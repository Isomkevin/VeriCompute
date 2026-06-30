import {
  Contract,
  rpc,
  TransactionBuilder,
  xdr,
  Account,
  nativeToScVal,
  scValToNative,
  Address,
} from "@stellar/stellar-sdk";
import {
  ESCROW_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  STELLAR_RPC_URL,
  TOKEN_CONTRACT_ID,
  VERIFIER_CONTRACT_ID,
} from "./stellar";
import type { ProofResult } from "./types";

function hexToBuffer(hex: string): Buffer {
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  return Buffer.from(cleaned, "hex");
}

function bytesScVal(value: Buffer): xdr.ScVal {
  return xdr.ScVal.scvBytes(value);
}

function bytesN32ScVal(value: Buffer): xdr.ScVal {
  if (value.length !== 32) {
    throw new Error("expected 32-byte value");
  }
  return xdr.ScVal.scvBytes(value);
}

export async function buildInitEscrowTx(params: {
  source: string;
  admin: string;
  imageIdHex: string;
}): Promise<string> {
  if (!VERIFIER_CONTRACT_ID || !ESCROW_CONTRACT_ID) {
    throw new Error("verifier and escrow contract IDs must be configured");
  }
  const server = new rpc.Server(STELLAR_RPC_URL);
  const account = await server.getAccount(params.source);
  const contract = new Contract(ESCROW_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "init",
        Address.fromString(params.admin).toScVal(),
        Address.fromString(VERIFIER_CONTRACT_ID).toScVal(),
        bytesN32ScVal(hexToBuffer(params.imageIdHex)),
        Address.fromString(TOKEN_CONTRACT_ID).toScVal(),
      ),
    )
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

export async function buildCreateRequestTx(params: {
  source: string;
  lender: string;
  borrower: string;
  provider: string;
  amount: bigint;
  providerFee: bigint;
  scoreThreshold: number;
}): Promise<string> {
  const server = new rpc.Server(STELLAR_RPC_URL);
  const account = await server.getAccount(params.source);
  const contract = new Contract(ESCROW_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "create_request",
        Address.fromString(params.lender).toScVal(),
        Address.fromString(params.borrower).toScVal(),
        Address.fromString(params.provider).toScVal(),
        nativeToScVal(params.amount, { type: "i128" }),
        nativeToScVal(params.providerFee, { type: "i128" }),
        nativeToScVal(params.scoreThreshold, { type: "u32" }),
      ),
    )
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }

  const prepared = rpc.assembleTransaction(tx, sim).build();
  return prepared.toXDR();
}

export async function buildSubmitProofTx(params: {
  source: string;
  requestId: bigint;
  proof: ProofResult;
}): Promise<string> {
  const server = new rpc.Server(STELLAR_RPC_URL);
  const account = await server.getAccount(params.source);
  const contract = new Contract(ESCROW_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "submit_proof_and_settle",
        nativeToScVal(params.requestId, { type: "u64" }),
        bytesScVal(hexToBuffer(params.proof.seal)),
        bytesN32ScVal(hexToBuffer(params.proof.image_id)),
        bytesN32ScVal(hexToBuffer(params.proof.journal_digest)),
        bytesScVal(hexToBuffer(params.proof.journal_hex)),
      ),
    )
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }

  const prepared = rpc.assembleTransaction(tx, sim).build();
  return prepared.toXDR();
}

export async function submitSignedTransaction(signedXdr: string): Promise<string> {
  const server = new rpc.Server(STELLAR_RPC_URL);
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);
  if (response.status === "ERROR") {
    throw new Error(JSON.stringify(response));
  }
  return response.hash;
}

export async function waitForTransaction(hash: string): Promise<rpc.Api.GetTransactionResponse> {
  const server = new rpc.Server(STELLAR_RPC_URL);
  let attempt = 0;
  while (attempt < 30) {
    const result = await server.getTransaction(hash);
    if (result.status !== "NOT_FOUND") {
      return result;
    }
    await new Promise((r) => setTimeout(r, 2000));
    attempt += 1;
  }
  throw new Error("transaction not found after polling");
}

export function parseRequestIdFromSimulation(
  sim: rpc.Api.SimulateTransactionResponse,
): bigint | null {
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result?.retval) {
    return null;
  }
  const value = scValToNative(sim.result.retval);
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  return null;
}

export async function simulateCreateRequest(params: {
  source: string;
  lender: string;
  borrower: string;
  provider: string;
  amount: bigint;
  providerFee: bigint;
  scoreThreshold: number;
}): Promise<bigint> {
  const server = new rpc.Server(STELLAR_RPC_URL);
  const account = await server.getAccount(params.source);
  const contract = new Contract(ESCROW_CONTRACT_ID);
  const tx = new TransactionBuilder(new Account(account.accountId(), account.sequenceNumber()), {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "create_request",
        Address.fromString(params.lender).toScVal(),
        Address.fromString(params.borrower).toScVal(),
        Address.fromString(params.provider).toScVal(),
        nativeToScVal(params.amount, { type: "i128" }),
        nativeToScVal(params.providerFee, { type: "i128" }),
        nativeToScVal(params.scoreThreshold, { type: "u32" }),
      ),
    )
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  const requestId = parseRequestIdFromSimulation(sim);
  if (requestId === null) {
    throw new Error("could not parse request id from simulation");
  }
  return requestId;
}
