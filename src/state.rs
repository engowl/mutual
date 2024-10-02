use anchor_lang::prelude::*;

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
