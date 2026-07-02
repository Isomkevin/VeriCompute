# PRD — VeriCompute: A Verifiable AI Inference Marketplace on Stellar

## 1. Problem Statement

Today, if you pay someone (or some service) to run an AI inference on your behalf — an LLM call, a fraud-detection model, a credit-scoring model, an image classifier, anything — **you have no way to verify they actually ran the model you agreed on, against the input you provided, to produce the output they're charging you for.**

A provider could:

- Swap in a cheaper, smaller, or worse model and pocket the difference
- Run the model on different (or stale) inputs
- Fabricate the output entirely

The requester has to trust the provider. There is no cryptographic accountability, and payment happens regardless of whether the work was actually done as specified.

This is a trust gap that blocks AI compute from becoming a real, composable, on-chain economic primitive — you can't build automated agents, marketplaces, or financial products on top of "trust me."

## 2. Solution

**VeriCompute** is a protocol + reference application that makes AI inference **verifiable and payment-conditional**:

1. A **Requester** specifies a task: a program (the "model" — e.g., a scoring function, a classifier, a deterministic rules engine), and an input.
2. A **Provider** runs that exact program on that exact input **inside a RISC Zero zkVM**, which produces:
   - The output
   - A cryptographic **receipt** proving "this exact program, given this input (hash), produced this output (hash)"
3. The Provider submits the receipt to a **Soroban smart contract on Stellar**, which verifies the proof using the RISC Zero Groth16 verifier.
4. **Only if the proof verifies** does an **escrow contract** release payment (XLM/USDC) to the Provider.

No proof → no payment. Automatically, trustlessly, on-chain.

This is a **general protocol** for "pay for compute, verify the compute happened as specified, settle automatically." The flagship demo use case is **AI-powered credit/risk scoring**, but the architecture must remain general enough to support any deterministic RISC Zero guest program (fraud scoring, content moderation checks, eligibility checks, data validation, etc.).

> **Important framing for engineering agents:** Do not hardcode the credit-scoring logic so deeply that it can't be swapped out. The "guest program" (what runs inside the zkVM) should be a pluggable module. The credit-scoring demo is *one instance* of "a deterministic program ran correctly on this input and produced this output," not the whole point of the system.

## 3. Primary Demo Use Case: AI Credit/Risk Scoring

- A **Borrower** (Requester) submits financial data (income, existing debts, repayment history — can be mocked/synthetic for the demo).
- A **Scoring Provider** runs a scoring model (a simple, deterministic algorithm — rules-based or a small linear model, NOT a giant LLM, to keep zkVM proving times reasonable) inside RISC Zero.
- The zkVM produces a receipt proving: "Model X, given input hash H_in, produced score S (hash H_out)."
- A Soroban **LoanEscrow** contract:
  - Holds funds from a Lender
  - Calls the RISC Zero verifier contract with the receipt
  - On successful verification, checks if the score meets a threshold
  - If it does, releases the loan amount to the Borrower
  - If not, the Provider is still paid their inference fee (they did the work correctly — just the answer was "no"), but the loan does not disburse

This demonstrates: verifiable compute, conditional payment, and a real-world financial use case — directly aligned with Stellar's strengths (stablecoins, RWA, payments).

## 4. Users / Personas

| Persona | Role |
|---|---|
| **Requester** | Wants an inference run (e.g., a Borrower wanting a credit score, or any party needing a verified computation) |
| **Provider** | Runs the zkVM compute, generates the proof, gets paid on successful verification |
| **Verifier (the contract itself)** | The on-chain Soroban contract — not a human role, but a system component worth naming explicitly |
| **Payer / Funder** | The party whose funds sit in escrow (could be same as Requester, or a third party like a Lender) |

## 5. Core User Flow (Demo Script)

1. User lands on the app, sees a clear explanation: "Pay for AI inference. Only pay if we can prove it ran correctly."
2. User selects (or is shown) the demo task: **Credit Scoring**.
3. User fills in mock applicant data via a form.
4. User clicks "Request Verified Score."
5. Frontend shows a step-by-step pipeline visualization:
   - Step 1: Submitting input → hashing input
   - Step 2: Provider running model inside RISC Zero zkVM (this takes real time — show a progress/loading state with explanation of what's happening)
   - Step 3: Proof generated (show the receipt / proof hash)
   - Step 4: Submitting proof to Soroban verifier contract on Stellar testnet
   - Step 5: On-chain verification result
   - Step 6: Conditional outcome — funds released (or not) based on score threshold, shown via a Stellar testnet transaction link
6. User sees the final result: score, verification status (✅ verified on-chain), and payment/escrow outcome, with a link to the transaction on Stellar Expert (testnet).

## 6. Functional Requirements

### FR1 — Guest Program (RISC Zero)

- A Rust "guest" program that takes structured input (JSON or serialized struct), runs a deterministic scoring function, and outputs a result + commits input/output hashes to the journal.
- Must be modular — the scoring logic should live in a clearly separated module so it can be swapped for other use cases later.

### FR2 — Host / Prover

- A Rust "host" binary (or service) that:
  - Accepts input from the Next.js app (via API route or a small local service)
  - Executes the guest program in the RISC Zero zkVM
  - Produces a receipt (proof)
  - Returns the receipt + public outputs to the frontend/backend

### FR3 — Soroban Verifier Contract

- Use/adapt the existing RISC Zero Groth16 verifier contract (Nethermind's `stellar-risc0-verifier`).
- Deployed to Stellar testnet.
- Exposes a function to verify a receipt against an expected image ID (program identity) and return the verified public outputs.

### FR4 — Escrow / Settlement Contract

- A Soroban contract that:
  - Holds funds (test tokens or native XLM on testnet)
  - Calls the verifier contract
  - On success, reads the public output (score) and compares to a threshold
  - Releases funds accordingly (to Provider always on valid proof; to Borrower conditionally based on score)
  - Emits events for each step (for frontend to display)

### FR5 — Next.js Frontend

- App Router, TypeScript, Tailwind.
- Pages:
  - Landing / explainer page (problem statement, how it works)
  - Demo flow page (credit scoring form → pipeline visualization → result)
  - "How it works" / architecture page (for judges)
- Wallet integration (Stellar Wallets Kit) for connecting a testnet wallet (Freighter or similar) to sign transactions.
- API routes that:
  - Trigger the proving process (or call an external proving service)
  - Submit transactions to Soroban contracts
  - Poll/return transaction status

### FR6 — Generalization Layer (stretch but architecturally important)

- A simple config/registry describing "available verified compute tasks" (even if only one is implemented for the demo), so the README and code can credibly say "this generalizes beyond credit scoring."

## 7. Non-Functional Requirements

- **Runs on Stellar testnet.** No real funds.
- **Proving time:** keep the guest program simple enough that proof generation completes in a reasonable demo window (seconds to low minutes). If proving is slow, the frontend MUST communicate this clearly (progress indicator, explanation) rather than appearing frozen.
- **Clarity over completeness:** if something is mocked (e.g., synthetic financial data, a simplified scoring formula), say so explicitly in the UI and README. Judges value honesty per the hackathon rules.
- **Reproducibility:** anyone should be able to clone the repo, follow setup steps, and run the full flow on testnet.

## 8. Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Wallet:** Stellar Wallets Kit
- **Smart Contracts:** Soroban (Rust), deployed via Stellar CLI to testnet
- **ZK:** RISC Zero zkVM (guest + host in Rust)
- **Verifier:** Nethermind `stellar-risc0-verifier` (Groth16 verifier for RISC Zero receipts on Soroban)
- **Chain interaction:** Stellar SDK (JS) / `@stellar/stellar-sdk`

## 9. Stretch Goals (do not block core demo)

- **Private threshold proof (Noir):** instead of revealing the raw score on-chain, add a second proof (Noir/UltraHonk) that proves "score ≥ threshold" without revealing the score itself. This combines "verifiable computation happened correctly" (RISC Zero) with "result satisfies a private condition" (Noir) — chained into one settlement flow.
- **Task registry / multi-task support:** support a second guest program (e.g., a simple eligibility check) to prove generality.
- **Provider marketplace UI:** a simple list of "available compute providers" with fees, even if simulated for the demo.

## 10. Out of Scope

- Real money, mainnet deployment, KYC/compliance integrations
- Production-grade prover infrastructure (Bonsai, distributed proving) — local proving is fine for the demo
- Arbitrary/Turing-complete model support — guest programs must be deterministic and provable in reasonable time
- Full LLM inference inside the zkVM (too slow) — the "model" in the demo is a deterministic scoring function, with the README clearly explaining how this generalizes conceptually to "any deterministic computation, including small ML models or rules derived from larger AI systems"

## 11. Success Criteria (Hackathon Judging Lens)

- ✅ ZK is **load-bearing**: the proof is generated, submitted, and verified on-chain, and the payment outcome genuinely depends on verification success.
- ✅ Touches Stellar meaningfully: real Soroban contracts on testnet, real transactions.
- ✅ Clear, honest README documenting what's real vs. simplified/mocked.
- ✅ 2–3 minute demo video showing the full flow end-to-end with on-chain confirmation.
- ✅ The narrative clearly frames this as a **general protocol** (verifiable-compute-conditional-payment) with credit scoring as one compelling instance — not a one-off credit scoring app.

## 12. Key Reference Links

- RISC Zero Docs: https://dev.risczero.com/
- RISC Zero Stellar Verifier: https://github.com/NethermindEth/stellar-risc0-verifier
- E2E Tutorial (RISC Zero + Stellar): https://jamesbachini.com/stellar-risc-zero-games/
- ZK Proofs on Stellar (docs): https://developers.stellar.org/docs/build/apps/zk
- Stellar Skills (agent docs): https://skills.stellar.org/
- Stellar Wallets Kit: https://stellarwalletskit.dev/
- Stellar CLI: https://developers.stellar.org/docs/tools/cli
