#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Bytes, BytesN, Env};

#[test]
fn decode_score_reads_last_four_bytes() {
    let env = Env::default();
    let mut raw = [0u8; JOURNAL_LEN as usize];
    raw[64..68].copy_from_slice(&720u32.to_le_bytes());
    let journal = Bytes::from_array(&env, &raw);
    assert_eq!(decode_score(&journal), 720);
}
