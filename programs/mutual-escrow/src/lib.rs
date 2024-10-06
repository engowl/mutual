use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("mutvCELMcCmXrHetrFYpDTydeBcowm9gneVVgUQ179f");

#[program]
pub mod mutual_escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, max_claimable_after_obligation: u8) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let escrow_bump = ctx.bumps.escrow;
        escrow.admin = ctx.accounts.admin.key();
        escrow.escrow_bump = escrow_bump;
        escrow.max_claimable_after_obligation = max_claimable_after_obligation;

        Ok(())
    }

    #[event]
    pub struct DealCreated {
        pub order_id: [u8; 16],
        pub deal: Pubkey,
        pub project_owner: Pubkey,
        pub kol: Pubkey,
        pub amount: u64,
    }

    #[event]
    pub struct DealStatusChanged {
        pub order_id: [u8; 16],
        pub deal: Pubkey,
        pub project_owner: Pubkey,
        pub kol: Pubkey,
        pub status: DealStatus,
    }

    // Add this to your events
    #[event]
    pub struct MaxClaimablePercentageUpdated {
        pub old_percentage: u8,
        pub new_percentage: u8,
    }

    #[event]
    pub struct DealResolved {
        pub order_id: [u8; 16],
        pub deal: Pubkey,
        pub project_owner: Pubkey,
        pub kol: Pubkey,
        pub released_amount: u64,
        pub status: DealStatus,
    }

    #[event]
    pub struct EligibilityStatusUpdated {
        pub order_id: [u8; 16],
        pub deal: Pubkey,
        pub kol: Pubkey,
        pub new_status: EligibilityStatus,
    }

    pub fn create_deal(
        ctx: Context<CreateDeal>,
        amount: u64,
        vesting_type: VestingType,
        vesting_duration: i64,
        order_id: [u8; 16],
    ) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        let deal_bump: u8 = ctx.bumps.deal; // Accessing bump directly for the 'deal' account

        // TODO: make the order_id always unique

        deal.order_id = order_id.clone();
        deal.project_owner = ctx.accounts.project_owner.key();
        deal.kol = ctx.accounts.kol.key();
        deal.mint = ctx.accounts.mint.key();
        deal.amount = amount;
        deal.released_amount = 0;
        deal.vesting_type = vesting_type.clone();
        deal.vesting_duration = vesting_duration;
        deal.start_time = Clock::get()?.unix_timestamp;
        deal.accept_time = 0;
        deal.status = DealStatus::Created;
        deal.dispute_reason = DisputeReason::None;
        deal.deal_bump = deal_bump;

        // TODO: If use SOL, it wraps it into WSOL
        // let is_wsol = ctx.accounts.mint.key() == spl_token::native_mint::id();

        // Transfer tokens from project owner to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.project_owner_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.project_owner.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        emit!(DealCreated {
            order_id: order_id.clone(),
            deal: ctx.accounts.deal.key(),
            project_owner: ctx.accounts.project_owner.key(),
            kol: ctx.accounts.kol.key(),
            amount: amount
        });

        Ok(())
    }

    pub fn accept_deal(ctx: Context<AcceptDeal>) -> Result<()> {
        let deal = &mut ctx.accounts.deal;

        // Ensure the deal is in the 'Created' status
        require!(
            deal.status == DealStatus::Created,
            ErrorCode::InvalidDealStatus
        );

        // Update the deal status and accept_time
        deal.status = DealStatus::Accepted;
        deal.accept_time = Clock::get()?.unix_timestamp;

        emit!(DealStatusChanged {
            order_id: deal.order_id,
            deal: deal.key(),
            project_owner: deal.project_owner,
            kol: deal.kol,
            status: deal.status.clone(),
        });

        Ok(())
    }

    pub fn reject_deal(ctx: Context<RejectDeal>) -> Result<()> {
        let deal = &mut ctx.accounts.deal;

        // Ensure the deal is in the 'Created' status
        require!(
            deal.status == DealStatus::Created,
            ErrorCode::InvalidDealStatus
        );

        // Access the bump seed directly
        let vault_authority_bump = ctx.bumps.vault_authority;

        // Create seeds for signing
        let seeds = &[b"vault_authority".as_ref(), &[vault_authority_bump]];
        let signer = &[&seeds[..]];

        // Transfer tokens back to project owner
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.project_owner_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();

        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
            deal.amount,
        )?;

        // Update deal status
        deal.status = DealStatus::Rejected;

        emit!(DealStatusChanged {
            order_id: deal.order_id,
            deal: deal.key(),
            project_owner: deal.project_owner,
            kol: deal.kol,
            status: deal.status.clone(),
        });

        Ok(())
    }

    pub fn resolve_deal(ctx: Context<ResolveDeal>) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        let current_time = Clock::get()?.unix_timestamp;

        // Calculate how much the KOL can claim based on time or marketcap
        let claimable_amount = calculate_vested_amount(
            deal,
            current_time,
            ctx.accounts.escrow.max_claimable_after_obligation, // Handles the partial claim logic
        )?;

        // Debugging output using `msg!()`
        msg!("Calculated claimable amount: {}", claimable_amount);
        msg!("Current time: {}", current_time);
        msg!("Released amount before claim: {}", deal.released_amount);

        // Ensure they are claiming at least some amount
        require!(claimable_amount > 0, ErrorCode::ExceedsVestedAmount);

        // Transfer tokens to the KOL
        let seeds = &[b"vault_authority".as_ref(), &[ctx.bumps.vault_authority]];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.kol_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();

        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
            claimable_amount,
        )?;

        // Update the released amount after the claim
        deal.released_amount = deal.released_amount.checked_add(claimable_amount).unwrap();

        // Log the updated released amount for debugging
        msg!("Released amount after claim: {}", deal.released_amount);

        // If full amount has been released, mark deal as completed
        if deal.released_amount >= deal.amount {
            deal.status = DealStatus::Completed;
            msg!("Deal status: Completed");
        } else {
            deal.status = DealStatus::PartialCompleted;
            msg!("Deal status: PartialCompleted");
        }

        emit!(DealStatusChanged {
            order_id: deal.order_id,
            deal: deal.key(),
            project_owner: deal.project_owner,
            kol: deal.kol,
            status: deal.status.clone(),
        });

        emit!(DealResolved {
            order_id: deal.order_id,
            deal: deal.key(),
            project_owner: deal.project_owner,
            kol: deal.kol,
            released_amount: deal.released_amount,
            status: deal.status.clone(),
        });

        Ok(())
    }

    pub fn set_eligibility_status(
        ctx: Context<SetEligibilityStatus>,
        new_status: EligibilityStatus,
    ) -> Result<()> {
        let deal = &mut ctx.accounts.deal;

        require!(
            ctx.accounts.signer.key() == ctx.accounts.escrow.admin,
            ErrorCode::UnauthorizedSigner
        );

        // Set the done_obligation_time when eligibility changes to PartiallyEligible (the status when KOL finished the obligation)
        if new_status == EligibilityStatus::PartiallyEligible {
            deal.done_obligation_time = Clock::get()?.unix_timestamp;
            msg!("done_obligation_time set to: {}", deal.done_obligation_time);
        }

        deal.eligibility_status = new_status.clone();

        emit!(EligibilityStatusUpdated {
            order_id: deal.order_id,
            deal: deal.key(),
            kol: deal.kol,
            new_status: new_status.clone(),
        });

        Ok(())
    }

    // Admin can update the max claimable percentage for early claim
    pub fn update_max_claimable_percentage(
        ctx: Context<UpdateMaxClaimablePercentage>,
        new_percentage: u8,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        // Ensure the new percentage is valid (0-100)
        require!(new_percentage <= 100, ErrorCode::InvalidPercentage);

        // Update the max claimable percentage
        escrow.max_claimable_after_obligation = new_percentage;

        emit!(MaxClaimablePercentageUpdated {
            old_percentage: escrow.max_claimable_after_obligation,
            new_percentage,
        });

        Ok(())
    }

    // To check how much KOL can claim
    // pub fn check_claimable_amount(ctx: Context<CheckClaimableAmount>) -> Result<u64> {
    //     let deal = &ctx.accounts.deal;
    //     let current_time = Clock::get()?.unix_timestamp;

    //     // Calculate how much the KOL can claim
    //     let vested_amount = calculate_vested_amount(
    //         deal,
    //         current_time,
    //         ctx.accounts.escrow.max_claimable_after_obligation,
    //     )?;

    //     // Return the claimable amount
    //     let claimable_amount = vested_amount
    //         .checked_sub(deal.released_amount)
    //         .ok_or(ErrorCode::ExceedsVestedAmount)?;

    //     Ok(claimable_amount)
    // }

    // To check how much KOL can claim
    pub fn check_claimable_amount(ctx: Context<CheckClaimableAmount>) -> Result<u64> {
        let deal = &ctx.accounts.deal;
        let current_time = Clock::get()?.unix_timestamp;

        // Log the current time and vesting status
        msg!(
            "Checking claimable amount at current time: {}",
            current_time
        );
        msg!("Deal order_id: {:?}", deal.order_id);

        // Calculate how much the KOL can claim
        let vested_amount = calculate_vested_amount(
            deal,
            current_time,
            ctx.accounts.escrow.max_claimable_after_obligation,
        )?;

        // Log the vested amount calculated
        msg!(
            "Vested amount based on vesting conditions: {}",
            vested_amount
        );

        // Calculate the claimable amount by subtracting the released amount from the vested amount
        let claimable_amount = vested_amount
            .checked_sub(deal.released_amount)
            .ok_or(ErrorCode::ExceedsVestedAmount)?;

        // Log the final claimable amount that will be returned
        msg!("Final claimable amount for the KOL: {}", claimable_amount);

        // Return the claimable amount
        Ok(claimable_amount)
    }

}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VestingType {
    Time,      // Vesting based on time
    Marketcap, // Vesting based on market cap reaching a target
    None,      // No vesting, the KOL can claim all tokens immediately
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DealStatus {
    Created,
    Accepted,
    Rejected,
    PartialCompleted,
    Completed,
    Disputed,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EligibilityStatus {
    NotEligible,       // No tokens can be claimed yet
    PartiallyEligible, // Can claim max_claimable_after_obligation (e.g., 20%)
    FullyEligible,     // Can claim all remaining tokens (market cap or time conditions met)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DisputeReason {
    None,
    Unresolved,
    Other,
    // Add more variants as needed
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid deal status")]
    InvalidDealStatus,
    #[msg("Unauthorized signer")]
    UnauthorizedSigner,
    #[msg("Exceeds vested amount")]
    ExceedsVestedAmount,
    #[msg("Invalid vesting type")]
    InvalidVestingType,
    #[msg("Invalid percentage value")]
    InvalidPercentage,
}

// Structs
#[account]
pub struct Escrow {
    pub admin: Pubkey,
    pub escrow_bump: u8,
    pub max_claimable_after_obligation: u8,
}

#[account]
pub struct Deal {
    pub order_id: [u8; 16],
    pub project_owner: Pubkey,
    pub kol: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub released_amount: u64,
    pub vesting_type: VestingType,
    pub vesting_duration: i64,
    pub start_time: i64,
    pub accept_time: i64,
    pub done_obligation_time: i64,
    pub status: DealStatus,
    pub dispute_reason: DisputeReason,
    pub deal_bump: u8,
    pub eligibility_status: EligibilityStatus,
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
#[instruction(
    amount: u64,
    vesting_type: VestingType,
    vesting_duration: i64,
    order_id: [u8; 16],
)]
pub struct CreateDeal<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    #[account(
        init,
        payer = project_owner,
        space = 8 + std::mem::size_of::<Deal>(),
        seeds = [
            b"deal",
            order_id.as_ref(), 
            project_owner.key().as_ref(),
            kol.key().as_ref(),
            mint.key().as_ref(),
        ],
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
        seeds = [b"vault_authority"],
        bump
    )]
    pub vault_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AcceptDeal<'info> {
    #[account(mut)]
    pub deal: Account<'info, Deal>,

    // Allow either the KOL or the admin to sign
    #[account(
        signer,
        constraint = signer.key() == deal.kol || signer.key() == escrow.admin,
    )]
    /// CHECK: This is either the KOL or the admin
    pub signer: AccountInfo<'info>,

    // Fetch the escrow account to get the admin's public key
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct RejectDeal<'info> {
    #[account(mut)]
    pub deal: Account<'info, Deal>,

    // Allow either the KOL or the admin to sign
    #[account(
        signer,
        constraint = signer.key() == deal.kol || signer.key() == escrow.admin,
    )]
    /// CHECK: This is either the KOL or the admin
    pub signer: AccountInfo<'info>,

    // Fetch the escrow account to get the admin's public key
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub project_owner: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"vault_token_account", deal.mint.as_ref()],
        bump,
        token::mint = mint,
        token::authority = vault_authority,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the PDA acting as the vault authority
    #[account(
        seeds = [b"vault_authority"],
        bump
    )]
    pub vault_authority: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = project_owner,
    )]
    pub project_owner_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ResolveDeal<'info> {
    #[account(mut)]
    pub deal: Account<'info, Deal>,

    // Allow either the KOL or the admin to sign
    #[account(
        signer,
        constraint = signer.key() == deal.kol || signer.key() == escrow.admin,
    )]
    /// CHECK: This is either the KOL or the admin
    pub signer: AccountInfo<'info>,

    // Fetch the escrow account to get the admin's public key
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub kol_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"vault_authority"],
        bump
    )]
    pub vault_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetEligibilityStatus<'info> {
    #[account(mut)]
    pub deal: Account<'info, Deal>,

    #[account(
        signer,
        constraint = signer.key() == escrow.admin,
    )]
    pub signer: AccountInfo<'info>,

    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct UpdateMaxClaimablePercentage<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    #[account(
        constraint = admin.key() == escrow.admin @ ErrorCode::UnauthorizedSigner
    )]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckClaimableAmount<'info> {
    pub deal: Account<'info, Deal>,
    pub escrow: Account<'info, Escrow>,
}

// Helper function to calculate vested amount based on time elapsed or eligible
fn calculate_vested_amount(
    deal: &Deal,
    current_time: i64,
    max_claimable_after_obligation: u8, // Updated parameter name
) -> Result<u64> {
    match deal.vesting_type {
        // No vesting: Allow the KOL to claim the entire remaining amount only if FullyEligible
        VestingType::None => {
            match deal.eligibility_status {
                EligibilityStatus::FullyEligible => {
                    msg!("Vesting type is None, and KOL is FullyEligible. Claiming all remaining tokens.");
                    Ok(deal.amount.checked_sub(deal.released_amount).unwrap())
                }
                _ => {
                    msg!("Vesting type is None, but KOL is not FullyEligible. No tokens can be claimed.");
                    Ok(0)
                }
            }
        }

        VestingType::Time => {
            // Use `done_obligation_time` instead of `accept_time`
            let elapsed_time = current_time.checked_sub(deal.done_obligation_time).unwrap();
            msg!("Elapsed time since done_obligation_time: {}", elapsed_time);
            msg!("Vesting duration: {}", deal.vesting_duration);

            // Ensure that the claimable amount never exceeds the total deal amount
            let total_amount = deal.amount;

            // Calculate the max claimable portion based on `max_claimable_after_obligation`
            let max_claimable =
                (total_amount as u128 * max_claimable_after_obligation as u128) / 100;
            let max_claimable = max_claimable as u64;
            msg!(
                "Max claimable based on max_claimable_after_obligation: {}",
                max_claimable
            );

            match deal.eligibility_status {
                // Partially eligible scenario,
                EligibilityStatus::PartiallyEligible => {
                    msg!("Partially eligible claim.");

                    // If the KOL has not claimed the max claimable yet, allow them to claim it
                    if deal.released_amount < max_claimable {
                        // Allow claiming the difference between max claimable and already released
                        let claimable =
                            max_claimable.checked_sub(deal.released_amount).unwrap_or(0);
                        msg!("Claimable under partial eligibility: {}", claimable);

                        // Ensure the claimable amount doesn't exceed the total deal amount
                        return Ok(std::cmp::min(claimable, total_amount));
                    } else {
                        // Already claimed the max claimable, no more tokens can be claimed under partial eligibility
                        msg!("Max claimable has already been claimed. No more tokens can be claimed in partial eligibility.");
                        return Ok(0);
                    }
                }

                // Fully eligible scenario
                EligibilityStatus::FullyEligible => {
                    msg!("Fully eligible claim.");

                    // If the KOL has not claimed the max claimable during partial eligibility,
                    // allow them to claim it here first.
                    let mut claimable = if deal.released_amount < max_claimable {
                        max_claimable.checked_sub(deal.released_amount).unwrap_or(0)
                    } else {
                        0
                    };

                    // Now calculate the additional claimable based on time passed
                    // Remaining amount after max claimable (i.e., 100% - max_claimable_after_obligation%)
                    let remaining_amount = total_amount.checked_sub(max_claimable).unwrap_or(0);

                    // Calculate how much of the remaining amount is vested proportional to time
                    let vested_remaining = (remaining_amount as u128 * elapsed_time as u128)
                        / deal.vesting_duration as u128;
                    let vested_remaining = vested_remaining as u64;
                    msg!("Vested portion of remaining amount: {}", vested_remaining);

                    // Ensure the vested remaining does not exceed the remaining amount
                    let vested_remaining = std::cmp::min(vested_remaining, remaining_amount);

                    // Allow claiming additional vested amount minus what has already been claimed
                    let additional_claimable = vested_remaining
                        .checked_sub(deal.released_amount.checked_sub(max_claimable).unwrap_or(0))
                        .unwrap_or(0);

                    msg!(
                        "Additional claimable after time vesting: {}",
                        additional_claimable
                    );

                    claimable += additional_claimable;
                    msg!("Total claimable under full eligibility: {}", claimable);

                    // Ensure the claimable amount does not exceed the total deal amount
                    return Ok(std::cmp::min(
                        claimable,
                        total_amount.checked_sub(deal.released_amount).unwrap_or(0),
                    ));
                }

                _ => {
                    // Not eligible to claim yet
                    msg!("Not eligible to claim yet.");
                    Ok(0)
                }
            }
        }
        VestingType::Marketcap => {
            // For Marketcap, check eligibility status
            match deal.eligibility_status {
                EligibilityStatus::PartiallyEligible => {
                    // Calculate the maximum claimable amount before full eligibility
                    let max_claimable =
                        (deal.amount as u128 * max_claimable_after_obligation as u128) / 100;
                    let max_claimable = max_claimable as u64;

                    // Return the lesser of the full amount or the maximum allowed
                    let claimable = std::cmp::min(deal.amount, max_claimable);

                    // Subtract the already released amount
                    Ok(claimable.checked_sub(deal.released_amount).unwrap())
                }
                EligibilityStatus::FullyEligible => {
                    // In Full eligibility, the remaining amount should be:
                    // Total deal amount minus the already claimed amount during partial eligibility
                    let remaining_amount =
                        deal.amount.checked_sub(deal.released_amount).unwrap_or(0);

                    msg!(
                        "Full eligibility claim: remaining amount after partial release: {}",
                        remaining_amount
                    );

                    // Return the remaining amount
                    Ok(remaining_amount)
                }
                _ => Ok(0), // Not eligible to claim yet
            }
        }
    }
}
