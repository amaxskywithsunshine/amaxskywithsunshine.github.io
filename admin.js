/**
 * AMAX CATALOG & HARDWARE SECURITY CONSOLE — CONTROLLER
 */

(function () {
  "use strict";

  // ── STATE ──
  let state = {
    token: localStorage.getItem("amax_admin_token") || "",
    authenticated: false,
    serverHwid: "",
    allowedHwid: "",
    hwidValid: false,
    clientFingerprint: "",
    systemInfo: null,
    catalog: [],
    originalCatalog: [],
    filterQuery: "",
    hasUnsavedChanges: false,
    discoveredYtVideos: [],
  };

  // ── DOM ELEMENTS ──
  const authView = document.getElementById("authView");
  const dashboardView = document.getElementById("dashboardView");

  // Auth elements
  const loginForm = document.getElementById("loginForm");
  const adminKeyInput = document.getElementById("adminKeyInput");
  const btnTogglePw = document.getElementById("btnTogglePw");
  const btnLogin = document.getElementById("btnLogin");
  const loginErrorMsg = document.getElementById("loginErrorMsg");
  const diagHwid = document.getElementById("diagHwid");
  const diagHost = document.getElementById("diagHost");
  const diagStatusBadge = document.getElementById("diagStatusBadge");
  const diagStatusText = document.getElementById("diagStatusText");
  const diagClientFp = document.getElementById("diagClientFp");
  const hwMismatchAlert = document.getElementById("hwMismatchAlert");
  const hwMismatchDesc = document.getElementById("hwMismatchDesc");
  const staticServerAlert = document.getElementById("staticServerAlert");

  // Dashboard Nav & Stats
  const navHwidBadge = document.getElementById("navHwidBadge");
  const navHwidText = document.getElementById("navHwidText");
  const navBranchBadge = document.getElementById("navBranchBadge");
  const statTotalVideos = document.getElementById("statTotalVideos");
  const statGitState = document.getElementById("statGitState");
  const statLastCommit = document.getElementById("statLastCommit");
  const statYtStatus = document.getElementById("statYtStatus");
  const statHwidShort = document.getElementById("statHwidShort");
  const statHostLabel = document.getElementById("statHostLabel");

  // Action Banners & Toolbar
  const changesBanner = document.getElementById("changesBanner");
  const changesBannerText = document.getElementById("changesBannerText");
  const btnRevertChanges = document.getElementById("btnRevertChanges");
  const btnQuickCommit = document.getElementById("btnQuickCommit");
  const ytScanBanner = document.getElementById("ytScanBanner");
  const ytScanList = document.getElementById("ytScanList");
  const btnAddAllYtVideos = document.getElementById("btnAddAllYtVideos");
  const btnDismissYtBanner = document.getElementById("btnDismissYtBanner");

  const catalogSearch = document.getElementById("catalogSearch");
  const btnClearSearch = document.getElementById("btnClearSearch");
  const btnScanChannel = document.getElementById("btnScanChannel");
  const btnPushRemote = document.getElementById("btnPushRemote");
  const btnOpenAddModal = document.getElementById("btnOpenAddModal");
  const btnSaveAndCommit = document.getElementById("btnSaveAndCommit");
  const catalogContainer = document.getElementById("catalogContainer");
  const emptyState = document.getElementById("emptyState");

  // Modals & Drawers
  const videoModalBackdrop = document.getElementById("videoModalBackdrop");
  const videoModalTitle = document.getElementById("videoModalTitle");
  const btnCloseVideoModal = document.getElementById("btnCloseVideoModal");
  const videoForm = document.getElementById("videoForm");
  const videoEditIndex = document.getElementById("videoEditIndex");
  const inputVideoUrl = document.getElementById("inputVideoUrl");
  const btnFetchMeta = document.getElementById("btnFetchMeta");
  const inputVideoTitle = document.getElementById("inputVideoTitle");
  const inputVideoDate = document.getElementById("inputVideoDate");
  const catPreviewBadge = document.getElementById("catPreviewBadge");
  const previewThumb = document.getElementById("previewThumb");
  const previewBadge = document.getElementById("previewBadge");
  const previewTitle = document.getElementById("previewTitle");
  const previewDate = document.getElementById("previewDate");
  const btnCancelVideo = document.getElementById("btnCancelVideo");

  const commitModalBackdrop = document.getElementById("commitModalBackdrop");
  const btnCloseCommitModal = document.getElementById("btnCloseCommitModal");
  const summaryTotal = document.getElementById("summaryTotal");
  const commitMessageInput = document.getElementById("commitMessageInput");
  const checkPushRemote = document.getElementById("checkPushRemote");
  const commitTerminalBox = document.getElementById("commitTerminalBox");
  const commitTerminalOutput = document.getElementById("commitTerminalOutput");
  const btnCancelCommit = document.getElementById("btnCancelCommit");
  const btnExecuteCommit = document.getElementById("btnExecuteCommit");

  const gitDrawerBackdrop = document.getElementById("gitDrawerBackdrop");
  const btnCloseGitDrawer = document.getElementById("btnCloseGitDrawer");
  const btnGitHistory = document.getElementById("btnGitHistory");
  const drawerBranch = document.getElementById("drawerBranch");
  const drawerStatusText = document.getElementById("drawerStatusText");
  const drawerLatestCommit = document.getElementById("drawerLatestCommit");
  const btnDrawerPush = document.getElementById("btnDrawerPush");
  const commitHistoryList = document.getElementById("commitHistoryList");

  const secDrawerBackdrop = document.getElementById("secDrawerBackdrop");
  const btnCloseSecDrawer = document.getElementById("btnCloseSecDrawer");
  const btnSecDashboard = document.getElementById("btnSecDashboard");
  const secServerHwid = document.getElementById("secServerHwid");
  const secHostname = document.getElementById("secHostname");
  const secMac = document.getElementById("secMac");
  const secCpu = document.getElementById("secCpu");
  const secOs = document.getElementById("secOs");
  const secClientFp = document.getElementById("secClientFp");
  const secAllowedHwid = document.getElementById("secAllowedHwid");

  const playerModalBackdrop = document.getElementById("playerModalBackdrop");
  const playerModalTitle = document.getElementById("playerModalTitle");
  const btnClosePlayerModal = document.getElementById("btnClosePlayerModal");
  const playerIframeWrap = document.getElementById("playerIframeWrap");

  const btnLogout = document.getElementById("btnLogout");

  // ── HELPERS & UTILITIES ──
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function extractVideoId(urlOrId) {
    if (!urlOrId) return "";
    const str = String(urlOrId).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const m =
      str.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
      str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
      str.match(/embed\/([a-zA-Z0-9_-]{11})/) ||
      str.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : str;
  }

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

  function getCategoryClass(cat) {
    if (cat.includes("Typography")) return "cat-typography";
    if (cat.includes("Visual")) return "cat-visuals";
    if (cat.includes("Anime") || cat.includes("AMV")) return "cat-amv";
    if (cat.includes("Intro")) return "cat-intro";
    return "";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "--";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return dateStr;
    }
  }

  // ── CLIENT DEVICE FINGERPRINTING ──
  async function computeClientFingerprint() {
    try {
      const parts = [
        navigator.userAgent || "",
        navigator.language || "",
        navigator.hardwareConcurrency || "",
        screen.width + "x" + screen.height + "x" + screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      ];
      // Canvas fingerprint
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("amax:hwid:client", 2, 15);
        parts.push(canvas.toDataURL().slice(-50));
      } catch (e) {}

      const text = parts.join("::");
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      return `DEV-${hashHex.substring(0, 4)}-${hashHex.substring(4, 8)}-${hashHex.substring(8, 12)}`;
    } catch (e) {
      return "DEV-BROWSER-GENERIC";
    }
  }

  // ── API REQUEST WRAPPER ──
  async function apiRequest(endpoint, options = {}) {
    const headers = options.headers || {};
    if (state.token) {
      headers["x-admin-token"] = state.token;
    }
    headers["x-client-fingerprint"] = state.clientFingerprint;
    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    options.headers = headers;

    try {
      const res = await fetch(endpoint, options);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && data.message) || `HTTP ${res.status}: ${res.statusText}`);
      }
      return data;
    } catch (err) {
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        throw new Error("Cannot connect to server. Ensure 'node server.js' is running locally.");
      }
      throw err;
    }
  }

  // ── INITIALIZATION ──
  async function init() {
    state.clientFingerprint = await computeClientFingerprint();
    if (diagClientFp) diagClientFp.textContent = state.clientFingerprint;

    // Password toggle
    btnTogglePw.addEventListener("click", () => {
      adminKeyInput.type = adminKeyInput.type === "password" ? "text" : "password";
      btnTogglePw.textContent = adminKeyInput.type === "password" ? "👁️" : "🙈";
    });

    // Login Form Submit
    loginForm.addEventListener("submit", handleLogin);

    // Logout
    btnLogout.addEventListener("click", handleLogout);

    // Check Auth Status & Hardware
    await checkAuthStatus();
  }

  async function checkAuthStatus() {
    try {
      const data = await apiRequest("/api/admin/auth/status");
      state.serverHwid = data.currentHwid || "";
      state.allowedHwid = data.allowedHwid || "";
      state.hwidValid = data.hwidValid === true;
      state.systemInfo = data.systemInfo || {};

      updateHardwareUI(data);

      if (data.authenticated && state.hwidValid) {
        enterDashboard();
      } else {
        exitDashboard();
      }
    } catch (err) {
      // Backend not running
      if (staticServerAlert) staticServerAlert.style.display = "block";
      if (diagStatusBadge) {
        diagStatusBadge.className = "hw-status-badge mismatch";
        diagStatusText.textContent = "SERVER OFFLINE";
      }
      if (diagHwid) diagHwid.textContent = "OFFLINE (RUN 'node server.js')";
    }
  }

  function updateHardwareUI(data) {
    if (diagHwid) diagHwid.textContent = data.currentHwid || "UNKNOWN";
    if (diagHost) diagHost.textContent = `${data.systemInfo?.hostname || "Local"} (${data.systemInfo?.platform || "OS"})`;

    if (data.hwidValid) {
      diagStatusBadge.className = "hw-status-badge verified";
      diagStatusText.textContent = "HARDWARE VERIFIED";
      hwMismatchAlert.style.display = "none";

      if (navHwidText) {
        navHwidText.textContent = `HWID VERIFIED : ${data.currentHwid.slice(-9)}`;
      }
      if (statHwidShort) statHwidShort.textContent = "HWID-OK";
      if (statHostLabel) statHostLabel.textContent = `HOST: ${data.systemInfo?.hostname || "iTxAmax"}`;
    } else {
      diagStatusBadge.className = "hw-status-badge mismatch";
      diagStatusText.textContent = "HARDWARE MISMATCH";
      hwMismatchAlert.style.display = "block";
      hwMismatchDesc.innerHTML = `
        Server HWID: <strong>${data.currentHwid}</strong><br>
        Allowed HWID: <strong>${data.allowedHwid || "NONE (Configure .env)"}</strong>
      `;
      if (navHwidText) {
        navHwidText.textContent = "HARDWARE LOCKED";
        navHwidBadge.className = "navbar-status-pill mismatch";
      }
      if (statHwidShort) statHwidShort.textContent = "HWID-LOCK";
    }

    // Security Drawer details
    if (secServerHwid) secServerHwid.textContent = data.currentHwid || "--";
    if (secHostname) secHostname.textContent = data.systemInfo?.hostname || "--";
    if (secMac) secMac.textContent = data.systemInfo?.primaryMac || "--";
    if (secCpu) secCpu.textContent = data.systemInfo?.cpuModel || "--";
    if (secOs) secOs.textContent = `${data.systemInfo?.platform} ${data.systemInfo?.arch}`;
    if (secClientFp) secClientFp.textContent = state.clientFingerprint;
    if (secAllowedHwid) secAllowedHwid.textContent = data.allowedHwid || "--";
  }

  // ── AUTHENTICATION ──
  async function handleLogin(e) {
    e.preventDefault();
    loginErrorMsg.textContent = "";
    const key = adminKeyInput.value.trim();
    if (!key) return;

    btnLogin.disabled = true;
    btnLogin.querySelector(".btn-text").textContent = "VERIFYING CREDENTIALS & HWID...";

    try {
      const res = await apiRequest("/api/admin/auth/login", {
        method: "POST",
        body: {
          adminKey: key,
          clientFingerprint: state.clientFingerprint,
        },
      });

      if (res.success && res.token) {
        state.token = res.token;
        state.authenticated = true;
        localStorage.setItem("amax_admin_token", res.token);
        adminKeyInput.value = "";
        showToast("Authentication successful. Hardware verified.", "success");
        enterDashboard();
      }
    } catch (err) {
      loginErrorMsg.textContent = err.message || "Invalid Admin Key or Hardware Mismatch";
      showToast(err.message, "error");
    } finally {
      btnLogin.disabled = false;
      btnLogin.querySelector(".btn-text").textContent = "AUTHENTICATE & ENTER CONSOLE";
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/api/admin/auth/logout", { method: "POST" });
    } catch (e) {}
    state.token = "";
    state.authenticated = false;
    localStorage.removeItem("amax_admin_token");
    exitDashboard();
    showToast("Console locked. Session ended.", "info");
  }

  function enterDashboard() {
    authView.style.display = "none";
    dashboardView.style.display = "flex";
    loadCatalog();
  }

  function exitDashboard() {
    dashboardView.style.display = "none";
    authView.style.display = "flex";
  }

  // ── CATALOG LOADING & RENDERING ──
  async function loadCatalog() {
    try {
      const data = await apiRequest("/api/admin/catalog");
      state.catalog = Array.isArray(data.catalog) ? data.catalog : [];
      state.originalCatalog = JSON.parse(JSON.stringify(state.catalog));
      state.hasUnsavedChanges = false;
      updateChangesBanner();

      if (data.gitStatus) {
        updateGitStatusUI(data.gitStatus);
      }

      renderCatalog();
    } catch (err) {
      showToast(`Error loading catalog: ${err.message}`, "error");
    }
  }

  function updateGitStatusUI(git) {
    if (navBranchBadge) navBranchBadge.textContent = git.branch || "main";
    if (drawerBranch) drawerBranch.textContent = git.branch || "main";

    if (git.isClean) {
      statGitState.textContent = "CLEAN";
      statGitState.className = "stat-value stat-git";
      drawerStatusText.textContent = "Working tree clean";
    } else {
      statGitState.textContent = "MODIFIED";
      statGitState.className = "stat-value stat-git pending";
      drawerStatusText.textContent = `${git.changes?.length || 1} uncommitted file(s)`;
    }

    if (git.lastCommit) {
      statLastCommit.textContent = `HEAD: ${git.lastCommit.slice(0, 30)}`;
      drawerLatestCommit.textContent = git.lastCommit;
    }

    if (commitHistoryList && git.recentCommits) {
      commitHistoryList.innerHTML = git.recentCommits
        .map(
          (c) => `
        <div class="commit-item">
          <div class="commit-item-top">
            <span class="commit-hash">${c.hash}</span>
            <span class="commit-time">${c.relativeDate}</span>
          </div>
          <div class="commit-subject">${c.subject}</div>
        </div>
      `
        )
        .join("");
    }
  }

  function renderCatalog() {
    statTotalVideos.textContent = state.catalog.length;

    const query = state.filterQuery.toLowerCase();
    const filtered = state.catalog.filter((item) => {
      if (!query) return true;
      const cat = getCategoryFromTitle(item.title).toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        cat.includes(query)
      );
    });

    catalogContainer.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    filtered.forEach((item, index) => {
      const realIndex = state.catalog.findIndex((v) => v.id === item.id);
      const cat = getCategoryFromTitle(item.title);
      const catClass = getCategoryClass(cat);
      const thumbUrl = `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;

      const row = document.createElement("div");
      row.className = "catalog-row";
      row.draggable = true;
      row.dataset.index = realIndex;

      row.innerHTML = `
        <div class="col-drag-handle">
          <span class="drag-dots">⋮⋮</span>
          <span>${String(realIndex + 1).padStart(2, "0")}</span>
        </div>
        <div class="col-thumb-wrap" data-vid="${item.id}" data-title="${encodeURIComponent(item.title)}">
          <img src="${thumbUrl}" alt="${item.title}" class="col-thumb-img" loading="lazy" />
          <div class="col-thumb-play">▶</div>
        </div>
        <div class="col-title-wrap">
          <div class="video-row-title">${item.title}</div>
          <span class="video-category-tag ${catClass}">${cat}</span>
        </div>
        <div>
          <a href="https://www.youtube.com/watch?v=${item.id}" target="_blank" class="col-id-text" title="Open on YouTube">
            ${item.id} ↗
          </a>
        </div>
        <div class="col-date-text">${formatDate(item.pubDate)}</div>
        <div class="col-actions-wrap">
          <button type="button" class="btn-icon" data-action="up" data-idx="${realIndex}" title="Move Up" ${realIndex === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn-icon" data-action="down" data-idx="${realIndex}" title="Move Down" ${realIndex === state.catalog.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn-icon" data-action="edit" data-idx="${realIndex}" title="Edit Video">✏️</button>
          <button type="button" class="btn-icon btn-icon-del" data-action="delete" data-idx="${realIndex}" title="Delete Video">🗑️</button>
        </div>
      `;

      // Event listeners on row elements
      row.querySelector(".col-thumb-wrap").addEventListener("click", () => {
        openVideoPlayer(item.id, item.title);
      });

      row.querySelector('[data-action="up"]').addEventListener("click", () => moveItem(realIndex, -1));
      row.querySelector('[data-action="down"]').addEventListener("click", () => moveItem(realIndex, 1));
      row.querySelector('[data-action="edit"]').addEventListener("click", () => openEditModal(realIndex));
      row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteItem(realIndex));

      // Drag and drop reordering
      setupDragAndDrop(row, realIndex);

      catalogContainer.appendChild(row);
    });
  }

  function setupDragAndDrop(row, index) {
    row.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
    });
    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      row.style.background = "rgba(139, 92, 246, 0.15)";
    });
    row.addEventListener("dragleave", () => {
      row.style.background = "";
    });
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.style.background = "";
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      const toIndex = index;
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        const item = state.catalog.splice(fromIndex, 1)[0];
        state.catalog.splice(toIndex, 0, item);
        markChanges();
        renderCatalog();
        showToast("Catalog reordered.", "info");
      }
    });
  }

  // ── REORDER & MUTATION ACTIONS ──
  function moveItem(index, direction) {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= state.catalog.length) return;
    const item = state.catalog.splice(index, 1)[0];
    state.catalog.splice(newIdx, 0, item);
    markChanges();
    renderCatalog();
  }

  function deleteItem(index) {
    const item = state.catalog[index];
    if (!item) return;
    const confirmDel = confirm(`Are you sure you want to remove:\n"${item.title}" (${item.id}) from the catalog?`);
    if (!confirmDel) return;

    state.catalog.splice(index, 1);
    markChanges();
    renderCatalog();
    showToast(`Removed "${item.title}" from catalog.`, "info");
  }

  function markChanges() {
    state.hasUnsavedChanges = true;
    updateChangesBanner();
  }

  function updateChangesBanner() {
    if (state.hasUnsavedChanges) {
      changesBanner.style.display = "flex";
      changesBannerText.textContent = `You have unsaved changes (${state.catalog.length} videos). Remember to commit!`;
    } else {
      changesBanner.style.display = "none";
    }
  }

  btnRevertChanges.addEventListener("click", () => {
    if (confirm("Revert all unsaved catalog changes?")) {
      state.catalog = JSON.parse(JSON.stringify(state.originalCatalog));
      state.hasUnsavedChanges = false;
      updateChangesBanner();
      renderCatalog();
      showToast("Reverted to last committed state.", "info");
    }
  });

  // ── SEARCH FILTER ──
  catalogSearch.addEventListener("input", (e) => {
    state.filterQuery = e.target.value.trim();
    btnClearSearch.style.display = state.filterQuery ? "block" : "none";
    renderCatalog();
  });

  btnClearSearch.addEventListener("click", () => {
    catalogSearch.value = "";
    state.filterQuery = "";
    btnClearSearch.style.display = "none";
    renderCatalog();
  });

  // ── ADD & EDIT VIDEO MODAL ──
  btnOpenAddModal.addEventListener("click", () => {
    openAddModal();
  });

  function openAddModal() {
    videoModalTitle.textContent = "ADD VIDEO TO CATALOG";
    videoEditIndex.value = "-1";
    inputVideoUrl.value = "";
    inputVideoTitle.value = "";
    inputVideoDate.value = new Date().toISOString().split("T")[0];
    updatePreviewCard();
    videoModalBackdrop.style.display = "flex";
  }

  function openEditModal(index) {
    const item = state.catalog[index];
    if (!item) return;
    videoModalTitle.textContent = "EDIT CATALOG VIDEO";
    videoEditIndex.value = index;
    inputVideoUrl.value = item.id;
    inputVideoTitle.value = item.title;
    inputVideoDate.value = item.pubDate ? item.pubDate.split("T")[0] : new Date().toISOString().split("T")[0];
    updatePreviewCard();
    videoModalBackdrop.style.display = "flex";
  }

  function closeVideoModal() {
    videoModalBackdrop.style.display = "none";
  }

  btnCloseVideoModal.addEventListener("click", closeVideoModal);
  btnCancelVideo.addEventListener("click", closeVideoModal);
  videoModalBackdrop.addEventListener("click", (e) => {
    if (e.target === videoModalBackdrop) closeVideoModal();
  });

  // Live Preview Updating
  inputVideoUrl.addEventListener("input", updatePreviewCard);
  inputVideoTitle.addEventListener("input", updatePreviewCard);
  inputVideoDate.addEventListener("input", updatePreviewCard);

  function updatePreviewCard() {
    const vid = extractVideoId(inputVideoUrl.value);
    const title = inputVideoTitle.value.trim() || "Enter title above...";
    const date = inputVideoDate.value || new Date().toISOString().split("T")[0];
    const cat = getCategoryFromTitle(title);

    previewTitle.textContent = title;
    previewDate.textContent = formatDate(date);
    previewBadge.textContent = cat;
    catPreviewBadge.textContent = cat;

    if (vid) {
      previewThumb.src = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
    } else {
      previewThumb.src = "img/personal_preview.jpg";
    }
  }

  // Auto-Fetch Video Metadata from YouTube
  btnFetchMeta.addEventListener("click", async () => {
    const vid = extractVideoId(inputVideoUrl.value);
    if (!vid) {
      showToast("Please enter a valid YouTube URL or 11-char Video ID first.", "error");
      return;
    }

    btnFetchMeta.disabled = true;
    btnFetchMeta.textContent = "FETCHING...";

    try {
      const data = await apiRequest(`/api/admin/youtube/video-info?id=${vid}`);
      if (data && data.title) {
        inputVideoTitle.value = data.title;
        if (data.pubDate) {
          inputVideoDate.value = data.pubDate.split("T")[0];
        }
        updatePreviewCard();
        showToast(`Metadata loaded: "${data.title}"`, "success");
      }
    } catch (err) {
      showToast(`Could not fetch info: ${err.message}`, "error");
    } finally {
      btnFetchMeta.disabled = false;
      btnFetchMeta.textContent = "AUTO-FETCH INFO";
    }
  });

  // Submit Video Form
  videoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const vid = extractVideoId(inputVideoUrl.value);
    const title = inputVideoTitle.value.trim();
    const date = inputVideoDate.value ? new Date(inputVideoDate.value).toISOString() : new Date().toISOString();
    const editIdx = parseInt(videoEditIndex.value, 10);

    if (!vid || !title) {
      showToast("Video ID and Title are required.", "error");
      return;
    }

    const item = {
      id: vid,
      title: title,
      pubDate: date,
    };

    if (editIdx >= 0 && editIdx < state.catalog.length) {
      state.catalog[editIdx] = item;
      showToast(`Updated "${title}"`, "success");
    } else {
      // Check for duplicate ID
      const exists = state.catalog.find((v) => v.id === vid);
      if (exists) {
        showToast(`Video ${vid} is already in the catalog!`, "error");
        return;
      }
      // Add to top of catalog
      state.catalog.unshift(item);
      showToast(`Added "${title}" to catalog!`, "success");
    }

    markChanges();
    renderCatalog();
    closeVideoModal();
  });

  // ── YOUTUBE CHANNEL SCANNER ──
  btnScanChannel.addEventListener("click", scanYouTubeChannel);

  async function scanYouTubeChannel() {
    btnScanChannel.disabled = true;
    btnScanChannel.innerHTML = `<span class="icon">⏳</span><span>SCANNING CHANNEL...</span>`;

    try {
      const data = await apiRequest("/api/admin/youtube/channel-sync");
      statYtStatus.textContent = "SYNCED";

      if (data.newVideos && data.newVideos.length > 0) {
        state.discoveredYtVideos = data.newVideos;
        renderDiscoveredVideos(data.newVideos);
        ytScanBanner.style.display = "block";
        showToast(`Found ${data.newVideos.length} new YouTube uploads!`, "success");
      } else {
        ytScanBanner.style.display = "none";
        showToast("Your catalog is fully up to date with YouTube!", "success");
      }
    } catch (err) {
      showToast(`YouTube scan error: ${err.message}`, "error");
    } finally {
      btnScanChannel.disabled = false;
      btnScanChannel.innerHTML = `<span class="icon">📡</span><span>SCAN YOUTUBE CHANNEL</span>`;
    }
  }

  function renderDiscoveredVideos(videos) {
    ytScanList.innerHTML = videos
      .map(
        (v, i) => `
      <div class="yt-scan-item">
        <div class="yt-scan-item-info">
          <img src="${v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}" class="yt-scan-thumb" alt="" />
          <div>
            <div class="yt-scan-title-text">${v.title}</div>
            <div class="yt-scan-date">${formatDate(v.pubDate)} &bull; <span class="hw-mono">${v.id}</span></div>
          </div>
        </div>
        <button type="button" class="btn btn-xs btn-primary" data-add-yt="${i}">+ ADD TO CATALOG</button>
      </div>
    `
      )
      .join("");

    ytScanList.querySelectorAll("[data-add-yt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.addYt, 10);
        const item = state.discoveredYtVideos[idx];
        if (item) {
          state.catalog.unshift({
            id: item.id,
            title: item.title,
            pubDate: item.pubDate || new Date().toISOString(),
          });
          state.discoveredYtVideos.splice(idx, 1);
          renderDiscoveredVideos(state.discoveredYtVideos);
          if (state.discoveredYtVideos.length === 0) {
            ytScanBanner.style.display = "none";
          }
          markChanges();
          renderCatalog();
          showToast(`Added "${item.title}" to catalog!`, "success");
        }
      });
    });
  }

  btnAddAllYtVideos.addEventListener("click", () => {
    if (!state.discoveredYtVideos.length) return;
    state.discoveredYtVideos.forEach((v) => {
      state.catalog.unshift({
        id: v.id,
        title: v.title,
        pubDate: v.pubDate || new Date().toISOString(),
      });
    });
    state.discoveredYtVideos = [];
    ytScanBanner.style.display = "none";
    markChanges();
    renderCatalog();
    showToast("Added all new uploads to catalog!", "success");
  });

  btnDismissYtBanner.addEventListener("click", () => {
    ytScanBanner.style.display = "none";
  });

  // ── GIT COMMIT & SAVE ──
  btnSaveAndCommit.addEventListener("click", openCommitModal);
  btnQuickCommit.addEventListener("click", openCommitModal);

  function openCommitModal() {
    summaryTotal.textContent = `${state.catalog.length} videos`;
    commitTerminalBox.style.display = "none";
    commitTerminalOutput.textContent = "";

    // Conventional commit message auto-generation
    const diffCount = state.catalog.length - state.originalCatalog.length;
    let autoMsg = `feat(catalog): update portfolio catalog (${state.catalog.length} works)`;
    if (diffCount > 0) {
      autoMsg = `feat(catalog): add ${diffCount} video${diffCount > 1 ? "s" : ""} to portfolio catalog (${state.catalog.length} works)`;
    } else if (diffCount < 0) {
      autoMsg = `feat(catalog): remove ${Math.abs(diffCount)} video(s) from catalog (${state.catalog.length} works)`;
    }
    commitMessageInput.value = autoMsg;
    commitModalBackdrop.style.display = "flex";
  }

  function closeCommitModal() {
    commitModalBackdrop.style.display = "none";
  }

  btnCloseCommitModal.addEventListener("click", closeCommitModal);
  btnCancelCommit.addEventListener("click", closeCommitModal);
  commitModalBackdrop.addEventListener("click", (e) => {
    if (e.target === commitModalBackdrop) closeCommitModal();
  });

  btnExecuteCommit.addEventListener("click", async () => {
    btnExecuteCommit.disabled = true;
    btnExecuteCommit.innerHTML = `<span>COMMITTING &amp; VALIDATING...</span>`;
    commitTerminalBox.style.display = "block";
    commitTerminalOutput.textContent = "⚙️ Validating catalog schema and files...\n";

    const commitMsg = commitMessageInput.value.trim() || `feat(catalog): update portfolio catalog (${state.catalog.length} works)`;
    const push = checkPushRemote.checked;

    try {
      commitTerminalOutput.textContent += "📝 Writing catalog.json...\n";
      commitTerminalOutput.textContent += "🔄 Syncing script.js CATALOG_VIDEOS...\n";
      commitTerminalOutput.textContent += "⚡ Checking JavaScript syntax with node --check...\n";
      commitTerminalOutput.textContent += "🌿 Staging git changes & committing...\n";

      const res = await apiRequest("/api/admin/catalog/save", {
        method: "POST",
        body: {
          items: state.catalog,
          commitMessage: commitMsg,
          push: push,
        },
      });

      if (res.commit && res.commit.committed) {
        commitTerminalOutput.textContent += `✅ Committed successfully: [${res.commit.commitHash}] "${res.commit.message}"\n`;
      } else {
        commitTerminalOutput.textContent += `ℹ️ ${res.commit?.message || "No git changes to commit."}\n`;
      }

      if (push) {
        commitTerminalOutput.textContent += `🚀 Git Push Result:\n${res.commit?.pushOutput || "Pushed to origin main."}\n`;
      }

      commitTerminalOutput.textContent += `🎉 All operations completed successfully!`;

      // Update state
      state.originalCatalog = JSON.parse(JSON.stringify(state.catalog));
      state.hasUnsavedChanges = false;
      updateChangesBanner();

      if (res.gitStatus) {
        updateGitStatusUI(res.gitStatus);
      }

      showToast("Catalog updated & committed to Git!", "success");

      setTimeout(() => {
        closeCommitModal();
      }, 1500);
    } catch (err) {
      commitTerminalOutput.textContent += `❌ Error: ${err.message}\n`;
      showToast(`Commit failed: ${err.message}`, "error");
    } finally {
      btnExecuteCommit.disabled = false;
      btnExecuteCommit.innerHTML = `<span class="icon">🚀</span><span>EXECUTE COMMIT &amp; SAVE</span>`;
    }
  });

  // ── MANUAL GIT PUSH ──
  btnPushRemote.addEventListener("click", executeGitPush);
  btnDrawerPush.addEventListener("click", executeGitPush);

  async function executeGitPush() {
    const btn = btnPushRemote;
    btn.disabled = true;
    btn.innerHTML = `<span class="icon">⏳</span><span>PUSHING...</span>`;

    try {
      const res = await apiRequest("/api/admin/git/push", { method: "POST" });
      if (res.success) {
        showToast("Pushed successfully to origin/main!", "success");
      } else {
        showToast(`Push warning: ${res.error || res.output}`, "error");
      }
    } catch (err) {
      showToast(`Push failed: ${err.message}`, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span class="icon">⬆</span><span>PUSH TO GITHUB</span>`;
    }
  }

  // ── GIT HISTORY DRAWER ──
  btnGitHistory.addEventListener("click", () => {
    gitDrawerBackdrop.style.display = "flex";
  });
  btnCloseGitDrawer.addEventListener("click", () => {
    gitDrawerBackdrop.style.display = "none";
  });
  gitDrawerBackdrop.addEventListener("click", (e) => {
    if (e.target === gitDrawerBackdrop) gitDrawerBackdrop.style.display = "none";
  });

  // ── SECURITY DRAWER ──
  btnSecDashboard.addEventListener("click", () => {
    secDrawerBackdrop.style.display = "flex";
  });
  btnCloseSecDrawer.addEventListener("click", () => {
    secDrawerBackdrop.style.display = "none";
  });
  secDrawerBackdrop.addEventListener("click", (e) => {
    if (e.target === secDrawerBackdrop) secDrawerBackdrop.style.display = "none";
  });

  // ── VIDEO PLAYER MODAL ──
  function openVideoPlayer(videoId, title) {
    playerModalTitle.textContent = title;
    playerIframeWrap.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1"
        allow="autoplay; encrypted-media; fullscreen"
        allowfullscreen
      ></iframe>
    `;
    playerModalBackdrop.style.display = "flex";
  }

  function closeVideoPlayer() {
    playerModalBackdrop.style.display = "none";
    playerIframeWrap.innerHTML = "";
  }

  btnClosePlayerModal.addEventListener("click", closeVideoPlayer);
  playerModalBackdrop.addEventListener("click", (e) => {
    if (e.target === playerModalBackdrop) closeVideoPlayer();
  });

  // Global ESC key listener
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeVideoModal();
      closeCommitModal();
      closeVideoPlayer();
      gitDrawerBackdrop.style.display = "none";
      secDrawerBackdrop.style.display = "none";
    }
  });

  // Start app
  init();
})();
