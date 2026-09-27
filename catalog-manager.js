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
const SCRIPT_PATH = path.join(__dirname, "script.js");
const INDEX_PATH = path.join(__dirname, "index.html");
const CLIENT_IMAGES_DIR = path.join(__dirname, "img", "clients");

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

  const ext = path.extname(originalName) || ".png";
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  const fileName = `${base}_${Date.now().toString(36)}${ext}`;
  const filePath = path.join(targetDir, fileName);

  const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
  fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));

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

function syncIndexHtmlCounts(counts = {}) {
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

  // 4. Synchronize index.html counts
  syncIndexHtmlCounts(counts);

  // 5. Git commit procedure following GEMINI.md
  let commitResult = {
    committed: false,
    commitHash: null,
    message: "",
    pushed: false,
    pushOutput: "",
  };

  try {
    // Stage modified files & any added images
    execSync('git add "clients.json" "catalog.json" "script.js" "index.html" "img/clients"', {
      cwd: __dirname,
      encoding: "utf8",
    });

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

module.exports = {
  extractVideoId,
  getCatalog,
  getClients,
  getAvailableImages,
  saveUploadedImage,
  saveClientsAndCommit,
  saveCatalogAndCommit,
  pushToRemote,
  getGitStatus,
  fetchVideoMetadata,
};
