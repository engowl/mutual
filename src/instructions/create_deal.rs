use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

pub fn create_deal(
    ctx: Context<CreateDeal>,
    amount: u64,
    vesting_type: VestingType,
    vesting_duration: i64,
    deal_bump: u8,
    marketcap_authorizer: Option<Pubkey>,
) -> Result<()> {
    let deal = &mut ctx.accounts.deal;
    deal.project_owner = ctx.accounts.project_owner.key();
    deal.kol = ctx.accounts.kol.key();
    deal.mint = ctx.accounts.mint.key();
    deal.amount = amount;
    deal.vesting_type = vesting_type;
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
        from: ctx
            .accounts
            .project_owner_token_account
            .to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.project_owner.to_account_info(),
    };

    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, vesting_type: VestingType, vesting_duration: i64, deal_bump: u8)]
pub struct CreateDeal<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = project_owner,
        space = 8 + std::mem::size_of::<Deal>(),
        seeds = [b"deal", project_owner.key().as_ref(), kol.key().as_ref(), mint.key().as_ref()],
        bump = deal_bump,
    )]
    pub deal: Account<'info, Deal>,
    #[account(mut)]
    pub project_owner: Signer<'info>,
    /// CHECK: This is safe; we only read the public key
    pub kol: AccountInfo<'info>,
    pub mint: Account<'info, token::Mint>,
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
