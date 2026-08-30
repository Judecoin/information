(function () {
  "use strict";

  const EXPLORER_URL = "https://www.judeblock.org/";
  const DEFAULT = {
    activeServiceNodes: 364,
    stakingRequirement: 23600,
    totalJudeStaked: 364 * 23600,
    latestBlockHeight: null,
    latestBlockAge: null,
    source: "fallback"
  };

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function toNumber(value) {
    if (value === undefined || value === null) return null;
    const n = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
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

  function parseExplorerText(text) {
    const activeSentence = text.match(/([0-9][\d,]*)\s+service nodes awaiting contributions,\s*([0-9][\d,]*)\s+decommissioned service nodes,\s*and\s*([0-9][\d,]*)\s+active service nodes/i);
    const activeHeading = text.match(/Active Service Nodes\s+([0-9][\d,]*)/i);
    const stakingMatch = text.match(/Staking requirement:\s*([0-9][\d,.]*)\s*JUDE/i);
    const heightMatch = text.match(/Height:\s*([0-9][\d,]*)/i);
    const serverTimeMatch = text.match(/Server Time:\s*([^#]+?)\s+Height:/i);
    const latestBlockMatch = text.match(/Height Age \[h:m:s\] Size Type Transaction Hash Fee Rewards In\/Out TX Size\s+([0-9][\d,]*)\s+([0-9]{1,3}:[0-9]{2}:[0-9]{2})/i);

    const activeServiceNodes = activeSentence ? toNumber(activeSentence[3]) : activeHeading ? toNumber(activeHeading[1]) : null;
    const stakingRequirement = stakingMatch ? toNumber(stakingMatch[1]) : DEFAULT.stakingRequirement;
    const latestBlockHeight = latestBlockMatch ? toNumber(latestBlockMatch[1]) : null;
    const latestBlockAge = latestBlockMatch ? latestBlockMatch[2] : null;

    if (!activeServiceNodes) return null;

    return {
      activeServiceNodes: activeServiceNodes,
      stakingRequirement: stakingRequirement || DEFAULT.stakingRequirement,
      totalJudeStaked: activeServiceNodes * (stakingRequirement || DEFAULT.stakingRequirement),
      chainHeight: heightMatch ? toNumber(heightMatch[1]) : null,
      latestBlockHeight: latestBlockHeight,
      latestBlockAge: latestBlockAge,
      serverTime: serverTimeMatch ? serverTimeMatch[1].trim() : null,
      source: "explorer"
    };
  }

  function parseExplorerHtml(html) {
    return parseExplorerText(cleanHtml(html));
  }

  function parseJson(data) {
    if (!data || typeof data !== "object") return null;
    const activeServiceNodes = toNumber(data.activeServiceNodes || data.active_service_nodes || data.activeNodes || data.active);
    const stakingRequirement = toNumber(data.stakingRequirement || data.staking_requirement) || DEFAULT.stakingRequirement;
    if (!activeServiceNodes) return null;
    return {
      activeServiceNodes: activeServiceNodes,
      stakingRequirement: stakingRequirement,
      totalJudeStaked: activeServiceNodes * stakingRequirement,
      chainHeight: toNumber(data.chainHeight || data.height),
      latestBlockHeight: toNumber(data.latestBlockHeight || data.lastBlockHeight),
      latestBlockAge: data.latestBlockAge || data.lastBlockAge || null,
      serverTime: data.serverTime || null,
      source: data.source || "api"
    };
  }

  async function fetchStats() {
    const sources = [];
    if (window.location.protocol !== "file:") sources.push({ url: "/api/judeblock-stats", type: "json" });
    sources.push({ url: EXPLORER_URL, type: "html" });

    for (const source of sources) {
      try {
        const response = await fetch(source.url, { cache: "no-store" });
        if (!response.ok) continue;
        if (source.type === "json") {
          const stats = parseJson(await response.json());
          if (stats) return stats;
        } else {
          const stats = parseExplorerHtml(await response.text());
          if (stats) return stats;
        }
      } catch (error) {
      }
    }

    return DEFAULT;
  }

  function formatNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value || "");
    return n.toLocaleString("en-US");
  }

  function formatJude(value) {
    return formatNumber(value) + ' <span class="metric-unit">JUDE</span>';
  }

  function formatBlockAge(age) {
    if (!age) return "Explorer";
    const parts = String(age).split(":").map((part) => Number(part));
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return String(age);
    const h = parts[0], m = parts[1], s = parts[2];
    if (h > 0) return h + "h " + m + "m ago";
    if (m > 0) return m + " min ago";
    return s + " sec ago";
  }

  function setReady(el) {
    if (!el) return;
    el.classList.remove("is-live-loading");
    el.classList.add("is-live-ready");
  }

  function applyStats(stats) {
    const data = Object.assign({}, DEFAULT, stats || {});
    data.totalJudeStaked = Number(data.activeServiceNodes) * Number(data.stakingRequirement);

    const active = document.querySelector('[data-live-stat="activeServiceNodes"]');
    const total = document.querySelector('[data-live-stat="totalJudeStaked"]');
    const requirement = document.querySelector('[data-live-stat="stakingRequirement"]');
    const updated = document.querySelector('[data-live-stat="lastBlockAge"]');
    const panel = document.querySelector(".status-panel");

    if (active) active.textContent = formatNumber(data.activeServiceNodes);
    if (total) total.innerHTML = formatJude(data.totalJudeStaked);
    if (requirement) requirement.innerHTML = formatJude(data.stakingRequirement);
    if (updated) {
      updated.textContent = formatBlockAge(data.latestBlockAge);
      const titleParts = [];
      if (data.latestBlockHeight) titleParts.push("Latest block: " + data.latestBlockHeight);
      if (data.latestBlockAge) titleParts.push("Explorer age: " + data.latestBlockAge);
      if (data.serverTime) titleParts.push("Explorer server time: " + data.serverTime);
      if (titleParts.length) updated.setAttribute("title", titleParts.join(" | "));
    }

    [active, total, requirement, updated].forEach(setReady);
    if (panel) panel.setAttribute("data-live-source", data.source || "fallback");
  }

  function init() {
    document.querySelectorAll("[data-live-stat]").forEach((el) => el.classList.add("is-live-loading"));
    applyStats(DEFAULT);
    fetchStats().then(applyStats);
  }

  ready(init);
})();
