"use client";

import { useEffect, useState } from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { KitEventType } from "@creit.tech/stellar-wallets-kit";
import { Networks } from "@stellar/stellar-sdk";

let initialized = false;

function ensureKit() {
  if (!initialized) {
    StellarWalletsKit.init({ modules: defaultModules() });
    StellarWalletsKit.setNetwork(Networks.TESTNET);
    initialized = true;
  }
}

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureKit();
    const unsubscribe = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      ({ payload }) => {
        setAddress(payload.address ?? null);
      },
    );
    StellarWalletsKit.getAddress()
      .then(({ address: addr }) => setAddress(addr))
      .catch(() => setAddress(null));
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const connect = async () => {
    setError(null);
    try {
      ensureKit();
      await StellarWalletsKit.authModal();
      const { address: addr } = await StellarWalletsKit.getAddress();
      setAddress(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "wallet connect failed");
    }
  };

  const disconnect = async () => {
    await StellarWalletsKit.disconnect();
    setAddress(null);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {address ? (
        <>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-900">
            {address.slice(0, 4)}…{address.slice(-4)}
          </span>
          <button
            type="button"
            onClick={disconnect}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={connect}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Connect wallet (testnet)
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export async function getConnectedAddress(): Promise<string> {
  ensureKit();
  const { address } = await StellarWalletsKit.getAddress();
  return address;
}

export async function signTransactionXdr(unsignedXdr: string): Promise<string> {
  ensureKit();
  const { address } = await StellarWalletsKit.getAddress();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(unsignedXdr, {
    address,
    networkPassphrase: Networks.TESTNET,
  });
  return signedTxXdr;
}
