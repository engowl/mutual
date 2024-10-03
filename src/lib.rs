use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("7w1nj8HEw1j8vkQVPo7gwTcY9ayUA9L3bZhZXbM5Y9jE");

#[program]
pub mod mutual_escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let escrow_bump = ctx.bumps.escrow;
        escrow.admin = ctx.accounts.admin.key();
        escrow.escrow_bump = escrow_bump;
        Ok(())
    }

    pub fn create_deal(
        ctx: Context<CreateDeal>,
        amount: u64,
        vesting_type: VestingType,
        vesting_duration: i64,
        marketcap_authorizer: Option<Pubkey>,
    ) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        let deal_bump: u8 = ctx.bumps.deal; // Accessing bump directly for the 'deal' account
        let project_owner_key = ctx.accounts.project_owner.key(); // This returns a Pubkey

        deal.kol = ctx.accounts.kol.key();
        deal.mint = ctx.accounts.mint.key();
        deal.amount = amount;
        deal.vesting_type = vesting_type.clone();
        deal.vesting_duration = vesting_duration;
        deal.start_time = Clock::get()?.unix_timestamp;
        deal.status = DealStatus::Created;
        deal.deal_bump = deal_bump;
        deal.marketcap_authorizer = marketcap_authorizer;
        deal.released_amount = 0;

        // Validate marketcap_authorizer based on vesting type
        match vesting_type {
            VestingType::Time => {
                require!(
                    marketcap_authorizer.is_none(),
                    ErrorCode::UnexpectedMarketcapAuthorizer
                );
            }
            VestingType::Marketcap => {
                require!(
                    marketcap_authorizer.is_some(),
                    ErrorCode::MissingMarketcapAuthorizer
                );
            }
        }

        // Transfer tokens from project owner to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.project_owner_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.project_owner.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        Ok(())
    }
}

// Enums
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

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid deal status")]
    InvalidDealStatus,
    #[msg("Exceeds vested amount")]
    ExceedsVestedAmount,
    #[msg("Marketcap authorizer is missing")]
    MissingMarketcapAuthorizer,
    #[msg("Unexpected marketcap authorizer provided")]
    UnexpectedMarketcapAuthorizer,
    #[msg("Invalid marketcap authorizer")]
    InvalidMarketcapAuthorizer,
    #[msg("Invalid custom amount for dispute resolution")]
    InvalidCustomAmount,
}

// Structs
#[account]
pub struct Escrow {
    pub admin: Pubkey,
    pub escrow_bump: u8,
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
    pub marketcap_authorizer: Option<Pubkey>,
    pub deal_bump: u8,
}

// ACCOUNTS
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<Escrow>(),
        seeds = [b"escrow"],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, vesting_type: VestingType, vesting_duration: i64)]
pub struct CreateDeal<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = project_owner,
        space = 8 + std::mem::size_of::<Deal>(),
        seeds = [b"deal", project_owner.key().as_ref(), kol.key().as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(mut)]
    pub project_owner: Signer<'info>,
    /// CHECK: This is safe; we only read the public key
    pub kol: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = project_owner_token_account.owner == project_owner.key(),
        constraint = project_owner_token_account.mint == mint.key()
    )]
    pub project_owner_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = project_owner,
        seeds = [b"vault_token_account", mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = vault_authority,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is the PDA acting as the vault authority
    #[account(
        seeds = [b"vault_authority", mint.key().as_ref()],
        bump
    )]
    pub vault_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Helper function (Optional)
fn calculate_vested_amount(
    deal: &Deal,
    current_time: i64,
    marketcap_authorized: bool,
) -> Result<u64> {
    match deal.vesting_type {
        VestingType::Time => {
            let elapsed_time = current_time - deal.accept_time;
            if elapsed_time >= deal.vesting_duration {
                Ok(deal.amount)
            } else {
                Ok(
                    (deal.amount as u128 * elapsed_time as u128 / deal.vesting_duration as u128)
                        as u64,
                )
            }
        }
        VestingType::Marketcap => {
            if marketcap_authorized {
                Ok(deal.amount)
            } else {
                Ok(0)
            }
        }
    }
}
