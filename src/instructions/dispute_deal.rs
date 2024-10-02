use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

pub fn dispute_deal(ctx: Context<DisputeDeal>, reason: String) -> Result<()> {
    let deal = &mut ctx.accounts.deal;
    require!(
        deal.status == DealStatus::Accepted,
        ErrorCode::InvalidDealStatus
    );

    deal.status = DealStatus::Disputed;
    deal.dispute_reason = reason;

    Ok(())
}

#[derive(Accounts)]
pub struct DisputeDeal<'info> {
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"deal", deal.project_owner.as_ref(), deal.kol.as_ref(), deal.mint.as_ref()],
        bump = deal.deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        constraint = disputer.key() == deal.project_owner || disputer.key() == deal.kol,
        signer
    )]
    pub disputer: AccountInfo<'info>,
}
