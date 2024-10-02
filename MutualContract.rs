use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod mutual_escrow {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        escrow_bump: u8,
        vault_bump: u8,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.admin = ctx.accounts.admin.key();
        escrow.escrow_bump = escrow_bump;
        escrow.vault_bump = vault_bump;
        Ok(())
    }

    pub fn create_deal(
      ctx: Context<CreateDeal>,
      amount: u64,
      vesting_type: VestingType,
      vesting_duration: i64,
      deal_bump: u8,
    ) -> Result<()> {
      let deal = &mut ctx.accounts.deal;
      deal.project_owner = ctx.accounts.project_owner.key();
      deal.kol = ctx.accounts.kol.key();
      deal.mint = ctx.accounts.mint.key();  // This can be any SPL token
      deal.amount = amount;
      deal.vesting_type = vesting_type;
      deal.vesting_duration = vesting_duration;
      deal.start_time = Clock::get()?.unix_timestamp;
      deal.status = DealStatus::Created;
      deal.deal_bump = deal_bump;

      // Transfer tokens from project owner to vault
      let transfer_ix = Transfer {
          from: ctx.accounts.project_owner_token_account.to_account_info(),
          to: ctx.accounts.vault.to_account_info(),
          authority: ctx.accounts.project_owner.to_account_info(),
      };

      token::transfer(
          CpiContext::new(
              ctx.accounts.token_program.to_account_info(),
              transfer_ix,
          ),
          amount,
      )?;

      Ok(())
    }

    pub fn accept_deal(ctx: Context<AcceptDeal>) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        require!(deal.status == DealStatus::Created, ErrorCode::InvalidDealStatus);
        
        deal.status = DealStatus::Accepted;
        deal.accept_time = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn release_payment(ctx: Context<ReleasePayment>, amount: u64) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        require!(deal.status == DealStatus::Accepted, ErrorCode::InvalidDealStatus);

        let current_time = Clock::get()?.unix_timestamp;
        let vested_amount = calculate_vested_amount(deal, current_time)?;
        require!(amount <= vested_amount, ErrorCode::ExceedsVestedAmount);

        // Transfer tokens from vault to KOL
        let seeds = &[
            b"escrow".as_ref(),
            &[ctx.accounts.escrow.escrow_bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ix = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.kol_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_ix,
                signer,
            ),
            amount,
        )?;

        deal.released_amount += amount;

        if deal.released_amount == deal.amount {
            deal.status = DealStatus::Completed;
        }

        Ok(())
    }

    pub fn dispute_deal(ctx: Context<DisputeDeal>, reason: String) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        require!(deal.status == DealStatus::Accepted, ErrorCode::InvalidDealStatus);

        deal.status = DealStatus::Disputed;
        deal.dispute_reason = reason;

        Ok(())
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, resolution: DisputeResolution) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        require!(deal.status == DealStatus::Disputed, ErrorCode::InvalidDealStatus);

        match resolution {
            DisputeResolution::ReleaseToKol => {
                // Transfer all remaining tokens to KOL
                let amount = deal.amount - deal.released_amount;
                let seeds = &[
                    b"escrow".as_ref(),
                    &[ctx.accounts.escrow.escrow_bump],
                ];
                let signer = &[&seeds[..]];

                let transfer_ix = Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.kol_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                };

                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        transfer_ix,
                        signer,
                    ),
                    amount,
                )?;

                deal.released_amount = deal.amount;
            },
            DisputeResolution::RefundToProjectOwner => {
                // Transfer all remaining tokens back to project owner
                let amount = deal.amount - deal.released_amount;
                let seeds = &[
                    b"escrow".as_ref(),
                    &[ctx.accounts.escrow.escrow_bump],
                ];
                let signer = &[&seeds[..]];

                let transfer_ix = Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.project_owner_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                };

                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        transfer_ix,
                        signer,
                    ),
                    amount,
                )?;
            },
            DisputeResolution::Custom(kol_amount) => {
                // Transfer specified amount to KOL and refund the rest to project owner
                let seeds = &[
                    b"escrow".as_ref(),
                    &[ctx.accounts.escrow.escrow_bump],
                ];
                let signer = &[&seeds[..]];

                // Transfer to KOL
                let transfer_to_kol_ix = Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.kol_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                };

                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        transfer_to_kol_ix,
                        signer,
                    ),
                    kol_amount,
                )?;

                // Refund to project owner
                let refund_amount = deal.amount - deal.released_amount - kol_amount;
                let transfer_to_owner_ix = Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.project_owner_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                };

                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        transfer_to_owner_ix,
                        signer,
                    ),
                    refund_amount,
                )?;

                deal.released_amount += kol_amount;
            },
        }

        deal.status = DealStatus::Resolved;

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VestingType {
    Time,
    Marketcap,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DealStatus {
    Created,
    Accepted,
    Completed,
    Disputed,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DisputeResolution {
    ReleaseToKol,
    RefundToProjectOwner,
    Custom(u64),
}

#[account]
pub struct Escrow {
    pub admin: Pubkey,
    pub escrow_bump: u8,
    pub vault_bump: u8,
}

#[account]
pub struct Deal {
    pub project_owner: Pubkey,
    pub kol: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub released_amount: u64,
    pub vesting_type: VestingType,
    pub vesting_duration: i64,
    pub start_time: i64,
    pub accept_time: i64,
    pub status: DealStatus,
    pub dispute_reason: String,
    pub deal_bump: u8,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + size_of::<Escrow>(),
        seeds = [b"escrow"],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, vesting_type: VestingType, vesting_duration: i64, deal_bump: u8)]
pub struct CreateDeal<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = project_owner,
        space = 8 + size_of::<Deal>(),
        seeds = [b"deal", project_owner.key().as_ref(), kol.key().as_ref(), mint.key().as_ref()],
        bump = deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(mut)]
    pub project_owner: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub kol: AccountInfo<'info>,
    pub mint: Account<'info, token::Mint>,  // This can be any SPL token
    #[account(
        mut,
        constraint = project_owner_token_account.owner == project_owner.key(),
        constraint = project_owner_token_account.mint == mint.key()
    )]
    pub project_owner_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = project_owner,
        seeds = [b"vault", mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AcceptDeal<'info> {
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"deal", deal.project_owner.as_ref(), kol.key().as_ref()],
        bump = deal.deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        constraint = kol.key() == deal.kol,
    )]
    pub kol: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"deal", deal.project_owner.as_ref(), deal.kol.as_ref()],
        bump = deal.deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        mut,
        seeds = [b"vault", deal.mint.as_ref()],
        bump = escrow.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = kol_token_account.owner == deal.kol,
        constraint = kol_token_account.mint == deal.mint,
    )]
    pub kol_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DisputeDeal<'info> {
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"deal", deal.project_owner.as_ref(), deal.kol.as_ref()],
        bump = deal.deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        constraint = disputer.key() == deal.project_owner || disputer.key() == deal.kol,
    )]
    pub disputer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        constraint = escrow.admin == admin.key(),
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"deal", deal.project_owner.as_ref(), deal.kol.as_ref()],
        bump = deal.deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        mut,
        seeds = [b"vault", deal.mint.as_ref()],
        bump = escrow.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = kol_token_account.owner == deal.kol,
        constraint = kol_token_account.mint == deal.mint,
    )]
    pub kol_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = project_owner_token_account.owner == deal.project_owner,
        constraint = project_owner_token_account.mint == deal.mint,
    )]
    pub project_owner_token_account: Account<'info, TokenAccount>,
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid deal status")]
    InvalidDealStatus,
    #[msg("Exceeds vested amount")]
    ExceedsVestedAmount,
}

// Helper function to calculate vested amount
// Helper function to calculate vested amount
fn calculate_vested_amount(deal: &Deal, current_time: i64) -> Result<u64> {
  let elapsed_time = current_time - deal.accept_time;
  
  match deal.vesting_type {
      VestingType::Time => {
          if elapsed_time >= deal.vesting_duration {
              Ok(deal.amount)
          } else {
              Ok((deal.amount as f64 * elapsed_time as f64 / deal.vesting_duration as f64) as u64)
          }
      },
      VestingType::Marketcap => {
          // For Marketcap vesting, we'll need to implement an oracle or use backend APIs
          // For now, we'll use a simple time-based vesting as a placeholder
          if elapsed_time >= deal.vesting_duration {
              Ok(deal.amount)
          } else {
              Ok((deal.amount as f64 * elapsed_time as f64 / deal.vesting_duration as f64) as u64)
          }
      },
  }
}

// Utility function to get PDA for escrow account
pub fn get_escrow_address(program_id: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(&[b"escrow"], program_id)
}

// Utility function to get PDA for vault account
pub fn get_vault_address(program_id: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(&[b"vault", mint.as_ref()], program_id)
}

// Utility function to get PDA for deal account
pub fn get_deal_address(program_id: &Pubkey, project_owner: &Pubkey, kol: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(&[b"deal", project_owner.as_ref(), kol.as_ref()], program_id)
}

/// The MUTUAL Solana Contract
///
/// This contract implements an escrow system for a KOL (Key Opinion Leader) marketplace platform.
/// It allows project owners to securely pay for promotional services from KOLs, with built-in
/// dispute resolution and vesting mechanisms.
///
/// # Features
///
/// - Escrow payment system
/// - Support for any SPL token as payment
/// - Time-based and Marketcap-based vesting options
/// - Dispute resolution process
/// - Customizable and future-proof design
///
/// # Main structs and enums
///
/// - `Escrow`: Represents the main escrow account
/// - `Deal`: Represents an individual deal between a project owner and a KOL
/// - `VestingType`: Enum for different vesting types (Time, Marketcap)
/// - `DealStatus`: Enum for the various states a deal can be in
/// - `DisputeResolution`: Enum for different ways to resolve a dispute
///
/// # Main instructions
///
/// - `initialize`: Set up the escrow system
/// - `create_deal`: Create a new deal between a project owner and a KOL, specifying any SPL token for payment
/// - `accept_deal`: KOL accepts the terms of a deal
/// - `release_payment`: Release vested tokens to the KOL
/// - `dispute_deal`: Raise a dispute on a deal
/// - `resolve_dispute`: Admin resolves a disputed deal
///
/// # Usage
///
/// 1. Initialize the escrow system using the `initialize` instruction.
/// 2. Project owners can create deals using the `create_deal` instruction, specifying any SPL token for payment.
/// 3. KOLs can accept deals using the `accept_deal` instruction.
/// 4. Payments are released automatically based on the vesting schedule, or can be
///    manually triggered using the `release_payment` instruction.
/// 5. If there's a dispute, either party can use the `dispute_deal` instruction.
/// 6. Admins can resolve disputes using the `resolve_dispute` instruction.
///
/// # Security considerations
///
/// - The contract uses PDAs (Program Derived Addresses) for secure key derivation.
/// - Access control is implemented to ensure only authorized parties can perform certain actions.
/// - The escrow system ensures that funds are held securely until conditions are met.
/// - Each deal is associated with a specific SPL token, allowing for diverse payment options.
///
/// # Future improvements
///
/// - Implement a more sophisticated Marketcap-based vesting mechanism, potentially using oracles.
/// - Add more customization options for vesting schedules.
/// - Implement automated dispute resolution mechanisms.
/// - Add support for multiple token payments within a single deal.