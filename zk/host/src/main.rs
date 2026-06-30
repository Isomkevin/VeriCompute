use anyhow::{Context, Result};
use axum::{extract::State, routing::post, Json, Router};
use clap::Parser;
use risc0_ethereum_contracts::encode_seal;
use risc0_zkvm::{default_prover, ExecutorEnv, ProverOpts};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{fs, net::SocketAddr, path::PathBuf, sync::Arc};
use vericompute_methods::{GUEST_ELF, GUEST_ID};

pub const JOURNAL_LEN: usize = 68;

#[derive(Parser)]
#[command(name = "vericompute-host")]
struct Args {
    #[arg(long)]
    input: Option<PathBuf>,

    #[arg(long)]
    output: Option<PathBuf>,

    #[arg(long)]
    serve: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScoringInput {
    pub annual_income: u64,
    pub total_debt: u64,
    pub months_on_time_payments: u16,
    pub credit_utilization_pct: u8,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProofJson {
    pub seal: String,
    pub image_id: String,
    pub journal_digest: String,
    pub journal_hex: String,
    pub score: u32,
}

pub fn decode_score(journal_bytes: &[u8]) -> Result<u32> {
    if journal_bytes.len() != JOURNAL_LEN {
        anyhow::bail!("expected journal length {JOURNAL_LEN}, got {}", journal_bytes.len());
    }
    let score = u32::from_le_bytes(
        journal_bytes[64..68]
            .try_into()
            .context("score bytes")?,
    );
    Ok(score)
}

fn prove_input(input: &ScoringInput) -> Result<ProofJson> {
    let env = ExecutorEnv::builder()
        .write(input)
        .context("write input to guest env")?
        .build()
        .context("build executor env")?;

    let prover = default_prover();
    let opts = ProverOpts::groth16();
    let prove_info = prover
        .prove_with_opts(env, GUEST_ELF, &opts)
        .context("groth16 prove")?;
    let receipt = prove_info.receipt;

    let seal_bytes = encode_seal(&receipt).context("encode seal")?;
    let journal_bytes = receipt.journal.bytes.clone();
    let journal_digest: [u8; 32] = Sha256::digest(&journal_bytes).into();
    let score = decode_score(&journal_bytes)?;

    Ok(ProofJson {
        seal: hex::encode(seal_bytes),
        image_id: hex::encode(GUEST_ID),
        journal_digest: hex::encode(journal_digest),
        journal_hex: hex::encode(&journal_bytes),
        score,
    })
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    if let Some(addr) = args.serve {
        let app_state = Arc::new(());
        let app = Router::new()
            .route("/prove", post(prove_handler))
            .with_state(app_state);

        let listener: SocketAddr = addr.parse().context("parse serve address")?;
        println!("prover listening on http://{listener}");
        axum::serve(
            tokio::net::TcpListener::bind(listener)
                .await
                .context("bind")?,
            app,
        )
        .await
        .context("serve")?;
        return Ok(());
    }

    let input_path = args
        .input
        .context("--input is required unless --serve is set")?;
    let output_path = args
        .output
        .context("--output is required unless --serve is set")?;

    let input_json = fs::read_to_string(&input_path).context("read input json")?;
    let input: ScoringInput = serde_json::from_str(&input_json).context("parse input json")?;
    let proof = prove_input(&input)?;

    fs::write(
        &output_path,
        serde_json::to_string_pretty(&proof).context("serialize proof")?,
    )
    .context("write output json")?;

    println!("wrote proof to {}", output_path.display());
    Ok(())
}

async fn prove_handler(
    State(_): State<Arc<()>>,
    Json(input): Json<ScoringInput>,
) -> Result<Json<ProofJson>, (axum::http::StatusCode, String)> {
    prove_input(&input)
        .map(Json)
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}
