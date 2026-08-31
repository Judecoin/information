(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hexToRgb(hex) {
    if (!hex) return { r: 21, g: 154, b: 130 };
    const value = hex.trim();
    if (value.startsWith("#")) {
      const raw = value.slice(1);
      const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
      const num = parseInt(full, 16);
      if (!Number.isNaN(num)) {
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
      }
    }
    const rgba = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgba) return { r: +rgba[1], g: +rgba[2], b: +rgba[3] };
    return { r: 21, g: 154, b: 130 };
  }

  function getThemeColor(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function addCanvas() {
    if (reduceMotion) return;
    const canvas = document.getElementById("jude-vfx-network");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let particles = [];
    let raf = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 720 ? 34 : width < 1100 ? 52 : 72;
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.18,
        r: i % 9 === 0 ? 1.8 : 1.15 + Math.random() * 0.9,
        gold: i % 11 === 0
      }));
    }

    function draw() {
      const green = hexToRgb(getThemeColor("--green"));
      const gold = hexToRgb(getThemeColor("--gold"));
      const isLight = root.getAttribute("data-theme") === "light";
      const pointAlpha = isLight ? 0.13 : 0.24;
      const lineAlpha = isLight ? 0.045 : 0.075;
      const maxDistance = width < 720 ? 96 : 132;

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -16) p.x = width + 16;
        if (p.x > width + 16) p.x = -16;
        if (p.y < -16) p.y = height + 16;
        if (p.y > height + 16) p.y = -16;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * lineAlpha;
            ctx.strokeStyle = `rgba(${green.r}, ${green.g}, ${green.b}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const color = p.gold ? gold : green;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.gold ? pointAlpha * 0.82 : pointAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("beforeunload", function () {
      if (raf) cancelAnimationFrame(raf);
    });
  }

  function addRevealEffects() {
    root.classList.add("vfx-ready");
    document.body.classList.add("home-vfx");

    const selectors = [
      ".hero",
      ".trust-strip",
      ".section",
      ".placeholder-footer",
      "footer"
    ];
    const items = Array.from(document.querySelectorAll(selectors.join(","))).filter(Boolean);
    items.forEach((el, index) => {
      el.classList.add("vfx-reveal");
      if (index % 3 === 1) el.classList.add("vfx-delay-1");
      if (index % 3 === 2) el.classList.add("vfx-delay-2");
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("vfx-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("vfx-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.13, rootMargin: "0px 0px -8% 0px" });

    items.forEach((el) => observer.observe(el));
  }

  function addHeroOrbs() {
    if (reduceMotion) return;
    const panel = document.querySelector(".hero .visual-panel");
    if (!panel || panel.querySelector(".vfx-orb")) return;
    ["o1", "o2 gold", "o3 gold", "o4", "o5"].forEach((cls) => {
      const orb = document.createElement("span");
      orb.className = "vfx-orb " + cls;
      orb.setAttribute("aria-hidden", "true");
      panel.appendChild(orb);
    });
  }

  function parseNumber(text) {
    const match = text.trim().match(/^(\d[\d,]*)(.*)$/);
    if (!match) return null;
    const value = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(value)) return null;
    return { value, suffix: match[2] || "" };
  }

  function animateMetric(el) {
    if (el.dataset.vfxCounted === "1") return;
    const finalText = el.textContent.trim().replace(/\s+/g, " ");
    const parsed = parseNumber(finalText);
    if (!parsed) return;
    const finalHtml = el.innerHTML;
    const unitMatch = finalText.match(/\b(JUDE)\b/);
    const unit = unitMatch ? unitMatch[1] : "";
    const suffix = unit ? "" : parsed.suffix;
    const duration = parsed.value > 100000 ? 1300 : 900;
    const start = performance.now();
    el.dataset.vfxCounted = "1";
    el.classList.add("vfx-counting");

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(parsed.value * eased);
      if (unit) {
        el.innerHTML = `${current.toLocaleString("en-US")} <span class="metric-unit">${unit}</span>`;
      } else {
        el.textContent = current.toLocaleString("en-US") + suffix;
      }
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.innerHTML = finalHtml;
        el.classList.remove("vfx-counting");
      }
    }

    requestAnimationFrame(frame);
  }

  function addMetricCounters() {
    if (reduceMotion) return;
    const panel = document.querySelector(".status-panel");
    if (!panel) return;
    const values = Array.from(panel.querySelectorAll(".metric-card strong"));
    if (!("IntersectionObserver" in window)) {
      values.forEach(animateMetric);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        values.forEach(animateMetric);
        observer.disconnect();
      }
    }, { threshold: 0.28 });
    observer.observe(panel);
  }

  function init() {
    addRevealEffects();
    addHeroOrbs();
    addMetricCounters();
    addCanvas();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

(function () {
  const cards = document.querySelectorAll(".year-card");
  if (!("IntersectionObserver" in window)) {
    cards.forEach(card => card.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  cards.forEach(card => observer.observe(card));
})();

(function () {
  const links = Array.from(document.querySelectorAll(".status-nav .status-chip[data-target]"));
  const sections = links
    .map(link => document.getElementById(link.getAttribute("data-target")))
    .filter(Boolean);

  function setActive(id) {
    links.forEach(link => {
      link.classList.toggle("is-active", link.getAttribute("data-target") === id);
    });
  }

  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible) setActive(visible.target.id);
    }, {
      rootMargin: "-20% 0px -58% 0px",
      threshold: [0.12, 0.24, 0.48]
    });

    sections.forEach(section => observer.observe(section));
  }

  links.forEach(link => {
    link.addEventListener("click", function () {
      setActive(this.getAttribute("data-target"));
    });
  });

  setActive("current-focus");
})();
