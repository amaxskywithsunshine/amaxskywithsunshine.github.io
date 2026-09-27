/**
 * Catalog Manager & Git Workflow Automation
 * Manages video catalog updates, synchronization across files, and automated git commits.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const CATALOG_PATH = path.join(__dirname, "catalog.json");
const SCRIPT_PATH = path.join(__dirname, "script.js");
const INDEX_PATH = path.join(__dirname, "index.html");

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

function getGitStatus() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
    const lastCommit = execSync("git log -n 1 --format=\"%h - %s (%cr)\"", { encoding: "utf8" }).trim();
    const recentCommits = execSync("git log -n 5 --format=\"%h|%s|%cr|%an\"", { encoding: "utf8" })
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

function syncScriptJs(catalogItems) {
  const original = fs.readFileSync(SCRIPT_PATH, "utf8");
  const regex = /(let|const)\s+CATALOG_VIDEOS\s*=\s*\[[\s\S]*?\];/;

  if (!regex.test(original)) {
    throw new Error("Could not find CATALOG_VIDEOS array in script.js");
  }

  const jsonStr = JSON.stringify(catalogItems, null, 2);
  const replacement = `let CATALOG_VIDEOS = ${jsonStr};`;
  const updated = original.replace(regex, replacement);

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

function syncIndexHtml(count) {
  if (!fs.existsSync(INDEX_PATH)) return;
  let html = fs.readFileSync(INDEX_PATH, "utf8");

  // Update personalWorksCount and clientWorkCount
  html = html.replace(
    /(<span class="client-box-count" id="personalWorksCount">)[^<]*(<\/span>)/g,
    `$1${count} WORKS$2`
  );
  html = html.replace(
    /(<span class="client-stat-badge" id="clientWorkCount">)[^<]*(<\/span>)/g,
    `$1${count} WORKS$2`
  );

  fs.writeFileSync(INDEX_PATH, html, "utf8");
}

function saveCatalogAndCommit(catalogItems, options = {}) {
  if (!Array.isArray(catalogItems)) {
    throw new Error("Catalog items must be an array");
  }

  // Sanitize and validate items
  const cleanItems = catalogItems.map((item, idx) => {
    const id = extractVideoId(item.id || item.videoId || item.link);
    if (!id) {
      throw new Error(`Item at position #${idx + 1} is missing a valid YouTube Video ID`);
    }
    const title = (item.title || "").trim();
    if (!title) {
      throw new Error(`Item at position #${idx + 1} (${id}) is missing a title`);
    }
    let pubDate = item.pubDate;
    if (!pubDate || isNaN(new Date(pubDate).getTime())) {
      pubDate = new Date().toISOString();
    }

    return {
      id,
      title,
      pubDate: typeof pubDate === "string" ? pubDate : new Date(pubDate).toISOString(),
    };
  });

  // 1. Write catalog.json
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(cleanItems, null, 2) + "\n", "utf8");

  // 2. Synchronize script.js
  syncScriptJs(cleanItems);

  // 3. Synchronize index.html
  syncIndexHtml(cleanItems.length);

  // 4. Git commit procedure following GEMINI.md
  let commitResult = {
    committed: false,
    commitHash: null,
    message: "",
    pushed: false,
    pushOutput: "",
  };

  try {
    // Stage modified files
    execSync('git add "catalog.json" "script.js" "index.html"', {
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
          : `feat(catalog): update portfolio catalog (${cleanItems.length} works)`;

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
    totalItems: cleanItems.length,
    items: cleanItems,
    commit: commitResult,
    gitStatus: getGitStatus(),
  };
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

// Fetch metadata for a YouTube video
function fetchVideoMetadata(videoIdOrUrl) {
  const vid = extractVideoId(videoIdOrUrl);
  if (!vid) {
    return Promise.reject(new Error("Invalid YouTube video ID or URL"));
  }

  const apiKey = process.env.YOUTUBE_API_KEY || "";

  return new Promise((resolve) => {
    // Attempt 1: YouTube Data API v3 if API key is present
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
        // Fallback default
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
  saveCatalogAndCommit,
  pushToRemote,
  getGitStatus,
  fetchVideoMetadata,
};
