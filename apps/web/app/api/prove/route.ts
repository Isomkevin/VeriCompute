import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { ScoringInput } from "@/lib/types";

const execFileAsync = promisify(execFile);

const PROVER_SERVICE_URL = process.env.PROVER_SERVICE_URL;
const REPO_WSL_PATH =
  process.env.PROVER_WSL_REPO_PATH ??
  "/mnt/c/Users/Administrator/Downloads/VeriCompute";

async function proveRemote(input: ScoringInput) {
  const res = await fetch(`${PROVER_SERVICE_URL}/prove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

async function proveLocalWsl(input: ScoringInput) {
  const dir = await mkdtemp(join(tmpdir(), "vericompute-prove-"));
  const inputPath = join(dir, "input.json");
  const outputPath = join(dir, "proof.json");

  try {
    await writeFile(inputPath, JSON.stringify(input));
    const wslInput = inputPath.replace(/\\/g, "/").replace(/^C:/i, "/mnt/c");
    const wslOutput = outputPath.replace(/\\/g, "/").replace(/^C:/i, "/mnt/c");

    await execFileAsync("wsl", [
      "-d",
      "Ubuntu",
      "--",
      "bash",
      "-lc",
      `cd ${REPO_WSL_PATH} && source ~/.cargo/env && export PATH=$HOME/.risc0/bin:$PATH && cargo run --release -p vericompute-host -- --input ${wslInput} --output ${wslOutput}`,
    ], { timeout: 60 * 60 * 1000 });

    const raw = await readFile(outputPath, "utf8");
    return JSON.parse(raw) as unknown;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ScoringInput;
    const proof = PROVER_SERVICE_URL
      ? await proveRemote(input)
      : await proveLocalWsl(input);
    return NextResponse.json(proof);
  } catch (error) {
    const message = error instanceof Error ? error.message : "prove failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
