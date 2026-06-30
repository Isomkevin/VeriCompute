pub mod scoring;

use risc0_zkvm::guest::env;
use scoring::{compute_score, ScoringInput};
use sha2::{Digest, Sha256};

/// Fixed journal layout (68 bytes): input_hash(32) || output_hash(32) || score(4 LE)
pub const JOURNAL_LEN: usize = 68;

risc0_zkvm::guest::entry!(main);

fn main() {
    let input: ScoringInput = env::read();
    let input_bytes =
        bincode::serialize(&input).expect("input must serialize deterministically");
    let input_hash: [u8; 32] = Sha256::digest(&input_bytes).into();

    let score = compute_score(&input);
    let output_bytes = score.to_le_bytes().to_vec();
    let output_hash: [u8; 32] = Sha256::digest(&output_bytes).into();

    let mut journal = [0u8; JOURNAL_LEN];
    journal[..32].copy_from_slice(&input_hash);
    journal[32..64].copy_from_slice(&output_hash);
    journal[64..68].copy_from_slice(&score.to_le_bytes());

    env::commit_slice(&journal);
}
