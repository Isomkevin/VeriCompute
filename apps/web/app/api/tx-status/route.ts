import { NextResponse } from "next/server";
import { rpc } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE, STELLAR_RPC_URL } from "@/lib/stellar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  if (!hash) {
    return NextResponse.json({ error: "hash required" }, { status: 400 });
  }

  const server = new rpc.Server(STELLAR_RPC_URL);
  const tx = await server.getTransaction(hash);
  return NextResponse.json({
    hash,
    status: tx.status,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
}
