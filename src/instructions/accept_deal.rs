use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

pub fn accept_deal(ctx: Context<AcceptDeal>) -> Result<()> {
    let deal = &mut ctx.accounts.deal;
    require!(
        deal.status == DealStatus::Created,
        ErrorCode::InvalidDealStatus
    );

    deal.status = DealStatus::Accepted;
    deal.accept_time = Clock::get()?.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
pub struct AcceptDeal<'info> {
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"deal", deal.project_owner.as_ref(), deal.kol.as_ref(), deal.mint.as_ref()],
        bump = deal.deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        constraint = kol.key() == deal.kol,
        signer
    )]
    pub kol: AccountInfo<'info>,
}
