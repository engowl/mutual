use anchor_lang::prelude::*;

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
