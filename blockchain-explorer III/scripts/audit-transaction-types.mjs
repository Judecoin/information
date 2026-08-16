import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const NODES = (process.env.JUDECOIN_RPC_NODES || [
  "http://node1.judecoin.com:16061",
  "http://node.judecoin.info:16061",
  "http://67.230.167.187:16061",
].join(",")).split(",").map((value) => value.trim()).filter(Boolean);
const NODE = NODES[0];
const HEADER_CHUNK = Number(process.env.AUDIT_HEADER_CHUNK || 5000);
const TX_BATCH = Number(process.env.AUDIT_TX_BATCH || 100);
const CONCURRENCY = Number(process.env.AUDIT_CONCURRENCY || 4);
const OUTPUT = resolve(process.env.AUDIT_OUTPUT || "audit/transaction-type-audit.json");
const HASH_CACHE = resolve(process.env.AUDIT_HASH_CACHE || "audit/transaction-hashes.json");

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

async function request(path, body, attempts = 4, node = NODE) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await fetch(`${node}${path}`, {
        method: body ? "POST" : "GET",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(750 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function jsonRpc(method, params, node = NODE) {
  const data = await request("/json_rpc", { jsonrpc: "2.0", id: "audit", method, params }, 4, node);
  return data.result;
}

async function mapConcurrent(items, worker, concurrency = CONCURRENCY) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

function authoritativeType(parsed, rpcTransaction) {
  const extra = rpcTransaction?.extra && typeof rpcTransaction.extra === "object" ? rpcTransaction.extra : {};
  const state = String(extra?.sn_state_change?.type || "").toLowerCase();
  if (["dereg", "deregister", "deregistration"].includes(state)) return "deregistration";
  if (["decom", "decomm", "decommission"].includes(state)) return "decommission";
  if (["recom", "recomm", "recommission"].includes(state)) return "recommission";
  if (["ip", "ip-change", "ip_change"].includes(state)) return "ip-change";
  if (extra.sn_registration) return "registration";
  if (extra.sn_contributor) return "contribution";
  if (Number(parsed?.type || 0) === 2 || extra.key_image_unlock) return "unlock";
  if (Number(parsed?.type || 0) === 0) return "transfer";
  return "state-change";
}

function increment(object, key) {
  object[key] = (object[key] || 0) + 1;
}

async function fetchTransactions(hashes, node = NODE) {
  try {
    const data = await request("/get_transactions", {
      txs_hashes: hashes,
      decode_as_json: true,
      tx_extra: true,
    }, 4, node);
    if (!Array.isArray(data.txs)) throw new Error("Missing txs array");
    return data.txs;
  } catch (error) {
    if (hashes.length <= 25) throw error;
    const middle = Math.ceil(hashes.length / 2);
    const [left, right] = await Promise.all([
      fetchTransactions(hashes.slice(0, middle), node),
      fetchTransactions(hashes.slice(middle), node),
    ]);
    return [...left, ...right];
  }
}

async function main() {
  const info = await request("/get_info");
  const height = Number(info.height || 0);
  if (!Number.isInteger(height) || height <= 0) throw new Error("Invalid chain height");

  let headersScanned;
  let firstHeight;
  let lastHeight;
  let uniqueHashes;
  try {
    const cached = JSON.parse(await readFile(HASH_CACHE, "utf8"));
    if (!Array.isArray(cached.hashes) || !cached.hashes.length) throw new Error("Invalid hash cache");
    headersScanned = Number(cached.headersScanned);
    firstHeight = cached.firstHeight;
    lastHeight = cached.lastHeight;
    uniqueHashes = cached.hashes;
    console.log(`Resuming from ${HASH_CACHE}: ${uniqueHashes.length.toLocaleString()} transaction hashes.`);
  } catch {
    const ranges = [];
    for (let start = 0; start < height; start += HEADER_CHUNK) {
      ranges.push({ start, end: Math.min(height - 1, start + HEADER_CHUNK - 1) });
    }

    console.log(`Scanning ${height.toLocaleString()} block headers in ${ranges.length} ranges...`);
    let completedRanges = 0;
    const headerGroups = await mapConcurrent(ranges, async ({ start, end }, index) => {
      const node = NODES[index % NODES.length];
      const result = await jsonRpc("get_block_headers_range", {
        start_height: start,
        end_height: end,
        get_tx_hashes: true,
        fill_pow_hash: false,
      }, node);
      completedRanges += 1;
      if (completedRanges % 10 === 0 || completedRanges === ranges.length) {
        console.log(`Headers: ${completedRanges}/${ranges.length}`);
      }
      return result.headers || [];
    });

    const headers = headerGroups.flat();
    headersScanned = headers.length;
    firstHeight = headers[0]?.height ?? null;
    lastHeight = headers.at(-1)?.height ?? null;
    const hashes = headers.flatMap((header) => Array.isArray(header.tx_hashes) ? header.tx_hashes : []);
    uniqueHashes = [...new Set(hashes)];
    await writeFile(HASH_CACHE, `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      reportedChainHeight: height,
      headersScanned,
      firstHeight,
      lastHeight,
      hashes: uniqueHashes,
    })}\n`);
    console.log(`Hash checkpoint written to ${HASH_CACHE}`);
  }
  const batches = [];
  for (let index = 0; index < uniqueHashes.length; index += TX_BATCH) {
    batches.push(uniqueHashes.slice(index, index + TX_BATCH));
  }

  console.log(`Scanning ${uniqueHashes.length.toLocaleString()} non-coinbase transactions in ${batches.length} batches...`);
  let completedBatches = 0;
  const transactionGroups = await mapConcurrent(batches, async (batch, index) => {
    const transactions = await fetchTransactions(batch, NODES[index % NODES.length]);
    completedBatches += 1;
    if (completedBatches % 10 === 0 || completedBatches === batches.length) {
      console.log(`Transactions: ${completedBatches}/${batches.length}`);
    }
    return transactions;
  });

  const counts = { "block-reward": headersScanned };
  const samples = {};
  const structuredStateValues = {};
  const unclassified = [];
  const malformed = [];
  let decoded = 0;

  for (const transaction of transactionGroups.flat()) {
    try {
      const parsed = JSON.parse(transaction.as_json || "{}");
      const type = authoritativeType(parsed, transaction);
      increment(counts, type);
      if (!samples[type]) samples[type] = transaction.tx_hash;
      const rawState = transaction.extra?.sn_state_change?.type;
      if (rawState) increment(structuredStateValues, String(rawState));
      if (type === "state-change") {
        unclassified.push({
          hash: transaction.tx_hash,
          numericType: Number(parsed.type || 0),
          structuredExtraKeys: Object.keys(transaction.extra || {}),
          state: rawState || null,
        });
      }
      decoded += 1;
    } catch (error) {
      malformed.push({ hash: transaction.tx_hash, error: error.message });
    }
  }

  const knownSpecificTypes = [
    "registration", "contribution", "recommission", "decommission",
    "deregistration", "ip-change", "unlock",
  ];
  const missingSpecificTypes = knownSpecificTypes.filter((type) => !counts[type]);

  const report = {
    generatedAt: new Date().toISOString(),
    sources: NODES,
    methodology: {
      headerMethod: "get_block_headers_range(get_tx_hashes=true)",
      transactionMethod: "get_transactions(decode_as_json=true, tx_extra=true)",
      classificationBasis: "decoded structured transaction extra; no raw-byte semantic guessing",
      coinbaseRule: "one miner transaction per scanned canonical block",
    },
    coverage: {
      reportedChainHeight: height,
      headersScanned,
      firstHeight,
      lastHeight,
      transactionHashesEnumerated: uniqueHashes.length,
      transactionsDecoded: decoded,
    },
    counts,
    structuredStateValues,
    samples,
    findings: {
      unclassifiedCount: unclassified.length,
      unclassified,
      malformedCount: malformed.length,
      malformed,
      missingSpecificTypes,
    },
  };

  await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Audit written to ${OUTPUT}`);
  console.log(JSON.stringify({ coverage: report.coverage, counts, findings: {
    unclassifiedCount: unclassified.length,
    malformedCount: malformed.length,
    missingSpecificTypes,
  } }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
