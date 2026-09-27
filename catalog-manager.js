/**
 * Catalog Manager & Git Workflow Automation
 * Manages video and image catalogs for all clients, synchronization across files, and automated git commits.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const CATALOG_PATH = path.join(__dirname, "catalog.json");
const CLIENTS_PATH = path.join(__dirname, "clients.json");
const PROFILE_PATH = path.join(__dirname, "site-profile.json");
const SCRIPT_PATH = path.join(__dirname, "script.js");
const INDEX_PATH = path.join(__dirname, "index.html");
const CLIENT_IMAGES_DIR = path.join(__dirname, "img", "clients");
const CLIENT_VIDEOS_DIR = path.join(__dirname, "video", "clients");
const IMG_DIR = path.join(__dirname, "img");
const CONTACTS_PATH = path.join(__dirname, "contacts.json");
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB GitHub limit

function extractVideoId(urlOrId) {
  if (!urlOrId) return "";
  const str = String(urlOrId).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const m =
    str.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    str.match(/embed\/([a-zA-Z0-9_-]{11})/) ||
    str.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : str;
}

function getCatalog() {
  try {
    if (fs.existsSync(CATALOG_PATH)) {
      const raw = fs.readFileSync(CATALOG_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[CATALOG] Error reading catalog.json:", err.message);
  }
  return [];
}

function getClients() {
  try {
    if (fs.existsSync(CLIENTS_PATH)) {
      const raw = fs.readFileSync(CLIENTS_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[CLIENTS] Error reading clients.json:", err.message);
  }
  return {};
}

function getAvailableImages() {
  const images = [];
  if (!fs.existsSync(CLIENT_IMAGES_DIR)) return images;

  function scan(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        scan(path.join(dir, ent.name), rel);
      } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(ent.name)) {
        images.push(`img/clients/${rel}`);
      }
    }
  }

  scan(CLIENT_IMAGES_DIR, "");
  return images;
}

function saveUploadedImage(clientKey, originalName, base64Data) {
  const sanitizedClient = (clientKey || "general").replace(/[^a-zA-Z0-9_-]/g, "");
  const targetDir = path.join(CLIENT_IMAGES_DIR, sanitizedClient);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9._-]+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Image file size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 20MB.`
    );
  }

  const ext = path.extname(originalName) || ".png";
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  const fileName = `${base}_${Date.now().toString(36)}${ext}`;
  const filePath = path.join(targetDir, fileName);

  fs.writeFileSync(filePath, buffer);
  return `img/clients/${sanitizedClient}/${fileName}`;
}

function saveUploadedVideo(clientKey, originalName, base64Data) {
  const sanitizedClient = (clientKey || "general").replace(/[^a-zA-Z0-9_-]/g, "");
  const targetDir = path.join(CLIENT_VIDEOS_DIR, sanitizedClient);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cleanBase64 = base64Data.replace(/^data:video\/[a-zA-Z0-9._-]+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Video file size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 20MB.`
    );
  }

  const ext = path.extname(originalName) || ".mp4";
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  const fileName = `${base}_${Date.now().toString(36)}${ext}`;
  const filePath = path.join(targetDir, fileName);

  fs.writeFileSync(filePath, buffer);
  return `video/clients/${sanitizedClient}/${fileName}`;
}

function saveUploadedClientAvatar(clientKey, originalName, base64Data) {
  const sanitizedClient = (clientKey || "general").replace(/[^a-zA-Z0-9_-]/g, "");
  const targetDir = path.join(CLIENT_IMAGES_DIR, sanitizedClient);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9._-]+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Avatar image size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 20MB.`
    );
  }

  const ext = path.extname(originalName) || ".png";
  const fileName = `avatar_${Date.now().toString(36)}${ext}`;
  const filePath = path.join(targetDir, fileName);

  fs.writeFileSync(filePath, buffer);
  return `img/clients/${sanitizedClient}/${fileName}`;
}

function saveUploadedCatalogCover(clientKey, originalName, base64Data) {
  const sanitizedClient = (clientKey || "general").replace(/[^a-zA-Z0-9_-]/g, "");
  const targetDir = path.join(CLIENT_IMAGES_DIR, sanitizedClient);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9._-]+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Catalog cover size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 20MB.`
    );
  }

  const ext = path.extname(originalName) || ".jpg";
  const fileName = `cover_${Date.now().toString(36)}${ext}`;
  const filePath = path.join(targetDir, fileName);

  fs.writeFileSync(filePath, buffer);
  return `img/clients/${sanitizedClient}/${fileName}`;
}

function getGitStatus() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
    const lastCommit = execSync('git log -n 1 --format="%h - %s (%cr)"', { encoding: "utf8" }).trim();
    const recentCommits = execSync('git log -n 5 --format="%h|%s|%cr|%an"', { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, subject, relativeDate, author] = line.split("|");
        return { hash, subject, relativeDate, author };
      });
    const porcelain = execSync("git status --porcelain", { encoding: "utf8" }).trim();
    const isClean = porcelain.length === 0;

    return {
      branch,
      lastCommit,
      recentCommits,
      isClean,
      changes: porcelain ? porcelain.split("\n").filter(Boolean) : [],
    };
  } catch (err) {
    return {
      branch: "unknown",
      lastCommit: "",
      recentCommits: [],
      isClean: false,
      error: err.message,
    };
  }
}

function syncScriptJs(catalogVideos, clientsData) {
  const original = fs.readFileSync(SCRIPT_PATH, "utf8");
  let updated = original;

  // 1. Update CATALOG_VIDEOS if provided
  if (catalogVideos) {
    const catRegex = /(let|const)\s+CATALOG_VIDEOS\s*=\s*\[[\s\S]*?\];/;
    if (catRegex.test(updated)) {
      const jsonStr = JSON.stringify(catalogVideos, null, 2);
      updated = updated.replace(catRegex, `let CATALOG_VIDEOS = ${jsonStr};`);
    }
  }

  // 2. Update CLIENT_COLLECTIONS if provided
  if (clientsData) {
    const clientRegex = /(let|const)\s+CLIENT_COLLECTIONS\s*=\s*\{[\s\S]*?\n\};/;
    if (clientRegex.test(updated)) {
      const clientJsonStr = JSON.stringify(clientsData, null, 2);
      updated = updated.replace(clientRegex, `let CLIENT_COLLECTIONS = ${clientJsonStr};`);
    }
  }

  fs.writeFileSync(SCRIPT_PATH, updated, "utf8");

  // Validate script.js syntax
  try {
    execSync(`node --check "${SCRIPT_PATH}"`, { encoding: "utf8" });
  } catch (syntaxErr) {
    // Revert immediately if syntax check fails
    fs.writeFileSync(SCRIPT_PATH, original, "utf8");
    throw new Error(`script.js syntax check failed: ${syntaxErr.message}. Reverted changes.`);
  }
}

function syncIndexHtmlCounts(counts = {}, clientsData = {}) {
  if (!fs.existsSync(INDEX_PATH)) return;
  let html = fs.readFileSync(INDEX_PATH, "utf8");

  if (typeof counts.personal === "number") {
    html = html.replace(
      /(<span class="client-box-count" id="personalWorksCount">)[^<]*(<\/span>)/g,
      `$1${counts.personal} WORKS$2`
    );
    html = html.replace(
      /(<span class="client-stat-badge" id="clientWorkCount">)[^<]*(<\/span>)/g,
      `$1${counts.personal} WORKS$2`
    );
  }

  if (typeof counts.aihara === "number") {
    html = html.replace(
      /(<span class="client-box-count" id="aiharaWorksCount">)[^<]*(<\/span>)/g,
      `$1${counts.aihara} WORKS$2`
    );
  }

  if (typeof counts.hironeyka === "number") {
    html = html.replace(
      /(<span class="client-box-count" id="hiroWorksCount">)[^<]*(<\/span>)/g,
      `$1${counts.hironeyka} WORKS$2`
    );
  }

  // Update client preview images if present in clientsData
  for (const [key, client] of Object.entries(clientsData)) {
    if (client && client.previewImg) {
      const regex = new RegExp(
        `(<button[^>]*data-client=["']${key}["'][\\s\\S]*?<img src=["'])[^"']+(["'][^>]*class=["']client-box-img["'])`,
        "i"
      );
      html = html.replace(regex, `$1${client.previewImg}$2`);
    }
  }

  fs.writeFileSync(INDEX_PATH, html, "utf8");
}

function saveClientsAndCommit(clientsData, options = {}) {
  if (!clientsData || typeof clientsData !== "object") {
    throw new Error("Invalid clients data format. Must be an object.");
  }

  // Sanitize and validate works in each client
  const counts = {};
  for (const [key, client] of Object.entries(clientsData)) {
    if (!Array.isArray(client.works)) {
      client.works = [];
    }
    counts[key] = client.works.length;
    const clientImgDir = path.join(CLIENT_IMAGES_DIR, key);
    if (!fs.existsSync(clientImgDir)) {
      try {
        fs.mkdirSync(clientImgDir, { recursive: true });
      } catch (e) {}
    }
    const clientVideoDir = path.join(CLIENT_VIDEOS_DIR, key);
    if (!fs.existsSync(clientVideoDir)) {
      try {
        fs.mkdirSync(clientVideoDir, { recursive: true });
      } catch (e) {}
    }
  }

  // 1. Write clients.json
  fs.writeFileSync(CLIENTS_PATH, JSON.stringify(clientsData, null, 2) + "\n", "utf8");

  // 2. Also keep catalog.json in sync with personal video works
  let personalVideos = [];
  if (clientsData.personal && Array.isArray(clientsData.personal.works)) {
    personalVideos = clientsData.personal.works
      .filter((w) => w.videoId || w.id)
      .map((w) => ({
        id: extractVideoId(w.id || w.videoId),
        title: (w.title || "").trim(),
        pubDate: w.pubDate || new Date().toISOString(),
      }));
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(personalVideos, null, 2) + "\n", "utf8");
  }

  // 3. Synchronize script.js
  syncScriptJs(personalVideos.length > 0 ? personalVideos : null, clientsData);

  // 4. Synchronize index.html counts and client previews
  syncIndexHtmlCounts(counts, clientsData);

  // 5. Git commit procedure following GEMINI.md
  let commitResult = {
    committed: false,
    commitHash: null,
    message: "",
    pushed: false,
    pushOutput: "",
  };

  try {
    // Stage modified files & any added images and videos
    execSync(
      'git add "clients.json" "catalog.json" "script.js" "index.html" "img/clients" "video/clients" "video"',
      {
        cwd: __dirname,
        encoding: "utf8",
      }
    );

    // Validate that the combined size of all staged files does not exceed 20MB limit
    const stagedOutput = execSync("git diff --cached --name-only", {
      cwd: __dirname,
      encoding: "utf8",
    }).trim();
    const stagedFiles = stagedOutput ? stagedOutput.split("\n").filter(Boolean) : [];
    let totalStagedBytes = 0;
    for (const rel of stagedFiles) {
      const full = path.join(__dirname, rel.trim());
      if (fs.existsSync(full)) {
        totalStagedBytes += fs.statSync(full).size;
      }
    }

    if (totalStagedBytes > MAX_FILE_SIZE) {
      execSync("git reset", { cwd: __dirname, encoding: "utf8" });
      throw new Error(
        `Total combined size of files to commit (${(totalStagedBytes / 1024 / 1024).toFixed(2)} MB) exceeds 20MB limit. Please reduce file sizes or commit large media files separately.`
      );
    }

    const statusOutput = execSync("git status --porcelain", {
      cwd: __dirname,
      encoding: "utf8",
    }).trim();

    if (statusOutput.length > 0) {
      const commitMsg =
        options.commitMessage && options.commitMessage.trim().length > 0
          ? options.commitMessage.trim()
          : `feat(catalog): update client collections and works`;

      // Git commit
      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
        cwd: __dirname,
        encoding: "utf8",
      });

      const hash = execSync("git rev-parse --short HEAD", {
        cwd: __dirname,
        encoding: "utf8",
      }).trim();

      commitResult.committed = true;
      commitResult.commitHash = hash;
      commitResult.message = commitMsg;

      // Optional Git push
      const shouldPush = options.push === true || process.env.AUTO_GIT_PUSH === "true";
      if (shouldPush) {
        try {
          const pushOut = execSync("git push origin main", {
            cwd: __dirname,
            encoding: "utf8",
            timeout: 25000,
          });
          commitResult.pushed = true;
          commitResult.pushOutput = pushOut.trim() || "Pushed successfully to origin main.";
        } catch (pushErr) {
          commitResult.pushed = false;
          commitResult.pushOutput = `Push warning: ${pushErr.message}. Commit was saved locally.`;
        }
      }
    } else {
      commitResult.message = "No changes detected. Working tree already clean.";
    }
  } catch (gitErr) {
    console.error("[GIT] Commit error:", gitErr.message);
    commitResult.error = gitErr.message;
  }

  return {
    success: true,
    clients: clientsData,
    commit: commitResult,
    gitStatus: getGitStatus(),
  };
}

function saveCatalogAndCommit(catalogItems, options = {}) {
  const currentClients = getClients();
  if (currentClients.personal) {
    currentClients.personal.works = catalogItems.map((item) => ({
      id: extractVideoId(item.id),
      title: item.title,
      pubDate: item.pubDate,
      category: item.category || "Motion Graphic",
      type: "video",
      videoId: extractVideoId(item.id),
      src: `https://img.youtube.com/vi/${extractVideoId(item.id)}/hqdefault.jpg`,
    }));
    return saveClientsAndCommit(currentClients, options);
  }

  // Fallback if clients.json not initialized
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalogItems, null, 2) + "\n", "utf8");
  syncScriptJs(catalogItems, null);
  syncIndexHtmlCounts({ personal: catalogItems.length });
  return { success: true };
}

function pushToRemote() {
  try {
    const out = execSync("git push origin main", {
      cwd: __dirname,
      encoding: "utf8",
      timeout: 30000,
    });
    return {
      success: true,
      output: out.trim() || "Everything up-to-date with origin/main.",
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      output: (err.stdout || "") + "\n" + (err.stderr || ""),
    };
  }
}

function fetchVideoMetadata(videoIdOrUrl) {
  const vid = extractVideoId(videoIdOrUrl);
  if (!vid) {
    return Promise.reject(new Error("Invalid YouTube video ID or URL"));
  }

  const apiKey = process.env.YOUTUBE_API_KEY || "";

  return new Promise((resolve) => {
    if (apiKey) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${vid}&key=${apiKey}`;
      https
        .get(url, (res) => {
          if (res.statusCode === 200) {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                const json = JSON.parse(data);
                const item = json.items?.[0];
                if (item) {
                  return resolve({
                    id: vid,
                    title: item.snippet.title,
                    pubDate: item.snippet.publishedAt,
                    thumbnail:
                      item.snippet.thumbnails?.maxres?.url ||
                      item.snippet.thumbnails?.high?.url ||
                      `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
                    source: "youtube_api",
                  });
                }
              } catch (e) {}
              fallbackOEmbed(vid, resolve);
            });
          } else {
            fallbackOEmbed(vid, resolve);
          }
        })
        .on("error", () => fallbackOEmbed(vid, resolve));
    } else {
      fallbackOEmbed(vid, resolve);
    }
  });
}

function fallbackOEmbed(vid, resolve) {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`;
  https
    .get(oEmbedUrl, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            return resolve({
              id: vid,
              title: json.title || `Video ${vid}`,
              pubDate: new Date().toISOString(),
              thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
              source: "youtube_oembed",
            });
          }
        } catch (e) {}
        resolve({
          id: vid,
          title: `Video ${vid}`,
          pubDate: new Date().toISOString(),
          thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          source: "default_fallback",
        });
      });
    })
    .on("error", () => {
      resolve({
        id: vid,
        title: `Video ${vid}`,
        pubDate: new Date().toISOString(),
        thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        source: "default_fallback",
      });
    });
}

function getProfile() {
  try {
    if (fs.existsSync(PROFILE_PATH)) {
      const raw = fs.readFileSync(PROFILE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[PROFILE] Error reading site-profile.json:", err.message);
  }
  return {
    aboutAvatar: "img/about_avatar.jpg",
    aboutOverview: "",
    aboutBackground: "",
    mainLinks: [],
  };
}

function saveUploadedAvatar(originalName, base64Data) {
  const fileName = "about_avatar.jpg";
  const filePath = path.join(IMG_DIR, fileName);

  const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
  fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));

  return `img/${fileName}`;
}

function getAllWorks() {
  const clients = getClients();
  const allWorks = [];

  for (const [key, client] of Object.entries(clients)) {
    const works = client.works || [];
    works.forEach((w, idx) => {
      const isVideo = w.type === "video" || Boolean(w.videoId);
      const vid = extractVideoId(w.videoId || w.id);
      allWorks.push({
        id: w.id || vid || `${key}_${idx}`,
        title: w.title || "Untitled Work",
        type: isVideo ? "video" : "image",
        category: w.category || (isVideo ? "Motion Graphic" : "Artwork"),
        pubDate: w.pubDate || "",
        videoId: vid || "",
        src: w.src || (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : ""),
        clientKey: key,
        clientName: client.name || key,
        clientStatus: client.status || "online",
        clientAvatar: client.avatar || key[0].toUpperCase(),
      });
    });
  }

  allWorks.sort((a, b) => {
    if (a.pubDate && b.pubDate) {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    }
    return 0;
  });

  return allWorks;
}

// ── CONTACT INBOX MANAGER ──
function getContacts() {
  try {
    if (fs.existsSync(CONTACTS_PATH)) {
      const raw = fs.readFileSync(CONTACTS_PATH, "utf8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      }
    }
  } catch (err) {
    console.error("[CONTACTS] Error reading contacts.json:", err.message);
  }
  return [];
}

function saveContactMessage(data) {
  const list = getContacts();
  const item = {
    id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    name: (data.name || "Anonymous").trim(),
    email: (data.email || "").trim(),
    inquiry: (data.inquiry || data.message || "").trim(),
    date: data.timestamp || new Date().toISOString(),
    read: false,
  };
  list.unshift(item);
  fs.writeFileSync(CONTACTS_PATH, JSON.stringify(list, null, 2) + "\n", "utf8");
  return item;
}

function toggleContactRead(id, isRead) {
  const list = getContacts();
  const found = list.find((c) => c.id === id);
  if (found) {
    found.read = isRead !== undefined ? Boolean(isRead) : !found.read;
    fs.writeFileSync(CONTACTS_PATH, JSON.stringify(list, null, 2) + "\n", "utf8");
    return found;
  }
  return null;
}

function deleteContactMessage(id) {
  let list = getContacts();
  list = list.filter((c) => c.id !== id);
  fs.writeFileSync(CONTACTS_PATH, JSON.stringify(list, null, 2) + "\n", "utf8");
  return true;
}

// ── ABOUT SECTION & MULTILINGUAL SYNC ──
function saveAboutAndCommit(aboutData, options = {}) {
  if (!aboutData || typeof aboutData !== "object") {
    throw new Error("Invalid about data format.");
  }

  // 1. Update site-profile.json
  const profile = getProfile();
  const avatarPath = aboutData.aboutAvatar || aboutData.avatar;
  if (avatarPath) profile.aboutAvatar = avatarPath;
  if (aboutData.workStatus) profile.workStatus = aboutData.workStatus;
  if (!profile.about) profile.about = { overview: {}, background: {} };
  if (!profile.about.overview) profile.about.overview = {};
  if (!profile.about.background) profile.about.background = {};

  const langs = ["en", "th", "jp", "cn"];
  langs.forEach((lang) => {
    if (aboutData.overview && aboutData.overview[lang] !== undefined) {
      profile.about.overview[lang] = aboutData.overview[lang];
    }
    if (aboutData.background && aboutData.background[lang] !== undefined) {
      profile.about.background[lang] = aboutData.background[lang];
    }
  });

  if (aboutData.overview && aboutData.overview.en) {
    profile.aboutOverview = aboutData.overview.en;
  }
  if (aboutData.background && aboutData.background.en) {
    profile.aboutBackground = aboutData.background.en;
  }

  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2) + "\n", "utf8");

  // 2. Sync script.js I18N_DATA
  if (fs.existsSync(SCRIPT_PATH)) {
    let script = fs.readFileSync(SCRIPT_PATH, "utf8");

    langs.forEach((lang) => {
      const ov = aboutData.overview ? aboutData.overview[lang] : null;
      const bg = aboutData.background ? aboutData.background[lang] : null;

      if (ov) {
        const regexOv = new RegExp(`(\\b${lang}:\\s*\\{[\\s\\S]*?aboutOverview:\\s*\`)[\\s\\S]*?(\`,)`);
        if (regexOv.test(script)) {
          const safeOv = ov.replace(/`/g, "\\`").replace(/\$/g, "\\$");
          script = script.replace(regexOv, `$1${safeOv}$2`);
        }
      }
      if (bg) {
        const regexBg = new RegExp(`(\\b${lang}:\\s*\\{[\\s\\S]*?aboutBackground:\\s*\`)[\\s\\S]*?(\`,)`);
        if (regexBg.test(script)) {
          const safeBg = bg.replace(/`/g, "\\`").replace(/\$/g, "\\$");
          script = script.replace(regexBg, `$1${safeBg}$2`);
        }
      }
    });

    fs.writeFileSync(SCRIPT_PATH, script, "utf8");
    try {
      execSync(`node --check "${SCRIPT_PATH}"`, { encoding: "utf8" });
    } catch (syntaxErr) {
      console.error("[ABOUT] script.js syntax error after sync:", syntaxErr.message);
    }
  }

  // 3. Sync index.html fallback & widgets
  if (fs.existsSync(INDEX_PATH)) {
    let html = fs.readFileSync(INDEX_PATH, "utf8");

    // Avatar image
    if (avatarPath) {
      html = html.replace(
        /(<img src=")[^"]*(" alt="amax" class="about-full-img" id="aboutAvatarImg"[^>]*>)/,
        `$1${avatarPath}$2`
      );
    }

    // Work status dot
    if (aboutData.workStatus) {
      const isAvailable = aboutData.workStatus !== "unavailable";
      const dotClass = isAvailable ? "status-dot green" : "status-dot";
      const dotTitle = isAvailable ? "Available for Work" : "Currently Unavailable";
      html = html.replace(
        /<div class="status-dot[^"]*" id="workStatusDot"[^>]*><\/div>/,
        `<div class="${dotClass}" id="workStatusDot" title="${dotTitle}"></div>`
      );
    }

    // Overview fallback text (EN)
    if (aboutData.overview && aboutData.overview.en) {
      html = html.replace(
        /(<div class="about-pane active" id="paneOverview"[^>]*>[\s\S]*?<p class="about-desc">)[\s\S]*?(<\/p>)/,
        `$1\n              ${aboutData.overview.en}\n            $2`
      );
    }

    // Background fallback text (EN)
    if (aboutData.background && aboutData.background.en) {
      html = html.replace(
        /(<div class="about-pane" id="paneBackground"[^>]*>[\s\S]*?<p class="about-desc">)[\s\S]*?(<\/p>)/,
        `$1\n              ${aboutData.background.en}\n            $2`
      );
    }

    fs.writeFileSync(INDEX_PATH, html, "utf8");
  }

  // 4. Git commit with 20MB check
  let commitResult = {
    committed: false,
    commitHash: null,
    message: "",
    pushed: false,
    pushOutput: "",
  };

  try {
    execSync('git add "site-profile.json" "index.html" "script.js" "img/about_avatar.jpg"', {
      cwd: __dirname,
      encoding: "utf8",
    });

    const stagedOutput = execSync("git diff --cached --name-only", {
      cwd: __dirname,
      encoding: "utf8",
    }).trim();

    if (stagedOutput.length > 0) {
      const stagedFiles = stagedOutput.split(/\r?\n/).filter(Boolean);
      let totalStagedBytes = 0;
      for (const relFile of stagedFiles) {
        const fullP = path.join(__dirname, relFile);
        if (fs.existsSync(fullP)) {
          totalStagedBytes += fs.statSync(fullP).size;
        }
      }

      if (totalStagedBytes > MAX_FILE_SIZE) {
        execSync("git reset", { cwd: __dirname, encoding: "utf8" });
        throw new Error(
          `Total staged files size (${(totalStagedBytes / 1024 / 1024).toFixed(2)} MB) exceeds GitHub 20MB commit limit.`
        );
      }

      const commitMsg =
        options.commitMessage && options.commitMessage.trim().length > 0
          ? options.commitMessage.trim()
          : "docs(about): update about overview, background copy across EN, TH, JP, CN, avatar and work status";

      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
        cwd: __dirname,
        encoding: "utf8",
      });

      const hash = execSync("git rev-parse --short HEAD", {
        cwd: __dirname,
        encoding: "utf8",
      }).trim();

      commitResult.committed = true;
      commitResult.commitHash = hash;
      commitResult.message = commitMsg;
    }

    if (options.push) {
      const pushRes = pushToRemote();
      commitResult.pushed = pushRes.success;
      commitResult.pushOutput = pushRes.output || pushRes.error;
    }
  } catch (gitErr) {
    console.error("[ABOUT GIT COMMIT ERROR]", gitErr.message);
    commitResult.error = gitErr.message;
  }

  return {
    success: true,
    profile,
    commit: commitResult,
    gitStatus: getGitStatus(),
  };
}

// ── SOCIAL MEDIA LINKS SYNC ──
function saveSocialLinksAndCommit(links, options = {}) {
  if (!Array.isArray(links)) {
    throw new Error("Invalid social links data format. Must be an array.");
  }

  // 1. Update site-profile.json
  const profile = getProfile();
  profile.mainLinks = links;
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2) + "\n", "utf8");

  // 2. Sync index.html
  if (fs.existsSync(INDEX_PATH)) {
    let html = fs.readFileSync(INDEX_PATH, "utf8");

    // Home bottom social
    const homeHtml = links
      .map((l) => {
        if (l.isDiscord || (l.platform && l.platform.toLowerCase().includes("discord"))) {
          const handle = l.url || l.label || "amax.the_skywithsunshine.";
          return `        <button type="button" class="home-social-link discord-btn" id="homeLinkDiscord" aria-label="Discord: ${handle}" title="Discord: ${handle} (click to copy)" data-discord="${handle}">\n          <img src="${l.icon || 'img/icons/Platform=Discord, Color=Negative.png'}" alt="Discord" class="home-social-icon" draggable="false" />\n          <span class="discord-tooltip" id="homeDiscordTooltip">Copied!</span>\n        </button>`;
        }
        return `        <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="home-social-link" title="${l.platform}" aria-label="${l.platform}">\n          <img src="${l.icon}" alt="${l.platform}" class="home-social-icon" draggable="false" />\n        </a>`;
      })
      .join("\n");

    html = html.replace(
      /(<div class="home-bottom-social" id="homeBottomSocial">)[\s\S]*?(<\/div>\s*<div class="home-bottom-center">)/,
      `$1\n${homeHtml}\n      $2`
    );

    // Contact social links
    const contactHtml = links
      .map((l) => {
        if (l.isDiscord || (l.platform && l.platform.toLowerCase().includes("discord"))) {
          const handle = l.url || l.label || "amax.the_skywithsunshine.";
          return `          <button type="button" class="contact-link discord-btn" id="linkDiscord" aria-label="Discord: ${handle}" title="Discord: ${handle} (click to copy)" data-discord="${handle}">\n            <img src="${l.icon || 'img/icons/Platform=Discord, Color=Negative.png'}" alt="Discord" class="contact-icon-img" />\n            <span class="discord-tooltip" id="discordTooltip">Copied!</span>\n          </button>`;
        }
        return `          <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="contact-link" aria-label="${l.platform}" title="${l.platform}">\n            <img src="${l.icon}" alt="${l.platform}" class="contact-icon-img" />\n          </a>`;
      })
      .join("\n");

    html = html.replace(
      /(<div class="contact-links">)[\s\S]*?(<\/div>\s*<div class="contact-copyright)/,
      `$1\n${contactHtml}\n        $2`
    );

    fs.writeFileSync(INDEX_PATH, html, "utf8");
  }

  // 3. Commit
  let commitResult = {
    committed: false,
    commitHash: null,
    message: "",
    pushed: false,
    pushOutput: "",
  };

  try {
    execSync('git add "site-profile.json" "index.html"', {
      cwd: __dirname,
      encoding: "utf8",
    });

    const stagedOutput = execSync("git diff --cached --name-only", {
      cwd: __dirname,
      encoding: "utf8",
    }).trim();

    if (stagedOutput.length > 0) {
      const commitMsg =
        options.commitMessage && options.commitMessage.trim().length > 0
          ? options.commitMessage.trim()
          : "feat(social): update main and contact social links";

      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
        cwd: __dirname,
        encoding: "utf8",
      });

      const hash = execSync("git rev-parse --short HEAD", {
        cwd: __dirname,
        encoding: "utf8",
      }).trim();

      commitResult.committed = true;
      commitResult.commitHash = hash;
      commitResult.message = commitMsg;
    }

    if (options.push) {
      const pushRes = pushToRemote();
      commitResult.pushed = pushRes.success;
      commitResult.pushOutput = pushRes.output || pushRes.error;
    }
  } catch (gitErr) {
    console.error("[SOCIAL GIT COMMIT ERROR]", gitErr.message);
    commitResult.error = gitErr.message;
  }

  return {
    success: true,
    links,
    commit: commitResult,
    gitStatus: getGitStatus(),
  };
}

function saveProfileAndCommit(profileData, options = {}) {
  return saveAboutAndCommit(profileData, options);
}

module.exports = {
  extractVideoId,
  getCatalog,
  getClients,
  getProfile,
  getAllWorks,
  getAvailableImages,
  saveUploadedImage,
  saveUploadedVideo,
  saveUploadedAvatar,
  saveUploadedClientAvatar,
  saveUploadedCatalogCover,
  saveClientsAndCommit,
  saveCatalogAndCommit,
  saveProfileAndCommit,
  saveAboutAndCommit,
  saveSocialLinksAndCommit,
  getContacts,
  saveContactMessage,
  toggleContactRead,
  deleteContactMessage,
  pushToRemote,
  getGitStatus,
  fetchVideoMetadata,
  MAX_FILE_SIZE,
};
