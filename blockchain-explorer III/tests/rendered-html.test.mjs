import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the English-only release explorer", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Judecoin Blockchain Explorer<\/title>/i);
  assert.match(html, /See the chain/);
  assert.match(html, /Latest Blocks/);
  assert.match(html, /Latest Transactions/);
  assert.match(html, /Service Node Testing Quorums/);
  assert.match(html, /Latest Service Nodes/);
  assert.match(html, /class="quorum-bottom-pager"/);
  assert.doesNotMatch(html, /class="language-toggle"/);
  assert.doesNotMatch(html, />中文<\/button>/);
  assert.match(html, /Page 1 of 1/);
  assert.match(html, /<option value="5" selected="">5<\/option>/);
  assert.doesNotMatch(html, />5<!-- --> rows<\/option>/);
  assert.match(html, /href="\/service-nodes">Service Nodes/);
  assert.match(html, /href="\/statistics">Statistics/);
});

test("never server-renders fabricated fallback chain data", async () => {
  const [response, page] = await Promise.all([render(), readFile(new URL("../app/page.tsx", import.meta.url), "utf8")]);
  const html = await response.text();
  assert.doesNotMatch(page, /fallbackBlocks|fallbackTransactions/);
  assert.doesNotMatch(html, /840164|2\.84 kH\/s|4\.82 G/);
  assert.match(html, /Loading live block data/);
  assert.doesNotMatch(html, /\bRPC\b/i);
  assert.match(page, /Live block data is unavailable\. No preview data is shown/);
});

test("renders an accurate statistics command center", async () => {
  const response = await render("/statistics");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Judecoin network,/);
  assert.match(html, /Explore Judecoin blocks, transactions, Service Nodes, staking, and network activity in one place\./);
  assert.doesNotMatch(html, /retrieved through read-only public Judecoin RPC endpoints/i);
  assert.match(html, /Service Node Status/);
  assert.match(html, /Service Node Staking/);
  assert.match(html, /TOTAL SERVICE NODE STAKE/);
  assert.match(html, /Recent Block Activity/);
  assert.match(html, /Chain Parameters/);
  assert.match(html, /Service Node Lifecycle/);
  assert.doesNotMatch(html, /Data Source|Chain Status/);
  assert.doesNotMatch(html, /NODE LIFECYCLE|CURRENT \+ INDEXED HISTORY|CHAIN ACTIVITY|PROTOCOL STATUS/);
  assert.doesNotMatch(html, /emission secured|Quorum trust|UNLOCKED BLOCK|Staking economy/i);
});

test("includes deregistration records in the displayed Service Node status total", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /lockedDeregisteredServiceNodeTotal = snapshot/);
  assert.match(page, /node\.unlockedAt > snapshot\.network\.height/);
  assert.match(page, /statusTotal = currentServiceNodeTotal \+ lockedDeregisteredServiceNodeTotal/);
  assert.match(page, /activeServiceNodes = snapshot \? Math\.max\(0, snapshot\.serviceNodes\.active - unlockingServiceNodes\)/);
  assert.match(page, /\{"Deregistered · Stake locked"\}/);
  assert.match(page, /\{"TOTAL SHOWN"\}/);
  assert.match(page, /\{"CURRENT SERVICE NODES"\}/);
  assert.match(page, /deregistered with stake still locked/);
  assert.match(page, /#ef677b \$\{offlineEnd\}% 100%/);
  assert.doesNotMatch(page, /Deregistered history/);
  assert.doesNotMatch(page, /<i className="removed-dot" \/>\{"Awaiting contributions"\}/);
});

test("uses total mined supply for the staking ratio and never fabricates 100 percent", async () => {
  const [page, worker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /snapshot\.serviceNodes\.totalContributed \/ minedSupply/);
  assert.match(page, /% of total mined supply/);
  assert.match(page, /Total mined supply unavailable/);
  assert.doesNotMatch(page, /fundingProgress|registered Service Node requirement/);
  assert.match(worker, /JUDECOIN_EMISSION_API/);
  assert.match(worker, /minedSupply: hasCurrentMinedSupply \? minedSupply : null/);
});

test("keeps the complete primary navigation and places five Service Nodes after quorums", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const nav = page.slice(page.indexOf('<div className="nav-links">'), page.indexOf("</div>", page.indexOf('<div className="nav-links">')));
  assert.match(nav, /Home/);
  assert.match(nav, /Blocks/);
  assert.match(nav, /Transactions/);
  assert.match(nav, /Service Nodes/);
  assert.match(nav, /Statistics/);
  assert.match(nav, /Quorums/);
  assert.match(nav, /<a className=\{serviceNodesOnly \? "active" : undefined\} href="\/service-nodes">/);
  assert.match(nav, /<a className=\{statisticsOnly \? "active" : undefined\} href="\/statistics">/);
  assert.doesNotMatch(page, /import Link from "next\/link"/);
  const quorumIndex = page.indexOf('id="quorums"');
  const homeServiceNodesIndex = page.indexOf('id="home-service-nodes"');
  assert.ok(quorumIndex >= 0 && homeServiceNodesIndex > quorumIndex);
  assert.match(page, /b\.lastRewardAt - a\.lastRewardAt/);
  assert.match(page, /\.slice\(0, 5\)/);
  assert.match(page, /homepageServiceNodes\.map/);
  assert.match(page, /LAST REWARD BLOCK ↓/);
  assert.match(page, /Boolean\(snapshot\?\.serviceNodes\.decommissionedNodes\?\.length\)/);
  assert.match(page, /This panel is hidden automatically when all nodes return to service/);
});

test("paginates the Service Node list with 50 rows by default", async () => {
  const [response, page, worker] = await Promise.all([
    render("/service-nodes"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  const html = await response.text();
  assert.match(html, /Service Node Overview/);
  assert.match(html, /Search by node public key/);
  assert.match(page, /filteredServiceNodes/);
  assert.match(page, /TOTAL NODES:/);
  assert.match(page, /RESULTS:/);
  assert.doesNotMatch(page, /of \$\{compact\(snapshot\.serviceNodes\.nodes\.length\)\} nodes/);
  assert.ok(page.indexOf('className="service-node-search"') < page.indexOf('className="staking-stats"'));
  assert.match(html, /Page 1 of 1/);
  assert.match(html, /<option value="50" selected="">50<\/option>/);
  assert.match(page, /serviceNodePageSize, setServiceNodePageSize\] = useState\(50\)/);
  assert.match(page, /paginatedServiceNodes/);
  assert.match(page, /filteredServiceNodes\.slice\(serviceNodePage \* serviceNodePageSize/);
  assert.match(page, /setServiceNodePage\(0\)/);
  assert.doesNotMatch(worker, /\.slice\(serviceNodePage \* serviceNodePageSize/);
  assert.match(worker, /pageSize: currentServiceNodeStates\.length/);
  assert.match(page, /b\.lastRewardAt - a\.lastRewardAt\s*\|\| b\.registeredAt - a\.registeredAt/);
  assert.match(page, /LAST REWARD BLOCK ↓/);
  assert.match(worker, /Number\(b\.last_reward_block_height \|\| 0\) - Number\(a\.last_reward_block_height \|\| 0\)[\s\S]*Number\(b\.registration_height \|\| 0\) - Number\(a\.registration_height \|\| 0\)/);
  const serviceNodesPageStart = page.indexOf('serviceNodesOnly && <section');
  const decommissionedPanel = page.indexOf('className="decommissioned-live"', serviceNodesPageStart);
  const completeNodeTable = page.indexOf('className="table-card nodes-table"', serviceNodesPageStart);
  assert.ok(decommissionedPanel > serviceNodesPageStart && completeNodeTable > decommissionedPanel);
  assert.doesNotMatch(worker, /rank\(a\) - rank\(b\)/);
});

test("paginates deregistration records at 20 rows while fetching the complete history", async () => {
  const [page, worker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /deregisteredNodePageSize, setDeregisteredNodePageSize\] = useState\(20\)/);
  assert.match(page, /paginatedDeregisteredNodes/);
  assert.match(page, /deregisteredNodes\.slice\(deregisteredNodePage \* deregisteredNodePageSize/);
  assert.match(page, /deregisteredNodes\.length > 20/);
  assert.match(worker, /pageSize: deregisteredHistory\.nodes\.length/);
  assert.doesNotMatch(worker, /deregisteredNodes\.slice\(deregisteredNodePage \* deregisteredNodePageSize/);
});

test("searches blocks, transactions, and Service Node public keys", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /fetch\(`\/api\/block\?id=/);
  assert.match(page, /fetch\(`\/api\/transaction\?hash=/);
  assert.match(page, /fetch\(`\/api\/service-node\?key=/);
  assert.match(page, /#block-/);
  assert.match(page, /#tx-/);
  assert.match(page, /#node-/);
  assert.match(page, /aria-label=\{"Back"\}/);
});

test("uses live chain data, a constrained emission feed, freshness checks, and precise historical status", async () => {
  const [page, worker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  assert.match(worker, /https:\/\/www\.judeblock\.net\/api\/emission/);
  assert.doesNotMatch(worker, /fetch\([^)]*judeblock\.net[^)]*\.text\(|DOMParser|querySelector/);
  assert.match(worker, /latestBlockAgeSeconds/);
  assert.match(worker, /synced: latestBlockAgeSeconds <= Math\.max\(900, targetSeconds \* 5\)/);
  assert.match(worker, /unlockingNodes:/);
  assert.match(page, /Locked until block/);
  assert.match(page, /STAKE UNLOCK HEIGHT/);
  assert.match(page, /SCHEDULED UNLOCK BLOCK/);
  assert.match(page, /BLOCKS REMAINING/);
  assert.match(page, /ESTIMATED TIME REMAINING/);
  assert.match(page, /ESTIMATED UNLOCK TIME \(UTC\)/);
  assert.match(page, /Pending Unlock/);
  assert.match(page, /Pending Unlock Service Node/);
  assert.match(page, /Staking and Scheduled Unlock/);
  assert.match(page, /Actual wall-clock timing may vary/);
  assert.doesNotMatch(page, /onClick=\{\(\) => openBlock\(node\.unlockAt\)\}/);
  assert.match(page, /if \(inputs == null && outputs == null\) return "N\/A"/);
  assert.match(page, /Not detected/);
});

test("serves fast shared chain snapshots and refreshes them in the background", async () => {
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /const CHAIN_CACHE_FRESH_MS = 20_000/);
  assert.match(worker, /const CHAIN_CACHE_STALE_MS = 90_000/);
  assert.match(worker, /const CHAIN_CACHE_TTL_SECONDS = 120/);
  assert.match(worker, /cache\.match\(cacheKey\)/);
  assert.match(worker, /ctx\.waitUntil\(refreshChainCache\(cache, cacheKey, url\)/);
  assert.match(worker, /cache\.put\(cacheKey, stored\.clone\(\)\)/);
  assert.match(worker, /const serviceNodesResponsePromise = serviceNodeStatesRequest\(\)/);
  assert.match(worker, /const quorumSnapshotPromise = quorumPageSnapshot/);
  assert.match(worker, /return cachedChainResponse\(request, url, ctx\)/);
});

test("hides unavailable fields across service-node detail states", async () => {
  const [page, worker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  const start = page.indexOf("async function openServiceNode");
  const end = page.indexOf("async function search", start);
  const detail = page.slice(start, end);
  assert.match(detail, /data\.operatorAddress \? \[\{ label: "OPERATOR ADDRESS"/);
  assert.match(detail, /data\.historical \? \[\] : \[/);
  assert.match(detail, /protocolRows\.length \? \[\{ kicker: "PUBLIC NODE DATA"/);
  assert.match(detail, /\.\.\.\(snapshot \? \[/);
  assert.doesNotMatch(detail, /Removed from current RPC state|Not retained in the current historical index|Awaiting current chain height|Awaiting network timing|Never \/ not provided|Node did not provide/);
  assert.match(worker, /publicEndpoint: node\.public_ip \? \[node\.public_ip, node\.quorumnet_port\]\.filter\(Boolean\)\.join\(":"\) : null/);
  assert.doesNotMatch(worker, /publicEndpoint:.*Not published|version:.*Unknown/);
});

test("preserves authoritative transaction classification and multi-node pool validation", async () => {
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /function classifyTransaction/);
  assert.match(worker, /sn_state_change\?\.type/);
  assert.match(worker, /Promise\.allSettled\([\s\S]*get_transaction_pool/);
  assert.match(worker, /candidate\.height === synchronizedHeight/);
  assert.match(worker, /observation\.nodes\.length >= 2 && poolDetails\.has\(hash\)/);
  assert.doesNotMatch(worker, /rawExtra.*deregistration|extraBytes.*deregistration/i);
});

test("ships a real responsive phone layout and no local font paths", async () => {
  const [css, layout] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(css, /body\{width:auto!important;max-width:100%!important;overflow-x:hidden!important;font-size:16px!important;zoom:1!important\}/);
  assert.match(css, /\.metrics\{grid-template-columns:1fr!important\}/);
  assert.match(css, /\.nav-links\{display:flex!important;order:3!important;width:100%!important/);
  assert.match(css, /\.table-card\{width:100%!important;max-width:100%!important;overflow-x:auto!important\}/);
  assert.doesNotMatch(layout, /next\/font|\/Users\//);
});

test("keeps final telemetry labels readable and homepage node headers complete", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.chain-pulse-panel>header>span\{[^}]*font-size:12px/);
  assert.match(css, /\.pulse-footer\{[^}]*font-size:12px/);
  assert.match(css, /\.home-service-nodes \.nodes-table \.table-head\{[^}]*min-height:72px/);
  assert.match(css, /\.home-service-nodes \.nodes-table \.table-head>\*\{overflow:visible;text-overflow:clip;white-space:normal/);
});

test("retries slow live snapshot requests without clearing previously loaded data", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /SNAPSHOT_RETRY_DELAYS_MS = \[0, 1_200, 3_000\]/);
  assert.match(page, /async function fetchSnapshotWithRetry/);
  assert.match(page, /return await fetchSnapshot\(params\)/);
  assert.match(page, /const data = await fetchSnapshotWithRetry\(params\)/);
  assert.doesNotMatch(page, /catch[^}]*setSnapshot\(null\)/s);
});

test("keeps the complete Statistics page typography readable", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.statistics-page \.unlock-estimate-note\{[^}]*font-size:14px;line-height:1\.65/);
  assert.match(css, /\.statistics-page \.status-ledger dt\{font-size:14px\}/);
  assert.match(css, /\.statistics-page \.stake-mini-grid span\{font-size:12\.5px/);
  assert.match(css, /\.statistics-page \.lifecycle-grid span\{font-size:13px/);
  assert.match(css, /\.statistics-page \.protocol-panel dt\{font-size:12\.5px/);
  assert.match(css, /\.statistics-page \.pulse-tooltip b,\.statistics-page \.pulse-tooltip em\{font-size:10px\}/);
});

test("keeps the primary navigation fixed without covering page content", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /main\{padding-top:92px\}/);
  assert.match(css, /\.nav\{\s*position:fixed;\s*top:0;\s*left:50%;/);
  assert.match(css, /transform:translateX\(-50%\)/);
});

test("keeps the fixed navigation visible above every detail page", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(css, /\.nav\{[\s\S]*position:fixed;/);
  assert.match(css, /\.nav\{z-index:100\}/);
  assert.match(css, /\.detail-backdrop\{z-index:80\}/);
  assert.match(css, /\.detail-page-backdrop\{top:92px\}/);
  assert.match(css, /\.detail-page\{min-height:calc\(100vh - 92px\)\}/);
  assert.match(css, /\.detail-page > header\{isolation:isolate\}/);
  assert.match(page, /className="detail-back-button" aria-label=\{"Back"\}/);
  assert.doesNotMatch(page, /Back to Explorer/);
});

test("keeps every detail-page field and ledger heading on one line", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.detail-page \.detail-grid small,[\s\S]*\.detail-page \.ring-head > \*\{\s*white-space:nowrap;\s*overflow-wrap:normal;\s*word-break:normal;/);
  assert.match(css, /\.transaction-detail-page \.input-summary\{\s*grid-template-columns:minmax\(0,1fr\) 180px 170px;/);
  assert.match(css, /@media \(max-width:600px\)\{\s*\.transaction-detail-page \.input-summary\{grid-template-columns:1fr\}/);
});

test("sizes the Statistics reactor cube around its active-node label", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.statistics-page \.reactor-cube\{top:58px;width:148px;height:148px\}/);
  assert.match(css, /\.statistics-page \.cube-front\{transform:translateZ\(74px\)\}/);
  assert.match(css, /\.statistics-page \.cube-bottom\{transform:rotateX\(-90deg\) translateZ\(74px\)\}/);
  assert.match(css, /\.statistics-page \.ring-two\{top:84px;width:276px;height:88px\}/);
  assert.match(css, /\.statistics-page \.reactor-beam\{top:24px;width:144px;height:250px\}/);
});

test("omits the internal global output index from visitor-facing detail tables", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const outputTable = page.slice(page.indexOf('detail.outputs && <section className="detail-outputs"'), page.indexOf("</section>}", page.indexOf('detail.outputs && <section className="detail-outputs"')));
  assert.doesNotMatch(outputTable, /GLOBAL INDEX|output\.globalIndex/);
  assert.match(outputTable, /OUTPUT KEY/);
  assert.match(outputTable, /AMOUNT/);
  assert.match(outputTable, /UNLOCK HEIGHT/);
  assert.match(css, /\.detail-output-head,\.detail-output-row\{grid-template-columns:50px minmax\(380px,2\.8fr\) minmax\(120px,\.8fr\) minmax\(130px,\.8fr\)\}/);
});

test("uses clear, consistent titles across every detail page state", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /title: `Block \$\{compact\(data\.height\)\}`/);
  assert.match(page, /title: "Block Details", kind: "block"/);
  assert.match(page, /title: "Transaction Details", kind: "transaction"/);
  assert.match(page, /"Deregistered Service Node Details"/);
  assert.match(page, /"Pending Unlock Service Node Details"/);
  assert.match(page, /"Service Node Details"/);
  assert.match(page, /Show Raw Block Data/);
  assert.match(page, /Show Raw Transaction Data/);
  assert.match(page, /Show Raw Service Node Data/);
});

test("opens every Transactions table row as Transaction Details", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const start = page.indexOf('<section className="stream shell" id="transactions">');
  const end = page.indexOf("</section>", start);
  const transactionSection = page.slice(start, end);
  assert.match(transactionSection, /className="table-row transaction-row-link"/);
  assert.match(transactionSection, /aria-label=\{`Open transaction \$\{tx\.hash\}`\}/);
  assert.match(transactionSection, /onClick=\{\(\) => openTransaction\(tx\.hash, tx\.txType\)\}/);
  assert.doesNotMatch(transactionSection, /openBlock\(tx\.block\)/);
  assert.match(transactionSection, /<span className="height">/);
});

test("opens every Blocks table row as Block Details", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const blocksSection = page.slice(page.indexOf('id="blocks"'), page.indexOf('id="transactions"'));
  assert.match(blocksSection, /className="table-row block-row-link"/);
  assert.match(blocksSection, /role="button" tabIndex=\{0\} aria-label=\{`Open block/);
  assert.match(blocksSection, /onClick=\{\(\) => openBlock\(block\.height\)\}/);
  assert.doesNotMatch(blocksSection, /<button className="height detail-link"/);
  assert.doesNotMatch(blocksSection, /<button className="block-hash detail-link"/);
});

test("opens every Service Node ledger row as Service Node Details", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const serviceNodePage = page.slice(page.indexOf("{serviceNodesOnly &&"), page.indexOf("<section className=\"quorum-section", page.indexOf("{serviceNodesOnly &&")));
  const homepageNodes = page.slice(page.indexOf("home-service-nodes"), page.indexOf("<section className=\"privacy-panel", page.indexOf("home-service-nodes")));
  assert.match(serviceNodePage, /className="table-row service-node-row-link"/);
  assert.match(homepageNodes, /className="table-row service-node-row-link"/);
  assert.match(serviceNodePage, /role="button" tabIndex=\{0\} aria-label=\{`Open Service Node/);
  assert.match(homepageNodes, /onClick=\{\(\) => openServiceNode\(node\.publicKey\)\}/);
  assert.doesNotMatch(serviceNodePage, /<button className="node-key detail-link"/);
  assert.doesNotMatch(homepageNodes, /<button className="node-key detail-link"/);
});

test("keeps block-reward records out of Transaction Details", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const start = page.indexOf("async function openTransaction");
  const end = page.indexOf("async function openServiceNode", start);
  const transactionDetail = page.slice(start, end);
  assert.match(transactionDetail, /title: "Transaction Details"/);
  assert.match(transactionDetail, /outputTitle: "Transaction Outputs"/);
  assert.match(transactionDetail, /TRANSACTION HASH/);
  assert.match(transactionDetail, /FEE PER KB/);
  assert.doesNotMatch(transactionDetail, /Block Reward Transaction|BLOCK REWARD|SERVICE NODE WINNER|minerTransaction/);
});

test("uses the complete quorum summary row to expand its matrix", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const start = page.indexOf('<div className="quorum-ledger">');
  const end = page.indexOf("</section>", start);
  const quorumLedger = page.slice(start, end);
  assert.match(quorumLedger, /<summary>/);
  assert.match(quorumLedger, /<span className="block-height quorum-height">\{compact\(record\.height\)\}<\/span>/);
  assert.doesNotMatch(quorumLedger, /openBlock\(record\.height\)/);
  assert.match(quorumLedger, /EXPAND MATRIX →/);
  assert.match(quorumLedger, /COLLAPSE MATRIX ↑/);
});
