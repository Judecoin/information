import { readFile, writeFile } from "node:fs/promises";

const RPC_NODES = [
  "http://node1.judecoin.com:16061",
  "http://node.judecoin.info:16061",
  "http://67.230.167.187:16061",
];
const INDEX_PATH = new URL("../data/service-node-stake-index.json", import.meta.url);
const OUTPUT_PATH = new URL("../data/deregistered-service-nodes.json", import.meta.url);
const FIRST_POS_HEIGHT = 780000;
const HEADER_CHUNK = 2000;
const TX_CHUNK = 100;

async function request(path, body) {
  let lastError;
  for (const node of RPC_NODES) {
    try {
      const response = await fetch(`${node}${path}`, {
        method: body ? "POST" : "GET",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "RPC error");
      return data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No Judecoin RPC node is reachable");
}

async function jsonRpc(method, params = {}) {
  return request("/json_rpc", { jsonrpc: "2.0", id: "service-node-history", method, params });
}

async function loadIndex() {
  try {
    return JSON.parse(await readFile(INDEX_PATH, "utf8"));
  } catch {
    return { version: 1, scannedThrough: FIRST_POS_HEIGHT - 1, registrations: {}, stakes: [] };
  }
}

const index = await loadIndex();
const info = await request("/get_info");
const tip = Number(info.height) - 1;
const stakeByImage = new Map(index.stakes.map((stake) => [stake.keyImage, stake]));
const transactionHashes = [];

for (let start = Math.max(FIRST_POS_HEIGHT, index.scannedThrough + 1); start <= tip; start += HEADER_CHUNK) {
  const end = Math.min(tip, start + HEADER_CHUNK - 1);
  const response = await jsonRpc("get_block_headers_range", {
    start_height: start,
    end_height: end,
    get_tx_hashes: true,
  });
  for (const header of response.result?.headers || []) {
    for (const hash of header.tx_hashes || []) transactionHashes.push(hash);
  }
  process.stdout.write(`Indexed headers ${start}-${end}\n`);
}

for (let offset = 0; offset < transactionHashes.length; offset += TX_CHUNK) {
  const response = await request("/get_transactions", {
    txs_hashes: transactionHashes.slice(offset, offset + TX_CHUNK),
    decode_as_json: true,
    tx_extra: true,
    stake_info: true,
    prune: true,
  });
  for (const tx of response.txs || []) {
    const extra = tx.extra || {};
    if (extra.sn_registration && extra.sn_pubkey) index.registrations[extra.sn_pubkey] = tx.block_height;
    if (extra.sn_pubkey && Array.isArray(extra.locked_key_images)) {
      for (const keyImage of extra.locked_key_images) {
        stakeByImage.set(keyImage, { keyImage, publicKey: extra.sn_pubkey });
      }
    }
  }
}

index.scannedThrough = tip;
index.stakes = [...stakeByImage.values()].sort((a, b) => a.keyImage.localeCompare(b.keyImage));
await writeFile(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);

const blacklistResponse = await jsonRpc("get_service_node_blacklisted_key_images");
const deregisteredByNode = new Map();
for (const entry of blacklistResponse.result?.blacklist || []) {
  const stake = stakeByImage.get(entry.key_image);
  if (!stake) continue;
  const existing = deregisteredByNode.get(stake.publicKey);
  const record = existing || {
    publicKey: stake.publicKey,
    registeredAt: Number(index.registrations[stake.publicKey] || 0),
    unlockedAt: 0,
    contributions: 0,
  };
  record.unlockedAt = Math.max(record.unlockedAt, Number(entry.unlock_height || 0));
  record.contributions += 1;
  deregisteredByNode.set(stake.publicKey, record);
}

const nodes = [...deregisteredByNode.values()]
  .filter((node) => node.registeredAt > 0 && node.unlockedAt > 0)
  .sort((a, b) => b.unlockedAt - a.unlockedAt || a.publicKey.localeCompare(b.publicKey));
const output = {
  generatedAt: new Date().toISOString(),
  sourceHeight: tip,
  count: nodes.length,
  nodes,
};
await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`Synchronized ${nodes.length} deregistered service nodes through block ${tip}.\n`);
