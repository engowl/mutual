use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod errors;
pub mod utils;

use instructions::*;
use state::*;
use errors::*;
use utils::*;

declare_id!("YourProgramID");

#[program]
pub mod mutual_escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, escrow_bump: u8) -> Result<()> {
        instructions::initialize(ctx, escrow_bump)
    }

    pub fn create_deal(
        ctx: Context<CreateDeal>,
        amount: u64,
        vesting_type: VestingType,
        vesting_duration: i64,
        deal_bump: u8,
        marketcap_authorizer: Option<Pubkey>,
    ) -> Result<()> {
        instructions::create_deal(
            ctx,
            amount,
            vesting_type,
            vesting_duration,
            deal_bump,
            marketcap_authorizer,
        )
    }

    pub fn accept_deal(ctx: Context<AcceptDeal>) -> Result<()> {
        instructions::accept_deal(ctx)
    }

    pub fn release_payment(ctx: Context<ReleasePayment>, amount: u64) -> Result<()> {
        instructions::release_payment(ctx, amount)
    }

    pub fn dispute_deal(ctx: Context<DisputeDeal>, reason: String) -> Result<()> {
        instructions::dispute_deal(ctx, reason)
    }

    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: DisputeResolution,
    ) -> Result<()> {
        instructions::resolve_dispute(ctx, resolution)
    }
}
