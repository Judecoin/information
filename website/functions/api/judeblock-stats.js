export async function onRequestGet() {
  const explorerUrl = "https://www.judeblock.org/";
  const fallback = {
    activeServiceNodes: 364,
    stakingRequirement: 23600,
    totalJudeStaked: 364 * 23600,
    latestBlockHeight: null,
    latestBlockAge: null,
    source: "fallback"
  };

  function toNumber(value) {
    if (value === undefined || value === null) return null;
    const parsed = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function cleanHtml(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseExplorer(html) {
    const text = cleanHtml(html);
    const activeSentence = text.match(/([0-9][\d,]*)\s+service nodes awaiting contributions,\s*([0-9][\d,]*)\s+decommissioned service nodes,\s*and\s*([0-9][\d,]*)\s+active service nodes/i);
    const activeHeading = text.match(/Active Service Nodes\s+([0-9][\d,]*)/i);
    const stakingMatch = text.match(/Staking requirement:\s*([0-9][\d,.]*)\s*JUDE/i);
    const heightMatch = text.match(/Height:\s*([0-9][\d,]*)/i);
    const serverTimeMatch = text.match(/Server Time:\s*([^#]+?)\s+Height:/i);
    const latestBlockMatch = text.match(/Height Age \[h:m:s\] Size Type Transaction Hash Fee Rewards In\/Out TX Size\s+([0-9][\d,]*)\s+([0-9]{1,3}:[0-9]{2}:[0-9]{2})/i);

    const activeServiceNodes = activeSentence ? toNumber(activeSentence[3]) : activeHeading ? toNumber(activeHeading[1]) : null;
    const stakingRequirement = stakingMatch ? toNumber(stakingMatch[1]) : 23600;
    if (!activeServiceNodes) throw new Error("Active Service Nodes was not found in explorer HTML");

    return {
      activeServiceNodes,
      stakingRequirement,
      totalJudeStaked: activeServiceNodes * stakingRequirement,
      chainHeight: heightMatch ? toNumber(heightMatch[1]) : null,
      latestBlockHeight: latestBlockMatch ? toNumber(latestBlockMatch[1]) : null,
      latestBlockAge: latestBlockMatch ? latestBlockMatch[2] : null,
      serverTime: serverTimeMatch ? serverTimeMatch[1].trim() : null,
      source: "explorer",
      fetchedAt: new Date().toISOString()
    };
  }

  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=60",
    "access-control-allow-origin": "*"
  };

  try {
    const response = await fetch(explorerUrl, {
      headers: { "user-agent": "JudecoinWebsite/1.0 (+https://www.judecoin.io/)" }
    });
    if (!response.ok) throw new Error(`Explorer returned HTTP ${response.status}`);
    const data = parseExplorer(await response.text());
    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ ...fallback, error: String(error && error.message ? error.message : error), fetchedAt: new Date().toISOString() }), { headers });
  }
}
