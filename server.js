require("dotenv").config();
const express = require("express");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const fs = require("fs");

const { getSystemHWID, verifyHWID } = require("./hwid");
const {
  getCatalog,
  getClients,
  saveCatalogAndCommit,
  saveClientsAndCommit,
  getAvailableImages,
  saveUploadedImage,
  pushToRemote,
  getGitStatus,
  fetchVideoMetadata,
  extractVideoId,
} = require("./catalog-manager");

const app = express();
const PORT = process.env.PORT || 3000;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCuDkWnsBiTKlsecae0D11Ag";
const HANDLE = process.env.YOUTUBE_HANDLE || "iaexamax";
const UPLOADS_PLAYLIST_ID =
  process.env.YOUTUBE_UPLOADS_PLAYLIST_ID || "UUuDkWnsBiTKlsecae0D11Ag";
const API_KEY = process.env.YOUTUBE_API_KEY || "";
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const ALLOWED_HWID = process.env.ALLOWED_HWID || "";

// In-memory active auth sessions: Map<token, { createdAt, clientFingerprint, ip }>
const activeSessions = new Map();

// Rate limiter for login: Map<ip, { attempts, lockUntil }>
const failedLoginAttempts = new Map();

// Parse JSON request bodies
app.use(express.json({ limit: "2mb" }));

// Security middleware: Protect sensitive dotfiles (.env, .git)
app.use((req, res, next) => {
  const normalized = req.path.toLowerCase();
  if (
    normalized.startsWith("/.git") ||
    normalized.startsWith("/.env") ||
    normalized.startsWith("/.vscode")
  ) {
    return res.status(403).json({ error: "Access denied to protected files" });
  }
  next();
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Route for backend admin console
app.get(["/admin", "/admin.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Expose public config to the frontend
app.get("/config", (req, res) => {
  res.json({
    YOUTUBE_HANDLE: process.env.YOUTUBE_HANDLE || HANDLE,
    YOUTUBE_CHANNEL_ID: process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID,
    YOUTUBE_UPLOADS_PLAYLIST_ID:
      process.env.YOUTUBE_UPLOADS_PLAYLIST_ID || UPLOADS_PLAYLIST_ID,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || API_KEY,
  });
});

// ══════════════════════════════════════════════════════════════
// SECURITY & AUTHENTICATION MIDDLEWARE
// ══════════════════════════════════════════════════════════════
function requireAdminAuth(req, res, next) {
  // 1. Verify Server Hardware ID
  const hwCheck = verifyHWID(ALLOWED_HWID);
  if (!hwCheck.allowed) {
    console.warn(
      `[SECURITY ALERT] HWID verification failed: Detected ${hwCheck.currentHwid}, Allowed ${ALLOWED_HWID}`,
    );
    return res.status(403).json({
      error: "HARDWARE_UNAUTHORIZED",
      message: `Console locked: Server is running on unauthorized hardware (${hwCheck.currentHwid}).`,
    });
  }

  // 2. Verify Session Token
  const token = req.headers["x-admin-token"] || req.query.token;
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Admin authentication required. Please login.",
    });
  }

  const session = activeSessions.get(token);
  // Session expires after 24 hours
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return res.status(401).json({
      error: "SESSION_EXPIRED",
      message: "Session has expired. Please log in again.",
    });
  }

  req.adminSession = session;
  next();
}

// ══════════════════════════════════════════════════════════════
// ADMIN AUTHENTICATION ENDPOINTS
// ══════════════════════════════════════════════════════════════

// Auth status & hardware diagnostics
app.get("/api/admin/auth/status", (req, res) => {
  const hwCheck = verifyHWID(ALLOWED_HWID);
  const token = req.headers["x-admin-token"] || req.query.token;
  const isAuthenticated = token && activeSessions.has(token);

  res.json({
    authenticated: Boolean(isAuthenticated),
    hwidValid: hwCheck.allowed,
    hwidReason: hwCheck.reason,
    currentHwid: hwCheck.currentHwid,
    allowedHwid: ALLOWED_HWID,
    systemInfo: hwCheck.systemInfo,
    git: getGitStatus(),
  });
});

// Login endpoint
app.post("/api/admin/auth/login", (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || "127.0.0.1";
  const now = Date.now();

  const { adminKey, clientFingerprint } = req.body || {};

  // Rate limiting check: Brute-force protection against invalid passwords
  const attempts = failedLoginAttempts.get(clientIp);
  if (attempts && attempts.lockUntil > now) {
    if (adminKey && ADMIN_KEY && adminKey === ADMIN_KEY) {
      // Correct password supplied by legitimate admin: clear lockout
      failedLoginAttempts.delete(clientIp);
    } else {
      const remainingSecs = Math.ceil((attempts.lockUntil - now) / 1000);
      return res.status(429).json({
        error: "RATE_LIMITED",
        message: `Too many failed attempts. Try again in ${remainingSecs} seconds.`,
      });
    }
  }

  // 1. Hardware ID Check
  const hwCheck = verifyHWID(ALLOWED_HWID);
  if (!hwCheck.allowed) {
    return res.status(403).json({
      error: "HARDWARE_UNAUTHORIZED",
      message: `Access denied: Server is running on unauthorized hardware (${hwCheck.currentHwid}).`,
    });
  }

  // 2. Admin Key Check (requires non-empty ADMIN_KEY in .env)
  if (!ADMIN_KEY || !adminKey || adminKey !== ADMIN_KEY) {
    const current = failedLoginAttempts.get(clientIp) || {
      attempts: 0,
      lockUntil: 0,
    };
    current.attempts += 1;
    if (current.attempts >= 5) {
      current.lockUntil = now + 10 * 60 * 1000; // 10 min lock
    }
    failedLoginAttempts.set(clientIp, current);

    return res.status(401).json({
      error: "INVALID_CREDENTIALS",
      message: "Incorrect Admin Access Key.",
    });
  }

  // Success: Clear failed attempts
  failedLoginAttempts.delete(clientIp);

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, {
    createdAt: now,
    clientFingerprint: clientFingerprint || "unknown",
    ip: clientIp,
  });

  res.json({
    success: true,
    token,
    currentHwid: hwCheck.currentHwid,
    systemInfo: hwCheck.systemInfo,
  });
});

// Logout endpoint
app.post("/api/admin/auth/logout", (req, res) => {
  const token = req.headers["x-admin-token"] || req.query.token;
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// ══════════════════════════════════════════════════════════════
// ADMIN CATALOG & GIT API (PROTECTED)
// ══════════════════════════════════════════════════════════════

// Get current catalog and git status
app.get("/api/admin/catalog", requireAdminAuth, (req, res) => {
  const catalog = getCatalog();
  const git = getGitStatus();
  res.json({
    catalog,
    gitStatus: git,
  });
});

// Save catalog and trigger automated Git Commit
app.post("/api/admin/catalog/save", requireAdminAuth, (req, res) => {
  const { items, commitMessage, push } = req.body || {};

  if (!Array.isArray(items)) {
    return res
      .status(400)
      .json({ error: "Invalid catalog format. Must be an array." });
  }

  try {
    const result = saveCatalogAndCommit(items, {
      commitMessage,
      push: Boolean(push),
    });

    // Invalidate local in-memory video cache
    videoCache.items = null;
    videoCache.timestamp = 0;

    res.json(result);
  } catch (err) {
    console.error("[CATALOG SAVE ERROR]", err);
    res.status(500).json({ error: "SAVE_FAILED", message: err.message });
  }
});

// Get all client collections (personal, aihara, hironeyka), images, and git status
app.get("/api/admin/clients", requireAdminAuth, (req, res) => {
  const clients = getClients();
  const images = getAvailableImages();
  const git = getGitStatus();
  res.json({
    clients,
    images,
    gitStatus: git,
  });
});

// Save client collections and trigger automated Git Commit
app.post("/api/admin/clients/save", requireAdminAuth, (req, res) => {
  const { clients, commitMessage, push } = req.body || {};

  if (!clients || typeof clients !== "object") {
    return res
      .status(400)
      .json({ error: "Invalid clients format. Must be an object." });
  }

  try {
    const result = saveClientsAndCommit(clients, {
      commitMessage,
      push: Boolean(push),
    });

    // Invalidate local in-memory video cache
    videoCache.items = null;
    videoCache.timestamp = 0;

    res.json(result);
  } catch (err) {
    console.error("[CLIENTS SAVE ERROR]", err);
    res.status(500).json({ error: "SAVE_FAILED", message: err.message });
  }
});

// List available client images
app.get("/api/admin/images", requireAdminAuth, (req, res) => {
  res.json({ images: getAvailableImages() });
});

// Upload image for a client
app.post("/api/admin/upload-image", requireAdminAuth, (req, res) => {
  const { clientKey, fileName, fileData } = req.body || {};
  if (!clientKey || !fileName || !fileData) {
    return res
      .status(400)
      .json({ error: "Missing clientKey, fileName, or fileData" });
  }

  try {
    const relativePath = saveUploadedImage(clientKey, fileName, fileData);
    res.json({
      success: true,
      path: relativePath,
      images: getAvailableImages(),
    });
  } catch (err) {
    console.error("[IMAGE UPLOAD ERROR]", err);
    res.status(500).json({ error: "UPLOAD_FAILED", message: err.message });
  }
});

// Push to remote repository (main)
app.post("/api/admin/git/push", requireAdminAuth, (req, res) => {
  const result = pushToRemote();
  res.json(result);
});

// Get Git repository status
app.get("/api/admin/git/status", requireAdminAuth, (req, res) => {
  res.json(getGitStatus());
});

// Fetch single video metadata from YouTube
app.get("/api/admin/youtube/video-info", requireAdminAuth, async (req, res) => {
  const query = req.query.url || req.query.id;
  if (!query) {
    return res.status(400).json({ error: "Missing video url or id parameter" });
  }

  try {
    const meta = await fetchVideoMetadata(query);
    res.json(meta);
  } catch (err) {
    res.status(500).json({ error: "METADATA_FAILED", message: err.message });
  }
});

// Scan YouTube Channel for new uploads not in catalog
app.get("/api/admin/youtube/channel-sync", requireAdminAuth, (req, res) => {
  const currentCatalog = getCatalog();
  const catalogIds = new Set(currentCatalog.map((item) => item.id));
  const apiKey = process.env.YOUTUBE_API_KEY || API_KEY || "";
  const playlistId =
    process.env.YOUTUBE_UPLOADS_PLAYLIST_ID || UPLOADS_PLAYLIST_ID;

  function processUploads(uploads) {
    const newVideos = uploads.filter((v) => !catalogIds.has(v.id));
    res.json({
      totalChannelVideos: uploads.length,
      inCatalogCount: currentCatalog.length,
      newVideosCount: newVideos.length,
      newVideos,
    });
  }

  if (apiKey) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    https
      .get(
        apiUrl,
        { headers: { Referer: "https://amaxskywithsunshine.github.io/" } },
        (apiRes) => {
          if (apiRes.statusCode === 200) {
            let data = "";
            apiRes.on("data", (chunk) => (data += chunk));
            apiRes.on("end", () => {
              try {
                const json = JSON.parse(data);
                const items = (json.items || []).map((v) => ({
                  id: v.snippet.resourceId.videoId,
                  title: decodeHtmlEntities(v.snippet.title),
                  pubDate: v.snippet.publishedAt,
                  thumbnail:
                    v.snippet.thumbnails?.high?.url ||
                    v.snippet.thumbnails?.default?.url ||
                    `https://img.youtube.com/vi/${v.snippet.resourceId.videoId}/hqdefault.jpg`,
                }));
                return processUploads(items);
              } catch (e) {}
              fetchFromRSSFallback();
            });
          } else {
            fetchFromRSSFallback();
          }
        },
      )
      .on("error", () => fetchFromRSSFallback());
  } else {
    fetchFromRSSFallback();
  }

  function fetchFromRSSFallback() {
    const targetChannelId = process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID;
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetChannelId}`;
    https
      .get(rssUrl, (ytRes) => {
        if (ytRes.statusCode !== 200) {
          return processUploads([]);
        }
        let xml = "";
        ytRes.on("data", (chunk) => (xml += chunk));
        ytRes.on("end", () => {
          try {
            const entries = xml.split("<entry>").slice(1);
            const liveItems = entries
              .map((entry) => {
                const idMatch = entry.match(
                  /<yt:videoId>([^<]+)<\/yt:videoId>/,
                );
                const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
                const pubMatch = entry.match(/<published>([^<]+)<\/published>/);
                const vid = idMatch ? idMatch[1] : "";
                return {
                  id: vid,
                  title: decodeHtmlEntities(titleMatch ? titleMatch[1] : ""),
                  pubDate: pubMatch ? pubMatch[1] : "",
                  thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
                };
              })
              .filter((item) => item.id.length === 11);
            processUploads(liveItems);
          } catch (e) {
            processUploads([]);
          }
        });
      })
      .on("error", () => processUploads([]));
  }
});

// ══════════════════════════════════════════════════════════════
// PUBLIC VIDEO FEED WITH LIVE CATALOG FALLBACK
// ══════════════════════════════════════════════════════════════

// In-memory cache for fetched YouTube videos
let videoCache = {
  items: null,
  timestamp: 0,
};

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function mergeWithLiveCatalog(liveList) {
  const seen = new Set();
  const result = [];
  const catalogList = getCatalog();

  (liveList || []).forEach((item) => {
    const vid = item.link ? item.link.split("v=").pop() : item.id || "";
    if (vid && !seen.has(vid)) {
      seen.add(vid);
      result.push(item);
    }
  });

  catalogList.forEach((item) => {
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

// Fetch user's videos dynamically from YouTube (API or RSS feed)
app.get("/api/videos", (req, res) => {
  const now = Date.now();
  if (videoCache.items && now - videoCache.timestamp < 10 * 60 * 1000) {
    return res.json({ status: "ok", source: "cache", items: videoCache.items });
  }

  const apiKey = process.env.YOUTUBE_API_KEY || API_KEY || "";
  const playlistId =
    process.env.YOUTUBE_UPLOADS_PLAYLIST_ID || UPLOADS_PLAYLIST_ID;

  if (apiKey) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

    const apiReq = https.get(
      apiUrl,
      {
        headers: { Referer: "https://amaxskywithsunshine.github.io/" },
      },
      (apiRes) => {
        if (apiRes.statusCode === 200) {
          let data = "";
          apiRes.on("data", (chunk) => (data += chunk));
          apiRes.on("end", () => {
            try {
              const json = JSON.parse(data);
              const items = (json.items || []).map((v) => ({
                title: decodeHtmlEntities(v.snippet.title),
                pubDate: v.snippet.publishedAt,
                link: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
                thumbnail: {
                  url:
                    v.snippet.thumbnails?.maxres?.url ||
                    v.snippet.thumbnails?.high?.url ||
                    v.snippet.thumbnails?.default?.url,
                },
              }));
              if (items.length > 0) {
                const merged = mergeWithLiveCatalog(items);
                videoCache.items = merged;
                videoCache.timestamp = now;
                return res.json({
                  status: "ok",
                  source: "youtube_api_merged",
                  items: merged,
                });
              }
            } catch (e) {}
            fetchFromRSS();
          });
        } else {
          fetchFromRSS();
        }
      },
    );

    apiReq.on("error", () => fetchFromRSS());
  } else {
    fetchFromRSS();
  }

  function fetchFromRSS() {
    const targetChannelId = process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID;
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetChannelId}`;

    https
      .get(rssUrl, (ytRes) => {
        if (ytRes.statusCode !== 200) {
          if (videoCache.items) {
            return res.json({
              status: "ok",
              source: "stale_cache",
              items: videoCache.items,
            });
          }
          return res.json({
            status: "ok",
            source: "catalog_fallback",
            items: mergeWithLiveCatalog([]),
          });
        }

        let xml = "";
        ytRes.on("data", (chunk) => (xml += chunk));
        ytRes.on("end", () => {
          try {
            const entries = xml.split("<entry>").slice(1);
            const liveItems = entries
              .map((entry) => {
                const idMatch = entry.match(
                  /<yt:videoId>([^<]+)<\/yt:videoId>/,
                );
                const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
                const pubMatch = entry.match(/<published>([^<]+)<\/published>/);
                const vid = idMatch ? idMatch[1] : "";
                const rawTitle = titleMatch ? titleMatch[1] : "";

                return {
                  title: decodeHtmlEntities(rawTitle),
                  pubDate: pubMatch ? pubMatch[1] : "",
                  link: `https://www.youtube.com/watch?v=${vid}`,
                  thumbnail: {
                    url: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
                  },
                };
              })
              .filter((item) => item.link.length > 28);

            const merged = mergeWithLiveCatalog(liveItems);

            if (merged.length > 0) {
              videoCache.items = merged;
              videoCache.timestamp = now;
            }

            res.json({
              status: "ok",
              source: "youtube_rss_merged",
              items: merged,
            });
          } catch (err) {
            if (videoCache.items)
              return res.json({
                status: "ok",
                source: "stale_cache",
                items: videoCache.items,
              });
            res.json({
              status: "ok",
              source: "catalog_fallback",
              items: mergeWithLiveCatalog([]),
            });
          }
        });
      })
      .on("error", () => {
        if (videoCache.items)
          return res.json({
            status: "ok",
            source: "stale_cache",
            items: videoCache.items,
          });
        res.json({
          status: "ok",
          source: "catalog_fallback",
          items: mergeWithLiveCatalog([]),
        });
      });
  }
});

// For any other route, serve the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

function openBrowser(url) {
  try {
    const cmd =
      process.platform === "win32" ? `start "" "${url}"` : `open "${url}"`;
    require("child_process").exec(cmd);
  } catch (e) {}
}

function printBanner(port) {
  const hw = getSystemHWID();
  const hwCheck = verifyHWID(ALLOWED_HWID);
  const statusStr = hwCheck.allowed ? "VERIFIED HOST" : "HWID MISMATCH";

  console.log("");
  console.log("  ╔═══════════════════════════════════════════════════════════╗");
  console.log("  ║             AMAX PORTFOLIO & CATALOG CONSOLE              ║");
  console.log("  ╚═══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`  ➜  Local:     http://localhost:${port}/`);
  console.log(`  ➜  Admin:     http://localhost:${port}/admin`);
  console.log(`  ➜  Hardware:  ${hw.hwid} [${statusStr}]`);
  console.log(`  ➜  Host:      ${hw.hostname} (${hw.platform} ${hw.arch})`);
  console.log("");
  console.log("  Press Ctrl+C to stop the server\n");

  if (process.argv.includes("--admin")) {
    console.log(`  Opening Admin Console in browser: http://localhost:${port}/admin\n`);
    openBrowser(`http://localhost:${port}/admin`);
  }
}

const server = app.listen(PORT, () => {
  printBanner(PORT);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`\n  ⚠️  Port ${PORT} is already in use by an active server!\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Admin:   http://localhost:${PORT}/admin\n`);
    console.log(`  The server is already running and ready in your browser.\n`);
    if (process.argv.includes("--admin")) {
      openBrowser(`http://localhost:${PORT}/admin`);
    }
  } else {
    console.error("Server error:", err);
  }
});

