import handler from "vinext/server/app-router-entry";
import deregisteredHistory from "../data/deregistered-service-nodes.json";

interface Env {}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const JUDECOIN_RPC_NODES = [
  "http://node1.judecoin.com:16061",
  "http://node.judecoin.info:16061",
  "http://67.230.167.187:16061",
] as const;

const JUDECOIN_EMISSION_API = "https://www.judeblock.net/api/emission";

const EXPLORER_PAGE_SIZE = 5;
const EXPLORER_PAGE_SIZES = new Set([5, 10, 20, 25, 50, 100]);
const CHAIN_CACHE_FRESH_MS = 20_000;
const CHAIN_CACHE_STALE_MS = 90_000;
const CHAIN_CACHE_TTL_SECONDS = 120;
const CHAIN_CACHE_CREATED_HEADER = "x-judecoin-snapshot-created-at";

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

function explorerPageSize(value: string | null) {
  const parsed = Number.parseInt(value || String(EXPLORER_PAGE_SIZE), 10);
  return EXPLORER_PAGE_SIZES.has(parsed) ? parsed : EXPLORER_PAGE_SIZE;
}

type ExplorerTxType = "block-reward" | "transfer" | "registration" | "contribution" | "recommission" | "decommission" | "deregistration" | "ip-change" | "unlock" | "state-change";

function classifyTransaction(parsed: any, rpcExtra: any = {}): ExplorerTxType {
  const type = Number(parsed?.type || 0);
  // `get_transactions(..., tx_extra: true)` exposes protocol-decoded metadata
  // under `extra`.  This is the authoritative classification source.  Do not
  // infer a semantic state from raw extra bytes: 0x71 is the state-change tag,
  // not a deregistration code (for example, an IP penalty also starts with it).
  const extra = rpcExtra?.extra && typeof rpcExtra.extra === "object" ? rpcExtra.extra : rpcExtra;
  const state = String(extra?.sn_state_change?.type || "").toLowerCase();
  if (state === "dereg" || state === "deregister" || state === "deregistration") return "deregistration";
  if (state === "decom" || state === "decomm" || state === "decommission") return "decommission";
  if (state === "recom" || state === "recomm" || state === "recommission") return "recommission";
  if (state === "ip" || state === "ip-change" || state === "ip_change") return "ip-change";

  // Registration and contribution are encoded as extra fields and can use the
  // normal transfer transaction type, so they must be checked before type 0.
  if (extra?.sn_registration) return "registration";
  if (extra?.sn_contributor) return "contribution";
  if (type === 2 || extra?.key_image_unlock) return "unlock";
  if (Array.isArray(parsed?.vin) && parsed.vin.some((input: any) => input?.gen)) return "block-reward";
  if (type === 0) return "transfer";
  if (type === 1) return "state-change";
  // Numeric type 3 alone is not enough to distinguish a service-node action.
  // Only the decoded structured extra above may assign a specific action.
  if (type === 3) return "state-change";
  return "state-change";
}

type RpcHeader = {
  block_size: number;
  difficulty: number;
  hash: string;
  height: number;
  major_version: number;
  miner_tx_hash?: string;
  num_txes: number;
  reward: number;
  timestamp: number;
};

type RpcServiceNode = {
  active: boolean;
  funded: boolean;
  last_reward_block_height: number;
  last_uptime_proof: number;
  registration_height: number;
  requested_unlock_height: number;
  service_node_pubkey: string;
  service_node_version: number[];
  staking_requirement: number;
  total_contributed: number;
  contributors?: Array<{ address: string; amount: number; reserved: number }>;
  portions_for_operator?: number;
  decommission_count?: number;
  earned_downtime_blocks?: number;
};

async function rpcFetchNode(node: string, path: string, init?: RequestInit): Promise<{ node: string; data: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(`${node}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    return { node, data: await response.json() };
  } finally {
    clearTimeout(timer);
  }
}

let preferredRpcNode: string | null = null;

async function rpcFetch(path: string, init?: RequestInit): Promise<{ node: string; data: any }> {
  let lastError: unknown;
  const nodes = preferredRpcNode
    ? [preferredRpcNode, ...JUDECOIN_RPC_NODES.filter((node) => node !== preferredRpcNode)]
    : [...JUDECOIN_RPC_NODES];
  for (const node of nodes) {
    try {
      const result = await rpcFetchNode(node, path, init);
      preferredRpcNode = node;
      return result;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No synchronized Judecoin data source is reachable");
}

async function jsonRpc(method: string, params: Record<string, unknown> = {}) {
  return rpcFetch("/json_rpc", {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: "explorer-read-only", method, params }),
  });
}

type RpcResult = Awaited<ReturnType<typeof rpcFetch>>;
type RpcCacheEntry = { value?: RpcResult; expiresAt: number; pending?: Promise<RpcResult> };
const rpcResponseCache = new Map<string, RpcCacheEntry>();
const RPC_CACHE_TTL_MS = 12_000;

async function cachedRpcResult(key: string, load: () => Promise<RpcResult>) {
  const now = Date.now();
  const cached = rpcResponseCache.get(key);
  if (cached?.value && cached.expiresAt > now) return cached.value;
  if (cached?.pending) return cached.pending;
  const pending = load().then((value) => {
    rpcResponseCache.set(key, { value, expiresAt: Date.now() + RPC_CACHE_TTL_MS });
    return value;
  }).catch((error) => {
    rpcResponseCache.delete(key);
    throw error;
  });
  rpcResponseCache.set(key, { expiresAt: 0, pending });
  return pending;
}

function requestCacheKey(scope: string, path: string, init?: RequestInit) {
  return `${scope}:${path}:${String(init?.method || "GET")}:${String(init?.body || "")}`;
}

function cachedRpcFetch(path: string, init?: RequestInit) {
  return cachedRpcResult(requestCacheKey("any", path, init), () => rpcFetch(path, init));
}

function cachedRpcFetchNode(node: string, path: string, init?: RequestInit) {
  return cachedRpcResult(requestCacheKey(node, path, init), () => rpcFetchNode(node, path, init));
}

function cachedJsonRpc(method: string, params: Record<string, unknown> = {}) {
  const init = {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: "explorer-read-only", method, params }),
  };
  return cachedRpcFetch("/json_rpc", init);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=12, stale-while-revalidate=30" : "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function serviceNodeStatesRequest() {
  return cachedJsonRpc("get_service_nodes", {
    fields: {
      service_node_pubkey: true,
      active: true,
      funded: true,
      staking_requirement: true,
      total_contributed: true,
      registration_height: true,
      last_reward_block_height: true,
      last_uptime_proof: true,
      service_node_version: true,
      requested_unlock_height: true,
      contributors: true,
      portions_for_operator: true,
      decommission_count: true,
      earned_downtime_blocks: true,
    },
  });
}

async function quorumPageSnapshot(topHeight: number, quorumPage: number, pageSize = EXPLORER_PAGE_SIZE) {
  const quorumEndHeight = Math.max(0, topHeight - quorumPage * pageSize);
  const quorumResponse = await cachedJsonRpc("get_quorum_state", {
    quorum_type: 0,
    start_height: Math.max(0, quorumEndHeight - (pageSize - 1)),
    end_height: quorumEndHeight,
  });
  const result = quorumResponse.data?.result || {};
  return {
    source: "Judecoin mainnet quorum data",
    type: "Service Node testing",
    quorumType: 0,
    trusted: result.untrusted === false,
    page: quorumPage,
    pageSize,
    hasOlder: topHeight - (quorumPage + 1) * pageSize >= 0,
    records: (Array.isArray(result.quorums) ? result.quorums : [])
      .map((entry: any) => ({
        height: Number(entry.height || 0),
        validators: Array.isArray(entry.quorum?.validators) ? entry.quorum.validators.map(String) : [],
        workers: Array.isArray(entry.quorum?.workers) ? entry.quorum.workers.map(String) : [],
      }))
      .filter((entry: { height: number }) => entry.height > 0)
      .sort((a: { height: number }, b: { height: number }) => b.height - a.height)
      .slice(0, pageSize),
    unavailable: ["Checkpoint", "Blink", "Pulse"],
  };
}

async function chainSnapshot(
  blockPage = 0,
  transactionPage = 0,
  quorumPage = 0,
  blockPageSize = EXPLORER_PAGE_SIZE,
  transactionPageSize = EXPLORER_PAGE_SIZE,
  quorumPageSize = EXPLORER_PAGE_SIZE,
) {
  const infoResponse = await cachedRpcFetch("/get_info");
  const info = infoResponse.data;
  if (info?.status !== "OK" || !Number.isInteger(info.height)) throw new Error("Invalid Judecoin node response");

  const topHeight = Math.max(0, info.height - 1);
  const emissionSnapshotPromise = cachedRpcFetchNode(JUDECOIN_EMISSION_API, "").catch(() => null);
  // These independent chain reads start together instead of waiting for the
  // transaction-pool and block scans to finish first.
  const serviceNodesResponsePromise = serviceNodeStatesRequest();
  const quorumSnapshotPromise = quorumPageSnapshot(topHeight, quorumPage, quorumPageSize).catch(() => null);
  const transactionScanSize = Math.max(160, transactionPageSize * 32);
  const transactionEndHeight = Math.max(0, topHeight - transactionPage * transactionScanSize);
  const startHeight = Math.max(0, transactionEndHeight - (transactionScanSize - 1));
  const headersResponse = await cachedJsonRpc("get_block_headers_range", {
    start_height: startHeight,
    end_height: transactionEndHeight,
    fill_pow_hash: false,
  });
  const headers = (headersResponse.data?.result?.headers || []) as RpcHeader[];
  if (!headers.length) throw new Error("Judecoin node returned no block headers");

  let transactionPool: Array<{ hash: string; receivedAt: number; txType: ExplorerTxType; fee: number; size: number; inputs: number; outputs: number }> = [];
  let transactionPoolTotal = 0;
  let transactionPoolTotalBytes = 0;
  try {
    // A mempool is local node state, so one lagging or unhealthy RPC can retain
    // transactions that the rest of the network no longer sees. Read every
    // configured node, keep only nodes on the current chain height, and expose
    // transactions confirmed by a majority of those synchronized nodes.
    const poolResults = await Promise.allSettled(
      JUDECOIN_RPC_NODES.map(async (node) => {
        const [nodeInfo, pool] = await Promise.all([
          cachedRpcFetchNode(node, "/get_info"),
          cachedRpcFetchNode(node, "/get_transaction_pool"),
        ]);
        return {
          node,
          height: Number(nodeInfo.data?.height || 0),
          status: String(nodeInfo.data?.status || ""),
          transactions: Array.isArray(pool.data?.transactions) ? pool.data.transactions : [],
        };
      }),
    );
    const reachablePools = poolResults
      .flatMap((result) => result.status === "fulfilled" ? [result.value] : [])
      .filter((candidate) => candidate.status === "OK" && Number.isInteger(candidate.height) && candidate.height > 0);
    if (!reachablePools.length) throw new Error("No Judecoin transaction pool is reachable");
    const synchronizedHeight = Math.max(...reachablePools.map((candidate) => candidate.height));
    const synchronizedPools = reachablePools.filter((candidate) => candidate.height === synchronizedHeight);
    const observations = new Map<string, { transaction: any; nodes: string[] }>();
    for (const candidate of synchronizedPools) {
      for (const transaction of candidate.transactions) {
        const hash = String(transaction.id_hash || "").toLowerCase();
        if (!/^[a-f0-9]{64}$/.test(hash)) continue;
        const observation = observations.get(hash) || { transaction, nodes: [] };
        if (!observation.nodes.includes(candidate.node)) observation.nodes.push(candidate.node);
        // Prefer the richest copy when nodes expose different optional fields.
        if (String(transaction.tx_json || "").length > String(observation.transaction.tx_json || "").length) {
          observation.transaction = transaction;
        }
        observations.set(hash, observation);
      }
    }

    // The pool endpoint can retain a transaction after it has been mined. Ask
    // each synchronized node to resolve every hash it advertises and keep the
    // transactions that multiple synchronized nodes advertise and still mark
    // as genuinely in pool. Single-node records are deliberately withheld to
    // avoid showing local residue as network-wide pending data.
    const poolDetails = new Map<string, any>();
    const validationResults = await Promise.allSettled(synchronizedPools.map(async (candidate) => {
      const hashes = candidate.transactions
        .map((transaction: any) => String(transaction.id_hash || "").toLowerCase())
        .filter((hash: string) => /^[a-f0-9]{64}$/.test(hash));
      if (!hashes.length) return [];
      const response = await cachedRpcFetchNode(candidate.node, "/get_transactions", {
        method: "POST",
        body: JSON.stringify({ txs_hashes: hashes, decode_as_json: true, tx_extra: true }),
      });
      return Array.isArray(response.data?.txs) ? response.data.txs : [];
    }));
    for (const result of validationResults) {
      if (result.status !== "fulfilled") continue;
      for (const detail of result.value) {
        const hash = String(detail.tx_hash || "").toLowerCase();
        if (!observations.has(hash)) continue;
        if (detail.in_pool !== true || Number(detail.block_height || 0) > 0 || detail.double_spend_seen === true) continue;
        poolDetails.set(hash, detail);
      }
    }
    const rawPool = [...observations.entries()]
      .filter(([hash, observation]) => observation.nodes.length >= 2 && poolDetails.has(hash))
      .map(([, observation]) => observation.transaction);
    transactionPoolTotal = rawPool.length;
    transactionPoolTotalBytes = rawPool.reduce((sum: number, transaction: any) => (
      sum + Number(transaction.blob_size || transaction.weight || 0)
    ), 0);
    const visiblePool = rawPool
      .filter((transaction: any) => /^[a-f0-9]{64}$/.test(String(transaction.id_hash || "")))
      .sort((a: any, b: any) => Number(b.receive_time || b.last_relayed_time || 0) - Number(a.receive_time || a.last_relayed_time || 0))
      .slice(0, EXPLORER_PAGE_SIZE);

    transactionPool = visiblePool
      .map((transaction: any) => {
        const parsed = JSON.parse(transaction.tx_json || "{}");
        const decoded = poolDetails.get(String(transaction.id_hash || ""));
        return {
          hash: String(transaction.id_hash || ""),
          receivedAt: Number(transaction.receive_time || transaction.last_relayed_time || 0),
          txType: classifyTransaction(parsed, decoded || transaction),
          fee: Number(transaction.fee || parsed.rct_signatures?.txnFee || 0),
          size: Number(transaction.blob_size || transaction.weight || 0),
          inputs: Array.isArray(parsed.vin) ? parsed.vin.length : 0,
          outputs: Array.isArray(parsed.vout) ? parsed.vout.length : 0,
        };
      })
      .filter((transaction: { hash: string }) => /^[a-f0-9]{64}$/.test(transaction.hash));
  } catch {
    // A pool lookup failure must not prevent confirmed chain data from loading.
  }

  const blockEndHeight = Math.max(0, topHeight - blockPage * blockPageSize);
  const blockStartHeight = Math.max(0, blockEndHeight - (blockPageSize - 1));
  const blockHeaders = blockPage === 0 && transactionPage === 0
    ? headers.filter((header) => header.height >= blockStartHeight)
    : ((await cachedJsonRpc("get_block_headers_range", {
        start_height: blockStartHeight,
        end_height: blockEndHeight,
        fill_pow_hash: false,
      })).data?.result?.headers || []) as RpcHeader[];

  const serviceNodesResponse = await serviceNodesResponsePromise;
  const serviceNodeStates = (serviceNodesResponse.data?.result?.service_node_states || []) as RpcServiceNode[];
  const currentServiceNodeStates = serviceNodeStates.filter(
    (node) => node.requested_unlock_height === 0 || node.requested_unlock_height > topHeight,
  );

  let quorumSnapshot: Awaited<ReturnType<typeof quorumPageSnapshot>> = {
    source: "Judecoin mainnet quorum data", type: "Service Node testing", quorumType: 0,
    trusted: false, page: quorumPage, pageSize: quorumPageSize, hasOlder: true, records: [], unavailable: ["Checkpoint", "Blink", "Pulse"],
  };
  const resolvedQuorumSnapshot = await quorumSnapshotPromise;
  if (resolvedQuorumSnapshot) quorumSnapshot = resolvedQuorumSnapshot;

  const newest = [...headers].reverse();
  const latestBlockTimestamp = Number(newest[0]?.timestamp || 0);
  const latestBlockAgeSeconds = latestBlockTimestamp > 0 ? Math.max(0, Math.floor(Date.now() / 1000) - latestBlockTimestamp) : Number.MAX_SAFE_INTEGER;
  const targetSeconds = Math.max(1, Number(info.target || 180));
  const emissionResponse = await emissionSnapshotPromise;
  const emissionRecord = emissionResponse?.data?.status === "success" ? emissionResponse.data?.data : null;
  const minedSupply = Number(emissionRecord?.coinbase || 0);
  const supplyHeight = Number(emissionRecord?.blk_no || 0);
  const hasCurrentMinedSupply = Number.isFinite(minedSupply)
    && minedSupply > 0
    && Number.isInteger(supplyHeight)
    && Math.abs(supplyHeight - topHeight) <= 1_000;
  const latestBlockHeaders = [...blockHeaders].reverse().slice(0, blockPageSize);
  const latestBlockDetails = await Promise.all(latestBlockHeaders.map(async (header) => {
    const response = await cachedJsonRpc("get_block", { height: header.height });
    return JSON.parse(response.data?.result?.json || "{}");
  }));
  const transactionBlocks = newest.filter((header) => header.num_txes > 0).slice(0, transactionPageSize);
  const transactionGroups = await Promise.all(transactionBlocks.map(async (header) => {
    const response = await cachedJsonRpc("get_block", { height: header.height });
    const parsed = JSON.parse(response.data?.result?.json || "{}");
    return (parsed.tx_hashes || []).map((hash: string) => ({
      hash,
      block: header.height,
      timestamp: header.timestamp,
      size: null,
      confirmations: topHeight - header.height + 1,
    }));
  }));

  const transactionBase = transactionGroups.flat().slice(0, transactionPageSize);
  const requestedTxHashes = [...new Set([
    ...transactionBase.map((transaction) => transaction.hash),
    ...latestBlockDetails.flatMap((block) => block.tx_hashes || []),
  ])];
  const transactionDetailsResponse = requestedTxHashes.length ? await cachedRpcFetch("/get_transactions", {
    method: "POST",
    body: JSON.stringify({ txs_hashes: requestedTxHashes, decode_as_json: true, tx_extra: true }),
  }) : { data: { txs: [] } };
  const transactionDetails = new Map((transactionDetailsResponse.data?.txs || []).map((transaction: any) => {
    const parsed = JSON.parse(transaction.as_json || "{}");
    return [transaction.tx_hash, {
      fee: Number(parsed.rct_signatures?.txnFee || 0),
      inputs: Array.isArray(parsed.vin) ? parsed.vin.length : 0,
      outputs: Array.isArray(parsed.vout) ? parsed.vout.length : 0,
      size: Number(transaction.size || 0),
      txType: classifyTransaction(parsed, transaction),
    }];
  }));

  return {
    live: true,
    source: "Judecoin mainnet",
    node: new URL(infoResponse.node).hostname,
    fetchedAt: new Date().toISOString(),
    network: {
      height: topHeight,
      difficulty: Number(info.difficulty || newest[0].difficulty),
      targetSeconds,
      hashrate: Number(info.difficulty || newest[0].difficulty) / targetSeconds,
      hardFork: Number(info.hard_fork || newest[0].major_version),
      protocol: String(info.version || newest[0].major_version),
      txPoolSize: Number(info.tx_pool_size || 0),
      blockSizeMedian: Number(info.block_weight_median || info.block_size_median || 0),
      blockSizeLimit: Number(info.block_weight_limit || info.block_size_limit || 0),
      coinbase: null,
      fees: null,
      minedSupply: hasCurrentMinedSupply ? minedSupply : null,
      supplyHeight: hasCurrentMinedSupply ? supplyHeight : null,
      supplySource: hasCurrentMinedSupply ? "Judecoin emission index API" : null,
      latestBlockTimestamp,
      latestBlockAgeSeconds,
      synced: latestBlockAgeSeconds <= Math.max(900, targetSeconds * 5),
    },
    transactionPool: {
      count: transactionPoolTotal,
      totalBytes: transactionPoolTotalBytes,
      transactions: transactionPool,
    },
    pagination: { blockPage, transactionPage, pageSize: blockPageSize, transactionScanSize },
    blocks: latestBlockHeaders.map((header, index) => {
      const parsed = latestBlockDetails[index] || {};
      const minerInputs = Array.isArray(parsed.miner_tx?.vin) && parsed.miner_tx.vin.some((input: any) => input?.gen) ? 0 : (parsed.miner_tx?.vin?.length || 0);
      const minerOutputs = parsed.miner_tx?.vout?.length || 0;
      const regularTransactions = (parsed.tx_hashes || []).map((hash: string) => transactionDetails.get(hash)).filter(Boolean) as Array<{ fee: number; inputs: number; outputs: number }>;
      const blockFee = regularTransactions.reduce((sum, transaction) => sum + transaction.fee, 0);
      return {
      height: header.height,
      timestamp: header.timestamp,
      hash: header.hash,
      txs: header.num_txes,
      size: header.block_size,
      difficulty: header.difficulty,
      fee: blockFee,
      reward: Math.max(0, Number(header.reward || 0) - blockFee),
      inputs: minerInputs + regularTransactions.reduce((sum, transaction) => sum + transaction.inputs, 0),
      outputs: minerOutputs + regularTransactions.reduce((sum, transaction) => sum + transaction.outputs, 0),
    }; }),
    transactions: transactionBase.map((transaction) => {
      const details = transactionDetails.get(transaction.hash) as { fee: number; inputs: number; outputs: number; size: number; txType: ExplorerTxType } | undefined;
      return { ...transaction, txType: details?.txType || "transfer", size: details?.size || null, fee: details?.fee || 0, reward: 0, inputs: details?.inputs || 0, outputs: details?.outputs || 0 };
    }),
    serviceNodes: {
      total: currentServiceNodeStates.length,
      active: currentServiceNodeStates.filter((node) => node.active).length,
      funded: currentServiceNodeStates.filter((node) => node.funded).length,
      exiting: currentServiceNodeStates.filter((node) => node.requested_unlock_height > topHeight).length,
      decommissioned: currentServiceNodeStates.filter(
        (node) => !node.active && node.funded && node.requested_unlock_height === 0,
      ).length,
      stakingRequirement: currentServiceNodeStates[0]?.staking_requirement || 0,
      totalContributed: currentServiceNodeStates.reduce((sum, node) => sum + Number(node.total_contributed || 0), 0),
      page: 0,
      pageSize: currentServiceNodeStates.length,
      nodes: [...currentServiceNodeStates]
        .sort((a, b) => {
          return Number(b.last_reward_block_height || 0) - Number(a.last_reward_block_height || 0)
            || Number(b.registration_height || 0) - Number(a.registration_height || 0)
            || a.service_node_pubkey.localeCompare(b.service_node_pubkey);
        })
        .map((node) => ({
          publicKey: node.service_node_pubkey,
          active: node.active,
          funded: node.funded,
          contributed: node.total_contributed,
          requirement: node.staking_requirement,
          registeredAt: node.registration_height,
          lastRewardAt: node.last_reward_block_height,
          lastUptimeProof: node.last_uptime_proof,
          version: node.service_node_version.join("."),
          unlocking: node.requested_unlock_height > topHeight,
          unlockAt: Number(node.requested_unlock_height || 0),
          contributors: node.contributors?.length || 0,
          maxContributors: 9,
          operatorFee: Number.isFinite(Number(node.portions_for_operator))
            ? Math.round((Number(node.portions_for_operator) / 1.8446744073709552e19) * 10_000) / 100
            : null,
        })),
      unlockingNodes: currentServiceNodeStates
        .filter((node) => node.requested_unlock_height > topHeight)
        .sort((a, b) => a.requested_unlock_height - b.requested_unlock_height)
        .map((node) => ({
          publicKey: node.service_node_pubkey,
          contributed: Number(node.total_contributed || 0),
          registeredAt: Number(node.registration_height || 0),
          lastRewardAt: Number(node.last_reward_block_height || 0),
          unlockAt: Number(node.requested_unlock_height || 0),
        })),
      decommissionedNodes: currentServiceNodeStates
        .filter((node) => !node.active && node.funded && node.requested_unlock_height === 0)
        .sort((a, b) => b.last_uptime_proof - a.last_uptime_proof)
        .map((node) => ({
          publicKey: node.service_node_pubkey,
          contributors: node.contributors?.length || 0,
          maxContributors: 9,
          operatorFee: Number.isFinite(Number(node.portions_for_operator))
            ? Math.round((Number(node.portions_for_operator) / 1.8446744073709552e19) * 10_000) / 100
            : null,
          lastUptimeProof: Number(node.last_uptime_proof || 0),
          decommissionCount: Number(node.decommission_count || 0),
          downtimeCredit: Number(node.earned_downtime_blocks || 0),
        })),
    },
    quorums: quorumSnapshot,
    deregisteredServiceNodes: {
      total: deregisteredHistory.nodes.length,
      page: 0,
      pageSize: deregisteredHistory.nodes.length,
      indexedThrough: deregisteredHistory.sourceHeight,
      generatedAt: deregisteredHistory.generatedAt,
      nodes: deregisteredHistory.nodes
        .map((node) => ({ ...node })),
    },
  };
}

async function createChainResponse(url: URL) {
  try {
    const blockPage = Math.min(10000, Math.max(0, Number.parseInt(url.searchParams.get("blockPage") || "0", 10) || 0));
    const transactionPage = Math.min(10000, Math.max(0, Number.parseInt(url.searchParams.get("transactionPage") || "0", 10) || 0));
    const quorumPage = Math.min(10000, Math.max(0, Number.parseInt(url.searchParams.get("quorumPage") || "0", 10) || 0));
    const blockPageSize = explorerPageSize(url.searchParams.get("blockPageSize"));
    const transactionPageSize = explorerPageSize(url.searchParams.get("transactionPageSize"));
    const quorumPageSize = explorerPageSize(url.searchParams.get("quorumPageSize"));
    return json(await chainSnapshot(
      blockPage, transactionPage, quorumPage,
      blockPageSize, transactionPageSize, quorumPageSize,
    ));
  } catch (error) {
    return json({ live: false, error: error instanceof Error ? error.message : "Network data unavailable" }, 503);
  }
}

function storedChainResponse(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("cache-control", `public, max-age=0, s-maxage=${CHAIN_CACHE_TTL_SECONDS}`);
  headers.set(CHAIN_CACHE_CREATED_HEADER, String(Date.now()));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function refreshChainCache(cache: EdgeCache, cacheKey: Request, url: URL) {
  const response = await createChainResponse(url);
  if (!response.ok) return response;
  const stored = storedChainResponse(response);
  try {
    await cache.put(cacheKey, stored.clone());
  } catch {
    // A cache write failure must never block fresh chain data.
  }
  return stored;
}

async function cachedChainResponse(request: Request, url: URL, ctx: ExecutionContext) {
  const cache = (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches?.default;
  if (!cache) return createChainResponse(url);

  const cacheKey = new Request(request.url, { method: "GET" });
  let cached: Response | undefined;
  try {
    cached = await cache.match(cacheKey);
  } catch {
    return createChainResponse(url);
  }

  if (cached) {
    const createdAt = Number(cached.headers.get(CHAIN_CACHE_CREATED_HEADER) || 0);
    const age = Math.max(0, Date.now() - createdAt);
    if (createdAt > 0 && age <= CHAIN_CACHE_FRESH_MS) return cached;
    if (createdAt > 0 && age <= CHAIN_CACHE_STALE_MS) {
      ctx.waitUntil(refreshChainCache(cache, cacheKey, url).then(() => undefined));
      return cached;
    }
  }

  return refreshChainCache(cache, cacheKey, url);
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/block" && request.method === "GET") {
      const id = url.searchParams.get("id") || "";
      const isHeight = /^\d{1,10}$/.test(id);
      const isHash = /^[a-f0-9]{64}$/i.test(id);
      if (!isHeight && !isHash) return json({ error: "Enter a valid block height or 64-character block hash" }, 400);
      try {
        const response = await jsonRpc("get_block", isHeight ? { height: Number(id) } : { hash: id.toLowerCase() });
        const header = response.data?.result?.block_header as RpcHeader | undefined;
        if (!header) return json({ error: "Block not found" }, 404);
        const blockResult = response.data?.result || {};
        const parsedBlock = JSON.parse(blockResult.json || "{}");
        const minerHash = String(blockResult.miner_tx_hash || header.miner_tx_hash || "");
        const minerResponse = minerHash ? await rpcFetch("/get_transactions", {
          method: "POST",
          body: JSON.stringify({ txs_hashes: [minerHash], decode_as_json: true }),
        }) : { data: { txs: [] } };
        const minerRecord = minerResponse.data?.txs?.[0] || {};
        const minerTransaction = JSON.parse(minerRecord.as_json || JSON.stringify(parsedBlock.miner_tx || {}));
        const extraBytes = Array.isArray(minerTransaction.extra) ? minerTransaction.extra : [];
        const publicKeyOffset = extraBytes.findIndex((value: number, index: number) => value === 1 && extraBytes.length >= index + 33);
        const txPublicKey = publicKeyOffset >= 0
          ? extraBytes.slice(publicKeyOffset + 1, publicKeyOffset + 33).map((value: number) => value.toString(16).padStart(2, "0")).join("")
          : "";
        const outputs = (minerTransaction.vout || []).map((output: any, index: number) => ({
          index,
          amount: Number(output.amount || 0),
          key: String(output.target?.key || ""),
          globalIndex: Number(minerRecord.output_indices?.[index] ?? -1),
          unlockHeight: Number(minerTransaction.output_unlock_times?.[index] ?? minerTransaction.unlock_time ?? 0),
        }));
        return json({
          type: "block",
          height: header.height,
          hash: header.hash,
          timestamp: header.timestamp,
          transactions: header.num_txes,
          size: header.block_size,
          difficulty: header.difficulty,
          majorVersion: header.major_version,
          minorVersion: Number((header as any).minor_version || 0),
          orphan: Boolean((header as any).orphan_status),
          confirmations: Number((header as any).depth || 0) + 1,
          reward: Number((header as any).reward || 0),
          minerTransaction: {
            hash: minerHash,
            publicKey: txPublicKey,
            version: Number(minerTransaction.version || 0),
            type: Number(minerTransaction.type || 0),
            unlockHeight: Number(minerTransaction.unlock_time || 0),
            size: Number(minerRecord.size || 0),
            fee: Number(minerTransaction.rct_signatures?.txnFee || 0),
            ringCtType: Number(minerTransaction.rct_signatures?.type || 0),
            serviceNodeWinner: String((header as any).service_node_winner || ""),
            extra: extraBytes.map((value: number) => value.toString(16).padStart(2, "0")).join(""),
            outputs,
            raw: minerTransaction,
          },
        });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Block lookup failed" }, 502);
      }
    }

    if (url.pathname === "/api/transaction" && request.method === "GET") {
      const hash = (url.searchParams.get("hash") || "").toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(hash)) return json({ error: "Enter a valid 64-character transaction hash" }, 400);
      try {
        const response = await rpcFetch("/get_transactions", {
          method: "POST",
          body: JSON.stringify({ txs_hashes: [hash], decode_as_json: true, tx_extra: true }),
        });
        let tx = response.data?.txs?.[0];
        if (!tx) {
          // A pending transaction may be visible in one node's mempool while
          // another synchronized node does not return it from get_transactions.
          // Fall back to the authoritative raw transaction stored by the pool
          // instead of presenting a false "not found" error to the explorer.
          const lookupNodes = [...new Set([
            response.node,
            ...(preferredRpcNode ? [preferredRpcNode] : []),
            ...JUDECOIN_RPC_NODES,
          ])];
          let poolTransaction: any = null;
          for (const node of lookupNodes) {
            try {
              const poolResponse = await cachedRpcFetchNode(node, "/get_transaction_pool");
              poolTransaction = (Array.isArray(poolResponse.data?.transactions) ? poolResponse.data.transactions : [])
                .find((transaction: any) => String(transaction.id_hash || "").toLowerCase() === hash);
              if (poolTransaction) break;
            } catch {
              // Continue to the next configured read-only node.
            }
          }
          if (!poolTransaction) return json({ error: "Transaction not found" }, 404);
          tx = {
            tx_hash: hash,
            as_json: String(poolTransaction.tx_json || "{}"),
            block_height: 0,
            block_timestamp: Number(poolTransaction.receive_time || poolTransaction.last_relayed_time || 0),
            size: Number(poolTransaction.blob_size || poolTransaction.weight || 0),
            fee: Number(poolTransaction.fee || 0),
            in_pool: true,
            blink: Boolean(poolTransaction.blink),
            double_spend_seen: Boolean(poolTransaction.double_spend_seen),
            output_indices: [],
            extra: poolTransaction.extra,
          };
        }
        const infoResponse = await rpcFetch("/get_info");
        const parsed = JSON.parse(tx.as_json || tx.tx_json || "{}");
        const extraBytes = Array.isArray(parsed.extra) ? parsed.extra : [];
        const publicKeyOffset = extraBytes.findIndex((value: number, index: number) => value === 1 && extraBytes.length >= index + 33);
        const txPublicKey = publicKeyOffset >= 0 ? extraBytes.slice(publicKeyOffset + 1, publicKeyOffset + 33).map((value: number) => value.toString(16).padStart(2, "0")).join("") : "";
        const paymentIdOffset = extraBytes.findIndex((value: number, index: number) => value === 2 && extraBytes[index + 1] === 9 && extraBytes[index + 2] === 1 && extraBytes.length >= index + 11);
        const paymentId = paymentIdOffset >= 0 ? extraBytes.slice(paymentIdOffset + 3, paymentIdOffset + 11).map((value: number) => value.toString(16).padStart(2, "0")).join("") : "";
        const inputs = (parsed.vin || []).map((input: any, index: number) => {
          let absoluteOffset = 0;
          const keyOffsets = Array.isArray(input.key?.key_offsets)
            ? input.key.key_offsets.map((offset: unknown) => {
                absoluteOffset += Number(offset || 0);
                return absoluteOffset;
              })
            : [];
          return {
            index,
            type: input.gen ? "coinbase" : input.key ? "key" : "special",
            keyImage: String(input.key?.k_image || ""),
            amount: Number(input.key?.amount || 0),
            ringSize: keyOffsets.length,
            keyOffsets,
            ringMembers: [] as Array<{ index: number; outputKey: string; transactionHash: string; blockHeight: number; unlocked: boolean }>,
          };
        });
        const requestedRingOutputs = inputs.flatMap((input: any) => input.keyOffsets.map((offset: number) => ({ amount: input.amount, index: offset })));
        if (requestedRingOutputs.length) {
          try {
            const ringResponse = await rpcFetch("/get_outs", {
              method: "POST",
              body: JSON.stringify({ outputs: requestedRingOutputs, get_txid: true }),
            });
            const ringOutputs = Array.isArray(ringResponse.data?.outs) ? ringResponse.data.outs : [];
            let cursor = 0;
            for (const input of inputs) {
              input.ringMembers = input.keyOffsets.map((offset: number) => {
                const member = ringOutputs[cursor++] || {};
                return {
                  index: offset,
                  outputKey: String(member.key || ""),
                  transactionHash: String(member.txid || ""),
                  blockHeight: Number(member.height || 0),
                  unlocked: Boolean(member.unlocked),
                };
              });
            }
          } catch {
            // Some public nodes intentionally disable get_outs. Absolute indices
            // remain useful and are returned without inventing member details.
          }
        }
        return json({
          type: "transaction",
          hash: tx.tx_hash || hash,
          blockHeight: tx.block_height,
          confirmations: tx.in_pool ? 0 : Math.max(0, Number(infoResponse.data?.height || 0) - Number(tx.block_height || 0) + 1),
          timestamp: tx.block_timestamp,
          size: tx.size,
          inPool: Boolean(tx.in_pool),
          blink: Boolean(tx.blink),
          doubleSpendSeen: Boolean(tx.double_spend_seen),
          version: Number(parsed.version || 0),
          transactionType: Number(parsed.type || 0),
          txType: classifyTransaction(parsed, tx),
          unlockTime: Number(parsed.unlock_time || 0),
          fee: Number(parsed.rct_signatures?.txnFee || tx.fee || 0),
          ringCtType: Number(parsed.rct_signatures?.type || 0),
          publicKey: txPublicKey,
          paymentId,
          extra: extraBytes.map((value: number) => value.toString(16).padStart(2, "0")).join(""),
          inputs,
          outputs: (parsed.vout || []).map((output: any, index: number) => ({ index, key: String(output.target?.key || ""), globalIndex: Number(tx.output_indices?.[index] ?? -1), unlockHeight: Number(parsed.output_unlock_times?.[index] ?? parsed.unlock_time ?? 0), confidential: Number(output.amount || 0) === 0 })),
          raw: parsed,
        });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Transaction lookup failed" }, 502);
      }
    }

    if (url.pathname === "/api/service-node" && request.method === "GET") {
      const key = (url.searchParams.get("key") || "").toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(key)) return json({ error: "Enter a valid 64-character service-node public key" }, 400);
      try {
        const response = await jsonRpc("get_service_nodes", {
          service_node_pubkeys: [key],
          fields: {
            service_node_pubkey: true,
            active: true,
            funded: true,
            operator_address: true,
            contributors: true,
            public_ip: true,
            quorumnet_port: true,
            staking_requirement: true,
            total_contributed: true,
            registration_height: true,
            last_reward_block_height: true,
            last_uptime_proof: true,
            service_node_version: true,
            requested_unlock_height: true,
            decommission_count: true,
            swarm_id: true,
            last_decommission_height: true,
            last_ip_change_height: true,
            recommission_credit: true,
            registration_hf_version: true,
            storage_port: true,
            storage_lmq_port: true,
            pubkey_ed25519: true,
            pubkey_x25519: true,
          },
        });
        const node = response.data?.result?.service_node_states?.[0];
        if (!node) {
          const historicalNode = deregisteredHistory.nodes.find((entry) => entry.publicKey === key);
          if (!historicalNode) return json({ error: "Service node not found" }, 404);
          return json({
            type: "service-node",
            historical: true,
            publicKey: historicalNode.publicKey,
            active: false,
            funded: false,
            registrationHeight: historicalNode.registeredAt,
            unlockHeight: historicalNode.unlockedAt,
            contributions: historicalNode.contributions,
          });
        }
        return json({
          type: "service-node",
          publicKey: node.service_node_pubkey,
          active: Boolean(node.active),
          funded: Boolean(node.funded),
          operatorAddress: node.operator_address || null,
          publicEndpoint: node.public_ip ? [node.public_ip, node.quorumnet_port].filter(Boolean).join(":") : null,
          stakingRequirement: Number(node.staking_requirement || 0),
          totalContributed: Number(node.total_contributed || 0),
          registrationHeight: Number(node.registration_height || 0),
          lastRewardHeight: Number(node.last_reward_block_height || 0),
          lastUptimeProof: Number(node.last_uptime_proof || 0),
          version: Array.isArray(node.service_node_version) && node.service_node_version.length ? node.service_node_version.join(".") : null,
          unlockHeight: Number(node.requested_unlock_height || 0),
          decommissionCount: Number(node.decommission_count || 0),
          swarmId: node.swarm_id == null ? null : Number.isSafeInteger(node.swarm_id) ? String(node.swarm_id) : `${String(node.swarm_id)} (numeric precision not guaranteed)`,
          lastDecommissionHeight: Number(node.last_decommission_height || 0),
          lastIpChangeHeight: Number(node.last_ip_change_height || 0),
          recommissionCredit: Number(node.recommission_credit || 0),
          registrationProtocol: Number(node.registration_hf_version || 0),
          storagePort: Number(node.storage_port || 0),
          storageLmqPort: Number(node.storage_lmq_port || 0),
          ed25519PublicKey: String(node.pubkey_ed25519 || ""),
          x25519PublicKey: String(node.pubkey_x25519 || ""),
          contributors: (node.contributors || []).map((contributor: any) => ({
            address: contributor.address,
            amount: Number(contributor.amount || 0),
            reserved: Number(contributor.reserved || 0),
          })),
          raw: node,
        });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Service-node lookup failed" }, 502);
      }
    }

    if (url.pathname === "/api/quorums" && request.method === "GET") {
      try {
        const quorumPage = Math.min(10000, Math.max(0, Number.parseInt(url.searchParams.get("page") || "0", 10) || 0));
        const pageSize = explorerPageSize(url.searchParams.get("pageSize"));
        const infoResponse = await rpcFetch("/get_info");
        const topHeight = Math.max(0, Number(infoResponse.data?.height || 1) - 1);
        return json(await quorumPageSnapshot(topHeight, quorumPage, pageSize));
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Quorum data unavailable" }, 503);
      }
    }

    if (url.pathname === "/api/chain" && request.method === "GET") {
      return cachedChainResponse(request, url, ctx);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
