/* ════════════════════════════════════════════
   CONFIG — loaded from config.js (window.CONFIG) or /config endpoint (reads .env on the server)
   YOUTUBE_HANDLE, YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY are injected below.
════════════════════════════════════════════ */
let YOUTUBE_HANDLE              = window.CONFIG?.YOUTUBE_HANDLE              || 'iaexamax';
let YOUTUBE_CHANNEL_ID          = window.CONFIG?.YOUTUBE_CHANNEL_ID          || 'UCuDkWnsBiTKlsecae0D11Ag';
let YOUTUBE_UPLOADS_PLAYLIST_ID = window.CONFIG?.YOUTUBE_UPLOADS_PLAYLIST_ID || 'UUuDkWnsBiTKlsecae0D11Ag';
let YOUTUBE_API_KEY             = window.CONFIG?.YOUTUBE_API_KEY             || '';

const configReady = fetch('/config')
  .then(r => {
    if (!r.ok) throw new Error('No server config endpoint');
    return r.json();
  })
  .then(cfg => {
    if (cfg.YOUTUBE_HANDLE)              YOUTUBE_HANDLE              = cfg.YOUTUBE_HANDLE;
    if (cfg.YOUTUBE_CHANNEL_ID)          YOUTUBE_CHANNEL_ID          = cfg.YOUTUBE_CHANNEL_ID;
    if (cfg.YOUTUBE_UPLOADS_PLAYLIST_ID) YOUTUBE_UPLOADS_PLAYLIST_ID = cfg.YOUTUBE_UPLOADS_PLAYLIST_ID;
    if (cfg.YOUTUBE_API_KEY)             YOUTUBE_API_KEY             = cfg.YOUTUBE_API_KEY;
  })
  .catch(() => console.log('[CONFIG] Using local config.js channel settings.'));


/* ════════════════════════════════════════════
   NAVBAR — scroll behavior
════════════════════════════════════════════ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  handleIntroScroll();
  checkReveal();
}, { passive: true });

/* ════════════════════════════════════════════
   CANVAS — Background image or video
   ─────────────────────────────────────────
   Set BG_SOURCE to:
     'video/1.mp4'  → use the video file
     'img/1.jpg'    → use an image file
     ''             → use the gradient fallback
════════════════════════════════════════════ */
// BG is now a YouTube iframe — see index.html #ytBg
const ytBgShield = document.getElementById('ytBgShield');

// Fade the shield out once the YT iframe has had time to start playing
// (hides YouTube's initial play-button overlay)
function fadeShield() { ytBgShield.classList.add('hidden'); }
setTimeout(fadeShield, 1500); // fallback: always fade after 1.5s

// Also use the YT IFrame API to fade as soon as video actually plays
window.onYouTubeIframeAPIReady = function () { /* API loaded, player handled inline */ };
(function () {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
})();
window._ytPlayer = null;
window.onYouTubeIframeAPIReady = function () {
  window._ytPlayer = new YT.Player('ytBgFrame', {
    events: {
      onStateChange: function (e) {
        if (e.data === YT.PlayerState.PLAYING) {
          fadeShield();
          // Credit YouTube loading weight to the preloader (once only)
          if (!window._ytProgressAdded && typeof addProgress === 'function') {
            window._ytProgressAdded = true;
            addProgress(LOAD_ASSETS.ytReady);
          }
        }
      }
    }
  });
};

const canvas = document.getElementById('lightCanvas');
const ctx    = canvas.getContext('2d');
let W, H;

function resizeCanvas() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Alpha: 0=invisible → 1=full
let lightAlpha  = 0;
let lightTarget = 0;
let scrollFade  = 0;

// Time for animated overlays
let t = 0;

// Stars / bright dust
const STAR_COUNT = 80;
const stars = Array.from({ length: STAR_COUNT }, () => ({
  x:  Math.random(),
  y:  Math.random() * 0.75,
  r:  Math.random() * 1.2 + 0.2,
  o:  Math.random() * 0.6 + 0.2,
  tw: Math.random() * Math.PI * 2,
}));

// Cloud wisps
const CLOUD_COUNT = 7;
const clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
  x:  0.1 + (i / CLOUD_COUNT) * 0.85,
  y:  0.72 + Math.random() * 0.12,
  rx: 0.06 + Math.random() * 0.1,
  ry: 0.018 + Math.random() * 0.012,
  o:  0.08 + Math.random() * 0.12,
  vx: (Math.random() - 0.5) * 0.00005,
}));

// No local bg media to load — YouTube iframe handles background.

// (background is the YouTube iframe — canvas only renders overlays)

function drawFrame() {
  t += 0.008;
  ctx.clearRect(0, 0, W, H);

  const alpha = lightAlpha * (1 - scrollFade);
  if (alpha <= 0) { requestAnimationFrame(drawFrame); return; }

  // ── 1. Background — YouTube iframe is behind the canvas ──────
  // (nothing to draw here; iframe renders beneath)

  // ── 2. Radial vignette — dark edges keep focus central ────
  const vig = ctx.createRadialGradient(W*0.5, H*0.45, H*0.05, W*0.5, H*0.45, W*0.75);
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(0.7, 'rgba(0,0,0,0)');
  vig.addColorStop(1,   `rgba(0,0,0,${0.55 * alpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── 3. Bright halo behind character head ─────────────────
  const halo = ctx.createRadialGradient(W*0.5, H*0.52, 0, W*0.5, H*0.52, W*0.22);
  halo.addColorStop(0,   `rgba(180, 200, 255, ${0.35 * alpha})`);
  halo.addColorStop(0.4, `rgba(100, 130, 255, ${0.12 * alpha})`);
  halo.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // ── 4. Ground mist / cloud wisps ─────────────────────────
  clouds.forEach(c => {
    c.x += c.vx;
    if (c.x > 1.1) c.x = -0.1;
    if (c.x < -0.1) c.x = 1.1;
    const wispAlpha = c.o * alpha;
    const grad = ctx.createRadialGradient(
      c.x * W, c.y * H, 0,
      c.x * W, c.y * H, c.rx * W
    );
    grad.addColorStop(0,   `rgba(140,160,255,${wispAlpha})`);
    grad.addColorStop(0.5, `rgba(100,120,255,${wispAlpha * 0.4})`);
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.save();
    ctx.scale(1, c.ry / c.rx);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x * W, (c.y * H) / (c.ry / c.rx), c.rx * W, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // ── 5. Stars / bright particles in sky ───────────────────
  ctx.save();
  stars.forEach(s => {
    const twinkle = 0.5 + 0.5 * Math.sin(t * 1.8 + s.tw);
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,230,255,${s.o * twinkle * alpha})`;
    ctx.fill();
  });
  ctx.restore();

  // ── 6. Bottom dark fade so character stands on darkness ──
  const base = ctx.createLinearGradient(0, H * 0.78, 0, H);
  base.addColorStop(0, 'rgba(0,0,0,0)');
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
const charWrap   = document.getElementById('characterWrap');
const introText  = document.getElementById('introText');
const barcode    = document.getElementById('introBarcode');
const tagsRow    = document.getElementById('introTagsRow');
const scrollHint = document.getElementById('scrollHint');
const rays       = document.querySelectorAll('.god-ray');

/* ════════════════════════════════════════════
   PRELOADER LOGIC — Real asset tracking
════════════════════════════════════════════ */
const preloader        = document.getElementById('preloader');
const preloaderText    = document.getElementById('preloaderText');
const preloaderBar     = document.getElementById('preloaderBar');
const preloaderClick   = document.getElementById('preloaderClick');
const preloaderBarWrap = document.getElementById('preloaderBarWrap');

const enterVideo = document.getElementById('enterVideo');

// ── Real progress tracking ────────────────────────────────
// Each asset has a weight (total = 100).
// When it resolves we add its weight to loadProgress.
// ─────────────────────────────────────────────────────────
const LOAD_ASSETS = {
  //              weight
  config:         15,   // /config fetch
  enterVideo:     30,   // click_to_enter.mp4 canplaythrough
  characterImg:   25,   // character.png
  logoImg:        15,   // LOGO.png
  ytReady:        15,   // YouTube iframe starts playing
};

let loadProgress = 0;
let loadingDone  = false;

function addProgress(weight) {
  if (loadingDone) return;
  loadProgress = Math.min(100, loadProgress + weight);
  preloaderBar.style.width = loadProgress + '%';
  preloaderText.textContent = `LOADING... ${Math.floor(loadProgress)}%`;
  if (loadProgress >= 100) onLoadComplete();
}

function onLoadComplete() {
  if (loadingDone) return;
  loadingDone = true;
  // Small pause so the user sees "LOADING... 100%" before transition
  setTimeout(() => {
    preloaderText.style.display = 'none';
    preloaderBarWrap.style.display = 'none';
    preloaderClick.style.display = 'flex';
  }, 350);
}

// ── Safety net: if any asset stalls, still finish after 8s ──
const safetyTimer = setTimeout(() => {
  if (!loadingDone) {
    loadProgress = 100;
    preloaderBar.style.width = '100%';
    preloaderText.textContent = 'LOADING... 100%';
    onLoadComplete();
  }
}, 8000);

// ── 1. /config fetch ─────────────────────────────────────
configReady.finally(() => addProgress(LOAD_ASSETS.config));

// ── 2. Enter video (click_to_enter.mp4) ──────────────────
// Show first frame as soon as metadata is ready
enterVideo.addEventListener('loadedmetadata', () => {
  enterVideo.currentTime = 0.01;
});

function onEnterVideoReady() {
  addProgress(LOAD_ASSETS.enterVideo);
}
if (enterVideo.readyState >= 3) {
  // Already ready in cache
  onEnterVideoReady();
} else {
  enterVideo.addEventListener('canplaythrough', onEnterVideoReady, { once: true });
  // Fallback: if 'canplaythrough' doesn't fire (e.g. no video file), count as done after metadata
  enterVideo.addEventListener('loadeddata', () => {
    if (loadProgress < LOAD_ASSETS.config + LOAD_ASSETS.enterVideo) {
      onEnterVideoReady();
    }
  }, { once: true });
}

// ── 3. Character image ───────────────────────────────────
const _charImg = document.getElementById('character');
function onCharImgReady() { addProgress(LOAD_ASSETS.characterImg); }
if (_charImg.complete && _charImg.naturalWidth > 0) {
  onCharImgReady();
} else {
  _charImg.addEventListener('load',  onCharImgReady, { once: true });
  _charImg.addEventListener('error', onCharImgReady, { once: true }); // count errors too
}

// ── 4. Logo image ────────────────────────────────────────
const _logoImg = new Image();
_logoImg.onload  = () => addProgress(LOAD_ASSETS.logoImg);
_logoImg.onerror = () => addProgress(LOAD_ASSETS.logoImg);
_logoImg.src = 'img/LOGO.png';

// ── 5. YouTube iframe (counted when it starts playing) ───
// Handled below in onYouTubeIframeAPIReady via window._ytProgressAdded flag.
// We give it up to 6s to start before we forfeit its weight via safety net.
window._ytProgressAdded = false;

// ── Click to enter ───────────────────────────────────────
preloaderClick.addEventListener('click', () => {
  preloaderClick.style.pointerEvents = 'none';
  clearTimeout(safetyTimer);

  enterVideo.play().catch(() => {
    preloader.classList.add('hidden');
    startIntroSequence();
  });
});

// Transition to main page when enter video finishes
enterVideo.addEventListener('ended', () => {
  preloader.classList.add('hidden');
  startIntroSequence();
});

function startIntroSequence() {
  // Step 1 — light fades in after 400ms
  setTimeout(() => {
    lightTarget = 1;
    rays.forEach(r => r.classList.add('lit'));
  }, 400);

  // Step 2 — character appears
  setTimeout(() => charWrap.classList.add('visible'), 1000);

  // Step 3 — text + barcode
  setTimeout(() => {
    introText.classList.add('visible');
    barcode.classList.add('visible');
    tagsRow.classList.add('visible');
  }, 1600);

  // Step 4 — scroll hint
  setTimeout(() => scrollHint.classList.add('visible'), 2600);
}

/* ════════════════════════════════════════════
   PIXEL-PERFECT CHARACTER HOVER & CLICK
════════════════════════════════════════════ */
const characterImg = document.getElementById('character');
const charHitCanvas = document.createElement('canvas');
const charHitCtx = charHitCanvas.getContext('2d', { willReadFrequently: true });
let isCharLoaded = false;

characterImg.addEventListener('load', () => {
  charHitCanvas.width = characterImg.naturalWidth;
  charHitCanvas.height = characterImg.naturalHeight;
  charHitCtx.drawImage(characterImg, 0, 0);
  isCharLoaded = true;
});
if (characterImg.complete) {
  characterImg.dispatchEvent(new Event('load'));
}

characterImg.addEventListener('mousemove', (e) => {
  if (!isCharLoaded) return;
  const rect = characterImg.getBoundingClientRect();
  
  // Calculate relative coordinates (0 to 1)
  const relX = (e.clientX - rect.left) / rect.width;
  const relY = (e.clientY - rect.top) / rect.height;
  
  // Map to natural image dimensions
  const imgX = Math.floor(relX * characterImg.naturalWidth);
  const imgY = Math.floor(relY * characterImg.naturalHeight);
  
  // Get alpha channel (index 3) of the pixel
  const pixel = charHitCtx.getImageData(imgX, imgY, 1, 1).data;
  const alpha = pixel[3];
  
  if (alpha > 0) {
    characterImg.classList.add('pixel-hover');
  } else {
    characterImg.classList.remove('pixel-hover');
  }
});

characterImg.addEventListener('mouseleave', () => {
  characterImg.classList.remove('pixel-hover');
});

characterImg.addEventListener('click', () => {
  if (characterImg.classList.contains('pixel-hover')) {
    document.getElementById('about').scrollIntoView({behavior: 'smooth'});
  }
});

/* ════════════════════════════════════════════
   SCROLL → INTRO FADE (light dims to black)
════════════════════════════════════════════ */
const introSection = document.getElementById('intro');
const introOverlay = document.getElementById('introOverlay');

function handleIntroScroll() {
  const introH = introSection.offsetHeight;
  const progress = Math.min(1, Math.max(0, window.scrollY / (introH * 0.75)));

  // Fade out the light (dark overlay)
  introOverlay.style.opacity = progress.toFixed(3);

  // Also dim canvas light via scrollFade
  scrollFade = progress;

  // Hide scroll hint once scrolled
  if (progress > 0.05) scrollHint.classList.remove('visible');
  else scrollHint.classList.add('visible');
}

/* ════════════════════════════════════════════
   SCROLL-REVEAL (Intersection Observer)
════════════════════════════════════════════ */
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.12 });
revealEls.forEach(el => revealObs.observe(el));

function checkReveal() {
  // Fallback for older browsers
  revealEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.88) el.classList.add('visible');
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
    el.textContent = cur + (target >= 10 ? '+' : '');
    if (cur >= target) clearInterval(timer);
  }, 40);
}

// Calculate exact years since June 6, 2022
const startDate = new Date('2022-06-06');
const currentDate = new Date();
const diffTime = Math.abs(currentDate - startDate);
const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
// Round to 1 decimal place (e.g. 2.8) if it's not a whole number, otherwise keep whole
const displayYears = diffYears.toFixed(1).replace(/\.0$/, '');

let projectsCount = 0; // Will be updated by loadVideos

const statsSection = document.getElementById('about');
const statsObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    animateCounter(document.getElementById('statProjects'), projectsCount || 10); // fallback if scroll is too fast
    animateCounter(document.getElementById('statYears'), parseFloat(displayYears));
    statsObs.disconnect();
  }
}, { threshold: 0.3 });
statsObs.observe(statsSection);

/* ════════════════════════════════════════════
   YOUTUBE VIDEO CATALOG
════════════════════════════════════════════ */
const videoGrid = document.getElementById('videoGrid');
const loadingEl = document.getElementById('loadingState');

/* ─────────────────────────────────────────────
   STATIC FALLBACK — Accurate catalog of recent videos.
   These show immediately if offline or network fails.
   Format: { id, title, date }
───────────────────────────────────────────── */
const STATIC_VIDEOS = [
  { id: 'k5uBiraClCY', title: 'ENDER LILIES | EP1 ( NO CUT ) | กำเนิดนักบุญตัวน้อยแห่งดอกไม้ขาว Lilies (Lily)', date: '2026-08-17' },
  { id: 'AdU297GBNvg', title: 'visuals:AZURE2026', date: '2026-07-07' },
  { id: 'rpY9ydbisP4', title: 'visuals:AZURE2026 [ Discarded ]', date: '2026-06-11' },
  { id: 'Rwc5zKMN1xM', title: 'visuals:NO_WORRIES.', date: '2026-05-31' },
  { id: 'mm-pWXxyT6k', title: 'visuals:Height.', date: '2026-05-31' },
  { id: 'N0SML3Qotaw', title: 'banner:HIRO.', date: '2026-05-31' },
  { id: 'zIEbQMFPSMs', title: 'remake:AMOS', date: '2026-03-15' },
  { id: '0eXpsDlfUII', title: 'reels:2024-2025', date: '2026-03-08' },
  { id: 'ZVTB6703DnE', title: 'HBD:amax.', date: '2026-02-02' },
  { id: 'Q-Fg1dh8s_I', title: 'HBD:sxcstyles2025.', date: '2025-08-17' },
  { id: '4gGzsHAM4mA', title: 'amv:News.', date: '2024-10-21' },
  { id: 'NiYcw0yX2VY', title: '文字PV:not_enough.', date: '2024-09-12' },
  { id: 'QpnHcE5G0ks', title: '文字PV:all_alone.', date: '2024-06-10' },
  { id: 'R3zzz9GDyfs', title: 'amv:Untitled.', date: '2024-05-13' },
  { id: 'P5uiNuZG46s', title: 'amv:Daisey.', date: '2024-02-29' },
  { id: 'XgDKkSS0aPw', title: '.', date: '2024-05-01' },
  { id: 'gNO7aiqYkSQ', title: 'visuals:busy.', date: '2024-02-01' },
  { id: 'Rc__qEAHGAU', title: 'amv:Story.', date: '2023-11-01' },
  { id: 'Taiw_SjScNY', title: 'HBD:sxcstyles', date: '2023-08-17' },
  { id: 'ot68zIJmfyY', title: 'intro:HiroNeyka.', date: '2023-05-01' },
  { id: 'r5wQP7NbVmQ', title: 'fantro:Nerumi-S', date: '2023-03-01' },
  { id: 'x8C_vZsPIFc', title: 'amv:amax&witty.', date: '2022-12-01' },
];

function mergeVideos(liveItems, catalog) {
  const seen = new Set();
  const merged = [];

  // 1. Put live items first (so any new uploads appear at the top)
  (liveItems || []).forEach(item => {
    const vid = item.id || item.videoId || extractVideoId(item.link || item.guid || '');
    if (vid && !seen.has(vid)) {
      seen.add(vid);
      merged.push({
        ...item,
        id: vid,
        link: item.link || `https://www.youtube.com/watch?v=${vid}`,
      });
    }
  });

  // 2. Append all other videos from the catalog so none are lost
  (catalog || []).forEach(item => {
    const vid = item.id || extractVideoId(item.link || '');
    if (vid && !seen.has(vid)) {
      seen.add(vid);
      merged.push({
        title: item.title,
        pubDate: item.date || item.pubDate || '',
        link: `https://www.youtube.com/watch?v=${vid}`,
        thumbnail: item.thumbnail || { url: `https://img.youtube.com/vi/${vid}/hqdefault.jpg` },
        id: vid,
      });
    }
  });

  return merged;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/) || url.match(/embed\/([^?]+)/);
  return m ? m[1] : null;
}

/* ════════════════════════════════════════════
   MODAL PLAYER CONTROLLER
════════════════════════════════════════════ */
const modalBackdrop = document.getElementById('modalBackdrop');
const modalPlayer   = document.getElementById('modalPlayer');
const modalClose    = document.getElementById('modalClose');
const modalTitle    = document.getElementById('modalTitle');
const modalDate     = document.getElementById('modalDate');
const modalYTLink   = document.getElementById('modalYTLink');

function openModal(videoId, title, date) {
  // Inject autoplay iframe
  modalPlayer.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1"
      allow="autoplay; encrypted-media; fullscreen"
      allowfullscreen
    ></iframe>
  `;
  modalTitle.textContent  = title;
  modalDate.textContent   = formatDate(date);
  modalYTLink.href        = `https://www.youtube.com/watch?v=${videoId}`;
  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Pause background music if playing
  if (typeof bgMusic !== 'undefined' && !bgMusic.paused) {
    window.wasMusicPlaying = true;
    bgMusic.pause();
    if (typeof muteBtn !== 'undefined') muteBtn.textContent = 'MUSIC: OFF';
  } else {
    window.wasMusicPlaying = false;
  }
}

function closeModal() {
  modalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  // Stop video by clearing iframe
  setTimeout(() => { modalPlayer.innerHTML = ''; }, 300);

  // Resume background music if it was playing before
  if (window.wasMusicPlaying && typeof bgMusic !== 'undefined') {
    bgMusic.play().catch(() => {});
    if (typeof muteBtn !== 'undefined') muteBtn.textContent = 'MUSIC: ON';
  }
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function createVideoCard(item, index) {
  const videoId = item.id || item.videoId || extractVideoId(item.link || item.guid || '');
  const thumb   = (typeof item.thumbnail === 'string' && item.thumbnail)
    ? item.thumbnail
    : (item.thumbnail?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
  const delay   = (index % 12) * 60;
  const card    = document.createElement('div');
  card.className = 'video-card';
  card.style.animationDelay = delay + 'ms';
  card.innerHTML = `
    <img class="video-thumb" src="${thumb}" alt="${item.title}" loading="lazy" />
    <div class="video-overlay">
      <div class="play-btn">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    <div class="video-info">
      <div class="video-idx">${String(index + 1).padStart(2, '0')}</div>
      <div class="video-title">${item.title}</div>
      <div class="video-date">${formatDate(item.pubDate)}</div>
    </div>
  `;
  card.addEventListener('click', () => openModal(videoId, item.title, item.pubDate));
  return card;
}

async function loadVideos() {
  await configReady; // ensure config values are loaded before using them
  const hasApiKey     = Boolean(YOUTUBE_API_KEY && YOUTUBE_API_KEY.length > 0);
  const targetChannel = YOUTUBE_CHANNEL_ID || 'UCuDkWnsBiTKlsecae0D11Ag';
  const targetHandle  = YOUTUBE_HANDLE || 'iaexamax';

  console.log('%c[VIDEO CATALOG]', 'color:#a78bfa;font-weight:bold',
    `Channel: ${targetChannel}`,
    '|',
    `Handle: @${targetHandle}`,
    '|',
    hasApiKey ? '🔑 API Key configured' : '📡 Auto-Sync Mode'
  );

  let items   = null;
  let method  = null;

  // ── Method 1: Local / Express Backend API (bypasses browser CORS completely) ──
  try {
    console.log('%c[VIDEO] Checking backend API /api/videos...', 'color:#60a5fa');
    const res = await fetch('/api/videos', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length) {
        items = data.items;
        method = 'Backend API (/api/videos)';
      }
    }
  } catch (e) {
    // Server endpoint not active or running statically — proceed to client methods
  }

  // ── Method 2: YouTube Data API v3 (Uploads Playlist) ──
  if (!items?.length && hasApiKey) {
    console.log('%c[VIDEO] Trying YouTube Data API v3...', 'color:#60a5fa');
    try {
      const playlistId = YOUTUBE_UPLOADS_PLAYLIST_ID || ('UU' + targetChannel.slice(2));
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=30&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length) {
          items = data.items.map(v => ({
            title: v.snippet.title,
            pubDate: v.snippet.publishedAt,
            link: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
            thumbnail: {
              url: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url
            }
          }));
          method = 'YouTube Data API v3 (Uploads Playlist)';
        }
      }
    } catch (err) {
      console.warn('[VIDEO] YouTube Data API request failed:', err.message);
    }
  }

  // ── Method 3: Official YouTube RSS Feed via rss2json ──
  if (!items?.length && targetChannel) {
    console.log('%c[VIDEO] Fetching latest videos from YouTube RSS feed (rss2json)...', 'color:#60a5fa');
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetChannel}`;
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&t=${Date.now()}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const raw = await res.json();
        if (raw?.status === 'ok' && raw.items?.length) {
          items = raw.items.map(item => ({
            title: item.title,
            pubDate: item.pubDate,
            link: item.link,
            thumbnail: {
              url: (typeof item.thumbnail === 'string' && item.thumbnail)
                ? item.thumbnail
                : (item.enclosure?.thumbnail || `https://img.youtube.com/vi/${extractVideoId(item.link)}/hqdefault.jpg`)
            }
          }));
          method = 'Live YouTube RSS Feed (rss2json)';
        }
      }
    } catch (err) {
      console.warn('[VIDEO] rss2json proxy failed:', err.message);
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
      console.log(`%c[VIDEO] Trying XML proxy ${i + 1}/${xmlProxies.length}...`, 'color:#60a5fa');
      try {
        const res = await fetch(xmlProxies[i], { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const xml = await res.text();
          if (xml && xml.includes('<entry>')) {
            const parser = new DOMParser();
            const doc    = parser.parseFromString(xml, 'application/xml');
            const parsed = Array.from(doc.querySelectorAll('entry')).map(e => {
              const vid = e.querySelector('videoId')?.textContent || e.querySelector('id')?.textContent?.split(':').pop();
              return {
                title:     e.querySelector('title')?.textContent || '',
                pubDate:   e.querySelector('published')?.textContent || '',
                link:      `https://www.youtube.com/watch?v=${vid}`,
                thumbnail: { url: e.querySelector('thumbnail')?.getAttribute('url') || `https://img.youtube.com/vi/${vid}/hqdefault.jpg` },
              };
            });
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

  // ── Render Videos (Merged Live + Archive) ──
  const finalVideos = mergeVideos(items, STATIC_VIDEOS);
  console.log(`%c[VIDEO] ✅ Displaying ${finalVideos.length} videos (Live: ${items ? items.length : 0} via ${method || 'Archive'})`, 'color:#34d399;font-weight:bold');

  loadingEl.remove();
  projectsCount = finalVideos.length;
  const statEl = document.getElementById('statProjects');
  if (statEl && statEl.textContent !== '0') animateCounter(statEl, projectsCount);
  videoGrid.innerHTML = '';
  finalVideos.forEach((item, i) => videoGrid.appendChild(createVideoCard(item, i)));
}




// Trigger load when Work section scrolls into view
const workSection = document.getElementById('work');
let videosLoaded = false;
const workObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !videosLoaded) {
    videosLoaded = true;
    loadVideos();
  }
}, { threshold: 0.05 });
workObs.observe(workSection);

/* ════════════════════════════════════════════
   PLAYLIST & MUSIC LOGIC
════════════════════════════════════════════ */
const bgMusic = document.getElementById('bgMusic');
bgMusic.volume = 0.3; // Set default volume to 30%
const muteBtn = document.getElementById('muteBtn');
const marqueeWrap = document.getElementById('songMarqueeWrap');
const songNameDisplay = document.getElementById('songNameDisplay');

// 1. Define your playlist here (path to file, display name)
const PLAYLIST = [
  { name: 'AZALI - letter to future you', path: 'audio/letter to future you.mp3' },
  { name: 'AZALI - new horizons', path: 'audio/new horizons.mp3'},
  {name: 'AZALI - of flowers to bloom', path: 'audio/of flowers to bloom.mp3'},
  {name: 'AZALI - Something You Don\'t Want to Hear', path: 'audio/Something_You_Dont_Want_to_Hear.mp3'},
  {name: 'AZALI - to you, at the end of the world', path: 'audio/to you, at the end.mp3'},
  // { name: 'Another Great Track', path: 'audio/song2.mp3' },
];

let playQueue = [];
let currentTrack = null;
let isMusicInitialized = false;

function shufflePlaylist() {
  // Create a copy of the playlist and shuffle it
  playQueue = [...PLAYLIST].sort(() => Math.random() - 0.5);
}

function playNextSong() {
  if (PLAYLIST.length === 0) {
    console.log('Playlist is empty.');
    return;
  }
  
  if (playQueue.length === 0) {
    shufflePlaylist(); // Refill the queue once all songs have played
  }
  
  currentTrack = playQueue.pop();
  bgMusic.src = currentTrack.path;
  
  // Update UI
  songNameDisplay.textContent = 'NOW PLAYING: ' + currentTrack.name;
  marqueeWrap.style.display = 'block'; // Show the marquee row
  
  bgMusic.play().catch(() => {
    console.log('Audio playback failed or was blocked by browser.');
  });
}

// When a song finishes, automatically play the next one
bgMusic.addEventListener('ended', playNextSong);

muteBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent the document click listener below from instantly overriding this
  
  if (PLAYLIST.length === 0) {
    console.log('No songs in playlist to play.');
    return;
  }

  if (!isMusicInitialized) {
    // First time clicking play (if autoplay was completely blocked)
    isMusicInitialized = true;
    playNextSong();
    muteBtn.textContent = 'MUSIC: ON';
  } else if (bgMusic.paused) {
    // Resume current track
    bgMusic.play();
    muteBtn.textContent = 'MUSIC: ON';
  } else {
    // Pause current track
    bgMusic.pause();
    muteBtn.textContent = 'MUSIC: OFF';
  }
});

// We don't try to play immediately on load anymore to avoid the annoying browser console error.
// Instead, we wait for ANY first interaction with the page (click, scroll, or keydown)
let hasUserInteracted = false;

function startMusicOnInteraction() {
  if (hasUserInteracted || PLAYLIST.length === 0) return;
  hasUserInteracted = true;
  
  if (!isMusicInitialized) {
    isMusicInitialized = true;
    playNextSong();
    muteBtn.textContent = 'MUSIC: ON';
  } else if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
    muteBtn.textContent = 'MUSIC: ON';
  }
}

// Listen to common first-interactions
document.addEventListener('click', startMusicOnInteraction, { once: true });
document.addEventListener('scroll', startMusicOnInteraction, { once: true, passive: true });
document.addEventListener('keydown', startMusicOnInteraction, { once: true });