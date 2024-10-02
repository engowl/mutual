use anchor_lang::prelude::*;
use crate::state::*;

pub fn initialize(ctx: Context<Initialize>, escrow_bump: u8) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    escrow.admin = ctx.accounts.admin.key();
    escrow.escrow_bump = escrow_bump;
    Ok(())
}

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
