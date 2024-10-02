use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

pub fn resolve_dispute(
    ctx: Context<ResolveDispute>,
    resolution: DisputeResolution,
) -> Result<()> {
    let deal = &mut ctx.accounts.deal;
    require!(
        deal.status == DealStatus::Disputed,
        ErrorCode::InvalidDealStatus
    );

    let seeds = &[b"escrow".as_ref(), &[ctx.accounts.escrow.escrow_bump]];
    let signer = &[&seeds[..]];

    match resolution {
        DisputeResolution::ReleaseToKol => {
            let amount = deal.amount - deal.released_amount;

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

            deal.released_amount = deal.amount;
        }
        DisputeResolution::RefundToProjectOwner => {
            let amount = deal.amount - deal.released_amount;

            let cpi_accounts = Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx
                    .accounts
                    .project_owner_token_account
                    .to_account_info(),
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
        }
        DisputeResolution::Custom(kol_amount) => {
            let total_remaining = deal.amount - deal.released_amount;
            require!(
                kol_amount <= total_remaining,
                ErrorCode::InvalidCustomAmount
            );

            let refund_amount = total_remaining - kol_amount;

            // Transfer to KOL
            let cpi_accounts_kol = Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.kol_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            };

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts_kol,
                    signer,
                ),
                kol_amount,
            )?;

            // Refund to Project Owner
            let cpi_accounts_owner = Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx
                    .accounts
                    .project_owner_token_account
                    .to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            };

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts_owner,
                    signer,
                ),
                refund_amount,
            )?;

            deal.released_amount += kol_amount;
        }
    }

    deal.status = DealStatus::Resolved;

    Ok(())
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        constraint = escrow.admin == admin.key(),
    )]
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
    #[account(
        mut,
        constraint = project_owner_token_account.owner == deal.project_owner,
        constraint = project_owner_token_account.mint == deal.mint,
    )]
    pub project_owner_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
