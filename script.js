/* ════════════════════════════════════════════
   CONFIG — loaded from config.js (window.CONFIG) or /config endpoint (reads .env on the server)
   YOUTUBE_HANDLE, YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY are injected below.
════════════════════════════════════════════ */
let YOUTUBE_HANDLE = window.CONFIG?.YOUTUBE_HANDLE || "iaexamax";
let YOUTUBE_CHANNEL_ID =
  window.CONFIG?.YOUTUBE_CHANNEL_ID || "UCuDkWnsBiTKlsecae0D11Ag";
let YOUTUBE_UPLOADS_PLAYLIST_ID =
  window.CONFIG?.YOUTUBE_UPLOADS_PLAYLIST_ID || "UUuDkWnsBiTKlsecae0D11Ag";
let YOUTUBE_API_KEY = window.CONFIG?.YOUTUBE_API_KEY || "";

const configReady = fetch("/config")
  .then((r) => {
    if (!r.ok) throw new Error("No server config endpoint");
    return r.json();
  })
  .then((cfg) => {
    if (cfg.YOUTUBE_HANDLE) YOUTUBE_HANDLE = cfg.YOUTUBE_HANDLE;
    if (cfg.YOUTUBE_CHANNEL_ID) YOUTUBE_CHANNEL_ID = cfg.YOUTUBE_CHANNEL_ID;
    if (cfg.YOUTUBE_UPLOADS_PLAYLIST_ID)
      YOUTUBE_UPLOADS_PLAYLIST_ID = cfg.YOUTUBE_UPLOADS_PLAYLIST_ID;
    if (cfg.YOUTUBE_API_KEY) YOUTUBE_API_KEY = cfg.YOUTUBE_API_KEY;
  })
  .catch(() => console.log("[CONFIG] Using local config.js channel settings."));

/* ════════════════════════════════════════════
   NAVBAR — scroll behavior
════════════════════════════════════════════ */
const navbar = document.getElementById("navbar");
const aboutSection = document.getElementById("about");

function updateNavbar() {
  if (!navbar) return;
  const scrollY = window.scrollY;
  navbar.classList.toggle("scrolled", scrollY > 60);

  if (aboutSection) {
    const rect = aboutSection.getBoundingClientRect();
    const navHeight = navbar.offsetHeight || 80;
    const isAtAbout = rect.top <= navHeight && rect.bottom >= navHeight;
    navbar.classList.toggle("nav-hidden", isAtAbout);
  }
}

window.addEventListener(
  "scroll",
  () => {
    updateNavbar();
    handleIntroScroll();
    checkReveal();
  },
  { passive: true },
);
window.addEventListener("resize", updateNavbar);
updateNavbar();

/* ════════════════════════════════════════════
   CANVAS — Background image or video
   ─────────────────────────────────────────
   Set BG_SOURCE to:
     'video/1.mp4'  → use the video file
     'img/1.jpg'    → use an image file
     ''             → use the gradient fallback
════════════════════════════════════════════ */
// Intro background image
const introBg = document.getElementById("introBg");

const canvas = document.getElementById("lightCanvas");
const ctx = canvas.getContext("2d");
let W, H;

function resizeCanvas() {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Alpha: 0=invisible → 1=full
let lightAlpha = 0;
let lightTarget = 0;
let scrollFade = 0;

// Time for animated overlays
let t = 0;

// Cloud wisps
const CLOUD_COUNT = 7;
const clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
  x: 0.1 + (i / CLOUD_COUNT) * 0.85,
  y: 0.72 + Math.random() * 0.12,
  rx: 0.06 + Math.random() * 0.1,
  ry: 0.018 + Math.random() * 0.012,
  o: 0.08 + Math.random() * 0.12,
  vx: (Math.random() - 0.5) * 0.00005,
}));

// No local bg media to load — YouTube iframe handles background.

// (background is the YouTube iframe — canvas only renders overlays)

function drawFrame() {
  t += 0.008;
  ctx.clearRect(0, 0, W, H);

  const alpha = lightAlpha * (1 - scrollFade);
  if (alpha <= 0) {
    requestAnimationFrame(drawFrame);
    return;
  }

  // ── 1. Background — YouTube iframe is behind the canvas ──────
  // (nothing to draw here; iframe renders beneath)

  // ── 2. Radial vignette — dark edges keep focus central ────
  const vig = ctx.createRadialGradient(
    W * 0.5,
    H * 0.45,
    H * 0.05,
    W * 0.5,
    H * 0.45,
    W * 0.75,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(0.7, "rgba(0,0,0,0)");
  vig.addColorStop(1, `rgba(0,0,0,${0.55 * alpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── 3. Bright halo behind character head ─────────────────
  const halo = ctx.createRadialGradient(
    W * 0.5,
    H * 0.52,
    0,
    W * 0.5,
    H * 0.52,
    W * 0.22,
  );
  halo.addColorStop(0, `rgba(180, 200, 255, ${0.35 * alpha})`);
  halo.addColorStop(0.4, `rgba(100, 130, 255, ${0.12 * alpha})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // ── 4. Ground mist / cloud wisps ─────────────────────────
  clouds.forEach((c) => {
    c.x += c.vx;
    if (c.x > 1.1) c.x = -0.1;
    if (c.x < -0.1) c.x = 1.1;
    const wispAlpha = c.o * alpha;
    const grad = ctx.createRadialGradient(
      c.x * W,
      c.y * H,
      0,
      c.x * W,
      c.y * H,
      c.rx * W,
    );
    grad.addColorStop(0, `rgba(140,160,255,${wispAlpha})`);
    grad.addColorStop(0.5, `rgba(100,120,255,${wispAlpha * 0.4})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.scale(1, c.ry / c.rx);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x * W, (c.y * H) / (c.ry / c.rx), c.rx * W, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // ── 6. Bottom dark fade so character stands on darkness ──
  const base = ctx.createLinearGradient(0, H * 0.78, 0, H);
  base.addColorStop(0, "rgba(0,0,0,0)");
  base.addColorStop(1, `rgba(2,2,8,${alpha})`);
  ctx.fillStyle = base;
  ctx.fillRect(0, H * 0.78, W, H * 0.22);

  requestAnimationFrame(drawFrame);
}
drawFrame();

// Smooth lerp
(function tickLight() {
  lightAlpha += (lightTarget - lightAlpha) * 0.025;
  requestAnimationFrame(tickLight);
})();

/* ════════════════════════════════════════════
   INTRO ANIMATION SEQUENCE
════════════════════════════════════════════ */
const introText = document.getElementById("introText");
const barcode = document.getElementById("introBarcode");
const tagsRow = document.getElementById("introTagsRow");
const scrollHint = document.getElementById("scrollHint");

function startIntroSequence() {
  if (introBg) introBg.classList.add("visible");

  // Step 1 — light fades in after 200ms
  setTimeout(() => {
    lightTarget = 1;
  }, 200);

  // Step 2 — text + barcode
  setTimeout(() => {
    if (introText) introText.classList.add("visible");
    if (barcode) barcode.classList.add("visible");
    if (tagsRow) tagsRow.classList.add("visible");
  }, 600);

  // Step 3 — scroll hint
  setTimeout(() => {
    if (scrollHint) scrollHint.classList.add("visible");
  }, 1400);
}

// Start intro immediately without preloader
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startIntroSequence);
} else {
  startIntroSequence();
}

/* ════════════════════════════════════════════
   SCROLL → INTRO FADE (light dims to black)
════════════════════════════════════════════ */
const introSection = document.getElementById("intro");
const introOverlay = document.getElementById("introOverlay");

function handleIntroScroll() {
  const introH = introSection.offsetHeight;
  const progress = Math.min(1, Math.max(0, window.scrollY / (introH * 0.75)));

  // Fade out the light (dark overlay)
  introOverlay.style.opacity = progress.toFixed(3);

  // Also dim canvas light via scrollFade
  scrollFade = progress;

  // Hide scroll hint once scrolled
  if (progress > 0.05) scrollHint.classList.remove("visible");
  else scrollHint.classList.add("visible");
}

/* ════════════════════════════════════════════
   SCROLL-REVEAL (Intersection Observer)
════════════════════════════════════════════ */
const revealEls = document.querySelectorAll(".reveal");
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.12 },
);
revealEls.forEach((el) => revealObs.observe(el));

function checkReveal() {
  // Fallback for older browsers
  revealEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.88) el.classList.add("visible");
  });
}

/* ════════════════════════════════════════════
   COUNTER ANIMATION (About stats)
════════════════════════════════════════════ */
function animateCounter(el, target) {
  let cur = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur + (target >= 10 ? "+" : "");
    if (cur >= target) clearInterval(timer);
  }, 40);
}

// Calculate exact years since June 6, 2022
const startDate = new Date("2022-06-06");
const currentDate = new Date();
const diffTime = Math.abs(currentDate - startDate);
const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
// Round to 1 decimal place (e.g. 2.8) if it's not a whole number, otherwise keep whole
const displayYears = diffYears.toFixed(1).replace(/\.0$/, "");

let projectsCount = 0; // Will be updated by loadVideos

const statsSection = document.getElementById("about");
const statsObs = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      animateCounter(
        document.getElementById("statProjects"),
        projectsCount || 10,
      ); // fallback if scroll is too fast
      animateCounter(
        document.getElementById("statYears"),
        parseFloat(displayYears),
      );
      statsObs.disconnect();
    }
  },
  { threshold: 0.3 },
);
statsObs.observe(statsSection);

/* ════════════════════════════════════════════
   ABOUT TABS (Overview / Background)
════════════════════════════════════════════ */
document.querySelectorAll(".about-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetTab = btn.getAttribute("data-tab");
    document.querySelectorAll(".about-tab-btn").forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    document.querySelectorAll(".about-pane").forEach((pane) => {
      pane.classList.remove("active");
    });
    const targetPane = document.getElementById(
      targetTab === "overview" ? "paneOverview" : "paneBackground",
    );
    if (targetPane) targetPane.classList.add("active");

    const panesContainer = document.querySelector(".about-panes");
    if (panesContainer) panesContainer.scrollTop = 0;
  });
});

/* ════════════════════════════════════════════
   YOUTUBE VIDEO CATALOG
════════════════════════════════════════════ */
const videoGrid = document.getElementById("videoGrid");
const loadingEl = document.getElementById("loadingState");

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function extractVideoId(url) {
  if (!url) return null;
  const m =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/embed\/([^?]+)/);
  return m ? m[1] : null;
}

/* ════════════════════════════════════════════
   MODAL PLAYER CONTROLLER
════════════════════════════════════════════ */
const modalBackdrop = document.getElementById("modalBackdrop");
const modalPlayer = document.getElementById("modalPlayer");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalYTLink = document.getElementById("modalYTLink");

function openModal(videoId, title, date) {
  // Inject autoplay iframe
  modalPlayer.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1"
      allow="autoplay; encrypted-media; fullscreen"
      allowfullscreen
    ></iframe>
  `;
  modalTitle.textContent = title;
  modalDate.textContent = formatDate(date);
  modalYTLink.href = `https://www.youtube.com/watch?v=${videoId}`;
  modalBackdrop.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalBackdrop.classList.remove("open");
  document.body.style.overflow = "";
  // Stop video by clearing iframe
  setTimeout(() => {
    modalPlayer.innerHTML = "";
  }, 300);
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

const CATALOG_VIDEOS = [
  {
    id: "AdU297GBNvg",
    title: "visuals:AZURE2026",
    pubDate: "2026-07-07T07:53:15Z",
  },
  {
    id: "rpY9ydbisP4",
    title: "visuals:AZURE2026 [ Discarded ]",
    pubDate: "2026-06-11T16:26:26Z",
  },
  {
    id: "Rwc5zKMN1xM",
    title: "visuals:NO_WORRIES.",
    pubDate: "2026-05-31T15:03:05Z",
  },
  {
    id: "mm-pWXxyT6k",
    title: "visuals:Height.",
    pubDate: "2026-05-31T13:49:22Z",
  },
  { id: "N0SML3Qotaw", title: "banner:HIRO.", pubDate: "2026-05-31T13:08:11Z" },
  { id: "zIEbQMFPSMs", title: "remake:AMOS", pubDate: "2026-03-15T13:54:37Z" },
  {
    id: "0eXpsDlfUII",
    title: "reels:2024-2025",
    pubDate: "2026-03-08T02:10:51Z",
  },
  { id: "ZVTB6703DnE", title: "HBD:amax.", pubDate: "2026-02-02T09:11:09Z" },
  {
    id: "Q-Fg1dh8s_I",
    title: "HBD:sxcstyles2025.",
    pubDate: "2025-08-17T04:02:46Z",
  },
  { id: "4gGzsHAM4mA", title: "amv:News.", pubDate: "2024-10-21T10:21:34Z" },
  {
    id: "NiYcw0yX2VY",
    title: "文字PV:not_enough.",
    pubDate: "2024-09-12T03:43:59Z",
  },
  {
    id: "QpnHcE5G0ks",
    title: "文字PV:all_alone.",
    pubDate: "2024-06-10T09:03:54Z",
  },
  {
    id: "R3zzz9GDyfs",
    title: "amv:Untitled.",
    pubDate: "2024-05-13T17:43:31Z",
  },
  { id: "P5uiNuZG46s", title: "amv:Daisey.", pubDate: "2024-02-29T06:37:30Z" },
  { id: "XgDKkSS0aPw", title: "amv:dot.", pubDate: "2024-02-05T00:59:57Z" },
  {
    id: "gNO7aiqYkSQ",
    title: "visuals:busy.",
    pubDate: "2024-01-07T11:14:44Z",
  },
  { id: "zVkIiLFjrWU", title: "miley", pubDate: "2023-12-09T15:07:36Z" },
  { id: "Rc__qEAHGAU", title: "amv:Story.", pubDate: "2023-10-27T14:12:59Z" },
  {
    id: "Taiw_SjScNY",
    title: "HBD:sxcstyles",
    pubDate: "2023-07-22T06:01:41Z",
  },
  {
    id: "ot68zIJmfyY",
    title: "intro:HiroNeyka.",
    pubDate: "2023-06-10T09:08:34Z",
  },
  {
    id: "r5wQP7NbVmQ",
    title: "fantro:Nerumi-S",
    pubDate: "2023-05-29T10:29:48Z",
  },
  {
    id: "x8C_vZsPIFc",
    title: "amv:amax&witty.",
    pubDate: "2023-05-20T12:13:08Z",
  },
];

function mergeWithCatalog(liveList) {
  const seen = new Set();
  const result = [];
  (liveList || []).forEach((item) => {
    const vid =
      item.id || item.videoId || extractVideoId(item.link || item.guid || "");
    if (vid && !seen.has(vid)) {
      seen.add(vid);
      result.push({
        title: item.title,
        pubDate: item.pubDate,
        link: item.link || `https://www.youtube.com/watch?v=${vid}`,
        thumbnail: item.thumbnail || {
          url: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        },
      });
    }
  });
  CATALOG_VIDEOS.forEach((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push({
        title: item.title,
        pubDate: item.pubDate,
        link: `https://www.youtube.com/watch?v=${item.id}`,
        thumbnail: {
          url: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
        },
      });
    }
  });
  return result;
}

function createVideoCard(item, index) {
  const videoId =
    item.id || item.videoId || extractVideoId(item.link || item.guid || "");
  const thumb =
    typeof item.thumbnail === "string" && item.thumbnail
      ? item.thumbnail
      : item.thumbnail?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const delay = (index % 12) * 60;
  const card = document.createElement("div");
  card.className = "video-card";
  card.style.animationDelay = delay + "ms";
  card.innerHTML = `
    <img class="video-thumb" src="${thumb}" alt="${item.title}" loading="lazy" />
    <div class="video-overlay">
      <div class="play-btn">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    <div class="video-info">
      <div class="video-idx">${String(index + 1).padStart(2, "0")}</div>
      <div class="video-title">${item.title}</div>
      <div class="video-date">${formatDate(item.pubDate)}</div>
    </div>
  `;
  card.addEventListener("click", () =>
    openModal(videoId, item.title, item.pubDate),
  );
  return card;
}

async function loadVideos() {
  await configReady; // ensure config values are loaded before using them
  const hasApiKey = Boolean(YOUTUBE_API_KEY && YOUTUBE_API_KEY.length > 0);
  const targetChannel = YOUTUBE_CHANNEL_ID || "UCuDkWnsBiTKlsecae0D11Ag";
  const targetHandle = YOUTUBE_HANDLE || "iaexamax";

  console.log(
    "%c[VIDEO CATALOG]",
    "color:#a78bfa;font-weight:bold",
    `Channel: ${targetChannel}`,
    "|",
    `Handle: @${targetHandle}`,
    "|",
    hasApiKey ? "🔑 API Key configured" : "📡 Auto-Sync Mode (22+ Catalog)",
  );

  let items = null;
  let method = null;

  // ── Method 1: Local / Express Backend API (bypasses browser CORS completely) ──
  try {
    console.log(
      "%c[VIDEO] Checking backend API /api/videos...",
      "color:#60a5fa",
    );
    const res = await fetch("/api/videos", {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length) {
        items = data.items;
        method = "Backend API (/api/videos)";
      }
    }
  } catch (e) {
    // Server endpoint not active or running statically — proceed to client methods
  }

  // ── Method 2: YouTube Data API v3 (Uploads Playlist) ──
  if (!items?.length && hasApiKey) {
    console.log("%c[VIDEO] Trying YouTube Data API v3...", "color:#60a5fa");
    try {
      const playlistId =
        YOUTUBE_UPLOADS_PLAYLIST_ID || "UU" + targetChannel.slice(2);
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length) {
          items = data.items.map((v) => ({
            title: v.snippet.title,
            pubDate: v.snippet.publishedAt,
            link: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
            thumbnail: {
              url:
                v.snippet.thumbnails?.maxres?.url ||
                v.snippet.thumbnails?.high?.url ||
                v.snippet.thumbnails?.default?.url,
            },
          }));
          method = "YouTube Data API v3 (Uploads Playlist)";
        }
      }
    } catch (err) {
      console.warn("[VIDEO] YouTube Data API request failed:", err.message);
    }
  }

  // ── Method 3: Official YouTube RSS Feed via rss2json ──
  if (!items?.length && targetChannel) {
    console.log(
      "%c[VIDEO] Fetching latest videos from YouTube RSS feed (rss2json)...",
      "color:#60a5fa",
    );
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetChannel}`;
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&t=${Date.now()}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const raw = await res.json();
        if (raw?.status === "ok" && raw.items?.length) {
          items = raw.items.map((item) => ({
            title: item.title,
            pubDate: item.pubDate,
            link: item.link,
            thumbnail: {
              url:
                typeof item.thumbnail === "string" && item.thumbnail
                  ? item.thumbnail
                  : item.enclosure?.thumbnail ||
                    `https://img.youtube.com/vi/${extractVideoId(item.link)}/hqdefault.jpg`,
            },
          }));
          method = "Live YouTube RSS Feed (rss2json)";
        }
      }
    } catch (err) {
      console.warn("[VIDEO] rss2json proxy failed:", err.message);
    }
  }

  // ── Method 4: Raw XML via CORS proxies ──
  if (!items?.length && targetChannel) {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetChannel}`;
    const xmlProxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
    ];

    for (let i = 0; i < xmlProxies.length; i++) {
      console.log(
        `%c[VIDEO] Trying XML proxy ${i + 1}/${xmlProxies.length}...`,
        "color:#60a5fa",
      );
      try {
        const res = await fetch(xmlProxies[i], {
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const xml = await res.text();
          if (xml && xml.includes("<entry>")) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, "application/xml");
            const parsed = Array.from(doc.querySelectorAll("entry")).map(
              (e) => {
                const vid =
                  e.querySelector("videoId")?.textContent ||
                  e.querySelector("id")?.textContent?.split(":").pop();
                return {
                  title: e.querySelector("title")?.textContent || "",
                  pubDate: e.querySelector("published")?.textContent || "",
                  link: `https://www.youtube.com/watch?v=${vid}`,
                  thumbnail: {
                    url:
                      e.querySelector("thumbnail")?.getAttribute("url") ||
                      `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
                  },
                };
              },
            );
            if (parsed.length) {
              items = parsed;
              method = `XML Proxy ${i + 1}`;
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`[VIDEO] XML proxy ${i + 1} failed:`, err.message);
      }
    }
  }

  // ── Merge with complete channel catalog (ensures all 22+ videos show) ──
  const allVideos = mergeWithCatalog(items);

  // ── Sync Videos to Personal Projects ──
  if (allVideos.length) {
    console.log(
      `%c[VIDEO] ✅ Loaded ${allVideos.length} videos (${method ? `${method} + ` : ""}Catalog Sync)`,
      "color:#34d399;font-weight:bold",
    );
    projectsCount = allVideos.length;
    const statEl = document.getElementById("statProjects");
    if (statEl && statEl.textContent !== "0")
      animateCounter(statEl, projectsCount);

    if (CLIENT_COLLECTIONS.personal) {
      CLIENT_COLLECTIONS.personal.works = allVideos.map((item) => {
        const vid = item.id || item.videoId || extractVideoId(item.link || "");
        return {
          title: item.title,
          category: getCategoryFromTitle(item.title),
          type: "video",
          videoId: vid,
          pubDate: item.pubDate,
          src:
            typeof item.thumbnail === "string" && item.thumbnail
              ? item.thumbnail
              : item.thumbnail?.url ||
                `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        };
      });

      const pCountEl = document.getElementById("personalWorksCount");
      if (pCountEl)
        pCountEl.textContent = `${CLIENT_COLLECTIONS.personal.works.length} WORKS`;

      if (activeClientKey === "personal") {
        renderClientShowcase("personal");
      }
    }
  } else {
    console.warn(
      "[VIDEO] Could not load video catalog. Using default catalog.",
    );
  }
}

// Trigger video catalog sync when Works scrolls into view or after initial delay
const collectionSection =
  document.getElementById("works") || document.getElementById("collection");
let videosLoaded = false;
if (collectionSection) {
  const collObs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !videosLoaded) {
        videosLoaded = true;
        loadVideos();
      }
    },
    { threshold: 0.05 },
  );
  collObs.observe(collectionSection);
}
setTimeout(() => {
  if (!videosLoaded) {
    videosLoaded = true;
    loadVideos();
  }
}, 1200);

/* ════════════════════════════════════════════
   DISCORD CLICK TO COPY
════════════════════════════════════════════ */
const discordBtn = document.getElementById("linkDiscord");
const discordTooltip = document.getElementById("discordTooltip");
if (discordBtn) {
  discordBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const username = discordBtn.getAttribute("data-discord");
    if (!username) return;

    function showTooltip() {
      if (!discordTooltip) return;
      discordTooltip.classList.add("visible");
      setTimeout(() => discordTooltip.classList.remove("visible"), 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(username)
        .then(showTooltip)
        .catch(() => fallbackCopy(username, showTooltip));
    } else {
      fallbackCopy(username, showTooltip);
    }
  });
}

function fallbackCopy(text, callback) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    if (callback) callback();
  } catch (err) {}
  document.body.removeChild(ta);
}

/* ════════════════════════════════════════════
   CONTACT EMAIL SENDER
   Sends work inquiries to:
   - aongsakrb@gmail.com
   - amaxforworks@gmail.com
   Fields:
   1. Name
   2. Email
   3. Work inquiries
════════════════════════════════════════════ */
const contactForm = document.getElementById("contactForm");
const contactNameInput = document.getElementById("contactName");
const contactEmailInput = document.getElementById("contactEmail");
const contactInquiryInput = document.getElementById("contactInquiry");
const contactSubmitBtn = document.getElementById("contactSubmitBtn");
const contactStatus = document.getElementById("contactStatus");

function escapeContactHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function setButtonLoading(loading) {
  if (!contactSubmitBtn) return;
  const btnText = contactSubmitBtn.querySelector(".btn-text");
  if (loading) {
    contactSubmitBtn.classList.add("loading");
    if (btnText) btnText.textContent = "SENDING...";
  } else {
    contactSubmitBtn.classList.remove("loading");
    if (btnText) btnText.textContent = "SEND";
  }
}

function showContactStatus(type, htmlMsg) {
  if (!contactStatus) return;
  contactStatus.className = `contact-status ${type}`;
  contactStatus.innerHTML = htmlMsg;
  contactStatus.style.display = "block";
}

function hideContactStatus() {
  if (!contactStatus) return;
  contactStatus.style.display = "none";
  contactStatus.className = "contact-status";
  contactStatus.innerHTML = "";
}

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear validation states
    [contactNameInput, contactEmailInput, contactInquiryInput].forEach((el) => {
      if (el) el.classList.remove("is-invalid");
    });
    hideContactStatus();

    const nameVal = (contactNameInput?.value || "").trim();
    const emailVal = (contactEmailInput?.value || "").trim();
    const inquiryVal = (contactInquiryInput?.value || "").trim();

    // 1. Validate Name
    if (!nameVal) {
      if (contactNameInput) {
        contactNameInput.classList.add("is-invalid");
        contactNameInput.focus();
      }
      showContactStatus("error", "Please enter your name.");
      return;
    }

    // 2. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      if (contactEmailInput) {
        contactEmailInput.classList.add("is-invalid");
        contactEmailInput.focus();
      }
      showContactStatus("error", "Please enter a valid email address.");
      return;
    }

    // 3. Validate Work Inquiries
    if (!inquiryVal) {
      if (contactInquiryInput) {
        contactInquiryInput.classList.add("is-invalid");
        contactInquiryInput.focus();
      }
      showContactStatus("error", "Please describe your work inquiry.");
      return;
    }

    // Loading state
    setButtonLoading(true);

    try {
      const payload = {
        name: nameVal,
        email: emailVal,
        _replyto: emailVal,
        inquiry: inquiryVal,
        message: inquiryVal,
        _cc: "amaxforworks@gmail.com",
        _subject: `Work Inquiry from ${nameVal} [amax portfolio]`,
        _template: "table",
        _captcha: "false",
      };

      const response = await fetch(
        "https://formsubmit.co/ajax/aongsakrb@gmail.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (
        response.ok &&
        (data.success === "true" ||
          data.success === true ||
          response.status === 200)
      ) {
        showContactStatus(
          "success",
          `✓ Thank you, ${escapeContactHtml(nameVal)}! Your inquiry has been sent. I will get back to you shortly.`,
        );
        contactForm.reset();
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (err) {
      console.warn("[Contact Form] Notice:", err);
      const mailtoSubject = encodeURIComponent(`Work Inquiry from ${nameVal}`);
      const mailtoBody = encodeURIComponent(
        `Name: ${nameVal}\nEmail: ${emailVal}\n\nWork Inquiries:\n${inquiryVal}`,
      );
      const mailtoUrl = `mailto:aongsakrb@gmail.com,amaxforworks@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

      showContactStatus(
        "error",
        `Could not deliver automatically via network. <a href="${mailtoUrl}" target="_blank" rel="noopener">Click here to send directly via your email client</a> to aongsakrb@gmail.com &amp; amaxforworks@gmail.com.`,
      );
    } finally {
      setButtonLoading(false);
    }
  });

  // Clear invalid border and dismiss error on user input
  [contactNameInput, contactEmailInput, contactInquiryInput].forEach(
    (input) => {
      if (input) {
        input.addEventListener("input", () => {
          input.classList.remove("is-invalid");
          if (contactStatus && contactStatus.classList.contains("error")) {
            hideContactStatus();
          }
        });
      }
    },
  );
}

/* ════════════════════════════════════════════
   CLIENT WORK COLLECTIONS & LIGHTBOX
════════════════════════════════════════════ */
function getCategoryFromTitle(title) {
  if (!title) return "Motion Graphic";
  const t = title.toLowerCase();
  if (t.includes("文字pv")) return "Typography Motion PV";
  if (t.includes("visuals:")) return "Motion Visual";
  if (t.includes("amv:")) return "Anime Music Video (AMV)";
  if (t.includes("reels:")) return "Motion Reel";
  if (t.includes("banner:")) return "Channel Banner & Visual";
  if (t.includes("intro:") || t.includes("fantro:")) return "Intro Animation";
  if (t.includes("remake:")) return "Motion Remake";
  if (t.includes("hbd:")) return "Celebration Visual";
  return "Motion Graphic";
}

const CLIENT_COLLECTIONS = {
  personal: {
    name: "Personal Project",
    handle: "@iaexamax",
    url: "https://www.youtube.com/@iaexamax",
    desc: "Original motion design, typography PVs, visual experiments, and animated showcase reels.",
    avatar: "P",
    links: [
      {
        platform: "YouTube",
        label: "@iaexamax",
        url: "https://www.youtube.com/@iaexamax",
        icon: "img/icons/Platform=YouTube, Color=Negative.png",
      },
      {
        platform: "Twitter / X",
        label: "@i_AExAmax",
        url: "https://x.com/i_AExAmax",
        icon: "img/icons/Platform=X (Twitter), Color=Negative.png",
      },
      {
        platform: "Instagram",
        label: "@itxamax",
        url: "https://www.instagram.com/itxamax/",
        icon: "img/icons/Platform=Instagram, Color=Negative.png",
      },
      {
        platform: "Twitch",
        label: "@iaexamax",
        url: "https://www.twitch.tv/iaexamax",
        icon: "img/icons/Platform=Twitch, Color=Negative.png",
      },
      {
        platform: "TikTok",
        label: "@iaexamax",
        url: "https://www.tiktok.com/@iaexamax",
        icon: "img/icons/Platform=TikTok, Color=Negative.png",
      },
    ],
    works: CATALOG_VIDEOS.map((item) => ({
      title: item.title,
      category: getCategoryFromTitle(item.title),
      type: "video",
      videoId: item.id,
      pubDate: item.pubDate,
      src: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
    })),
  },
  aihara: {
    name: "Aihara Ch.",
    handle: "@Aihara-wan",
    url: "https://www.youtube.com/@Aihara-wan",
    desc: "Vtuber",
    avatar: "A",
    links: [
      {
        platform: "YouTube",
        label: "@Aihara-wan",
        url: "https://www.youtube.com/@Aihara-wan",
        icon: "img/icons/Platform=YouTube, Color=Negative.png",
      },
    ],
    works: [
      {
        title: "Battlefield V",
        category: "Stream Thumbnail",
        type: "image",
        src: "img/clients/aihara/battlefield_v.png",
      },
      {
        title: "For Honor",
        category: "Stream Thumbnail",
        type: "image",
        src: "img/clients/aihara/for_honor.jpg",
      },
      {
        title: "Sky Story Origin",
        category: "Banner & Key Visual",
        type: "image",
        src: "img/clients/aihara/sky_story_origin.png",
      },
      {
        title: "No One Can Hide",
        category: "Stream Thumbnail",
        type: "image",
        src: "img/clients/aihara/no_one_can_hide.png",
      },
    ],
  },
  hironeyka: {
    name: "@HiroKitsuNyx",
    handle: "HiroNeyka / HiroKitsuNyx",
    url: "https://www.twitch.tv/hirokitsunyx",
    desc: "VTuber & Streamer",
    avatar: "H",
    links: [
      {
        platform: "Twitch",
        label: "@hirokitsunyx",
        url: "https://www.twitch.tv/hirokitsunyx",
        icon: "img/icons/Platform=Twitch, Color=Negative.png",
      },
      {
        platform: "YouTube",
        label: "@HiroNeyka",
        url: "https://www.youtube.com/@HiroNeyka",
        icon: "img/icons/Platform=YouTube, Color=Negative.png",
      },
      {
        platform: "X",
        label: "@HiroNeyka",
        url: "https://x.com/HiroNeyka",
        icon: "img/icons/Platform=X (Twitter), Color=Negative.png",
      },
      {
        platform: "TikTok",
        label: "@hironeyka",
        url: "https://www.tiktok.com/@hironeyka",
        icon: "img/icons/Platform=TikTok, Color=Negative.png",
      },
    ],
    works: [
      {
        title: "banner:HIRO.",
        category: "Channel Banner & Visual",
        type: "video",
        videoId: "N0SML3Qotaw",
        pubDate: "2026-05-31T13:08:11Z",
        src: "img/clients/hironeyka/banner_hiro.jpg",
      },
      {
        title: "intro:HiroNeyka.",
        category: "Stream Intro & Motion Graphic",
        type: "video",
        videoId: "ot68zIJmfyY",
        pubDate: "2023-06-10T09:08:34Z",
        src: "img/clients/hironeyka/intro_hironeyka.jpg",
      },
    ],
  },
};

let activeClientKey = null; // Default: unselected on page start
let activeImageIndex = 0;
let currentClientWorks = [];

function renderClientShowcase(clientKey) {
  const data = CLIENT_COLLECTIONS[clientKey];
  if (!data) return;

  activeClientKey = clientKey;
  currentClientWorks = data.works;

  const nameEl = document.getElementById("clientShowcaseName");
  const avatarEl = document.getElementById("clientShowcaseAvatar");
  const linksWrapEl = document.getElementById("clientChannelLinks");
  const linkEl = document.getElementById("clientChannelLink");
  const descEl = document.getElementById("clientShowcaseDesc");
  const countEl = document.getElementById("clientWorkCount");
  const gridEl = document.getElementById("clientGalleryGrid");

  const currentT = (typeof I18N_DATA !== "undefined" && I18N_DATA[currentAppLang]) ? I18N_DATA[currentAppLang] : {
    worksCountSuffix: "WORKS",
    worksBadgeVideo: "VIDEO",
    worksBadgeImage: "IMAGE",
    worksPlayVideo: "PLAY VIDEO ▶",
    worksViewArtwork: "VIEW ARTWORK",
    worksPersonalTitle: "Personal Project",
    worksPersonalDesc: data.desc
  };

  if (nameEl) nameEl.textContent = (clientKey === "personal" && currentT.worksPersonalTitle) ? currentT.worksPersonalTitle : data.name;
  if (avatarEl) avatarEl.textContent = data.avatar || data.name.charAt(0);
  if (descEl) descEl.textContent = (clientKey === "personal" && currentT.worksPersonalDesc) ? currentT.worksPersonalDesc : data.desc;
  if (countEl) countEl.textContent = `${data.works.length} ${currentT.worksCountSuffix || "WORKS"}`;

  if (linksWrapEl) {
    if (data.links && data.links.length > 0) {
      linksWrapEl.innerHTML = data.links
        .map(
          (l) => `
        <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="client-channel-link" title="${l.platform}: ${l.label}">
          ${l.icon ? `<img src="${l.icon}" alt="${l.platform}" class="client-link-icon" />` : ""}
          <span>${l.label} ↗</span>
        </a>
      `,
        )
        .join("");
    } else if (linkEl) {
      linkEl.textContent = data.handle + " ↗";
      linkEl.href = data.url;
    }
  } else if (linkEl) {
    linkEl.textContent = data.handle + " ↗";
    linkEl.href = data.url;
  }

  if (gridEl) {
    gridEl.innerHTML = data.works
      .map(
        (work, idx) => `
      <div class="client-work-card ${work.videoId ? "is-video-work" : "is-image-work"}" data-idx="${idx}">
        <div class="client-work-thumb-wrap">
          <img src="${work.src}" alt="${work.title}" class="client-work-img" loading="lazy" />
          ${
            work.videoId
              ? `
            <div class="client-work-type-badge client-work-type-video">
              <svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              <span>${currentT.worksBadgeVideo || "VIDEO"}</span>
            </div>
          `
              : `
            <div class="client-work-type-badge client-work-type-image">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>${currentT.worksBadgeImage || "IMAGE"}</span>
            </div>
          `
          }
          <div class="client-work-overlay">
            <span class="client-work-zoom-btn">${work.videoId ? (currentT.worksPlayVideo || "PLAY VIDEO ▶") : (currentT.worksViewArtwork || "VIEW ARTWORK")}</span>
          </div>
        </div>
        <div class="client-work-info">
          <div class="client-work-idx">${String(idx + 1).padStart(2, "0")}</div>
          <div class="client-work-title">${work.title}</div>
          <div class="client-work-cat">${work.category}</div>
        </div>
      </div>
    `,
      )
      .join("");

    // Attach click events: open video player modal if work has videoId, otherwise open image lightbox
    gridEl.querySelectorAll(".client-work-card").forEach((card) => {
      card.addEventListener("click", () => {
        const idx = parseInt(card.getAttribute("data-idx"), 10);
        const work = currentClientWorks[idx];
        if (work && work.videoId) {
          openModal(work.videoId, work.title, work.pubDate || "");
        } else {
          openImageModal(idx);
        }
      });
    });
  }
}

function closeClientShowcase() {
  activeClientKey = null;
  document
    .querySelectorAll(".client-box")
    .forEach((b) => b.classList.remove("active"));
  const wrapper = document.getElementById("clientShowcaseWrapper");
  if (wrapper) wrapper.classList.remove("is-open");
  const hint = document.getElementById("clientSelectHint");
  if (hint) hint.classList.remove("hidden");
}

function openClientShowcase(clientKey) {
  const data = CLIENT_COLLECTIONS[clientKey];
  if (!data) return;

  activeClientKey = clientKey;

  document.querySelectorAll(".client-box").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-client") === clientKey);
  });

  const hint = document.getElementById("clientSelectHint");
  if (hint) hint.classList.add("hidden");

  renderClientShowcase(clientKey);

  const wrapper = document.getElementById("clientShowcaseWrapper");
  if (wrapper) {
    wrapper.classList.add("is-open");
  }
}

function toggleClientShowcase(clientKey) {
  if (activeClientKey === clientKey) {
    closeClientShowcase();
  } else {
    openClientShowcase(clientKey);
  }
}

// Lightbox logic
const imageModalBackdrop = document.getElementById("imageModalBackdrop");
const imageModalImg = document.getElementById("imageModalImg");
const imageModalTitle = document.getElementById("imageModalTitle");
const imageModalClient = document.getElementById("imageModalClient");
const imageModalCategory = document.getElementById("imageModalCategory");
const imageModalCount = document.getElementById("imageModalCount");
const imageModalClose = document.getElementById("imageModalClose");
const imageModalPrev = document.getElementById("imageModalPrev");
const imageModalNext = document.getElementById("imageModalNext");

function openImageModal(index) {
  if (!currentClientWorks || !currentClientWorks[index]) return;
  activeImageIndex = index;
  updateImageModal();
  if (imageModalBackdrop) imageModalBackdrop.classList.add("open");
  document.body.style.overflow = "hidden";
}

function updateImageModal() {
  const work = currentClientWorks[activeImageIndex];
  const client = CLIENT_COLLECTIONS[activeClientKey];
  if (!work) return;

  if (imageModalImg) {
    imageModalImg.src = work.src;
    imageModalImg.alt = work.title;
  }
  if (imageModalTitle) imageModalTitle.textContent = work.title;
  if (imageModalClient)
    imageModalClient.textContent = client ? client.name : "";
  if (imageModalCategory) imageModalCategory.textContent = work.category;
  if (imageModalCount)
    imageModalCount.textContent = `${activeImageIndex + 1} / ${currentClientWorks.length}`;

  const videoBtn = document.getElementById("imageModalVideoLink");
  if (videoBtn) {
    if (work.videoId) {
      const currentT = (typeof I18N_DATA !== "undefined" && I18N_DATA[currentAppLang]) ? I18N_DATA[currentAppLang] : null;
      videoBtn.textContent = (currentT && currentT.worksPlayVideo) ? currentT.worksPlayVideo : "PLAY VIDEO ▶";
      videoBtn.style.display = "inline-flex";
      videoBtn.onclick = (e) => {
        e.preventDefault();
        closeImageModal();
        openModal(work.videoId, work.title, work.pubDate || "");
      };
    } else {
      videoBtn.style.display = "none";
      videoBtn.onclick = null;
    }
  }
}

function closeImageModal() {
  if (imageModalBackdrop) imageModalBackdrop.classList.remove("open");
  document.body.style.overflow = "";
}

function nextImageModal() {
  if (!currentClientWorks || !currentClientWorks.length) return;
  activeImageIndex = (activeImageIndex + 1) % currentClientWorks.length;
  updateImageModal();
}

function prevImageModal() {
  if (!currentClientWorks || !currentClientWorks.length) return;
  activeImageIndex =
    (activeImageIndex - 1 + currentClientWorks.length) %
    currentClientWorks.length;
  updateImageModal();
}

if (imageModalClose) imageModalClose.addEventListener("click", closeImageModal);
if (imageModalNext) imageModalNext.addEventListener("click", nextImageModal);
if (imageModalPrev) imageModalPrev.addEventListener("click", prevImageModal);

if (imageModalBackdrop) {
  imageModalBackdrop.addEventListener("click", (e) => {
    if (e.target === imageModalBackdrop) closeImageModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (!imageModalBackdrop || !imageModalBackdrop.classList.contains("open"))
    return;
  if (e.key === "Escape") closeImageModal();
  if (e.key === "ArrowRight") nextImageModal();
  if (e.key === "ArrowLeft") prevImageModal();
});

// Setup client box selection clicks (toggle swipe down / up)
document.querySelectorAll(".client-box[data-client]").forEach((box) => {
  box.addEventListener("click", () => {
    const clientKey = box.getAttribute("data-client");
    toggleClientShowcase(clientKey);
  });
});

// Setup close button inside showcase
const clientCloseBtn = document.getElementById("clientCloseBtn");
if (clientCloseBtn) {
  clientCloseBtn.addEventListener("click", closeClientShowcase);
}

// Initial state: default is NOT selected (closed)
closeClientShowcase();

/* ════════════════════════════════════════════
   MULTI-LANGUAGE SUPPORT (EN / TH / JP / CN)
════════════════════════════════════════════ */
let currentAppLang = "en";

const I18N_DATA = {
  en: {
    // Navigation
    navWorks: "WORKS",
    navAbout: "ABOUT",
    navContact: "CONTACT",
    scrollHint: "SCROLL",
    // Works section
    worksTopTag: "MOTION WORKS & CLIENT COLLECTIONS",
    worksTitle: "WORKS",
    worksMetaMotion: "MOTION & GRAPHIC DESIGN",
    worksMetaWorks: "PERSONAL & CLIENT WORKS",
    worksSelectLabel: "SELECT A COLLECTION OR CLIENT :",
    worksTagOriginal: "ORIGINAL",
    worksTagClient: "CLIENT",
    worksPersonalTitle: "Personal Project",
    worksCountSuffix: "WORKS",
    worksPlaceholderText: "MORE SOON",
    worksHintText: "SELECT A COLLECTION ABOVE TO VIEW WORKS",
    worksCloseBtn: "✕ CLOSE",
    worksPlayVideo: "PLAY VIDEO ▶",
    worksViewArtwork: "VIEW ARTWORK",
    worksBadgeVideo: "VIDEO",
    worksBadgeImage: "IMAGE",
    worksPersonalDesc: "Original motion design, typography PVs, visual experiments, and animated showcase reels.",
    // About section
    aboutTitle: "ABOUT",
    tabOverview: "OVERVIEW",
    tabBackground: "BACKGROUND",
    statProjects: "PROJECTS",
    statYears: "YEARS EXP.",
    aboutOverview: `Amax is a motion designer from Thailand. He makes smooth animations that match music and sound. As a solo creator, he builds both 2D and 3D graphics by himself.<br /><br />He learns from many different styles, but he always tries new ideas to make his work fresh and unique.<br /><br />He is still practicing story writing. His greatest strength is making videos that look cool, energetic, and move to the beat.<br /><br />Amax cares about good quality and staying healthy. He does not rush his work. Depending on the project, he may take from one day to over a year to finish, making sure every video is made with care.`,
    aboutBackground: `Amax is a motion designer from Thailand.<br /><br />He started making videos four years ago by editing anime music videos (AMVs). In 2024, he loved watching motion design creators from Japan and China, and their work inspired him a lot. In late 2025, he started learning 3D for the first time, making motion graphics with references from Japanese and Chinese creators.<br /><br />In 2026, he also discovered virtual club culture. After visiting music clubs in VRChat, he became very interested in DJing and VJing. His dream is to perform in VRChat clubs and build his own virtual club one day.<br /><br />Besides motion design, he also likes making music, 3D modeling, and drawing. His first dream was to make video games. He believes that once you set a goal, you should never give up. He uses all these skills to help him make games in the future.<br /><br />Over the last four years, he has worked for clients, friends, and himself. He always works hard on his art, hoping to share his work with people who enjoy his style.`,
    // Contact section
    contactYearTag: "DIRECT INQUIRIES & COLLABORATION",
    contactTitle: "CONTACT",
    contactLabelName: "NAME",
    contactLabelEmail: "EMAIL",
    contactLabelInquiry: "WORK INQUIRIES",
    contactPlaceholderName: "Your name or organization",
    contactPlaceholderEmail: "Your email address",
    contactPlaceholderInquiry: "Tell me about your project, timeline, deliverables, or questions...",
    contactBtnText: "SEND",
    // Work Status
    workStatusLabel: "WORK STATUS",
    workStatusTooltip: "Available for Work",
  },
  th: {
    // Navigation
    navWorks: "ผลงาน",
    navAbout: "เกี่ยวกับ",
    navContact: "ติดต่อ",
    scrollHint: "เลื่อนลง",
    // Works section
    worksTopTag: "รวมผลงานโมชันและลูกค้า",
    worksTitle: "ผลงาน",
    worksMetaMotion: "โมชัน & กราฟิกดีไซน์",
    worksMetaWorks: "โปรเจกต์ส่วนตัว & ลูกค้า",
    worksSelectLabel: "เลือกผลงานหรือลูกค้า :",
    worksTagOriginal: "ออริจินัล",
    worksTagClient: "ลูกค้า",
    worksPersonalTitle: "โปรเจกต์ส่วนตัว",
    worksCountSuffix: "ผลงาน",
    worksPlaceholderText: "เร็วๆ นี้",
    worksHintText: "เลือกผลงานด้านบนเพื่อดูวิดีโอ",
    worksCloseBtn: "✕ ปิด",
    worksPlayVideo: "เล่นวิดีโอ ▶",
    worksViewArtwork: "ดูภาพผลงาน",
    worksBadgeVideo: "วิดีโอ",
    worksBadgeImage: "รูปภาพ",
    worksPersonalDesc: "ผลงานโมชันดีไซน์ออริจินัล, ไทโปกราฟี PV, งานทดลองภาพ และแอนิเมชัน",
    // About section
    aboutTitle: "เกี่ยวกับ",
    tabOverview: "ภาพรวม",
    tabBackground: "ประวัติ",
    statProjects: "โปรเจกต์",
    statYears: "ปีประสบการณ์",
    aboutOverview: `Amax เป็นโมชันดีไซเนอร์จากประเทศไทย เขาถนัดการทำแอนิเมชันที่ลื่นไหลและตรงตามจังหวะเพลง ในฐานะครีเอเตอร์เดี่ยว เขาสร้างสรรค์กราฟิกทั้ง 2D และ 3D ด้วยตัวเองทั้งหมด<br /><br />เขาเรียนรู้จากหลากหลายสไตล์ และชอบลองไอเดียใหม่ๆ เสมอ เพื่อให้ผลงานดูสดใหม่และมีเอกลักษณ์เฉพาะตัว<br /><br />เขายังคงฝึกฝนด้านการเล่าเรื่องอยู่ แต่จุดเด่นที่สุดของเขาคือการทำวิดีโอที่ดูเท่ ทรงพลัง และเคลื่อนไหวตามจังหวะได้อย่างลงตัว<br /><br />Amax ให้ความสำคัญกับงานที่มีคุณภาพและสุขภาพที่ดี เขาทำงานอย่างตั้งใจโดยไม่เร่งรีบ ในแต่ละโปรเจกต์อาจใช้เวลาตั้งแต่ 1 วัน ไปจนถึงมากกว่า 1 ปี เพื่อให้มั่นใจว่าทุกชิ้นงานได้รับการดูแลอย่างประณีต`,
    aboutBackground: `Amax เป็นโมชันดีไซเนอร์จากประเทศไทย<br /><br />เขาเริ่มต้นทำวิดีโอเมื่อ 4 ปีก่อนจากการตัดต่อคลิป AMV อนิเมะ ในปี 2024 เขาหลงใหลและติดตามผลงานของครีเอเตอร์โมชันดีไซน์จากญี่ปุ่นและจีน ซึ่งเป็นแรงบันดาลใจให้เขาอย่างมาก ในช่วงปลายปี 2025 เขาเริ่มเรียนรู้การทำ 3D เป็นครั้งแรก และสร้างสรรค์งานโมชันโดยนำเรฟเฟอเรนซ์จากครีเอเตอร์ญี่ปุ่นและจีนมาต่อยอด<br /><br />ในปี 2026 เขาได้เปิดโลกสู่ Virtual Club หลังจากการไปสัมผัสคลับดนตรีใน VRChat เขาก็สนใจด้าน DJ และ VJ อย่างมาก ความฝันของเขาคือการได้ขึ้นแสดงในคลับ VRChat และสร้างเวอร์ชวลคลับของตัวเองขึ้นมาในอนาคต<br /><br />นอกจากโมชันดีไซน์แล้ว เขายังชอบทำเพลง ปั้นโมเดล 3D และวาดรูป ความฝันแรกของเขาคือการเป็นนักพัฒนาเกม เขาเชื่อเสมอว่าเมื่อตั้งเป้าหมายแล้วต้องไม่ยอมแพ้ และนำทักษะทั้งหมดที่เรียนรู้มาช่วยสร้างเกมในอนาคต<br /><br />ตลอด 4 ปีที่ผ่านมา เขาได้ทำงานทั้งสำหรับลูกค้า เพื่อน และโปรเจกต์ส่วนตัว เขาทุ่มเทสร้างสรรค์ผลงานเสมอ โดยหวังว่าจะได้แบ่งปันงานศิลปะนี้ให้กับทุกคนที่ชื่นชอบสไตล์ของเขา`,
    // Contact section
    contactYearTag: "ติดต่องาน & ร่วมงาน",
    contactTitle: "ติดต่อ",
    contactLabelName: "ชื่อ",
    contactLabelEmail: "อีเมล",
    contactLabelInquiry: "รายละเอียดงาน",
    contactPlaceholderName: "ชื่อของคุณหรือองค์กร",
    contactPlaceholderEmail: "ที่อยู่อีเมลของคุณ",
    contactPlaceholderInquiry: "บอกเล่าเกี่ยวกับโปรเจกต์ ระยะเวลา สิ่งที่ต้องการ หรือคำถามของคุณ...",
    contactBtnText: "ส่งข้อความ",
    // Work Status
    workStatusLabel: "สถานะงาน",
    workStatusTooltip: "พร้อมรับงาน",
  },
  jp: {
    // Navigation
    navWorks: "作品",
    navAbout: "概要",
    navContact: "連絡先",
    scrollHint: "スクロール",
    // Works section
    worksTopTag: "モーション作品＆クライアント制作",
    worksTitle: "作品",
    worksMetaMotion: "モーション＆グラフィックデザイン",
    worksMetaWorks: "自主制作＆クライアントワーク",
    worksSelectLabel: "コレクションまたはクライアントを選択 :",
    worksTagOriginal: "オリジナル",
    worksTagClient: "クライアント",
    worksPersonalTitle: "自主制作プロジェクト",
    worksCountSuffix: "作品",
    worksPlaceholderText: "近日公開",
    worksHintText: "上記のコレクションを選択して作品を見る",
    worksCloseBtn: "✕ 閉じる",
    worksPlayVideo: "動画を再生 ▶",
    worksViewArtwork: "作品を見る",
    worksBadgeVideo: "動画",
    worksBadgeImage: "画像",
    worksPersonalDesc: "オリジナルモーションデザイン、タイポグラフィPV、ビジュアル実験、アニメーション制作。",
    // About section
    aboutTitle: "概要",
    tabOverview: "概要",
    tabBackground: "経歴",
    statProjects: "実績数",
    statYears: "経験年数",
    aboutOverview: `Amaxはタイ出身のモーションデザイナーです。音楽やサウンドに合わせた滑らかなアニメーション制作を得意とし、ソロクリエイターとして2D・3Dのグラフィックス制作から合成までを自身で行っています。<br /><br />様々な表現から学びつつ、常に新しいアイデアを取り入れ、新鮮で独自性のあるスタイルを追求しています。<br /><br />ストーリーテリングは現在も学びの途中ですが、最大の強みはクールでエネルギッシュ、そしてビートにシンクロした映像表現です。<br /><br />作品のクオリティと健康を大切にしており、無理に急ぐことはしません。プロジェクトに応じて1日から1年以上じっくり時間をかけ、一つひとつの作品に愛情とこだわりを込めて制作しています。`,
    aboutBackground: `Amaxはタイ出身のモーションデザイナーです。<br /><br />4年前にアニメのAMV（アニメ・ミュージック・ビデオ）編集から動画制作を始めました。2024年には日本や中国のモーションデザインクリエイターの作品に魅了され、大きなインスピレーションを受けました。そして2025年末に初めて3Dの制作を始め、日本や中国のクリエイターをリファレンスにしたモーション作品を手掛けました。<br /><br />2026年にはバーチャルクラブ文化の魅力に出会いました。VRChat内の音楽クラブを体験したことをきっかけにDJやVJに興味を持ち、いつかVRChatクラブでパフォーマンスすること、そして自分自身のバーチャルクラブを作ることを夢見ています。<br /><br />モーションデザインのほか、作曲、3Dモデリング、イラスト制作なども行っています。最初の夢はゲームクリエイターになることでした。「一度決めた目標は決して諦めない」という信念のもと、これらすべてのスキルを活かして将来ゲームを制作したいと考えています。<br /><br />この4年間で、クライアントワーク、友人への制作、そして個人作品を手掛けてきました。自分のスタイルを気に入ってくれる人たちと作品を共有できるよう、常に心を込めて制作に取り組んでいます。`,
    // Contact section
    contactYearTag: "お仕事のご相談・共同制作",
    contactTitle: "連絡先",
    contactLabelName: "お名前",
    contactLabelEmail: "メールアドレス",
    contactLabelInquiry: "ご依頼内容",
    contactPlaceholderName: "お名前または貴社名",
    contactPlaceholderEmail: "メールアドレス",
    contactPlaceholderInquiry: "プロジェクトの概要、スケジュール、ご予算、ご質問などをお書きください...",
    contactBtnText: "送信する",
    // Work Status
    workStatusLabel: "稼働ステータス",
    workStatusTooltip: "お仕事募集中",
  },
  cn: {
    // Navigation
    navWorks: "作品",
    navAbout: "关于",
    navContact: "联系",
    scrollHint: "下滑",
    // Works section
    worksTopTag: "动态设计作品与商业委托",
    worksTitle: "作品",
    worksMetaMotion: "动态与平面视觉设计",
    worksMetaWorks: "个人创作与商业委托",
    worksSelectLabel: "选择作品集或客户 :",
    worksTagOriginal: "原创作品",
    worksTagClient: "商业客户",
    worksPersonalTitle: "个人原创项目",
    worksCountSuffix: "部作品",
    worksPlaceholderText: "敬请期待",
    worksHintText: "点击上方选择作品集以查看内容",
    worksCloseBtn: "✕ 关闭",
    worksPlayVideo: "播放视频 ▶",
    worksViewArtwork: "查看作品",
    worksBadgeVideo: "视频",
    worksBadgeImage: "图片",
    worksPersonalDesc: "原创动态设计、文字排版 PV、视觉概念实验及精选动画合集。",
    // About section
    aboutTitle: "关于",
    tabOverview: "概述",
    tabBackground: "背景",
    statProjects: "累计项目",
    statYears: "年经验",
    aboutOverview: `Amax 是一位来自泰国的动态设计师（Motion Designer）。他擅长制作流畅且与音乐节奏高度契合的动画。作为一名独立创作者，他能够全流程独立完成 2D 和 3D 视觉制作。<br /><br />他广泛汲取各种风格的灵感，并勇于尝试新想法，力求让自己的作品始终保持新颖与独特性。<br /><br />虽然复杂的叙事表达仍是他正在不断练习的领域，但他最大的优势在于打造酷炫、充满活力且与节拍完美契合的动态视觉。<br /><br />Amax 非常注重作品的质量与身心健康，从不盲目赶工。根据项目的不同，制作周期从一天到一年以上不等，只为确保每一件作品都倾注了足够的心思与精细打磨。`,
    aboutBackground: `Amax 是一位来自泰国的动态设计师。<br /><br />大约四年前，他通过制作动漫 AMV 开启了视频创作之路。2024 年，他深深喜欢上来自日本和中国创作者的优秀动态设计作品，并获得了极大的启发。在 2025 年底，他首次开始学习 3D 制作，并参考中日创作者的风格打造属于自己的动态作品。<br /><br />到了 2026 年，他又爱上了虚拟俱乐部（Virtual Club）文化。在体验了 VRChat 中的音乐俱乐部后，他对 DJ 和 VJ 产生了浓厚兴趣。他的梦想是在 VRChat 俱乐部中进行演出，并在未来打造一个属于自己的虚拟俱乐部。<br /><br />除了动态设计，他还热爱音乐制作、3D 建模和插画。他最初的梦想是成为一名游戏开发者。他坚信一旦确立了目标就绝不轻言放弃，并希望将目前掌握的全部技能，转化为未来制作独立游戏的基石。<br /><br />在过去的四年里，他完成了多项客户约稿、朋友合作及个人作品。他始终全心投入于艺术创作，期待与喜欢这种风格的朋友们分享自己的作品。`,
    // Contact section
    contactYearTag: "商业合作与项目洽谈",
    contactTitle: "联系",
    contactLabelName: "您的称呼",
    contactLabelEmail: "电子邮箱",
    contactLabelInquiry: "项目需求",
    contactPlaceholderName: "您的姓名或机构名称",
    contactPlaceholderEmail: "您的电子邮箱",
    contactPlaceholderInquiry: "请简述您的项目需求、时间周期、交付内容或任何疑问...",
    contactBtnText: "发送信息",
    // Work Status
    workStatusLabel: "工作状态",
    workStatusTooltip: "开放承接中",
  },
};

function applyLanguage(lang) {
  if (!I18N_DATA[lang]) lang = "en";
  currentAppLang = lang;
  const t = I18N_DATA[lang];

  // Update active button in widget
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  // Update Navigation
  const navWorks = document.getElementById("navWorks");
  if (navWorks) navWorks.textContent = t.navWorks;
  const navAbout = document.getElementById("navAbout");
  if (navAbout) navAbout.textContent = t.navAbout;
  const navContact = document.getElementById("navContact");
  if (navContact) navContact.textContent = t.navContact;

  // Update Scroll hint
  const scrollHint = document.querySelector("#scrollHint span");
  if (scrollHint) scrollHint.textContent = t.scrollHint;

  // Update Works section
  const worksTopTag = document.getElementById("worksTopTag");
  if (worksTopTag) worksTopTag.textContent = t.worksTopTag;
  const worksTitle = document.getElementById("worksTitle");
  if (worksTitle) worksTitle.textContent = t.worksTitle;
  const worksMetaMotion = document.getElementById("worksMetaMotion");
  if (worksMetaMotion) worksMetaMotion.textContent = t.worksMetaMotion;
  const worksMetaWorks = document.getElementById("worksMetaWorks");
  if (worksMetaWorks) worksMetaWorks.textContent = t.worksMetaWorks;
  const worksSelectLabel = document.getElementById("worksSelectLabel");
  if (worksSelectLabel) worksSelectLabel.textContent = t.worksSelectLabel;

  const tagPersonal = document.getElementById("tagPersonal");
  if (tagPersonal) tagPersonal.textContent = t.worksTagOriginal;
  const tagAihara = document.getElementById("tagAihara");
  if (tagAihara) tagAihara.textContent = t.worksTagClient;
  const tagHiro = document.getElementById("tagHiro");
  if (tagHiro) tagHiro.textContent = t.worksTagClient;

  const titlePersonal = document.getElementById("titlePersonal");
  if (titlePersonal) titlePersonal.textContent = t.worksPersonalTitle;

  const personalWorksCount = document.getElementById("personalWorksCount");
  const pLen = (CLIENT_COLLECTIONS.personal?.works || []).length || 22;
  if (personalWorksCount) personalWorksCount.textContent = `${pLen} ${t.worksCountSuffix}`;

  const aiharaWorksCount = document.getElementById("aiharaWorksCount");
  if (aiharaWorksCount) aiharaWorksCount.textContent = `4 ${t.worksCountSuffix}`;

  const hiroWorksCount = document.getElementById("hiroWorksCount");
  if (hiroWorksCount) hiroWorksCount.textContent = `2 ${t.worksCountSuffix}`;

  const worksPlaceholderText = document.getElementById("worksPlaceholderText");
  if (worksPlaceholderText) worksPlaceholderText.textContent = t.worksPlaceholderText;

  const worksHintText = document.getElementById("worksHintText");
  if (worksHintText) worksHintText.textContent = t.worksHintText;

  const clientCloseBtn = document.getElementById("clientCloseBtn");
  if (clientCloseBtn) clientCloseBtn.textContent = t.worksCloseBtn;

  // Re-render active client showcase if open
  if (activeClientKey) {
    renderClientShowcase(activeClientKey);
  }

  // Update About section
  const aboutTitle = document.querySelector(".about-title");
  if (aboutTitle) aboutTitle.textContent = t.aboutTitle;
  const tabOverview = document.getElementById("tabOverview");
  if (tabOverview) tabOverview.textContent = t.tabOverview;
  const tabBackground = document.getElementById("tabBackground");
  if (tabBackground) tabBackground.textContent = t.tabBackground;

  const statProjectsLabel = document.getElementById("statProjectsLabel");
  if (statProjectsLabel) statProjectsLabel.textContent = t.statProjects;
  const statYearsLabel = document.getElementById("statYearsLabel");
  if (statYearsLabel) statYearsLabel.textContent = t.statYears;

  const descOverview = document.querySelector("#paneOverview .about-desc");
  if (descOverview) descOverview.innerHTML = t.aboutOverview;
  const descBackground = document.querySelector("#paneBackground .about-desc");
  if (descBackground) descBackground.innerHTML = t.aboutBackground;

  // Update Contact section
  const contactYearTag = document.getElementById("contactYearTag");
  if (contactYearTag) contactYearTag.textContent = t.contactYearTag;
  const contactTitle = document.getElementById("contactTitle");
  if (contactTitle) contactTitle.textContent = t.contactTitle;

  const contactLabelName = document.getElementById("contactLabelName");
  if (contactLabelName) contactLabelName.textContent = t.contactLabelName;
  const contactLabelEmail = document.getElementById("contactLabelEmail");
  if (contactLabelEmail) contactLabelEmail.textContent = t.contactLabelEmail;
  const contactLabelInquiry = document.getElementById("contactLabelInquiry");
  if (contactLabelInquiry) contactLabelInquiry.textContent = t.contactLabelInquiry;

  const contactName = document.getElementById("contactName");
  if (contactName) contactName.setAttribute("placeholder", t.contactPlaceholderName);
  const contactEmail = document.getElementById("contactEmail");
  if (contactEmail) contactEmail.setAttribute("placeholder", t.contactPlaceholderEmail);
  const contactInquiry = document.getElementById("contactInquiry");
  if (contactInquiry) contactInquiry.setAttribute("placeholder", t.contactPlaceholderInquiry);

  const contactBtnText = document.getElementById("contactBtnText");
  if (contactBtnText) contactBtnText.textContent = t.contactBtnText;

  // Update Work Status widget
  const workStatusLabel = document.getElementById("workStatusLabel");
  if (workStatusLabel) workStatusLabel.textContent = t.workStatusLabel;
  const workStatusDot = document.getElementById("workStatusDot");
  if (workStatusDot) workStatusDot.setAttribute("title", t.workStatusTooltip);

  try {
    localStorage.setItem("amax_site_lang", lang);
  } catch (e) {}
}

// Setup language switcher clicks
document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    applyLanguage(lang);
  });
});

// Restore saved language or default to en
let initialLang = "en";
try {
  initialLang = localStorage.getItem("amax_site_lang") || "en";
} catch (e) {}
applyLanguage(initialLang);
