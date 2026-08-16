"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Block = {
  height: number;
  age: string;
  hash: string;
  txs: number;
  size: string;
  difficulty: string;
  fee?: number;
  reward?: number;
  inputs?: number;
  outputs?: number;
};

type Transaction = {
  hash: string;
  age: string;
  block: number;
  size: string;
  confirmations: number;
  fee?: number;
  reward?: number;
  inputs?: number;
  outputs?: number;
  txType: string;
};

type ChainSnapshot = {
  live: boolean;
  source: string;
  node: string;
  fetchedAt: string;
  network: {
    height: number;
    difficulty: number;
    targetSeconds: number;
    hashrate: number;
    hardFork: number;
    protocol: string;
    txPoolSize: number;
    blockSizeMedian: number;
    blockSizeLimit: number;
    coinbase: string | null;
    fees: string | null;
    minedSupply: number | null;
    supplyHeight: number | null;
    supplySource: string | null;
    latestBlockTimestamp: number;
    latestBlockAgeSeconds: number;
    synced: boolean;
  };
  blocks: Array<{ height: number; timestamp: number; hash: string; txs: number; size: number; difficulty: number; fee: number; reward: number; inputs: number; outputs: number }>;
  transactions: Array<{ hash: string; block: number; timestamp: number; size: number | null; confirmations: number; fee: number; reward: number; inputs: number; outputs: number; txType: string }>;
  transactionPool: {
    count: number;
    totalBytes: number;
    transactions: Array<{ hash: string; receivedAt: number; txType: string; fee: number; size: number; inputs: number; outputs: number }>;
  };
  pagination: { blockPage: number; transactionPage: number; pageSize: number; transactionScanSize: number };
  serviceNodes: {
    total: number;
    active: number;
    funded: number;
    exiting: number;
    decommissioned: number;
    stakingRequirement: number;
    totalContributed: number;
    page: number;
    pageSize: number;
    decommissionedNodes: Array<{
      publicKey: string;
      contributors: number;
      maxContributors: number;
      operatorFee: number | null;
      lastUptimeProof: number;
      decommissionCount: number;
      downtimeCredit: number;
    }>;
    nodes: Array<{
      publicKey: string;
      active: boolean;
      funded: boolean;
      contributed: number;
      requirement: number;
      registeredAt: number;
      lastRewardAt: number;
      lastUptimeProof: number;
      version: string;
      unlocking: boolean;
      unlockAt: number;
      contributors: number;
      maxContributors: number;
      operatorFee: number | null;
    }>;
    unlockingNodes: Array<{
      publicKey: string;
      contributed: number;
      registeredAt: number;
      lastRewardAt: number;
      unlockAt: number;
    }>;
  };
  quorums: {
    source: string;
    type: string;
    quorumType: number;
    trusted: boolean;
    page: number;
    pageSize: number;
    hasOlder: boolean;
    records: Array<{ height: number; validators: string[]; workers: string[] }>;
    unavailable: string[];
  };
  deregisteredServiceNodes: {
    total: number;
    page: number;
    pageSize: number;
    indexedThrough: number;
    generatedAt: string;
    nodes: Array<{ publicKey: string; registeredAt: number; unlockedAt: number; contributions: number }>;
  };
};

type Detail = {
  title: string;
  kind?: "transaction" | "block" | "service-node";
  rows: Array<{ label: string; value: ReactNode }>;
  sections?: Array<{ kicker: string; title: string; rows: Array<{ label: string; value: ReactNode }> }>;
  inputs?: Array<{ index: number; type: string; keyImage: string; amount: number; ringSize: number; keyOffsets?: number[]; ringMembers?: Array<{ index: number; outputKey: string; transactionHash: string; blockHeight: number; unlocked: boolean }> }>;
  note?: string;
  fullPage?: boolean;
  outputs?: Array<{ index: number; amount?: number; key: string; globalIndex: number; unlockHeight: number; confidential?: boolean }>;
  outputTitle?: string;
  raw?: string;
};

const TX_TYPE_META: Record<string, { label: string; icon?: string }> = {
  transfer: { label: "Transfer", icon: "/tx-types/transfer.png" }, registration: { label: "Registration", icon: "/tx-types/registration.png" },
  contribution: { label: "Contribution", icon: "/tx-types/contribution.png" }, recommission: { label: "Recommission", icon: "/tx-types/recommission.png" },
  decommission: { label: "Decommission", icon: "/tx-types/decommission.png" }, deregistration: { label: "Deregistration", icon: "/tx-types/deregistration.png" },
  "ip-change": { label: "IP Change", icon: "/tx-types/ip-change.png" }, unlock: { label: "Unlock", icon: "/tx-types/unlock.png" },
  "block-reward": { label: "Block Reward", icon: "/tx-types/block-reward.png" },
  // Never reuse a specific lifecycle icon for an unclassified state change:
  // that would present a guess (for example, decommission) as a chain fact.
  "state-change": { label: "Unclassified State Change" },
};
const TX_TYPE_LEGEND = ["block-reward", "transfer", "registration", "contribution", "recommission", "decommission", "deregistration", "ip-change", "unlock"];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 25, 50, 100] as const;
const SNAPSHOT_CACHE_TTL_MS = 12_000;
const SNAPSHOT_RETRY_DELAYS_MS = [0, 1_200, 3_000] as const;
const snapshotCache = new Map<string, { data: ChainSnapshot; expiresAt: number }>();
const snapshotRequests = new Map<string, Promise<ChainSnapshot>>();

function isBlockHeightLabel(label: string) {
  return /\bHEIGHT\b|\bAT BLOCK\b|\bREWARD BLOCK\b|\bDECOMMISSION BLOCK\b|\bIP CHANGE BLOCK\b|\bREGISTERED BLOCK\b/.test(label);
}

async function fetchSnapshot(params: URLSearchParams) {
  const key = params.toString();
  const cached = snapshotCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  if (cached) snapshotCache.delete(key);
  const pending = snapshotRequests.get(key);
  if (pending) return pending;
  const request = fetch(`/api/chain?${key}`).then(async (response) => {
    if (!response.ok) throw new Error("Network data unavailable");
    const data = await response.json() as ChainSnapshot;
    snapshotCache.set(key, { data, expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS });
    return data;
  }).finally(() => snapshotRequests.delete(key));
  snapshotRequests.set(key, request);
  return request;
}

async function fetchSnapshotWithRetry(params: URLSearchParams) {
  let lastError: unknown;
  for (const delay of SNAPSHOT_RETRY_DELAYS_MS) {
    if (delay) await new Promise<void>((resolve) => window.setTimeout(resolve, delay));
    try {
      return await fetchSnapshot(params);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network data unavailable");
}

function PaginationControls({ page, lastPage, pageSize, onPageChange, onPageSizeChange, onPrefetchPage, disableNext = false, loading = false }: {
  page: number;
  lastPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onPrefetchPage?: (page: number) => void;
  disableNext?: boolean;
  loading?: boolean;
}) {
  return <div className="pager">
    <div className="page-navigation">
      <button disabled={loading || page === 0} onMouseEnter={() => onPrefetchPage?.(Math.max(0, page - 1))} onFocus={() => onPrefetchPage?.(Math.max(0, page - 1))} onClick={() => onPageChange(Math.max(0, page - 1))}>← {"Prev"}</button>
      <span>{loading ? "Loading…" : `Page ${compact(page + 1)} of ${compact(lastPage + 1)}`}</span>
      <button disabled={loading || disableNext || page >= lastPage} onMouseEnter={() => onPrefetchPage?.(Math.min(lastPage, page + 1))} onFocus={() => onPrefetchPage?.(Math.min(lastPage, page + 1))} onClick={() => onPageChange(Math.min(lastPage, page + 1))}>{"Next"} →</button>
    </div>
    <label className="page-size-control" title={"Rows per page"}>
      <span className="sr-only">{"Rows per page"}</span>
      <select aria-label={"Rows per page"} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
        {PAGE_SIZE_OPTIONS.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    </label>
  </div>;
}

function TxTypeBadge({ type, compact = false, iconOnly = false }: { type: string; compact?: boolean; iconOnly?: boolean }) {
  const meta = TX_TYPE_META[type] || TX_TYPE_META["state-change"];
  const label = meta.label;
  return <span className={`tx-type-badge${compact ? " compact" : ""}${iconOnly ? " icon-only" : ""}${meta.icon ? "" : " unclassified"}`} title={label} aria-label={label}>{meta.icon ? <img src={meta.icon} alt="" aria-hidden="true" /> : <span aria-hidden="true">?</span>}{!iconOnly && <b>{label}</b>}</span>;
}

function DetailValue({ value }: { value: ReactNode }) {
  return typeof value === "string" || typeof value === "number" ? <code>{value}</code> : <>{value}</>;
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function inOut(inputs?: number, outputs?: number) {
  if (inputs == null && outputs == null) return "N/A";
  return `${inputs ?? "N/A"}/${outputs ?? "N/A"}`;
}

function age(timestamp: number) {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function bytes(value: number | null) {
  return value == null ? "SHIELDED" : value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} kB`;
}

function difficulty(value: number) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} G`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)} M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)} K`;
  return compact(value);
}

function hashPreview(value: string) {
  return value.length > 32 ? `${value.slice(0, 20)}...${value.slice(-8)}` : value;
}

function jude(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value / 1_000_000_000);
}

function atomicJude(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 9 }).format(value / 1_000_000_000);
}

function estimatedBlockWait(blocks: number, targetSeconds: number) {
  if (blocks <= 0) return "Unlock height reached";
  const totalMinutes = Math.max(1, Math.round((blocks * targetSeconds) / 60));
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${compact(days)} d ${hours} h`;
  if (hours) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

function estimatedBlockDate(currentHeight: number, unlockHeight: number, targetSeconds: number, latestBlockTimestamp: number) {
  const remainingBlocks = Math.max(0, unlockHeight - currentHeight);
  const timestamp = (latestBlockTimestamp + remainingBlocks * targetSeconds) * 1_000;
  return `${new Date(timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} UTC`;
}

export default function Home({ serviceNodesOnly = false, statisticsOnly = false }: { serviceNodesOnly?: boolean; statisticsOnly?: boolean }) {
  const [query, setQuery] = useState("");
  const [serviceNodeQuery, setServiceNodeQuery] = useState("");
  const [message, setMessage] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<ChainSnapshot | null>(null);
  const [connection, setConnection] = useState<"loading" | "live" | "offline">("loading");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [blockPage, setBlockPage] = useState(0);
  const [transactionPage, setTransactionPage] = useState(0);
  const [quorumPage, setQuorumPage] = useState(0);
  const [serviceNodePage, setServiceNodePage] = useState(0);
  const [deregisteredNodePage, setDeregisteredNodePage] = useState(0);
  const [blockPageSize, setBlockPageSize] = useState(5);
  const [transactionPageSize, setTransactionPageSize] = useState(5);
  const [quorumPageSize, setQuorumPageSize] = useState(5);
  const [serviceNodePageSize, setServiceNodePageSize] = useState(50);
  const [deregisteredNodePageSize, setDeregisteredNodePageSize] = useState(20);
  const [pageSizePreferencesLoaded, setPageSizePreferencesLoaded] = useState(false);
  const [quorumLoading, setQuorumLoading] = useState(false);
  const [quorumError, setQuorumError] = useState("");
  const [lifecycleView, setLifecycleView] = useState<"unlocking" | "decommissioned" | "deregistered" | null>(null);
  const [lifecycleInitialized, setLifecycleInitialized] = useState(false);

  const openSection = (section: "blocks" | "transactions" | "quorums") => {
    if (serviceNodesOnly || statisticsOnly) {
      window.location.assign(`/#${section}`);
      return;
    }
    const target = document.getElementById(section);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${section}`);
    }
  };

  const snapshotParams = (overrides: Partial<Record<"blockPage" | "blockPageSize" | "transactionPage" | "transactionPageSize" | "quorumPage" | "quorumPageSize", number>> = {}) => {
    const params = new URLSearchParams({
      blockPage: String(overrides.blockPage ?? blockPage), blockPageSize: String(overrides.blockPageSize ?? blockPageSize),
      transactionPage: String(overrides.transactionPage ?? transactionPage), transactionPageSize: String(overrides.transactionPageSize ?? transactionPageSize),
      quorumPage: String(overrides.quorumPage ?? quorumPage), quorumPageSize: String(overrides.quorumPageSize ?? quorumPageSize),
    });
    return params;
  };

  const prefetchSnapshot = (overrides: Parameters<typeof snapshotParams>[0]) => {
    void fetchSnapshot(snapshotParams(overrides)).catch(() => undefined);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const params = snapshotParams();
        const data = await fetchSnapshotWithRetry(params);
        if (active) { setSnapshot(data); setConnection("live"); setQuorumError(""); }
      } catch {
        if (active) { setConnection("offline"); setQuorumError("Unable to load this page"); }
      } finally {
        if (active) setQuorumLoading(false);
      }
    };
    load();
    const timer = blockPage === 0 && transactionPage === 0 && quorumPage === 0 ? window.setInterval(load, 30_000) : 0;
    return () => { active = false; window.clearInterval(timer); };
  }, [blockPage, blockPageSize, transactionPage, transactionPageSize, quorumPage, quorumPageSize]);

  useEffect(() => {
    const saved = window.localStorage.getItem("jude-explorer-page-sizes");
    if (!saved) { setPageSizePreferencesLoaded(true); return; }
    try {
      const sizes = JSON.parse(saved) as Record<string, number>;
      const valid = (value: number | undefined) => PAGE_SIZE_OPTIONS.includes(value as typeof PAGE_SIZE_OPTIONS[number]) ? value! : 5;
      setBlockPageSize(valid(sizes.blocks));
      setTransactionPageSize(valid(sizes.transactions));
      setQuorumPageSize(valid(sizes.quorums));
    } catch { /* Ignore an invalid customer preference. */ }
    setPageSizePreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!pageSizePreferencesLoaded) return;
    window.localStorage.setItem("jude-explorer-page-sizes", JSON.stringify({
      blocks: blockPageSize, transactions: transactionPageSize,
      quorums: quorumPageSize,
    }));
  }, [pageSizePreferencesLoaded, blockPageSize, transactionPageSize, quorumPageSize]);

  const changeQuorumPage = (nextPage: number) => {
    if (quorumLoading || nextPage < 0) return;
    setQuorumLoading(true);
    setQuorumError("");
    setQuorumPage(nextPage);
  };

  const changeQuorumPageSize = (nextPageSize: number) => {
    setQuorumLoading(true);
    setQuorumPageSize(nextPageSize);
    setQuorumPage(0);
    setQuorumError("");
  };

  const blocks: Block[] = snapshot ? snapshot.blocks.map((block) => ({
    height: block.height,
    age: age(block.timestamp),
    hash: block.hash,
    txs: block.txs,
    size: bytes(block.size),
    difficulty: difficulty(block.difficulty),
    fee: block.fee,
    reward: block.reward,
    inputs: block.inputs,
    outputs: block.outputs,
  })) : [];

  const transactions: Transaction[] = snapshot ? snapshot.transactions.map((tx) => ({
    hash: tx.hash,
    age: age(tx.timestamp),
    block: tx.block,
    size: bytes(tx.size),
    confirmations: tx.confirmations,
    fee: tx.fee,
    reward: tx.reward,
    inputs: tx.inputs,
    outputs: tx.outputs,
    txType: tx.txType,
  })) : [];

  const particles = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const currentServiceNodeTotal = snapshot?.serviceNodes.total ?? 0;
  const lockedDeregisteredServiceNodeTotal = snapshot
    ? snapshot.deregisteredServiceNodes.nodes.filter((node) => node.unlockedAt > snapshot.network.height).length
    : 0;
  const statusTotal = currentServiceNodeTotal + lockedDeregisteredServiceNodeTotal;
  const unlockingServiceNodes = snapshot?.serviceNodes.exiting ?? 0;
  const decommissionedServiceNodes = snapshot?.serviceNodes.decommissioned ?? 0;
  const activeServiceNodes = snapshot ? Math.max(0, snapshot.serviceNodes.active - unlockingServiceNodes) : 0;
  const statusShare = (value: number) => statusTotal > 0 ? (value / statusTotal) * 100 : 0;
  const activeEnd = statusShare(activeServiceNodes);
  const unlockingEnd = activeEnd + statusShare(unlockingServiceNodes);
  const offlineEnd = unlockingEnd + statusShare(decommissionedServiceNodes);
  const minedSupply = snapshot?.network.minedSupply ?? null;
  const stakingRatio = snapshot && minedSupply && minedSupply > 0
    ? (snapshot.serviceNodes.totalContributed / minedSupply) * 100
    : null;
  const stakingRatioWidth = Math.min(100, Math.max(0, stakingRatio ?? 0));
  const filteredServiceNodes = useMemo(() => {
    const nodes = [...(snapshot?.serviceNodes.nodes || [])].sort((a, b) =>
      b.lastRewardAt - a.lastRewardAt
      || b.registeredAt - a.registeredAt
      || a.publicKey.localeCompare(b.publicKey),
    );
    const searchTerm = serviceNodeQuery.trim().toLowerCase();
    if (!searchTerm) return nodes;
    return nodes.filter((node) => node.publicKey.toLowerCase().includes(searchTerm));
  }, [snapshot, serviceNodeQuery]);
  const serviceNodeLastPage = Math.max(0, Math.ceil(filteredServiceNodes.length / serviceNodePageSize) - 1);
  const paginatedServiceNodes = useMemo(
    () => filteredServiceNodes.slice(serviceNodePage * serviceNodePageSize, (serviceNodePage + 1) * serviceNodePageSize),
    [filteredServiceNodes, serviceNodePage, serviceNodePageSize],
  );
  const homepageServiceNodes = useMemo(
    () => [...(snapshot?.serviceNodes.nodes || [])]
      .sort((a, b) => b.lastRewardAt - a.lastRewardAt || b.registeredAt - a.registeredAt || a.publicKey.localeCompare(b.publicKey))
      .slice(0, 5),
    [snapshot],
  );

  useEffect(() => {
    if (serviceNodePage > serviceNodeLastPage) setServiceNodePage(serviceNodeLastPage);
  }, [serviceNodePage, serviceNodeLastPage]);
  const deregisteredNodes = snapshot?.deregisteredServiceNodes.nodes || [];
  const deregisteredNodeLastPage = Math.max(0, Math.ceil(deregisteredNodes.length / deregisteredNodePageSize) - 1);
  const paginatedDeregisteredNodes = useMemo(
    () => deregisteredNodes.slice(deregisteredNodePage * deregisteredNodePageSize, (deregisteredNodePage + 1) * deregisteredNodePageSize),
    [deregisteredNodes, deregisteredNodePage, deregisteredNodePageSize],
  );

  useEffect(() => {
    if (deregisteredNodePage > deregisteredNodeLastPage) setDeregisteredNodePage(deregisteredNodeLastPage);
  }, [deregisteredNodePage, deregisteredNodeLastPage]);

  useEffect(() => {
    if (!statisticsOnly || !snapshot || lifecycleInitialized) return;
    if (snapshot.serviceNodes.exiting > 0) setLifecycleView("unlocking");
    else if (snapshot.serviceNodes.decommissioned > 0) setLifecycleView("decommissioned");
    setLifecycleInitialized(true);
  }, [statisticsOnly, snapshot, lifecycleInitialized]);

  async function openBlock(id: number | string, updateHistory = true) {
    setDetailLoading(true);
    if (updateHistory) window.history.pushState(null, "", `#block-${String(id)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setDetail({ title: "Block Details", kind: "block", fullPage: true, rows: [{ label: "STATUS", value: "Loading live block data…" }] });
    try {
      const response = await fetch(`/api/block?id=${encodeURIComponent(String(id))}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Block lookup failed");
      setDetail({ title: "Block Details", kind: "block", fullPage: true, rows: [], sections: [
        { kicker: "BLOCK IDENTITY", title: "Header", rows: [
          { label: "BLOCK HASH", value: data.hash },
          { label: "TIMESTAMP", value: new Date(data.timestamp * 1000).toLocaleString("en-US", { timeZoneName: "short" }) },
          { label: "CHAIN STATUS", value: data.orphan ? "Orphaned" : "Main chain" },
        ] },
        { kicker: "PUBLIC CONSENSUS DATA", title: "Consensus", rows: [
          { label: "TRANSACTIONS", value: compact(data.transactions) },
          { label: "BLOCK SIZE", value: bytes(data.size) },
          { label: "DIFFICULTY", value: difficulty(data.difficulty) },
          { label: "PROTOCOL VERSION", value: `${data.majorVersion}.${data.minorVersion}` },
          { label: "CONFIRMATIONS", value: compact(data.confirmations) },
          { label: "BLOCK REWARD", value: `${atomicJude(data.reward)} JUDE` },
        ] },
        { kicker: "BLOCK REWARD RECORD", title: "Block Reward Transaction", rows: [
          { label: "BLOCK REWARD TRANSACTION HASH", value: data.minerTransaction.hash },
          { label: "TRANSACTION PUBLIC KEY", value: data.minerTransaction.publicKey || "Not published" },
          { label: "TRANSACTION VERSION / TYPE", value: <span className="version-type-value"><code>{String(data.minerTransaction.version)}</code><i aria-hidden="true">/</i><TxTypeBadge type="block-reward" compact iconOnly /></span> },
          { label: "TRANSACTION SIZE", value: bytes(data.minerTransaction.size) },
          { label: "RINGCT", value: data.minerTransaction.ringCtType ? `Yes / type ${data.minerTransaction.ringCtType}` : "No" },
          { label: "UNLOCK HEIGHT", value: compact(data.minerTransaction.unlockHeight) },
          { label: "SERVICE NODE WINNER", value: data.minerTransaction.serviceNodeWinner || "Not available" },
        ] },
        { kicker: "PROTOCOL PAYLOAD", title: "Extra", rows: [{ label: "EXTRA", value: data.minerTransaction.extra || "None" }] },
      ], outputs: data.minerTransaction.outputs || [], outputTitle: "Block Reward Transaction Outputs", raw: JSON.stringify(data.minerTransaction.raw, null, 2), note: "Block rewards, output keys, and indices are public consensus data. Private wallet addresses and confidential transfer amounts are not requested." });
    } catch (error) {
      setDetail({ title: "Block Details", kind: "block", fullPage: true, rows: [{ label: "ERROR", value: error instanceof Error ? error.message : "Lookup failed" }] });
    } finally { setDetailLoading(false); }
  }

  function closeDetail() {
    setDetail(null);
    if (window.location.hash.startsWith("#block-")) window.history.replaceState(null, "", "#blocks");
    else if (window.location.hash.startsWith("#tx-")) window.history.replaceState(null, "", "#transactions");
    else if (window.location.hash.startsWith("#node-")) window.history.replaceState(null, "", "#staking");
  }

  async function openTransaction(hash: string, knownType?: string, updateHistory = true) {
    setDetailLoading(true);
    if (updateHistory) window.history.pushState(null, "", `#tx-${hash}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setDetail({ title: "Transaction Details", kind: "transaction", fullPage: true, rows: [{ label: "STATUS", value: "Loading live transaction data…" }] });
    try {
      const response = await fetch(`/api/transaction?hash=${encodeURIComponent(hash)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transaction lookup failed");
      const confirmations = Number.isFinite(data.confirmations) ? data.confirmations : snapshot && data.blockHeight ? Math.max(0, snapshot.network.height - data.blockHeight + 1) : 0;
      const feePerKb = data.size > 0 ? data.fee / (data.size / 1000) : 0;
      // A row already has the classification produced during the same snapshot.
      // Prefer it so list and detail can never disagree when the live source omits
      // structured service-node state-change metadata from the detail response.
      const transactionType = knownType || data.txType || (data.transactionType === 0 ? "transfer" : "state-change");
      setDetail({ title: "Transaction Details", kind: "transaction", fullPage: true, rows: [], sections: [
        { kicker: "IDENTIFIERS", title: "Transaction Identity", rows: [
          { label: "TRANSACTION HASH", value: data.hash },
          { label: "TRANSACTION PUBLIC KEY", value: data.publicKey || "Not published" },
          { label: "PAYMENT ID (ENCRYPTED)", value: data.paymentId || "Not included" },
        ] },
        { kicker: "PUBLIC ON-CHAIN DATA", title: "Metadata", rows: [
          { label: "BLOCK HEIGHT", value: data.blockHeight ? compact(data.blockHeight) : "Pending" },
          { label: "TIMESTAMP", value: data.timestamp ? new Date(data.timestamp * 1000).toLocaleString("en-US", { timeZoneName: "short" }) : "Pending" },
          { label: "TRANSACTION VERSION / TYPE", value: <span className="version-type-value"><code>{String(data.version)}</code><i aria-hidden="true">/</i><TxTypeBadge type={transactionType} compact iconOnly /></span> },
          { label: "TRANSACTION SIZE", value: bytes(data.size) },
          { label: "FEE", value: `${atomicJude(data.fee)} JUDE` },
          { label: "FEE PER KB", value: `${atomicJude(feePerKb)} JUDE` },
          { label: "CONFIRMATIONS", value: compact(confirmations) },
          { label: "RINGCT", value: data.ringCtType ? `Yes / type ${data.ringCtType}` : "No" },
          { label: "INPUTS / OUTPUTS" , value: inOut(data.inputs.length, data.outputs.length) },
          { label: "UNLOCK TIME / HEIGHT", value: compact(data.unlockTime) },
          { label: "STATUS", value: data.inPool ? "Transaction Pool" : "Confirmed" },
          { label: "DOUBLE SPEND", value: data.doubleSpendSeen ? "Detected" : "Not detected" },
        ] },
        { kicker: "PROTOCOL PAYLOAD", title: "Extra", rows: [{ label: "EXTRA", value: data.extra || "None" }] },
      ], inputs: data.inputs || [], outputs: data.outputs || [], outputTitle: "Transaction Outputs", raw: JSON.stringify(data.raw, null, 2), note: "All values shown are public, read-only chain metadata. Confidential amounts and participant wallet addresses remain hidden by the Judecoin protocol." });
    } catch (error) {
      setDetail({ title: "Transaction Details", kind: "transaction", fullPage: true, rows: [{ label: "ERROR", value: error instanceof Error ? error.message : "Lookup failed" }] });
    } finally { setDetailLoading(false); }
  }

  async function openServiceNode(key: string, updateHistory = true) {
    setDetailLoading(true);
    if (updateHistory) window.history.pushState(null, "", `#node-${key}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setDetail({ title: "Service Node Details", kind: "service-node", fullPage: true, rows: [{ label: "STATUS", value: "Loading live Service Node data…" }] });
    try {
      const response = await fetch(`/api/service-node?key=${encodeURIComponent(key)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Service-node lookup failed");
      const contributorRows = (data.contributors || []).flatMap((contributor: { address: string; amount: number }, index: number) => [
        ...(contributor.address ? [{ label: `CONTRIBUTOR ${index + 1} ADDRESS`, value: contributor.address }] : []),
        ...(Number.isFinite(Number(contributor.amount)) ? [{ label: `CONTRIBUTOR ${index + 1} STAKE`, value: `${jude(contributor.amount)} JUDE` }] : []),
      ]);
      const pendingUnlock = !data.historical && Number(data.unlockHeight) > 0 && (!snapshot || Number(data.unlockHeight) > snapshot.network.height);
      const remainingUnlockBlocks = snapshot && pendingUnlock ? Math.max(0, Number(data.unlockHeight) - snapshot.network.height) : 0;
      const identityRows = [
        { label: "SERVICE NODE PUBLIC KEY", value: data.publicKey },
        { label: "STATUS", value: data.historical ? "Deregistered" : pendingUnlock ? "Pending Unlock" : data.unlockHeight ? "Unlock Height Reached" : data.active ? "Active" : data.funded ? "Decommissioned" : "Awaiting contributions" },
        ...(data.operatorAddress ? [{ label: "OPERATOR ADDRESS", value: data.operatorAddress }] : []),
        ...(data.publicEndpoint && data.publicEndpoint !== "Not published" ? [{ label: "PUBLIC ENDPOINT", value: data.publicEndpoint }] : []),
      ];
      const stakingRows = data.historical ? [
        ...(Number(data.registrationHeight) > 0 ? [{ label: "REGISTERED AT BLOCK" , value: compact(data.registrationHeight) }] : []),
        ...(Number(data.unlockHeight) > 0 ? [{ label: "STAKE OUTPUT UNLOCK HEIGHT", value: compact(data.unlockHeight) }] : []),
        ...(Number.isFinite(Number(data.contributions)) ? [{ label: "STAKE OUTPUTS", value: compact(data.contributions) }] : []),
        { label: "RECORD STATUS", value: "Deregistration recorded on chain" },
        ...(snapshot && Number(data.unlockHeight) > 0 ? [{ label: "STAKE STATUS", value: snapshot.network.height >= data.unlockHeight ? "Released" : `Locked until block ${compact(data.unlockHeight)}` }] : []),
      ] : [
        { label: "TOTAL STAKE", value: `${jude(data.totalContributed)} JUDE` },
        { label: "STAKING REQUIREMENT", value: `${jude(data.stakingRequirement)} JUDE` },
        { label: "FUNDING STATUS", value: data.funded ? "Fully funded" : "Awaiting contributions" },
        ...(Number(data.registrationHeight) > 0 ? [{ label: "REGISTERED AT BLOCK", value: compact(data.registrationHeight) }] : []),
        ...(Number(data.lastRewardHeight) > 0 ? [{ label: "LAST REWARD BLOCK", value: compact(data.lastRewardHeight) }] : []),
        ...(data.unlockHeight ? [
          { label: "UNLOCK STATUS", value: pendingUnlock ? "Scheduled — waiting for the unlock block" : "Scheduled unlock height reached" },
          { label: "SCHEDULED UNLOCK BLOCK", value: compact(data.unlockHeight) },
          ...(snapshot ? [
            { label: "CURRENT CHAIN HEIGHT", value: compact(snapshot.network.height) },
            { label: "BLOCKS REMAINING", value: compact(remainingUnlockBlocks) },
            { label: "ESTIMATED TIME REMAINING", value: estimatedBlockWait(remainingUnlockBlocks, snapshot.network.targetSeconds) },
            { label: "ESTIMATED UNLOCK TIME (UTC)", value: estimatedBlockDate(snapshot.network.height, Number(data.unlockHeight), snapshot.network.targetSeconds, snapshot.network.latestBlockTimestamp) },
          ] : []),
        ] : []),
        ...(Number(data.lastUptimeProof) > 0 ? [{ label: "LAST UPTIME PROOF", value: new Date(data.lastUptimeProof * 1000).toLocaleString("en-US", { timeZoneName: "short" }) }] : []),
        ...(data.version && data.version !== "Unknown" ? [{ label: "NODE VERSION", value: data.version }] : []),
        { label: "DECOMMISSIONS", value: compact(data.decommissionCount) },
      ];
      const reliableSwarmId = data.swarmId && !String(data.swarmId).includes("Unknown") && !String(data.swarmId).includes("precision not guaranteed") ? String(data.swarmId) : "";
      const protocolRows = data.historical ? [] : [
        ...(reliableSwarmId ? [{ label: "SWARM ID", value: reliableSwarmId }] : []),
        ...(Number(data.registrationProtocol) > 0 ? [{ label: "REGISTRATION PROTOCOL", value: String(data.registrationProtocol) }] : []),
        ...(Number(data.lastDecommissionHeight) > 0 ? [{ label: "LAST DECOMMISSION BLOCK", value: compact(data.lastDecommissionHeight) }] : []),
        ...(Number(data.lastIpChangeHeight) > 0 ? [{ label: "LAST IP CHANGE BLOCK", value: compact(data.lastIpChangeHeight) }] : []),
        { label: "RECOMMISSION CREDIT", value: compact(data.recommissionCredit || 0) },
        ...(Number(data.storagePort) > 0 ? [{ label: "STORAGE PORT", value: String(data.storagePort) }] : []),
        ...(Number(data.storageLmqPort) > 0 ? [{ label: "STORAGE LMQ PORT", value: String(data.storageLmqPort) }] : []),
        ...(data.ed25519PublicKey ? [{ label: "ED25519 PUBLIC KEY", value: data.ed25519PublicKey }] : []),
        ...(data.x25519PublicKey ? [{ label: "X25519 PUBLIC KEY", value: data.x25519PublicKey }] : []),
      ];
      setDetail({ title: data.historical ? "Deregistered Service Node Details" : pendingUnlock ? "Pending Unlock Service Node Details" : "Service Node Details", kind: "service-node", fullPage: true, rows: [], sections: [
        { kicker: "NODE IDENTITY", title: "Identity", rows: identityRows },
        { kicker: data.historical ? "ON-CHAIN HISTORY" : pendingUnlock ? "UNLOCK SCHEDULE" : "PROOF OF STAKE", title: data.historical ? "Registration and Unlock" : pendingUnlock ? "Staking and Scheduled Unlock" : "Staking" , rows: stakingRows },
        ...(protocolRows.length ? [{ kicker: "PUBLIC NODE DATA", title: "Network and Protocol", rows: protocolRows }] : []),
        ...(contributorRows.length ? [{ kicker: "PUBLIC REGISTRATION DATA", title: "Contributors", rows: contributorRows }] : []),
      ], raw: data.raw ? JSON.stringify(data.raw, null, 2) : undefined, note: data.historical ? "Only fields retained in the public historical index are shown." : pendingUnlock ? "Estimated unlock timing is calculated from the current chain height and protocol target block time. Actual wall-clock timing may vary. Operator and contributor addresses are public Service Node registration data." : "Operator and contributor addresses are public Service Node registration data. Private keys, wallet balances, and private transaction amounts are never requested." });
    } catch (error) {
      setDetail({ title: "Service Node Details", kind: "service-node", fullPage: true, rows: [{ label: "ERROR", value: error instanceof Error ? error.message : "Lookup failed" }] });
    } finally { setDetailLoading(false); }
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (!term) {
      setMessage("Enter a block height, block hash, transaction hash, or Service Node public key.");
      return;
    }
    if (/^\d+$/.test(term)) { setMessage(""); void openBlock(Number(term)); return; }
    if (!/^[a-fA-F0-9]{64}$/.test(term)) {
      setMessage("Enter a complete block height or a 64-character public identifier.");
      return;
    }
    const identifier = term.toLowerCase();
    setSearchLoading(true);
    setMessage("Searching the public chain…");
    try {
      const blockResponse = await fetch(`/api/block?id=${encodeURIComponent(identifier)}`);
      if (blockResponse.ok) { setMessage(""); await openBlock(identifier); return; }
      const transactionResponse = await fetch(`/api/transaction?hash=${encodeURIComponent(identifier)}`);
      if (transactionResponse.ok) { setMessage(""); await openTransaction(identifier); return; }
      const nodeResponse = await fetch(`/api/service-node?key=${encodeURIComponent(identifier)}`);
      if (nodeResponse.ok) { setMessage(""); await openServiceNode(identifier); return; }
      setMessage("No block, transaction, or Service Node matched that identifier.");
    } catch {
      setMessage("Search is temporarily unavailable. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }

  useEffect(() => {
    const openHashTarget = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#block-")) void openBlock(hash.slice(7), false);
      else if (hash.startsWith("#tx-")) void openTransaction(hash.slice(4), undefined, false);
      else if (hash.startsWith("#node-")) void openServiceNode(hash.slice(6), false);
      else setDetail(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeDetail(); };
    openHashTarget();
    window.addEventListener("popstate", openHashTarget);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", openHashTarget);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <main>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="particle-field" aria-hidden="true">
        {particles.map((particle) => <i key={particle} style={{ "--i": particle } as React.CSSProperties} />)}
      </div>

      <nav className="nav shell">
        <a className="brand" href="/" aria-label="Judecoin Explorer home">
          <span className="brand-mark"><img src="/judecoin-logo-minimal-ring-transparent.png" alt="" /></span>
          <span><b>JUDECOIN</b></span>
        </a>
        <div className="nav-links">
          <a className={!serviceNodesOnly && !statisticsOnly ? "active" : undefined} href="/">{"Home"}</a>
          <button type="button" onClick={() => openSection("blocks")}>{"Blocks"}</button>
          <button type="button" onClick={() => openSection("transactions")}>{"Transactions"}</button>
          <a className={serviceNodesOnly ? "active" : undefined} href="/service-nodes">{"Service Nodes"}</a>
          <a className={statisticsOnly ? "active" : undefined} href="/statistics">{"Statistics"}</a>
          <button type="button" onClick={() => openSection("quorums")}>{"Quorums"}</button>
        </div>
      </nav>

      {!serviceNodesOnly && !statisticsOnly && <>
      <section className="hero shell" id="top">
        <h1>{"See the chain"}<br /><em>{"Not the people"}</em></h1>
        <p className="hero-copy">{"A privacy-first window into the Judecoin network. Inspect public blocks, transactions, Service Nodes, and consensus data, while the participants, addresses, and amounts of private transfers remain hidden."}</p>
        <form className="search" onSubmit={search}>
          <span className="search-icon">⌕</span>
          <input aria-label={"Search the blockchain"} placeholder={"Search by block height, block hash, transaction hash, or node key"} value={query} onChange={(event) => setQuery(event.target.value)} />
          <button disabled={searchLoading}>{searchLoading ? "SEARCHING" : "EXPLORE"} <span>→</span></button>
        </form>
        {message && <div className="search-message" role="status">{message}</div>}
        <div className="privacy-note"><span>◉</span><p><b>{"Privacy preserved."}</b> {"Private transfer data remains hidden. Public Service Node registration fields are shown only when they are part of the protocol's public state."}</p></div>
      </section>

      <section className="metrics shell" id="network">
        <article><small>{"CHAIN HEIGHT"}</small><strong className="block-height">{snapshot ? compact(snapshot.network.height) : "N/A"}</strong><span className={snapshot?.network.synced ? "trend" : "warning"}>{connection === "offline" ? "Network data unavailable" : connection === "loading" ? "Connecting to mainnet" : snapshot?.network.synced ? "Mainnet · synced" : "Mainnet · delayed"}</span></article>
        <article><small>{"NETWORK HASH RATE"}</small><strong>{snapshot ? <>{(snapshot.network.hashrate / 1e3).toFixed(2)} <i>kH/s</i></> : "N/A"}</strong><span>{"Estimated from difficulty and target time"}</span></article>
        <article><small>{"NETWORK DIFFICULTY"}</small><strong>{snapshot ? difficulty(snapshot.network.difficulty) : "N/A"}</strong><span>{"Reported by the protocol"}</span></article>
        <article><small>{"TARGET BLOCK TIME"}</small><strong>{snapshot ? <>{snapshot.network.targetSeconds} <i>{"sec"}</i></> : "N/A"}</strong><span>{"Protocol target"}</span></article>
        <article><small>{"LATEST BLOCK AGE"}</small><strong>{snapshot ? age(snapshot.network.latestBlockTimestamp) : "N/A"}</strong><span className={snapshot?.network.synced ? "trend" : "warning"}>{snapshot?.network.synced ? "Time since latest block" : "Chain data may be delayed"}</span></article>
        <article><small>{"SERVICE NODES"}</small><strong>{snapshot ? compact(snapshot.serviceNodes.total) : "N/A"}</strong><span>{snapshot ? "Active on mainnet" : "Awaiting network status"}</span></article>
        <article><small>{"BLOCK SIZE"}</small><strong>{snapshot ? `${bytes(snapshot.network.blockSizeMedian)} / ${bytes(snapshot.network.blockSizeLimit)}` : "N/A"}</strong><span>{"Median / protocol limit"}</span></article>
        <article><small>{"PROTOCOL VERSION"}</small><strong>{snapshot?.network.protocol ?? "N/A"}</strong><span>{snapshot ? `Hard fork v${snapshot.network.hardFork}` : "Version unavailable"}</span></article>
      </section>

      <section className="tx-type-legend shell" aria-label="Transaction type legend">
        <div className="tx-type-legend-title"><span>{"Transaction Type Legend"}</span></div>
        <div className="tx-type-legend-items">{TX_TYPE_LEGEND.map((type) => <TxTypeBadge type={type} key={type} />)}</div>
      </section>

      {Boolean(snapshot?.transactionPool.count) && <section className="stream shell pool-section first-data-section" id="transaction-pool">
        <div className="section-heading pool-heading">
          <div><h2>{"Transaction Pool"}</h2></div>
          <div className="pool-summary"><i />{`${snapshot!.transactionPool.count} pending`} · {bytes(snapshot!.transactionPool.totalBytes)}</div>
        </div>
        <div className="table-card pool-table">
          <div className="table-head"><span>{"AGE"}</span><span>{"TRANSACTION HASH"}</span><span>{"TX TYPE"}</span><span>{"FEE / PER KB"}</span><span>{"IN/OUT"}</span><span>{"TX SIZE"}</span></div>
          {snapshot!.transactionPool.transactions.map((transaction) => (
            <div className="table-row transaction-row-link" key={transaction.hash} role="button" tabIndex={0} aria-label={`Open transaction ${transaction.hash}`} onClick={() => openTransaction(transaction.hash, transaction.txType)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openTransaction(transaction.hash, transaction.txType); } }}>
              <span>{transaction.receivedAt > 0 ? age(transaction.receivedAt) : "PENDING"}</span>
              <span className="tx-hash detail-link">{hashPreview(transaction.hash)}</span>
              <TxTypeBadge type={transaction.txType} compact iconOnly />
              <span>{`${atomicJude(transaction.fee)} / ${transaction.size > 0 ? atomicJude(transaction.fee / (transaction.size / 1000)) : "N/A"}`}</span>
              <span>{inOut(transaction.inputs, transaction.outputs)}</span>
              <span>{bytes(transaction.size)}</span>
            </div>
          ))}
        </div>
      </section>}

      <section className={`stream shell ${snapshot?.transactionPool.count ? "" : "first-data-section"}`}>
        <div className="section-heading" id="blocks">
          <div><h2>{"Latest Blocks"}</h2></div>
          <PaginationControls page={blockPage} lastPage={snapshot ? Math.floor(snapshot.network.height / blockPageSize) : 0} pageSize={blockPageSize} onPageChange={setBlockPage} onPageSizeChange={(size) => { setBlockPageSize(size); setBlockPage(0); }} onPrefetchPage={(page) => prefetchSnapshot({ blockPage: page })} />
        </div>
        <div className="table-card blocks-table">
          <div className="table-head"><span>{"HEIGHT"}</span><span>{"AGE [h:m:s]"}</span><span>{"TYPE"}</span><span>{"BLOCK HASH"}</span><span>{"TXS"}</span><span>{"SIZE"}</span><span>{"DIFFICULTY"}</span><span>{"FEE (JUDE)"}</span><span>{"REWARD (JUDE)"}</span><span>{"IN/OUT"}</span></div>
          {blocks.map((block, index) => (
            <div className="table-row block-row-link" key={block.height} role="button" tabIndex={0} aria-label={`Open block ${block.height}`} onClick={() => openBlock(block.height)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openBlock(block.height); } }}>
              <span className="height detail-link"><i>{index === 0 ? "●" : "◆"}</i>{compact(block.height)}</span>
              <span>{block.age}</span><TxTypeBadge type="block-reward" compact iconOnly /><span className="block-hash detail-link">{hashPreview(block.hash)}</span><span>{block.txs}</span><span>{block.size}</span><span>{block.difficulty}</span><span>{block.fee == null ? "N/A" : atomicJude(block.fee)}</span><span>{block.reward == null ? "N/A" : atomicJude(block.reward)}</span><span>{inOut(block.inputs, block.outputs)}</span>
            </div>
          ))}
          {!snapshot && <div className="nodes-loading">{connection === "offline" ? "Live block data is unavailable. No preview data is shown." : "Loading live block data…"}</div>}
        </div>
      </section>

      <section className="stream shell" id="transactions">
        <div className="section-heading">
          <div><h2>{"Latest Transactions"}</h2></div>
          <div className="heading-actions"><PaginationControls page={transactionPage} lastPage={snapshot ? Math.floor(snapshot.network.height / snapshot.pagination.transactionScanSize) : 0} pageSize={transactionPageSize} onPageChange={setTransactionPage} onPageSizeChange={(size) => { setTransactionPageSize(size); setTransactionPage(0); }} onPrefetchPage={(page) => prefetchSnapshot({ transactionPage: page })} /></div>
        </div>
        <div className="table-card tx-table">
          <div className="table-head"><span>{"BLOCK"}</span><span>{"AGE [h:m:s]"}</span><span>{"TYPE"}</span><span>{"TRANSACTION HASH"}</span><span>{"SIZE"}</span><span>{"CONFIRMATIONS"}</span><span>{"FEE (JUDE)"}</span><span>{"IN/OUT"}</span></div>
          {transactions.map((tx, index) => (
            <div className="table-row transaction-row-link" key={tx.hash} role="button" tabIndex={0} aria-label={`Open transaction ${tx.hash}`} onClick={() => openTransaction(tx.hash, tx.txType)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openTransaction(tx.hash, tx.txType); } }}>
              <span className="height"><i>{index === 0 ? "●" : "◆"}</i>{compact(tx.block)}</span><span>{tx.age}</span><TxTypeBadge type={tx.txType} compact iconOnly /><span className="tx-hash detail-link">{hashPreview(tx.hash)}</span><span>{tx.size}</span><span>{tx.confirmations}</span><span>{tx.fee == null ? "N/A" : atomicJude(tx.fee)}</span><span>{inOut(tx.inputs, tx.outputs)}</span>
            </div>
          ))}
          {!snapshot && <div className="nodes-loading">{connection === "offline" ? "Live transaction data is unavailable. No preview data is shown." : "Loading live transaction data…"}</div>}
        </div>
      </section>
      </>}

      {statisticsOnly && <section className="statistics-page shell" id="statistics">
        <header className="statistics-hero">
          <div>
            <h1>{"Judecoin network,"}<br /><em>{"at a glance."}</em></h1>
            <p>{"Explore Judecoin blocks, transactions, Service Nodes, staking, and network activity in one place."}</p>
          </div>
          <div className="network-reactor" aria-label={`${snapshot?.serviceNodes.active ?? 0} active service nodes`}>
            <i className="reactor-grid" /><i className="reactor-beam" /><i className="reactor-base" />
            <div className="reactor-cube"><i className="cube-front" /><i className="cube-back" /><i className="cube-left" /><i className="cube-right" /><i className="cube-top" /><i className="cube-bottom" /></div>
            <i className="reactor-ring ring-one" /><i className="reactor-ring ring-two" /><i className="reactor-ring ring-three" />
            {Array.from({ length: 8 }, (_, index) => <i className="reactor-particle" key={index} style={{ "--particle": index } as React.CSSProperties} />)}
            <div className="reactor-value"><strong>{snapshot ? compact(snapshot.serviceNodes.active) : "N/A"}</strong><span>ACTIVE SERVICE NODES</span></div>
          </div>
        </header>

        <div className="statistics-primary-grid">
          <article className="stat-command stat-height"><small>{"CHAIN HEIGHT"}</small><strong className="block-height">{snapshot ? compact(snapshot.network.height) : "N/A"}</strong></article>
          <article className="stat-command"><small>{"NETWORK HASH RATE"}</small><strong>{snapshot ? `${(snapshot.network.hashrate / 1e3).toFixed(2)} kH/s` : "N/A"}</strong></article>
          <article className="stat-command"><small>{"NETWORK DIFFICULTY"}</small><strong>{snapshot ? difficulty(snapshot.network.difficulty) : "N/A"}</strong></article>
          <article className="stat-command"><small>{"PENDING TRANSACTIONS"}</small><strong>{snapshot ? compact(snapshot.transactionPool.count) : "N/A"}</strong></article>
        </div>

        <div className="statistics-dashboard">
          <section className="stats-panel node-health-panel">
            <header><div><h2>{"Service Node Status"}</h2></div></header>
            <div className="node-health-content">
              <div className="status-pie" style={{ background: `conic-gradient(#64ffd0 0 ${activeEnd}%, #5fb8ff ${activeEnd}% ${unlockingEnd}%, #f1b956 ${unlockingEnd}% ${offlineEnd}%, #ef677b ${offlineEnd}% 100%)` }}>
                <i className="pie-grid" /><i className="pie-sweep" />
                <div className="pie-core"><strong>{snapshot ? compact(statusTotal) : "N/A"}</strong><span>{"TOTAL SHOWN"}</span></div>
              </div>
              <div className="status-breakdown">
                <dl className="status-ledger">
                  <div><dt><i className="active-dot" />{"Active"}</dt><dd>{snapshot ? compact(activeServiceNodes) : "N/A"}</dd></div>
                  <div><dt><i className="unlock-dot" />{"Unlocking"}</dt><dd>{snapshot ? compact(unlockingServiceNodes) : "N/A"}</dd></div>
                  <div><dt><i className="offline-dot" />{"Decommissioned"}</dt><dd>{snapshot ? compact(decommissionedServiceNodes) : "N/A"}</dd></div>
                  <div className="history-entry" title="Deregistered nodes whose stake remains locked on chain"><dt><i className="removed-dot" />{"Deregistered · Stake locked"}</dt><dd>{snapshot ? compact(lockedDeregisteredServiceNodeTotal) : "N/A"}</dd></div>
                </dl>
                {snapshot && <p className="status-summary"><b>{compact(currentServiceNodeTotal)}</b>{" current + "}<b>{compact(lockedDeregisteredServiceNodeTotal)}</b>{" deregistered with stake still locked"}</p>}
              </div>
            </div>
          </section>

          <section className="stats-panel staking-panel">
            <header><div><h2>{"Service Node Staking"}</h2></div></header>
            <div className="stake-total"><span>{"TOTAL SERVICE NODE STAKE"}</span><strong>{snapshot ? <>{jude(snapshot.serviceNodes.totalContributed)} <i>JUDE</i></> : "N/A"}</strong></div>
            <div className={`stake-progress${stakingRatio == null ? " unavailable" : ""}`}><i style={{ width: `${stakingRatioWidth}%` }} /></div>
            <div className="stake-scale"><span>0%</span><b>{stakingRatio == null ? "Total mined supply unavailable" : `${stakingRatio.toFixed(2)}% of total mined supply`}</b><span>100%</span></div>
            <div className="stake-mini-grid">
              <div><small>{"REQUIREMENT"}</small><strong>{snapshot ? jude(snapshot.serviceNodes.stakingRequirement) : "N/A"}</strong><span>{"JUDE / node"}</span></div>
              <div><small>{"TOTAL MINED SUPPLY"}</small><strong>{minedSupply ? atomicJude(minedSupply) : "N/A"}</strong><span>{minedSupply ? "JUDE" : "Supply feed unavailable"}</span></div>
              <div><small>{"CURRENT SERVICE NODES"}</small><strong>{snapshot ? compact(snapshot.serviceNodes.total) : "N/A"}</strong><span>{"Registered on mainnet"}</span></div>
              <div><small>{"STAKING RATIO"}</small><strong>{stakingRatio == null ? "N/A" : `${stakingRatio.toFixed(2)}%`}</strong><span>{"Current stake / total mined"}</span></div>
            </div>
          </section>

          <section className="stats-panel chain-pulse-panel">
            <header><div><h2>{"Recent Block Activity"}</h2></div><span>{snapshot ? `${snapshot.network.targetSeconds} s target` : "Target unavailable"}</span></header>
            <div className="pulse-timeline" aria-label={"Recent interactive block activity"}>
              <i className="pulse-track" />
              {(snapshot?.blocks || []).slice(0, 5).reverse().map((block, index) => <button key={block.height} className="pulse-node" style={{ "--pulse": `${Math.max(18, Math.min(82, 22 + block.txs * 13))}%`, "--left": `${4 + index * 23}%` } as React.CSSProperties} onClick={() => openBlock(block.height)} aria-label={`Open block ${block.height}`}>
                <i />
                <span className="pulse-tooltip"><b>{"BLOCK"} {compact(block.height)}</b><em>{`${block.txs} transactions`}</em><em>{bytes(block.size)}</em><em>{`${age(block.timestamp)} ago`}</em><small>{"CLICK TO INSPECT →"}</small></span>
              </button>)}
              {!snapshot && Array.from({ length: 5 }, (_, index) => <span className="pulse-node loading" key={index} style={{ "--pulse": `${28 + (index % 4) * 14}%`, "--left": `${4 + index * 23}%` } as React.CSSProperties}><i /></span>)}
            </div>
            <div className="pulse-footer"><span>{"OLDER"}</span><b>{snapshot?.blocks[0] ? `LATEST · ${compact(snapshot.blocks[0].height)}` : "SYNCHRONIZING"}</b></div>
          </section>

          <section className="stats-panel protocol-panel">
            <header><div><h2>{"Chain Parameters"}</h2></div></header>
            <dl>
              <div><dt>{"Hard Fork Version"}</dt><dd>{snapshot ? `v${snapshot.network.hardFork}` : "N/A"}</dd></div>
              <div><dt>{"Protocol Version"}</dt><dd>{snapshot?.network.protocol ?? "N/A"}</dd></div>
              <div><dt>{"Median Block Size"}</dt><dd>{snapshot ? bytes(snapshot.network.blockSizeMedian) : "N/A"}</dd></div>
              <div><dt>{"Block Size Limit"}</dt><dd>{snapshot ? bytes(snapshot.network.blockSizeLimit) : "N/A"}</dd></div>
            </dl>
          </section>
        </div>

        <section className="stats-panel lifecycle-panel">
          <header><div><h2>{"Service Node Lifecycle"}</h2></div></header>
          <div className="lifecycle-grid">
            <article><TxTypeBadge type="unlock" compact iconOnly /><div><small>{"UNLOCKING"}</small><button className="lifecycle-count" onClick={() => setLifecycleView(lifecycleView === "unlocking" ? null : "unlocking")}>{snapshot ? compact(snapshot.serviceNodes.exiting) : "N/A"}</button><span>{"Nodes scheduled to exit service"}</span><button className="lifecycle-action" onClick={() => setLifecycleView("unlocking")}>View unlocking nodes →</button></div></article>
            <article><TxTypeBadge type="decommission" compact iconOnly /><div><small>{"DECOMMISSIONED"}</small><button className="lifecycle-count" disabled={!decommissionedServiceNodes} onClick={() => setLifecycleView(lifecycleView === "decommissioned" ? null : "decommissioned")}>{snapshot ? compact(snapshot.serviceNodes.decommissioned) : "N/A"}</button><span>{"Funded nodes temporarily inactive"}</span>{decommissionedServiceNodes > 0 ? <button className="lifecycle-action" onClick={() => setLifecycleView("decommissioned")}>View decommissioned nodes →</button> : <em className="lifecycle-action empty">No decommissioned nodes</em>}</div></article>
            <article><TxTypeBadge type="deregistration" compact iconOnly /><div><small>{"DEREGISTRATION RECORDS"}</small><button className="lifecycle-count" onClick={() => { setLifecycleView(lifecycleView === "deregistered" ? null : "deregistered"); setDeregisteredNodePage(0); }}>{snapshot ? compact(snapshot.deregisteredServiceNodes.total) : "N/A"}</button><span>{snapshot ? `Indexed through block ${compact(snapshot.deregisteredServiceNodes.indexedThrough)}` : "Historical index synchronizing"}</span><button className="lifecycle-action" onClick={() => { setLifecycleView("deregistered"); setDeregisteredNodePage(0); }}>View deregistration records →</button></div></article>
          </div>
          {lifecycleView && <div className="lifecycle-details">
            <header><div><h3>{lifecycleView === "unlocking" ? "Nodes pending unlock" : lifecycleView === "decommissioned" ? "Temporarily decommissioned nodes" : "Deregistration records"}</h3></div><div className="lifecycle-header-actions">{lifecycleView === "deregistered" && deregisteredNodes.length > 20 && <PaginationControls page={deregisteredNodePage} lastPage={deregisteredNodeLastPage} pageSize={deregisteredNodePageSize} onPageChange={setDeregisteredNodePage} onPageSizeChange={(size) => { setDeregisteredNodePageSize(size); setDeregisteredNodePage(0); }} />}<button onClick={() => setLifecycleView(null)} aria-label={"Close lifecycle details"}>×</button></div></header>
            <div className={`table-card ${lifecycleView === "unlocking" ? "unlock-detail-table" : lifecycleView === "decommissioned" ? "decommission-detail-table" : "deregistered-table"}`}>
              {lifecycleView === "unlocking" ? <>
                <div className="table-head"><span>{"NODE PUBLIC KEY"}</span><span>{"STAKE"}</span><span>{"REGISTERED BLOCK"}</span><span>{"LAST REWARD"}</span><span>{"SCHEDULED UNLOCK BLOCK"}</span><span>{"EST. TIME LEFT"}</span></div>
                {(snapshot?.serviceNodes.unlockingNodes || []).map((node) => {
                  const remainingBlocks = snapshot ? Math.max(0, node.unlockAt - snapshot.network.height) : 0;
                  return <div className="table-row service-node-row-link" key={node.publicKey} role="button" tabIndex={0} aria-label={`Open Service Node ${node.publicKey}`} onClick={() => openServiceNode(node.publicKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openServiceNode(node.publicKey); } }}><span className="node-key detail-link">{hashPreview(node.publicKey)}</span><span>{jude(node.contributed)} JUDE</span><span className="block-height detail-link">{compact(node.registeredAt)}</span><span className="block-height detail-link">{compact(node.lastRewardAt)}</span><span className="block-height">{compact(node.unlockAt)}</span><span className="unlock-eta"><b>{snapshot ? estimatedBlockWait(remainingBlocks, snapshot.network.targetSeconds) : "N/A"}</b><small>{snapshot ? `${compact(remainingBlocks)} blocks` : "Waiting for chain data"}</small></span></div>;
                })}
              </> : lifecycleView === "decommissioned" ? <>
                <div className="table-head"><span>{"NODE PUBLIC KEY"}</span><span>{"CONTRIBUTORS"}</span><span>{"DECOMMISSIONS"}</span><span>{"DOWNTIME CREDIT"}</span></div>
                {(snapshot?.serviceNodes.decommissionedNodes || []).map((node) => <div className="table-row service-node-row-link" key={node.publicKey} role="button" tabIndex={0} aria-label={`Open Service Node ${node.publicKey}`} onClick={() => openServiceNode(node.publicKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openServiceNode(node.publicKey); } }}><span className="node-key detail-link">{hashPreview(node.publicKey)}</span><span>{node.contributors}/{node.maxContributors}</span><span>{compact(node.decommissionCount)}</span><span>{compact(node.downtimeCredit)} {"blocks"}</span></div>)}
                {snapshot && snapshot.serviceNodes.decommissionedNodes.length === 0 && <div className="lifecycle-empty"><b>0</b><span>{"No service nodes are currently decommissioned."}</span><small>{"This panel will populate automatically when the chain reports a temporarily offline funded node."}</small></div>}
              </> : <>
                <div className="table-head"><span>{"NODE PUBLIC KEY"}</span><span>{"STAKE STATUS"}</span><span>{"REGISTERED BLOCK"}</span><span>{"STAKE UNLOCK HEIGHT"}</span></div>
                {paginatedDeregisteredNodes.map((node) => <div className="table-row service-node-row-link" key={`${node.publicKey}-${node.unlockedAt}`} role="button" tabIndex={0} aria-label={`Open Service Node ${node.publicKey}`} onClick={() => openServiceNode(node.publicKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openServiceNode(node.publicKey); } }}><span className="node-key detail-link">{hashPreview(node.publicKey)}</span><span>{snapshot && snapshot.network.height >= node.unlockedAt ? "RELEASED" : "LOCKED"}</span><span className="block-height detail-link">{compact(node.registeredAt)}</span><span className="block-height detail-link">{compact(node.unlockedAt)}</span></div>)}
              </>}
            </div>
            {lifecycleView === "unlocking" && snapshot && <p className="unlock-estimate-note">Estimated time is calculated using the current chain height and the {snapshot.network.targetSeconds}-second target block time. Actual unlock timing may vary as blocks are produced.</p>}
          </div>}
        </section>
      </section>}

      {serviceNodesOnly && <section className="staking service-nodes-page shell" id="staking">
        <div className="section-heading">
          <div><h2>{"Service Node Overview"}</h2></div>
        </div>
        <form className="service-node-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <span className="service-node-search-icon" aria-hidden="true">⌕</span>
          <input
            aria-label="Search Service Nodes by public key"
            placeholder="Search by node public key"
            value={serviceNodeQuery}
            onChange={(event) => { setServiceNodeQuery(event.target.value); setServiceNodePage(0); }}
            autoComplete="off"
            spellCheck={false}
          />
          {serviceNodeQuery && <button type="button" onClick={() => { setServiceNodeQuery(""); setServiceNodePage(0); }} aria-label="Clear Service Node search">Clear</button>}
          <span className="service-node-search-count">{snapshot ? (serviceNodeQuery.trim() ? `RESULTS: ${compact(filteredServiceNodes.length)}` : `TOTAL NODES: ${compact(snapshot.serviceNodes.total)}`) : "Loading nodes…"}</span>
        </form>
        <div className="staking-stats">
          <article><small>{"TOTAL SERVICE NODES"}</small><strong>{snapshot ? compact(snapshot.serviceNodes.total) : connection === "offline" ? "N/A" : "Loading…"}</strong><span>{"Registered on mainnet"}</span></article>
          <article><small>{"ACTIVE NODES"}</small><strong>{snapshot ? compact(snapshot.serviceNodes.active) : connection === "offline" ? "N/A" : "Loading…"}</strong><span className="trend">{snapshot ? "Currently active on mainnet" : "Loading network status"}</span></article>
          <article><small>{"STAKING REQUIREMENT"}</small><strong>{snapshot ? <>{jude(snapshot.serviceNodes.stakingRequirement)} <i>JUDE</i></> : connection === "offline" ? "N/A" : "Loading…"}</strong><span>{"Required for a fully funded node"}</span></article>
          <article><small>{"TOTAL STAKED"}</small><strong>{snapshot ? <>{jude(snapshot.serviceNodes.totalContributed)} <i>JUDE</i></> : connection === "offline" ? "N/A" : "Loading…"}</strong><span className="trend">{"Total contributed to Service Nodes"}</span></article>
          <article className="unlocking-stat"><small>{"UNLOCKING NODES"}</small><strong>{snapshot ? compact(snapshot.serviceNodes.exiting) : connection === "offline" ? "N/A" : "Loading…"}</strong><span>{"Scheduled to exit service"}</span></article>
          <article><small>{"DECOMMISSIONED NODES"}</small><strong>{snapshot ? compact(snapshot.serviceNodes.decommissioned) : connection === "offline" ? "N/A" : "Loading…"}</strong><span>{"Temporarily inactive"}</span></article>
        </div>
        {Boolean(snapshot?.serviceNodes.decommissionedNodes?.length) && (
          <section className="decommissioned-live" aria-label="Temporarily decommissioned service nodes">
            <div className="decommissioned-live-heading">
              <div>
                <h3>{"Temporarily Decommissioned"}</h3>
                <p>{"Currently out of service and not earning rewards. This panel disappears automatically when every node returns to service."}</p>
              </div>
              <strong>{snapshot!.serviceNodes.decommissionedNodes.length} {"DECOMMISSIONED"}</strong>
            </div>
            <div className="decommissioned-live-table">
              <div className="table-head"><span>{"STATUS"}</span><span>{"NODE PUBLIC KEY"}</span><span>{"CONTRIBUTORS"}</span><span>{"OPERATOR FEE (%)"}</span><span>{"DECOMMISSIONS"}</span><span>{"LAST UPTIME AGE [h:m:s]"}</span><span>{"DOWNTIME CREDIT"}</span></div>
              {snapshot!.serviceNodes.decommissionedNodes.map((node) => (
                <div className="table-row service-node-row-link" key={node.publicKey} role="button" tabIndex={0} aria-label={`Open Service Node ${node.publicKey}`} onClick={() => openServiceNode(node.publicKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openServiceNode(node.publicKey); } }}>
                  <TxTypeBadge type="decommission" compact iconOnly />
                  <span className="node-key detail-link">{hashPreview(node.publicKey)}</span>
                  <span>{node.contributors}/{node.maxContributors}</span>
                  <span>{node.operatorFee == null ? "N/A" : node.operatorFee}</span>
                  <span>{compact(node.decommissionCount)}</span>
                  <span>{node.lastUptimeProof ? age(node.lastUptimeProof) : "N/A"}</span>
                  <span>{compact(node.downtimeCredit)} {"blocks"}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="table-card nodes-table">
          <div className="table-head"><span>{"STATUS"}</span><span>{"NODE PUBLIC KEY"}</span><span>{"CONTRIBUTORS"}</span><span>{"OPERATOR FEE (%)"}</span><span>{"STAKE (JUDE)"}</span><span>{"REGISTRATION HEIGHT"}</span><span title="Sorted by latest reward block height">{"LAST REWARD BLOCK ↓"}</span><span>{"VERSION"}</span></div>
          {paginatedServiceNodes.map((node) => (
            <div className="table-row service-node-row-link" key={node.publicKey} role="button" tabIndex={0} aria-label={`Open Service Node ${node.publicKey}`} onClick={() => openServiceNode(node.publicKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openServiceNode(node.publicKey); } }}>
              {node.unlocking
                ? <span className="node-unlocking"><TxTypeBadge type="unlock" compact iconOnly /></span>
                : <span className={node.active ? "node-active" : "node-inactive"}>{node.active ? "● ACTIVE" : node.funded ? "○ DECOMMISSIONED" : "○ AWAITING CONTRIBUTIONS"}</span>}
              <span className="node-key detail-link">{hashPreview(node.publicKey)}</span>
              <span>{node.contributors}/{node.maxContributors}</span>
              <span>{node.operatorFee == null ? "N/A" : node.operatorFee}</span>
              <span>{jude(node.contributed)}</span>
              <span className="block-height detail-link">{compact(node.registeredAt)}</span>
              <span className="block-height detail-link">{compact(node.lastRewardAt)}</span>
              <span>{node.version}</span>
            </div>
          ))}
          {snapshot && filteredServiceNodes.length === 0 && <div className="nodes-loading">No Service Node public key matches this search.</div>}
          {!snapshot && <div className="nodes-loading">{connection === "offline" ? "Service Node data is temporarily unavailable." : "Loading live Service Node data…"}</div>}
        </div>
        <div className="service-node-bottom-pager">
          <PaginationControls
            page={serviceNodePage}
            lastPage={serviceNodeLastPage}
            pageSize={serviceNodePageSize}
            onPageChange={setServiceNodePage}
            onPageSizeChange={(size) => { setServiceNodePageSize(size); setServiceNodePage(0); }}
          />
        </div>
      </section>}

      {!serviceNodesOnly && !statisticsOnly && <>
      <section className="quorum-section shell" id="quorums">
        <div className="section-heading quorum-heading">
          <div><h2>{"Service Node Testing Quorums"}</h2></div>
        </div>
        <div className="quorum-console">
          <div className="quorum-radar" aria-hidden="true">
            <i className="quorum-sweep" />
            <i className="quorum-ring ring-a" /><i className="quorum-ring ring-b" /><i className="quorum-ring ring-c" />
            {(snapshot?.quorums.records[0]?.validators || []).slice(0, 10).map((key, index) => <i className="radar-node" key={key} style={{ "--n": index } as React.CSSProperties} />)}
            <div className="radar-core"><strong>{snapshot?.quorums.records[0]?.validators.length ?? 0}</strong><span>{"VALIDATORS"}</span></div>
          </div>
          <div className="quorum-overview">
            <h3>{"Public testing quorums, clearly mapped."}</h3>
            <p>{"Each sampled height shows its Service Node testing quorum: validators and the nodes assigned for testing. Checkpoint, Blink, and Pulse quorums are not represented in this panel."}</p>
            <div className="quorum-metrics">
              <article><small>{"LATEST SAMPLE"}</small><strong className="block-height">{snapshot?.quorums.records[0] ? compact(snapshot.quorums.records[0].height) : "N/A"}</strong></article>
              <article><small>{"VALIDATORS"}</small><strong>{snapshot?.quorums.records[0]?.validators.length ?? "N/A"}</strong></article>
              <article><small>{"NODES UNDER TEST"}</small><strong>{snapshot?.quorums.records[0]?.workers.length ?? "N/A"}</strong></article>
            </div>
          </div>
        </div>
        <div className="quorum-ledger">
          <div className="quorum-ledger-head"><span>{quorumPage === 0 ? "RECENT TESTING QUORUMS" : "HISTORICAL TESTING QUORUMS"}</span></div>
          {(snapshot?.quorums.records || []).map((record, index) => (
            <details className="quorum-record" key={record.height}>
              <summary>
                <span className="quorum-index">{String(quorumPage * quorumPageSize + index + 1).padStart(2, "0")}</span>
                <span className="block-height quorum-height">{compact(record.height)}</span>
                <span><b>{record.validators.length}</b> {"validators"}</span><span><b>{record.workers.length}</b> {"nodes under test"}</span><i className="quorum-toggle"><span className="expand-label">{"EXPAND MATRIX →"}</span><span className="collapse-label">{"COLLAPSE MATRIX ↑"}</span></i>
              </summary>
              <div className="committee-matrix">
                <div><header><span>{"VALIDATOR QUORUM"}</span><b>{record.validators.length}</b></header><div className="key-matrix">{record.validators.map((key, keyIndex) => <button key={key} className="detail-link quorum-key" onClick={() => openServiceNode(key)}><i>V{String(keyIndex + 1).padStart(2, "0")}</i>{hashPreview(key)}</button>)}</div></div>
                <div><header><span>{"NODES UNDER TEST"}</span><b>{record.workers.length}</b></header><div className="key-matrix worker-matrix">{record.workers.map((key, keyIndex) => <button key={key} className="detail-link quorum-key" onClick={() => openServiceNode(key)}><i>N{String(keyIndex + 1).padStart(2, "0")}</i>{hashPreview(key)}</button>)}</div></div>
              </div>
            </details>
          ))}
          {!snapshot && <div className="nodes-loading">{"Loading live quorum data…"}</div>}
          {snapshot && snapshot.quorums.records.length === 0 && <div className="nodes-loading">{"Quorum records are unavailable for the selected range."}</div>}
          {quorumError && <div className="nodes-loading quorum-error">{`Unable to change page: ${quorumError}`}</div>}
        </div>
        <div className="quorum-bottom-pager">
          <PaginationControls page={quorumPage} lastPage={snapshot ? Math.floor(snapshot.network.height / quorumPageSize) : 0} pageSize={quorumPageSize} loading={quorumLoading} onPageChange={(page) => void changeQuorumPage(page)} onPageSizeChange={changeQuorumPageSize} onPrefetchPage={(page) => prefetchSnapshot({ quorumPage: page })} disableNext={Boolean(snapshot && !snapshot.quorums.hasOlder)} />
        </div>
      </section>

      <section className="staking home-service-nodes shell" id="home-service-nodes">
        <div className="section-heading">
          <div><h2>{"Latest Service Nodes"}</h2></div>
          <a className="section-link" href="/service-nodes">{"VIEW ALL SERVICE NODES →"}</a>
        </div>
        {Boolean(snapshot?.serviceNodes.decommissionedNodes?.length) && (
          <section className="decommissioned-live home-decommissioned" aria-label="Temporarily decommissioned service nodes">
            <div className="decommissioned-live-heading">
              <div>
                <h3>{"Temporarily Decommissioned"}</h3>
                <p>{"Currently offline, out of service, and not earning rewards. This panel is hidden automatically when all nodes return to service."}</p>
              </div>
              <strong>{snapshot!.serviceNodes.decommissionedNodes.length} {"DECOMMISSIONED"}</strong>
            </div>
            <div className="decommissioned-live-table">
              <div className="table-head"><span>{"STATUS"}</span><span>{"NODE PUBLIC KEY"}</span><span>{"CONTRIBUTORS"}</span><span>{"OPERATOR FEE (%)"}</span><span>{"DECOMMISSIONS"}</span><span>{"LAST UPTIME AGE [h:m:s]"}</span><span>{"DOWNTIME CREDIT"}</span></div>
              {snapshot!.serviceNodes.decommissionedNodes.map((node) => (
                <div className="table-row service-node-row-link" key={node.publicKey} role="button" tabIndex={0} aria-label={`Open Service Node ${node.publicKey}`} onClick={() => openServiceNode(node.publicKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openServiceNode(node.publicKey); } }}>
                  <TxTypeBadge type="decommission" compact iconOnly />
                  <span className="node-key detail-link">{hashPreview(node.publicKey)}</span>
                  <span>{node.contributors}/{node.maxContributors}</span>
                  <span>{node.operatorFee == null ? "N/A" : node.operatorFee}</span>
                  <span>{compact(node.decommissionCount)}</span>
                  <span>{node.lastUptimeProof ? age(node.lastUptimeProof) : "N/A"}</span>
                  <span>{compact(node.downtimeCredit)} {"blocks"}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="table-card nodes-table">
          <div className="table-head"><span>{"STATUS"}</span><span>{"NODE PUBLIC KEY"}</span><span>{"CONTRIBUTORS"}</span><span>{"OPERATOR FEE (%)"}</span><span>{"STAKE (JUDE)"}</span><span>{"REGISTRATION HEIGHT"}</span><span title="Sorted by latest reward block height">{"LAST REWARD BLOCK ↓"}</span><span>{"VERSION"}</span></div>
          {homepageServiceNodes.map((node) => (
            <div className="table-row service-node-row-link" key={node.publicKey} role="button" tabIndex={0} aria-label={`Open Service Node ${node.publicKey}`} onClick={() => openServiceNode(node.publicKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openServiceNode(node.publicKey); } }}>
              {node.unlocking
                ? <span className="node-unlocking"><TxTypeBadge type="unlock" compact iconOnly /></span>
                : <span className={node.active ? "node-active" : "node-inactive"}>{node.active ? "● ACTIVE" : node.funded ? "○ DECOMMISSIONED" : "○ PENDING"}</span>}
              <span className="node-key detail-link">{hashPreview(node.publicKey)}</span>
              <span>{node.contributors}/{node.maxContributors}</span>
              <span>{node.operatorFee == null ? "N/A" : node.operatorFee}</span>
              <span>{jude(node.contributed)}</span>
              <span className="block-height detail-link">{compact(node.registeredAt)}</span>
              <span className="block-height detail-link">{compact(node.lastRewardAt)}</span>
              <span>{node.version}</span>
            </div>
          ))}
          {!snapshot && <div className="nodes-loading">{connection === "offline" ? "Service Node data is temporarily unavailable." : "Loading live Service Node data…"}</div>}
        </div>
      </section>

      <section className="privacy-panel shell">
        <div className="privacy-hologram" aria-label={"Animated Judecoin privacy shield"}>
          <div className="holo-stage">
            <i className="holo-grid" />
            <i className="holo-beam" />
            <i className="holo-orbit holo-orbit-a" />
            <i className="holo-orbit holo-orbit-b" />
            <i className="holo-orbit holo-orbit-c" />
            <i className="holo-node holo-node-a" />
            <i className="holo-node holo-node-b" />
            <i className="holo-node holo-node-c" />
            <div className="holo-core">
              <span className="holo-scan" />
              <img src="/judecoin-j-logo.png" alt="Judecoin" />
            </div>
          </div>
        </div>
        <div><h2>{"Transparency where it matters."}<br />{"Privacy where it counts."}</h2><p>{"Public consensus data remains inspectable, while private transfer participants, addresses, and amounts remain hidden. Service Node registration fields appear only when they are part of the protocol’s public state."}</p></div>
        <div className="privacy-grid">
          <article><b>◉</b><span><strong>{"Private addresses"}</strong><small>{"Private transfer participants are not indexed."}</small></span></article>
          <article><b>◌</b><span><strong>{"Amounts stay private"}</strong><small>{"Transfer values remain confidential."}</small></span></article>
          <article><b>◇</b><span><strong>{"Public consensus proof"}</strong><small>{"Blocks, transaction hashes, and public Service Node consensus data remain verifiable."}</small></span></article>
        </div>
      </section>

      <footer className="shell"><div className="brand"><span className="brand-mark"><img src="/judecoin-logo-minimal-ring-transparent.png" alt="" /></span><span><b>JUDECOIN</b></span></div><div className="footer-meta"><a href="https://github.com/judecoin" target="_blank" rel="noreferrer">{"Source Code"}</a><span>{"Judecoin Core"}: 3.2.0-release</span></div></footer>
      </>}

      {detail && <div className={detail.fullPage ? "detail-backdrop detail-page-backdrop" : "detail-backdrop"} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetail(); }}>
        <div className={detail.fullPage ? `detail-modal detail-page${detail.kind ? ` ${detail.kind}-detail-page` : ""}` : "detail-modal"} role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <header><div>{detail.fullPage && <button className="detail-back-button" aria-label={"Back"} onClick={closeDetail}>← {"Back"}</button>}<h2 id="detail-title">{detail.title}</h2></div>{!detail.fullPage && <button aria-label={"Close details"} onClick={closeDetail}>×</button>}</header>
          {detail.sections ? <div className={detailLoading ? "detail-sections loading" : "detail-sections"}>{detail.sections.map((section) => <section className="detail-section" key={section.title}><div className="detail-subheading"><h3>{section.title}</h3></div><dl>{section.rows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd className={isBlockHeightLabel(row.label) ? "block-height" : undefined}><DetailValue value={row.value} /></dd></div>)}</dl></section>)}</div> : <div className={detailLoading ? "detail-grid loading" : "detail-grid"}>{detail.rows.map((row) => <div key={row.label}><small>{row.label}</small><DetailValue value={row.value} /></div>)}</div>}
          {detail.outputs && <section className="detail-outputs"><div className="detail-subheading"><h3>{detail.outputTitle || "Transaction Outputs"}</h3></div><div className="detail-output-table"><div className="detail-output-head"><span>#</span><span>{"OUTPUT KEY"}</span><span>{"AMOUNT"}</span><span>{"UNLOCK HEIGHT"}</span></div>{detail.outputs.map((output) => <div className="detail-output-row" key={`${output.index}-${output.key}`}><span>{output.index}</span><code>{output.key}</code><strong className={output.confidential ? "private-amount" : undefined}>{output.confidential ? "? JUDE" : `${atomicJude(output.amount || 0)} JUDE`}</strong><span className="block-height">{compact(output.unlockHeight)}</span></div>)}</div></section>}
          {detail.inputs && <section className="detail-inputs"><div className="detail-subheading"><h3>{"Inputs"}</h3><p>{`${detail.inputs.length} input(s) · amounts remain private`}</p></div><div className="detail-input-list">{detail.inputs.map((input) => <article key={`${input.index}-${input.keyImage}`}><header><span>{`INPUT ${input.index}`}</span><TxTypeBadge type={input.type === "coinbase" ? "block-reward" : "transfer"} compact iconOnly /></header><dl className="input-summary"><div><dt>{"KEY IMAGE"}</dt><dd><code>{input.keyImage || "Not applicable"}</code></dd></div><div><dt>{"AMOUNT"}</dt><dd className={input.amount ? undefined : "private-amount"}>{input.amount ? `${atomicJude(input.amount)} JUDE` : "? JUDE"}</dd></div><div><dt>{"RING SIZE"}</dt><dd>{input.ringSize || "N/A"}</dd></div></dl>{input.ringSize > 0 && <div className="ring-members"><div className="ring-head"><span>#</span><span>{"RING MEMBER / OUTPUT KEY"}</span><span>{"SOURCE TRANSACTION"}</span><span>{"BLOCK"}</span></div>{(input.ringMembers?.length ? input.ringMembers : (input.keyOffsets || []).map((offset) => ({ index: offset, outputKey: "", transactionHash: "", blockHeight: 0, unlocked: false }))).map((member, memberIndex) => <div className="ring-row" key={`${input.index}-${member.index}-${memberIndex}`}><span>{memberIndex}</span><code>{member.outputKey || `Output index ${compact(member.index)}`}</code><span>{member.transactionHash ? <button className="detail-link link" onClick={() => openTransaction(member.transactionHash)}>{hashPreview(member.transactionHash)}</button> : "Unavailable from node"}</span><span>{member.blockHeight ? <button className="detail-link block-height" onClick={() => openBlock(member.blockHeight)}>{compact(member.blockHeight)}</button> : "N/A"}</span></div>)}</div>}</article>)}</div></section>}
          {detail.raw && <details className="raw-details"><summary>{detail.kind === "service-node" ? "Show Raw Service Node Data" : detail.kind === "block" ? "Show Raw Block Data" : "Show Raw Transaction Data"}</summary><pre>{detail.raw}</pre></details>}
          <p>{detail.note || "Privacy fields are intentionally excluded. No private address, participant, balance, or amount is requested from the node."}</p>
        </div>
      </div>}
    </main>
  );
}
