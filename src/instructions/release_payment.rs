use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;
use crate::utils::*;

pub fn release_payment(ctx: Context<ReleasePayment>, amount: u64) -> Result<()> {
    let deal = &mut ctx.accounts.deal;
    require!(
        deal.status == DealStatus::Accepted,
        ErrorCode::InvalidDealStatus
    );

    let current_time = Clock::get()?.unix_timestamp;

    // Determine if the marketcap_authorizer has authorized the release
    let marketcap_authorized = match deal.vesting_type {
        VestingType::Time => false,
        VestingType::Marketcap => {
            let authorizer = ctx
                .accounts
                .marketcap_authorizer
                .as_ref()
                .ok_or(ErrorCode::MissingMarketcapAuthorizer)?;
            require_keys_eq!(
                authorizer.key(),
                deal.marketcap_authorizer.unwrap(),
                ErrorCode::InvalidMarketcapAuthorizer
            );
            true
        }
    };

    let vested_amount =
        calculate_vested_amount(deal, current_time, marketcap_authorized)?;

    require!(
        amount <= vested_amount - deal.released_amount,
        ErrorCode::ExceedsVestedAmount
    );

    // Transfer tokens from vault to KOL
    let seeds = &[b"escrow".as_ref(), &[ctx.accounts.escrow.escrow_bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.kol_token_account.to_account_info(),
        authority: ctx.accounts.escrow.to_account_info(),
    };

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
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

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"deal", deal.project_owner.as_ref(), deal.kol.as_ref(), deal.mint.as_ref()],
        bump = deal.deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        mut,
        seeds = [b"vault", deal.mint.as_ref()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = kol_token_account.owner == deal.kol,
        constraint = kol_token_account.mint == deal.mint,
    )]
    pub kol_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    // Optional signer for Marketcap vesting
    #[account(
        constraint = match deal.vesting_type {
            VestingType::Marketcap => marketcap_authorizer.is_some(),
            _ => marketcap_authorizer.is_none(),
        }
    )]
    pub marketcap_authorizer: Option<Signer<'info>>,
}
