// cb-badge.js — runtime cache-bust visual badge.
// Reads <meta name="cb" content="..."> and renders 3 cell tiles in the corner.
// Drop in via: <script src="/cb-badge.js" defer></script>

(function () {
  const meta = document.querySelector('meta[name="cb"]');
  if (!meta) return;

  const raw = meta.getAttribute("content") || "";
  const hex = raw.replace(/^0x/i, "").toLowerCase().padStart(8, "0").slice(0, 8);
  if (!/^[0-9a-f]{8}$/.test(hex)) return;

  const cells = [0, 1, 2].map(i => parseInt(hex.slice(i * 2, i * 2 + 2), 16) % 64);
  const pad = n => String(n).padStart(2, "0");

  // Derive the cb-shapes URL prefix + extension from the existing favicon
  // <link>. The favicon is rendered by the framework (Astro, Next, etc.)
  // and respects the deployment's base path — so on a sub-path deploy like
  // GitHub Pages (/<repo>/...) it will already point at the right place.
  // Bare "/cb-shapes/..." 404s under a sub-path; on iOS Safari the broken
  // <img> renders as the system placeholder, which reads as "???" in a row.
  // Falls back to "/cb-shapes/" + ".svg" only when no such link exists.
  let cellPrefix = "/cb-shapes/";
  let cellExt = ".svg";
  const fav = document.querySelector(
    'link[rel~="icon"][href*="/cb-shapes/"]'
  );
  if (fav) {
    const href = fav.getAttribute("href") || "";
    const m = href.match(/^(.*\/cb-shapes\/)\d{2}\.(svg|webp)(\?.*)?$/);
    if (m) {
      cellPrefix = m[1];
      cellExt = "." + m[2];
    }
  }

  // Project name comes from a dedicated <meta name="app-name"> tag (NOT the cb
  // #label, which bust.sh rewrites/drops). Expected: "ゲージスライダー / geejisuraidaa".
  const appMeta = document.querySelector('meta[name="app-name"]');
  const appName = appMeta ? (appMeta.getAttribute("content") || "").trim() : "";
  // Split "<jp> / <romaji>" if present.
  let nameJp = appName, nameRomaji = "";
  const slash = appName.indexOf("/");
  if (slash !== -1) {
    nameJp = appName.slice(0, slash).trim();
    nameRomaji = appName.slice(slash + 1).trim();
  }

  // Build the badge. Top-left per owner requirement; shapes, then project
  // name, then the 8-char token in a smaller muted font.
  const badge = document.createElement("div");
  badge.id = "cb-badge";
  badge.setAttribute("data-cb", hex);
  badge.style.cssText = [
    "position:fixed",
    "top:8px",
    "left:8px",
    "display:flex",
    "gap:2px",
    "padding:4px 8px",
    "background:#111",
    "border:1px solid #2a2a2a",
    "border-radius:6px",
    "z-index:2147483647",
    "font:11px ui-monospace,SFMono-Regular,Menlo,monospace",
    "color:#888",
    "align-items:center",
    "user-select:none"
  ].join(";");

  const tiles = cells.map(c => {
    const img = document.createElement("img");
    img.src = `${cellPrefix}${pad(c)}${cellExt}`;
    img.alt = "";
    img.width = 20;
    img.height = 20;
    img.style.cssText = "display:block;border-radius:2px";
    // If the chosen extension 404s, try the other one once (covers installs
    // where cb-shapes ship as svg-only or webp-only). Guarded so it can't
    // loop forever between the two.
    img.onerror = () => {
      if (img.dataset.cbFallback) return;
      img.dataset.cbFallback = "1";
      const alt = cellExt === ".webp" ? ".svg" : ".webp";
      img.src = `${cellPrefix}${pad(c)}${alt}`;
    };
    return img;
  });
  tiles.forEach(t => badge.appendChild(t));

  // Project name next to the shapes, in small font.
  if (appName) {
    const nameEl = document.createElement("span");
    nameEl.style.cssText = "margin-left:8px;color:#cfcfcf;font-size:11px;line-height:1";
    const jp = document.createElement("span");
    jp.textContent = nameJp;
    nameEl.appendChild(jp);
    if (nameRomaji) {
      const rom = document.createElement("span");
      rom.textContent = " " + nameRomaji;
      rom.style.cssText = "color:#8a8a8a;font-size:10px";
      nameEl.appendChild(rom);
    }
    badge.appendChild(nameEl);
  }

  // Version token in a smaller, muted font, after the name.
  const hexEl = document.createElement("span");
  hexEl.textContent = hex;
  hexEl.style.cssText = "margin-left:8px;color:#7a7a7a;font-size:9px;letter-spacing:0.04em";
  badge.appendChild(hexEl);

  // Click to copy the token.
  badge.style.cursor = "pointer";
  badge.title = "click to copy cache-bust token";
  badge.addEventListener("click", () => {
    navigator.clipboard?.writeText(hex);
    hexEl.style.color = "#5dcaa5";
    setTimeout(() => { hexEl.style.color = "#7a7a7a"; }, 600);
  });

  // Mount once DOM is ready.
  if (document.body) {
    document.body.appendChild(badge);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(badge));
  }
})();
