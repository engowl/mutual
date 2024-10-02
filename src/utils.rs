use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

pub fn calculate_vested_amount(
    deal: &Deal,
    current_time: i64,
    marketcap_authorized: bool,
) -> Result<u64> {
    match deal.vesting_type {
        VestingType::Time => {
            let elapsed_time = current_time - deal.accept_time;
            if elapsed_time >= deal.vesting_duration {
                Ok(deal.amount)
            } else {
                Ok((deal.amount as u128 * elapsed_time as u128 / deal.vesting_duration as u128)
                    as u64)
            }
        }
        VestingType::Marketcap => {
            if marketcap_authorized {
                Ok(deal.amount)
            } else {
                Ok(0)
            }
        }
    }
}
