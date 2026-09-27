/**
 * AMAX CATALOG & HARDWARE SECURITY CONSOLE — CONTROLLER
 * Multi-Client Portfolio Management & Image Works Support
 * Theme: Gotham Minimalist Dark (Matching Main Website)
 */

(function () {
  "use strict";

  // Security Guard: If accessed on public hosting (e.g. GitHub Pages), redirect away immediately
  if (
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" &&
    window.location.hostname !== "::1"
  ) {
    window.location.replace("./");
    return;
  }

  // ── STATE ──
  let state = {
    token: localStorage.getItem("amax_admin_token") || "",
    authenticated: false,
    serverHwid: "",
    allowedHwid: "",
    hwidValid: false,
    clientFingerprint: "",
    systemInfo: null,

    // Multi-client collection state
    clients: {},
    originalClients: {},
    activeClientKey: "personal",
    filterType: "all", // 'all' | 'video' | 'image'
    filterQuery: "",
    availableImages: [],

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
  const hwidAutoBox = document.getElementById("hwidAutoBox");
  const btnHwidAutoLogin = document.getElementById("btnHwidAutoLogin");
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
  const navWorkStatusToggle = document.getElementById("navWorkStatusToggle");
  const navWorkStatusLabel = document.getElementById("navWorkStatusLabel");
  const statTotalWorks = document.getElementById("statTotalWorks");
  const statTotalWorksLabel = document.getElementById("statTotalWorksLabel");
  const statVideosCount = document.getElementById("statVideosCount");
  const statImagesCount = document.getElementById("statImagesCount");
  const statGitState = document.getElementById("statGitState");
  const statLastCommit = document.getElementById("statLastCommit");
  const statYtStatus = document.getElementById("statYtStatus");
  const statHwidShort = document.getElementById("statHwidShort");
  const statHostLabel = document.getElementById("statHostLabel");

  // Client Selection & Profile
  const clientTabsRow = document.getElementById("clientTabsRow");
  const btnOpenAddClientModal = document.getElementById(
    "btnOpenAddClientModal",
  );
  const activeClientAvatar = document.getElementById("activeClientAvatar");
  const activeClientName = document.getElementById("activeClientName");
  const activeClientHandle = document.getElementById("activeClientHandle");
  const activeClientDesc = document.getElementById("activeClientDesc");
  const activeClientLinks = document.getElementById("activeClientLinks");
  const countFilterAll = document.getElementById("countFilterAll");
  const countFilterVideo = document.getElementById("countFilterVideo");
  const countFilterImage = document.getElementById("countFilterImage");
  const typeFilterBtns = document.querySelectorAll(".type-filter-btn");

  // Add Client Modal Elements
  const clientModalBackdrop = document.getElementById("clientModalBackdrop");
  const btnCloseClientModal = document.getElementById("btnCloseClientModal");
  const btnCancelClient = document.getElementById("btnCancelClient");
  const clientForm = document.getElementById("clientForm");
  const inputClientKey = document.getElementById("inputClientKey");
  const inputClientName = document.getElementById("inputClientName");
  const inputClientHandle = document.getElementById("inputClientHandle");
  const inputClientAvatar = document.getElementById("inputClientAvatar");
  const inputClientDesc = document.getElementById("inputClientDesc");
  const inputClientUrl = document.getElementById("inputClientUrl");
  const inputClientYt = document.getElementById("inputClientYt");
  const inputClientX = document.getElementById("inputClientX");
  const inputClientTwitch = document.getElementById("inputClientTwitch");

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
  const btnAddWorkLabel = document.getElementById("btnAddWorkLabel");
  const btnSaveAndCommit = document.getElementById("btnSaveAndCommit");
  const catalogContainer = document.getElementById("catalogContainer");
  const emptyState = document.getElementById("emptyState");

  // Add / Edit Work Modal Elements
  const videoModalBackdrop = document.getElementById("videoModalBackdrop");
  const videoModalTitle = document.getElementById("videoModalTitle");
  const btnCloseVideoModal = document.getElementById("btnCloseVideoModal");
  const videoForm = document.getElementById("videoForm");
  const videoEditIndex = document.getElementById("videoEditIndex");
  const radioTypeVideo = document.getElementById("radioTypeVideo");
  const radioTypeImage = document.getElementById("radioTypeImage");
  const sectionVideoInputs = document.getElementById("sectionVideoInputs");
  const sectionImageInputs = document.getElementById("sectionImageInputs");
  const groupPublishDate = document.getElementById("groupPublishDate");
  const inputVideoUrl = document.getElementById("inputVideoUrl");
  const btnFetchMeta = document.getElementById("btnFetchMeta");
  const videoFileUploadInput = document.getElementById("videoFileUploadInput");
  const videoUploadStatus = document.getElementById("videoUploadStatus");
  const inputVideoThumbSrc = document.getElementById("inputVideoThumbSrc");
  const fileUploadVideoThumb = document.getElementById("fileUploadVideoThumb");
  const videoThumbUploadStatus = document.getElementById("videoThumbUploadStatus");
  const selectExistingImage = document.getElementById("selectExistingImage");
  const fileUploadInput = document.getElementById("fileUploadInput");
  const inputImageSrc = document.getElementById("inputImageSrc");
  const inputVideoTitle = document.getElementById("inputVideoTitle");
  const inputCategory = document.getElementById("inputCategory");
  const inputVideoDate = document.getElementById("inputVideoDate");
  const previewThumb = document.getElementById("previewThumb");
  const previewPlayIcon = document.getElementById("previewPlayIcon");
  const previewBadge = document.getElementById("previewBadge");
  const previewTitle = document.getElementById("previewTitle");
  const previewDate = document.getElementById("previewDate");
  const btnCancelVideo = document.getElementById("btnCancelVideo");

  // Commit Modal
  const commitModalBackdrop = document.getElementById("commitModalBackdrop");
  const btnCloseCommitModal = document.getElementById("btnCloseCommitModal");
  const summaryTotal = document.getElementById("summaryTotal");
  const commitMessageInput = document.getElementById("commitMessageInput");
  const checkPushRemote = document.getElementById("checkPushRemote");
  const commitTerminalBox = document.getElementById("commitTerminalBox");
  const commitTerminalOutput = document.getElementById("commitTerminalOutput");
  const btnCancelCommit = document.getElementById("btnCancelCommit");
  const btnExecuteCommit = document.getElementById("btnExecuteCommit");

  // Git Drawer
  const gitDrawerBackdrop = document.getElementById("gitDrawerBackdrop");
  const btnCloseGitDrawer = document.getElementById("btnCloseGitDrawer");
  const btnGitHistory = document.getElementById("btnGitHistory");
  const drawerBranch = document.getElementById("drawerBranch");
  const drawerStatusText = document.getElementById("drawerStatusText");
  const drawerLatestCommit = document.getElementById("drawerLatestCommit");
  const btnDrawerPush = document.getElementById("btnDrawerPush");
  const commitHistoryList = document.getElementById("commitHistoryList");

  // Security Drawer
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

  // Lightboxes
  const playerModalBackdrop = document.getElementById("playerModalBackdrop");
  const playerModalTitle = document.getElementById("playerModalTitle");
  const btnClosePlayerModal = document.getElementById("btnClosePlayerModal");
  const playerIframeWrap = document.getElementById("playerIframeWrap");

  const imageLightboxBackdrop = document.getElementById(
    "imageLightboxBackdrop",
  );
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxImg = document.getElementById("lightboxImg");
  const btnCloseLightbox = document.getElementById("btnCloseLightbox");

  const btnLogout = document.getElementById("btnLogout");

  // ── HELPERS & UTILITIES ──
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
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

  function formatDate(dateStr) {
    if (!dateStr) return "--";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
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
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
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
    if (
      options.body &&
      typeof options.body === "object" &&
      !(options.body instanceof FormData)
    ) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    options.headers = headers;

    try {
      const res = await fetch(endpoint, options);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && data.message) || `HTTP ${res.status}: ${res.statusText}`,
        );
      }
      return data;
    } catch (err) {
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        throw new Error(
          "Cannot connect to server. Ensure 'node server.js' is running locally.",
        );
      }
      throw err;
    }
  }

  // ── INITIALIZATION ──
  async function init() {
    state.clientFingerprint = await computeClientFingerprint();
    if (diagClientFp) diagClientFp.textContent = state.clientFingerprint;

    // Password visibility toggle
    if (btnTogglePw && adminKeyInput) {
      btnTogglePw.addEventListener("click", () => {
        adminKeyInput.type =
          adminKeyInput.type === "password" ? "text" : "password";
        btnTogglePw.textContent =
          adminKeyInput.type === "password" ? "👁️" : "🙈";
      });
    }

    // Login Form Submit
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    // HWID Auto-Login Button
    if (btnHwidAutoLogin) {
      btnHwidAutoLogin.addEventListener("click", attemptHwidAutoLogin);
    }

    // Logout
    if (btnLogout) btnLogout.addEventListener("click", handleLogout);

    // Setup Add Client Modal listeners
    setupAddClientModal();

    // Setup work type filters
    setupTypeFilters();

    // Setup Add/Edit work modal type toggles
    setupWorkTypeSwitcher();

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

      if (data.authenticated) {
        enterDashboard();
      } else if (state.hwidValid) {
        if (hwidAutoBox) hwidAutoBox.style.display = "block";
        await attemptHwidAutoLogin();
      } else {
        if (hwidAutoBox) hwidAutoBox.style.display = "none";
        exitDashboard();
      }
    } catch (err) {
      if (staticServerAlert) staticServerAlert.style.display = "block";
      if (diagStatusBadge) {
        diagStatusBadge.className = "hw-status-badge mismatch";
        diagStatusText.textContent = "SERVER OFFLINE";
      }
      if (diagHwid) diagHwid.textContent = "OFFLINE (RUN 'node server.js')";
    }
  }

  async function attemptHwidAutoLogin() {
    try {
      if (btnHwidAutoLogin) {
        btnHwidAutoLogin.disabled = true;
        const textSpan = btnHwidAutoLogin.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = "AUTHENTICATING VIA HWID...";
      }
      const res = await apiRequest("/api/admin/auth/hwid-login", {
        method: "POST",
        body: { clientFingerprint: state.clientFingerprint },
      });
      if (res.success && res.token) {
        state.token = res.token;
        state.authenticated = true;
        localStorage.setItem("amax_admin_token", res.token);
        showToast("Hardware signature verified. Auto-logged in!", "success");
        enterDashboard();
      }
    } catch (e) {
      console.log("[HWID AUTO-LOGIN]", e.message);
    } finally {
      if (btnHwidAutoLogin) {
        btnHwidAutoLogin.disabled = false;
        const textSpan = btnHwidAutoLogin.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = "ENTER CONSOLE (HWID VERIFIED)";
      }
    }
  }

  function updateHardwareUI(data) {
    if (diagHwid) diagHwid.textContent = data.currentHwid || "UNKNOWN";
    if (diagHost)
      diagHost.textContent = `${data.systemInfo?.hostname || "Local"} (${data.systemInfo?.platform || "OS"})`;

    if (data.hwidValid) {
      if (diagStatusBadge) {
        diagStatusBadge.className = "hw-status-badge verified";
        diagStatusText.textContent = "HARDWARE VERIFIED";
      }
      if (hwMismatchAlert) hwMismatchAlert.style.display = "none";

      if (navHwidText) {
        navHwidText.textContent = `HWID VERIFIED : ${data.currentHwid.slice(-9)}`;
      }
      if (statHwidShort) statHwidShort.textContent = "HWID-OK";
      if (statHostLabel)
        statHostLabel.textContent = `HOST: ${data.systemInfo?.hostname || "iTxAmax"}`;
    } else {
      if (diagStatusBadge) {
        diagStatusBadge.className = "hw-status-badge mismatch";
        diagStatusText.textContent = "HARDWARE MISMATCH";
      }
      if (hwMismatchAlert) {
        hwMismatchAlert.style.display = "block";
        hwMismatchDesc.innerHTML = `
          Server HWID: <strong>${data.currentHwid}</strong><br>
          Allowed HWID: <strong>${data.allowedHwid || "NONE (Configure .env)"}</strong>
        `;
      }
      if (navHwidText) {
        navHwidText.textContent = "HARDWARE LOCKED";
        if (navHwidBadge)
          navHwidBadge.className = "navbar-status-pill mismatch";
      }
      if (statHwidShort) statHwidShort.textContent = "HWID-LOCK";
    }

    // Security Drawer details
    if (secServerHwid) secServerHwid.textContent = data.currentHwid || "--";
    if (secHostname)
      secHostname.textContent = data.systemInfo?.hostname || "--";
    if (secMac) secMac.textContent = data.systemInfo?.primaryMac || "--";
    if (secCpu) secCpu.textContent = data.systemInfo?.cpuModel || "--";
    if (secOs)
      secOs.textContent = `${data.systemInfo?.platform} ${data.systemInfo?.arch}`;
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
    btnLogin.querySelector(".btn-text").textContent =
      "VERIFYING CREDENTIALS & HWID...";

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
      loginErrorMsg.textContent =
        err.message || "Invalid Admin Key or Hardware Mismatch";
      showToast(err.message, "error");
    } finally {
      btnLogin.disabled = false;
      btnLogin.querySelector(".btn-text").textContent =
        "AUTHENTICATE & ENTER CONSOLE";
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
    loadAllClients();
    loadWorkStatus();
    if (typeof updateInboxBadge === "function") updateInboxBadge();
  }

  function exitDashboard() {
    dashboardView.style.display = "none";
    authView.style.display = "flex";
  }

  // ── LOAD CLIENTS & IMAGES ──
  async function loadAllClients() {
    try {
      const data = await apiRequest("/api/admin/clients");
      state.clients = data.clients || {};
      state.originalClients = JSON.parse(JSON.stringify(state.clients));
      state.availableImages = Array.isArray(data.images) ? data.images : [];
      state.hasUnsavedChanges = false;
      updateChangesBanner();

      if (data.gitStatus) {
        updateGitStatusUI(data.gitStatus);
      }

      renderClientTabs();
      populateImageSelectDropdown();
      updateActiveClientProfile();
      updateGlobalStats();
      renderCatalog();
    } catch (err) {
      showToast(`Error loading client collections: ${err.message}`, "error");
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
      `,
        )
        .join("");
    }
  }

  // ── DYNAMIC CLIENT TABS (MATCHING MAIN SITE .client-box) ──
  function renderClientTabs() {
    if (!clientTabsRow) return;
    clientTabsRow.innerHTML = "";

    const clientEntries = Object.entries(state.clients);

    clientEntries.forEach(([key, client]) => {
      const works = client.works || [];
      const isActive = key === state.activeClientKey;
      const count = works.length;

      // Find preview image
      let previewImg = "img/personal_preview.jpg";
      if (client.previewImg) {
        previewImg = client.previewImg;
      } else if (works.length > 0 && works[0].src) {
        previewImg = works[0].src;
      } else if (key === "aihara") {
        previewImg = "img/clients/aihara/battlefield_v.png";
      } else if (key === "hironeyka") {
        previewImg = "img/clients/hironeyka/banner_hiro.jpg";
      }

      const isOriginal = key === "personal";
      const tagText = isOriginal ? "ORIGINAL" : "CLIENT";

      const isOnline = client.status !== "offline";
      const statusLabel = isOnline ? "ONLINE" : "OFFLINE";

      const card = document.createElement("button");
      card.type = "button";
      card.className = `client-box-tab ${isActive ? "active" : ""} ${!isOnline ? "client-offline" : ""}`;
      card.dataset.client = key;
      card.innerHTML = `
        <div class="client-box-preview">
          <img src="${previewImg}" alt="${client.name}" class="client-box-img" loading="lazy" />
          <div class="client-box-shade"></div>
        </div>
        <div class="client-box-content">
          <div class="client-box-top-row">
            <span class="client-box-tag">${tagText}</span>
            <span class="client-box-status">
              <span class="status-dot-sm" style="background:${isOnline ? "" : "#ff4d4f"}"></span> ${statusLabel}
            </span>
          </div>
          <h3 class="client-box-title">${client.name || key}</h3>
          <span class="client-box-sub">${client.handle || `@${key}`}</span>
          <div class="client-box-footer">
            <span class="client-box-count">${count} WORK${count === 1 ? "" : "S"}</span>
            <span class="client-box-arrow">&rarr;</span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        if (state.activeClientKey === key) return;
        state.activeClientKey = key;
        renderClientTabs();
        updateActiveClientProfile();
        populateImageSelectDropdown();
        renderCatalog();
      });

      clientTabsRow.appendChild(card);
    });

    // Append + NEW CLIENT Card
    const newCard = document.createElement("div");
    newCard.className = "client-tab-new";
    newCard.title = "Add a new client collection";
    newCard.innerHTML = `
      <span class="client-tab-new-plus">+</span>
      <span class="client-tab-new-text">NEW CLIENT</span>
    `;
    newCard.addEventListener("click", openAddClientModal);
    clientTabsRow.appendChild(newCard);
  }

  // ── ADD CLIENT MODAL ──
  function setupAddClientModal() {
    if (btnOpenAddClientModal) {
      btnOpenAddClientModal.addEventListener("click", openAddClientModal);
    }
    if (btnCloseClientModal) {
      btnCloseClientModal.addEventListener("click", closeAddClientModal);
    }
    if (btnCancelClient) {
      btnCancelClient.addEventListener("click", closeAddClientModal);
    }
    if (clientModalBackdrop) {
      clientModalBackdrop.addEventListener("click", (e) => {
        if (e.target === clientModalBackdrop) closeAddClientModal();
      });
    }
    if (clientForm) {
      clientForm.addEventListener("submit", handleCreateClient);
    }
  }

  function openAddClientModal() {
    if (!clientModalBackdrop) return;
    inputClientKey.value = "";
    inputClientName.value = "";
    inputClientHandle.value = "";
    inputClientAvatar.value = "";
    inputClientDesc.value = "";
    inputClientUrl.value = "";
    inputClientYt.value = "";
    inputClientX.value = "";
    inputClientTwitch.value = "";
    clientModalBackdrop.style.display = "flex";
  }

  function closeAddClientModal() {
    if (clientModalBackdrop) {
      clientModalBackdrop.style.display = "none";
    }
  }

  function handleCreateClient(e) {
    e.preventDefault();
    const rawKey = inputClientKey.value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const name = inputClientName.value.trim();

    if (!rawKey || !name) {
      showToast("Client Slug and Display Name are required.", "error");
      return;
    }

    if (state.clients[rawKey]) {
      showToast(`A client with ID '${rawKey}' already exists!`, "error");
      return;
    }

    const handle = inputClientHandle.value.trim() || `@${rawKey}`;
    const avatar = (
      inputClientAvatar.value.trim() ||
      name.charAt(0) ||
      "C"
    ).toUpperCase();
    const desc = inputClientDesc.value.trim() || "Client Collection";
    const url = inputClientUrl.value.trim() || "";

    const links = [];
    if (inputClientYt.value.trim()) {
      links.push({
        platform: "YouTube",
        label: handle,
        url: inputClientYt.value.trim(),
        icon: "img/icons/Platform=YouTube, Color=Negative.png",
      });
    }
    if (inputClientX.value.trim()) {
      links.push({
        platform: "Twitter / X",
        label: handle,
        url: inputClientX.value.trim(),
        icon: "img/icons/Platform=X (Twitter), Color=Negative.png",
      });
    }
    if (inputClientTwitch.value.trim()) {
      links.push({
        platform: "Twitch",
        label: handle,
        url: inputClientTwitch.value.trim(),
        icon: "img/icons/Platform=Twitch, Color=Negative.png",
      });
    }

    // Add to state
    state.clients[rawKey] = {
      name,
      handle,
      url,
      desc,
      avatar,
      previewImg: "img/personal_preview.jpg",
      links,
      works: [],
    };

    state.activeClientKey = rawKey;
    markChanges();
    closeAddClientModal();
    renderClientTabs();
    updateActiveClientProfile();
    updateGlobalStats();
    populateImageSelectDropdown();
    renderCatalog();

    showToast(
      `Created client collection "${name}". Remember to click SAVE & COMMIT!`,
      "success",
    );
  }

  // ── ACTIVE CLIENT PROFILE & CLEAN SOCIAL ICONS ──
  function updateActiveClientProfile() {
    const client = state.clients[state.activeClientKey] || {};
    const works = client.works || [];

    if (activeClientAvatar) {
      const av = client.avatar || state.activeClientKey.charAt(0).toUpperCase();
      const isImg =
        av.includes("/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(av);
      if (isImg) {
        activeClientAvatar.innerHTML = `<img src="${av}" alt="${client.name || ""}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.onerror=null;this.parentElement.textContent='?'" />`;
      } else {
        activeClientAvatar.textContent = av;
      }
    }
    if (activeClientName)
      activeClientName.textContent = client.name || state.activeClientKey;
    if (activeClientHandle)
      activeClientHandle.textContent = client.handle || "";
    if (activeClientDesc) activeClientDesc.textContent = client.desc || "";

    if (btnAddWorkLabel) {
      btnAddWorkLabel.textContent = `ADD WORK (${client.name || state.activeClientKey})`;
    }

    // Sync ONLINE/OFFLINE toggle in profile banner
    const statusCheck = document.getElementById("clientStatusCheck");
    const statusLabel = document.getElementById("clientStatusLabel");
    if (statusCheck) {
      const isOnline = client.status !== "offline";
      statusCheck.checked = isOnline;
      if (statusLabel) {
        statusLabel.textContent = isOnline ? "ONLINE" : "OFFLINE";
      }
    }

    // Social icons (icon-only)
    if (activeClientLinks) {
      if (Array.isArray(client.links) && client.links.length > 0) {
        activeClientLinks.innerHTML = client.links
          .map(
            (link) => `
            <a href="${link.url || "#"}" target="_blank" rel="noopener" class="client-icon-btn" title="${link.platform || ""}${link.label ? `: ${link.label}` : ""}">
              ${link.icon ? `<img src="${link.icon}" alt="${link.platform || "Link"}" class="client-link-icon" />` : `<span class="icon-fallback">${(link.platform || "L").charAt(0)}</span>`}
            </a>
          `,
          )
          .join("");
      } else {
        activeClientLinks.innerHTML =
          '<span style="color:#555;font-size:11px;">No links added.</span>';
      }
    }

    // Update filter counts for active client
    const videoWorks = works.filter(
      (w) => w.type === "video" || (!w.type && (w.videoId || w.id)),
    );
    const imageWorks = works.filter(
      (w) => w.type === "image" || (!w.videoId && !w.id && w.src),
    );

    if (countFilterAll) countFilterAll.textContent = works.length;
    if (countFilterVideo) countFilterVideo.textContent = videoWorks.length;
    if (countFilterImage) countFilterImage.textContent = imageWorks.length;
  }

  function updateGlobalStats() {
    let totalAll = 0;
    let totalVideos = 0;
    let totalImages = 0;

    for (const client of Object.values(state.clients)) {
      const works = client.works || [];
      totalAll += works.length;
      works.forEach((w) => {
        if (w.type === "image" || (!w.videoId && !w.id && w.src)) {
          totalImages++;
        } else {
          totalVideos++;
        }
      });
    }

    if (statTotalWorks) statTotalWorks.textContent = totalAll;
    if (statVideosCount) statVideosCount.textContent = totalVideos;
    if (statImagesCount) statImagesCount.textContent = totalImages;
  }

  // ── WORK TYPE FILTERS ──
  function setupTypeFilters() {
    typeFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        typeFilterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.filterType = btn.dataset.type || "all";
        renderCatalog();
      });
    });
  }

  // ── CATALOG RENDERING ──
  function renderCatalog() {
    const client = state.clients[state.activeClientKey] || {};
    const works = client.works || [];

    const query = state.filterQuery.toLowerCase();
    const filtered = works.filter((item) => {
      const isImage =
        item.type === "image" || (!item.videoId && !item.id && item.src);
      const isVideo = !isImage;

      if (state.filterType === "video" && !isVideo) return false;
      if (state.filterType === "image" && !isImage) return false;

      if (!query) return true;
      const title = (item.title || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const idOrSrc = String(
        item.videoId || item.id || item.src || "",
      ).toLowerCase();

      return (
        title.includes(query) || cat.includes(query) || idOrSrc.includes(query)
      );
    });

    catalogContainer.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    filtered.forEach((item) => {
      const realIndex = works.indexOf(item);
      const isImage =
        item.type === "image" || (!item.videoId && !item.id && item.src);
      const cat =
        item.category || (isImage ? "Stream Artwork" : "Motion Graphic");

      let thumbUrl = "";
      if (isImage) {
        thumbUrl = item.src || "img/personal_preview.jpg";
      } else {
        const vid = extractVideoId(item.videoId || item.id);
        thumbUrl = vid
          ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg`
          : item.src || "img/personal_preview.jpg";
      }

      const row = document.createElement("div");
      row.className = "catalog-row";
      row.draggable = true;
      row.dataset.index = realIndex;

      const typeBadge = isImage
        ? `<span class="work-type-badge type-image"><img src="img/icons/image.png" class="badge-icon-img" alt="" /> IMAGE</span>`
        : `<span class="work-type-badge type-video"><img src="img/icons/video.png" class="badge-icon-img" alt="" /> VIDEO</span>`;

      let sourceMarkup = "";
      if (isImage) {
        sourceMarkup = `<span class="col-source-path" title="${item.src || ""}">${item.src ? item.src.split("/").pop() : "--"}</span>`;
      } else {
        const vid = extractVideoId(item.videoId || item.id);
        sourceMarkup = `
          <a href="https://www.youtube.com/watch?v=${vid}" target="_blank" class="col-id-text" title="Open on YouTube">
            ${vid} ↗
          </a>
        `;
      }

      row.innerHTML = `
        <div class="col-drag-handle">
          <span class="drag-dots">⋮⋮</span>
          <span>${String(realIndex + 1).padStart(2, "0")}</span>
        </div>
        <div class="col-thumb-wrap" title="Click to preview">
          <img src="${thumbUrl}" alt="${item.title || "Work"}" class="col-thumb-img" loading="lazy" />
          <div class="col-thumb-play">${isImage ? "🔍" : "▶"}</div>
        </div>
        <div>${typeBadge}</div>
        <div class="col-title-wrap">
          <div class="video-row-title">${item.title || "Untitled"}</div>
          <span class="video-category-tag">${cat}</span>
        </div>
        <div>${sourceMarkup}</div>
        <div class="col-actions-wrap">
          <button type="button" class="btn-icon" data-action="up" data-idx="${realIndex}" title="Move Up" ${realIndex === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn-icon" data-action="down" data-idx="${realIndex}" title="Move Down" ${realIndex === works.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn-icon" data-action="edit" data-idx="${realIndex}" title="Edit Work">✏️</button>
          <button type="button" class="btn-icon btn-icon-del" data-action="delete" data-idx="${realIndex}" title="Delete Work">🗑️</button>
        </div>
      `;

      // Preview click
      row.querySelector(".col-thumb-wrap").addEventListener("click", () => {
        if (isImage) {
          openImageLightbox(item.src, item.title);
        } else {
          const vid = extractVideoId(item.videoId || item.id);
          openVideoPlayer(vid, item.title);
        }
      });

      // Actions
      row
        .querySelector('[data-action="up"]')
        .addEventListener("click", () => moveItem(realIndex, -1));
      row
        .querySelector('[data-action="down"]')
        .addEventListener("click", () => moveItem(realIndex, 1));
      row
        .querySelector('[data-action="edit"]')
        .addEventListener("click", () => openEditModal(realIndex));
      row
        .querySelector('[data-action="delete"]')
        .addEventListener("click", () => deleteItem(realIndex));

      // Drag and drop
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
      row.style.background = "rgba(255, 255, 255, 0.04)";
    });
    row.addEventListener("dragleave", () => {
      row.style.background = "";
    });
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.style.background = "";
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      const toIndex = index;
      const works = state.clients[state.activeClientKey]?.works;
      if (!works) return;
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        const item = works.splice(fromIndex, 1)[0];
        works.splice(toIndex, 0, item);
        markChanges();
        renderCatalog();
        showToast("Works order updated.", "info");
      }
    });
  }

  // ── REORDER & MUTATION ACTIONS ──
  function moveItem(index, direction) {
    const works = state.clients[state.activeClientKey]?.works;
    if (!works) return;
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= works.length) return;
    const item = works.splice(index, 1)[0];
    works.splice(newIdx, 0, item);
    markChanges();
    renderCatalog();
  }

  function deleteItem(index) {
    const works = state.clients[state.activeClientKey]?.works;
    if (!works) return;
    const item = works[index];
    if (!item) return;

    const confirmDel = confirm(
      `Are you sure you want to remove:\n"${item.title}" from ${state.clients[state.activeClientKey]?.name}?`,
    );
    if (!confirmDel) return;

    works.splice(index, 1);
    markChanges();
    renderClientTabs();
    updateActiveClientProfile();
    updateGlobalStats();
    renderCatalog();
    showToast(`Removed "${item.title}".`, "info");
  }

  function markChanges() {
    state.hasUnsavedChanges = true;
    updateChangesBanner();
  }

  function updateChangesBanner() {
    if (state.hasUnsavedChanges) {
      changesBanner.style.display = "flex";
      let totalWorks = 0;
      for (const c of Object.values(state.clients)) {
        totalWorks += c.works?.length || 0;
      }
      changesBannerText.textContent = `You have unsaved catalog modifications (${totalWorks} works total). Remember to commit!`;
    } else {
      changesBanner.style.display = "none";
    }
  }

  btnRevertChanges.addEventListener("click", () => {
    if (confirm("Revert all unsaved catalog changes across all clients?")) {
      state.clients = JSON.parse(JSON.stringify(state.originalClients));
      state.hasUnsavedChanges = false;
      updateChangesBanner();
      renderClientTabs();
      updateActiveClientProfile();
      updateGlobalStats();
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

  // ── WORK TYPE SWITCHER & IMAGE SELECTION ──
  function setupWorkTypeSwitcher() {
    radioTypeVideo.addEventListener("change", updateWorkTypeVisibility);
    radioTypeImage.addEventListener("change", updateWorkTypeVisibility);

    // Existing image select change
    selectExistingImage.addEventListener("change", (e) => {
      if (e.target.value) {
        inputImageSrc.value = e.target.value;
        updatePreviewCard();
      }
    });

    inputImageSrc.addEventListener("input", updatePreviewCard);

    // Image file upload
    fileUploadInput.addEventListener("change", handleImageUpload);

    // Video file upload (Max 20MB)
    if (videoFileUploadInput) {
      videoFileUploadInput.addEventListener("change", handleVideoUpload);
    }

    // Video custom thumbnail upload & input
    if (fileUploadVideoThumb) {
      fileUploadVideoThumb.addEventListener("change", handleVideoThumbUpload);
    }
    if (inputVideoThumbSrc) {
      inputVideoThumbSrc.addEventListener("input", updatePreviewCard);
    }
  }

  function updateWorkTypeVisibility() {
    const isImage = radioTypeImage.checked;
    if (isImage) {
      sectionVideoInputs.style.display = "none";
      sectionImageInputs.style.display = "block";
      if (groupPublishDate) groupPublishDate.style.display = "none";
      if (previewPlayIcon) previewPlayIcon.style.display = "none";
      if (!inputCategory.value) inputCategory.value = "Stream Thumbnail";
    } else {
      sectionVideoInputs.style.display = "block";
      sectionImageInputs.style.display = "none";
      if (groupPublishDate) groupPublishDate.style.display = "block";
      if (previewPlayIcon) previewPlayIcon.style.display = "block";
      if (!inputCategory.value || inputCategory.value === "Stream Thumbnail") {
        inputCategory.value = "Motion Graphic";
      }
    }
    updatePreviewCard();
  }

  function populateImageSelectDropdown() {
    selectExistingImage.innerHTML = `<option value="">-- Choose Existing Client Image --</option>`;
    const clientKey = state.activeClientKey;

    // Filter available images for this client first, then others
    const sorted = [...state.availableImages].sort((a, b) => {
      const aMatches = a.includes(`clients/${clientKey}/`);
      const bMatches = b.includes(`clients/${clientKey}/`);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return a.localeCompare(b);
    });

    sorted.forEach((img) => {
      const opt = document.createElement("option");
      opt.value = img;
      const isClientImg = img.includes(`clients/${clientKey}/`);
      opt.textContent = isClientImg ? `⭐ ${img.split("/").pop()}` : img;
      selectExistingImage.appendChild(opt);
    });
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast(
        `Image size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 20MB limit.`,
        "error",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Data = evt.target.result;
      try {
        showToast("Uploading image...", "info");
        const res = await apiRequest("/api/admin/upload-image", {
          method: "POST",
          body: {
            clientKey: state.activeClientKey,
            fileName: file.name,
            fileData: base64Data,
          },
        });

        if (res.success && res.path) {
          inputImageSrc.value = res.path;
          state.availableImages = res.images || state.availableImages;
          populateImageSelectDropdown();
          selectExistingImage.value = res.path;
          updatePreviewCard();
          showToast(`Uploaded successfully: ${res.path}`, "success");
        }
      } catch (err) {
        showToast(`Image upload failed: ${err.message}`, "error");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleVideoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast(
        `Video size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 20MB limit.`,
        "error",
      );
      if (videoUploadStatus)
        videoUploadStatus.textContent = "⚠️ Exceeds 20MB limit";
      return;
    }

    if (videoUploadStatus) {
      videoUploadStatus.textContent = `Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB...`;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        showToast("Uploading video file (Max 20MB)...", "info");
        const res = await apiRequest("/api/admin/upload-video", {
          method: "POST",
          body: {
            clientKey: state.activeClientKey,
            fileName: file.name,
            fileData: evt.target.result,
          },
        });

        if (res.success && res.path) {
          inputVideoUrl.value = res.path;
          if (!inputVideoTitle.value.trim()) {
            inputVideoTitle.value = file.name.replace(/\.[^/.]+$/, "");
          }
          if (videoUploadStatus) {
            videoUploadStatus.textContent = `✓ Uploaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
          }
          updatePreviewCard();
          showToast(`Video uploaded: ${res.path}`, "success");
        }
      } catch (err) {
        if (videoUploadStatus) videoUploadStatus.textContent = "Upload failed";
        showToast(`Video upload failed: ${err.message}`, "error");
      }
    };
    reader.readAsDataURL(file);
  }

  // Video custom thumbnail upload (Max 20MB)
  function handleVideoThumbUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast("Thumbnail exceeds 20MB limit.", "error");
      if (videoThumbUploadStatus)
        videoThumbUploadStatus.textContent = "⚠️ Exceeds 20MB limit";
      return;
    }

    if (videoThumbUploadStatus) {
      videoThumbUploadStatus.textContent = `Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB...`;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        showToast("Uploading custom thumbnail...", "info");
        const res = await apiRequest("/api/admin/upload-image", {
          method: "POST",
          body: {
            clientKey: state.activeClientKey,
            fileName: file.name,
            fileData: evt.target.result,
          },
        });

        if (res.success && res.path) {
          if (inputVideoThumbSrc) inputVideoThumbSrc.value = res.path;
          if (videoThumbUploadStatus) {
            videoThumbUploadStatus.textContent = `✓ Uploaded: ${file.name}`;
          }
          updatePreviewCard();
          showToast(`Custom thumbnail uploaded: ${res.path}`, "success");
        }
      } catch (err) {
        if (videoThumbUploadStatus) videoThumbUploadStatus.textContent = "Upload failed";
        showToast(`Thumbnail upload failed: ${err.message}`, "error");
      }
    };
    reader.readAsDataURL(file);
  }

  // ── ADD & EDIT WORK MODAL ──
  btnOpenAddModal.addEventListener("click", () => {
    openAddModal();
  });

  function openAddModal() {
    const client = state.clients[state.activeClientKey] || {};
    videoModalTitle.textContent = `ADD WORK TO ${client.name?.toUpperCase() || "CLIENT"}`;
    videoEditIndex.value = "-1";

    // Auto default work type based on client collection
    if (state.activeClientKey === "aihara") {
      radioTypeImage.checked = true;
    } else {
      radioTypeVideo.checked = true;
    }

    inputVideoUrl.value = "";
    inputImageSrc.value = "";
    if (inputVideoThumbSrc) inputVideoThumbSrc.value = "";
    if (fileUploadVideoThumb) fileUploadVideoThumb.value = "";
    if (videoThumbUploadStatus)
      videoThumbUploadStatus.textContent = "No custom thumbnail (uses video thumb/preview)";
    selectExistingImage.value = "";
    inputVideoTitle.value = "";
    inputCategory.value =
      state.activeClientKey === "aihara"
        ? "Stream Thumbnail"
        : "Motion Graphic";
    inputVideoDate.value = new Date().toISOString().split("T")[0];
    if (videoUploadStatus)
      videoUploadStatus.textContent = "No local video selected";

    updateWorkTypeVisibility();
    videoModalBackdrop.style.display = "flex";
  }

  function openEditModal(index) {
    const works = state.clients[state.activeClientKey]?.works || [];
    const item = works[index];
    if (!item) return;

    videoModalTitle.textContent = `EDIT WORK (${state.clients[state.activeClientKey]?.name || ""})`;
    videoEditIndex.value = index;

    const isImage =
      item.type === "image" || (!item.videoId && !item.id && item.src);
    if (isImage) {
      radioTypeImage.checked = true;
      inputImageSrc.value = item.src || "";
      selectExistingImage.value = item.src || "";
      inputVideoUrl.value = "";
      if (inputVideoThumbSrc) inputVideoThumbSrc.value = "";
      if (videoThumbUploadStatus)
        videoThumbUploadStatus.textContent = "No custom thumbnail";
      if (videoUploadStatus)
        videoUploadStatus.textContent = "No local video selected";
    } else {
      radioTypeVideo.checked = true;
      inputVideoUrl.value = item.videoId || item.id || "";
      inputImageSrc.value = item.src || "";
      if (inputVideoThumbSrc) {
        if (item.src && !item.src.includes("img.youtube.com/vi/")) {
          inputVideoThumbSrc.value = item.src;
          if (videoThumbUploadStatus) {
            videoThumbUploadStatus.textContent = `✓ Custom thumbnail: ${item.src.split("/").pop()}`;
          }
        } else {
          inputVideoThumbSrc.value = "";
          if (videoThumbUploadStatus) {
            videoThumbUploadStatus.textContent = "Default video thumbnail";
          }
        }
      }
      if (videoUploadStatus) {
        if (
          item.isLocalVideo ||
          (item.videoId && item.videoId.startsWith("video/"))
        ) {
          videoUploadStatus.textContent = `✓ Local video: ${item.videoId.split("/").pop()}`;
        } else {
          videoUploadStatus.textContent = "YouTube video";
        }
      }
    }

    inputVideoTitle.value = item.title || "";
    inputCategory.value =
      item.category || (isImage ? "Stream Thumbnail" : "Motion Graphic");
    inputVideoDate.value = item.pubDate
      ? item.pubDate.split("T")[0]
      : new Date().toISOString().split("T")[0];

    updateWorkTypeVisibility();
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
  inputCategory.addEventListener("input", updatePreviewCard);
  inputVideoDate.addEventListener("input", updatePreviewCard);

  function updatePreviewCard() {
    const isImage = radioTypeImage.checked;
    const title = inputVideoTitle.value.trim() || "Enter work title above...";
    const cat =
      inputCategory.value.trim() || (isImage ? "Artwork" : "Motion Graphic");
    const date = inputVideoDate.value || new Date().toISOString().split("T")[0];

    previewTitle.textContent = title;
    previewDate.textContent = isImage ? "" : formatDate(date);
    previewBadge.textContent = cat;

    if (isImage) {
      const src = inputImageSrc.value.trim();
      previewThumb.src = src || "img/personal_preview.jpg";
      if (previewPlayIcon) previewPlayIcon.style.display = "none";
    } else {
      const val = inputVideoUrl.value.trim();
      const customThumb = inputVideoThumbSrc ? inputVideoThumbSrc.value.trim() : "";
      const isLocal =
        val.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(val);
      const vid = isLocal ? val : extractVideoId(val);
      if (customThumb) {
        previewThumb.src = customThumb;
      } else if (isLocal) {
        previewThumb.src = "img/personal_preview.jpg";
      } else if (vid) {
        previewThumb.src = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
      } else {
        previewThumb.src = "img/personal_preview.jpg";
      }
      if (previewPlayIcon) previewPlayIcon.style.display = "block";
    }
  }

  // Auto-Fetch Video Metadata from YouTube
  btnFetchMeta.addEventListener("click", async () => {
    const vid = extractVideoId(inputVideoUrl.value);
    if (!vid) {
      showToast(
        "Please enter a valid YouTube URL or 11-char Video ID first.",
        "error",
      );
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
      btnFetchMeta.textContent = "AUTO-FETCH";
    }
  });

  // Submit Work Form
  videoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const works = state.clients[state.activeClientKey]?.works;
    if (!works) return;

    const isImage = radioTypeImage.checked;
    const title = inputVideoTitle.value.trim();
    const category =
      inputCategory.value.trim() ||
      (isImage ? "Stream Thumbnail" : "Motion Graphic");
    const editIdx = parseInt(videoEditIndex.value, 10);

    if (!title) {
      showToast("Work Title is required.", "error");
      return;
    }

    let item = null;

    if (isImage) {
      const src = inputImageSrc.value.trim();
      if (!src) {
        showToast("Please select, upload, or enter an Image path.", "error");
        return;
      }
      item = {
        title: title,
        category: category,
        type: "image",
        src: src,
      };
    } else {
      const val = inputVideoUrl.value.trim();
      if (!val) {
        showToast(
          "Please enter a YouTube link or upload a video file.",
          "error",
        );
        return;
      }
      const isLocal =
        val.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(val);
      const vid = isLocal ? val : extractVideoId(val);
      if (!vid) {
        showToast(
          "Valid YouTube Video ID or video file path is required.",
          "error",
        );
        return;
      }
      const date = inputVideoDate.value
        ? new Date(inputVideoDate.value).toISOString()
        : new Date().toISOString();
      item = {
        id: vid,
        videoId: vid,
        title: title,
        category: category,
        type: "video",
        isLocalVideo: isLocal,
        pubDate: date,
        src: inputVideoThumbSrc?.value.trim()
          ? inputVideoThumbSrc.value.trim()
          : (isLocal
              ? inputImageSrc.value.trim() || "img/personal_preview.jpg"
              : `https://img.youtube.com/vi/${vid}/hqdefault.jpg`),
      };
    }

    if (editIdx >= 0 && editIdx < works.length) {
      works[editIdx] = item;
      showToast(`Updated "${title}"`, "success");
    } else {
      // Add to top of works list
      works.unshift(item);
      showToast(
        `Added "${title}" to ${state.clients[state.activeClientKey]?.name}!`,
        "success",
      );
    }

    markChanges();
    renderClientTabs();
    updateActiveClientProfile();
    updateGlobalStats();
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
      if (statYtStatus) statYtStatus.textContent = "SYNCED";

      if (data.newVideos && data.newVideos.length > 0) {
        state.discoveredYtVideos = data.newVideos;
        renderDiscoveredVideos(data.newVideos);
        ytScanBanner.style.display = "block";
        showToast(
          `Found ${data.newVideos.length} new YouTube uploads!`,
          "success",
        );
      } else {
        ytScanBanner.style.display = "none";
        showToast(
          "Your video catalog is fully up to date with YouTube!",
          "success",
        );
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
    `,
      )
      .join("");

    ytScanList.querySelectorAll("[data-add-yt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.addYt, 10);
        const item = state.discoveredYtVideos[idx];
        const works = state.clients.personal?.works;
        if (item && works) {
          works.unshift({
            id: item.id,
            videoId: item.id,
            title: item.title,
            category: "Motion Graphic",
            type: "video",
            pubDate: item.pubDate || new Date().toISOString(),
            src: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
          });
          state.discoveredYtVideos.splice(idx, 1);
          renderDiscoveredVideos(state.discoveredYtVideos);
          if (state.discoveredYtVideos.length === 0) {
            ytScanBanner.style.display = "none";
          }
          markChanges();
          renderClientTabs();
          updateActiveClientProfile();
          updateGlobalStats();
          renderCatalog();
          showToast(`Added "${item.title}" to Personal Project!`, "success");
        }
      });
    });
  }

  btnAddAllYtVideos.addEventListener("click", () => {
    const works = state.clients.personal?.works;
    if (!state.discoveredYtVideos.length || !works) return;
    state.discoveredYtVideos.forEach((v) => {
      works.unshift({
        id: v.id,
        videoId: v.id,
        title: v.title,
        category: "Motion Graphic",
        type: "video",
        pubDate: v.pubDate || new Date().toISOString(),
        src: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
      });
    });
    state.discoveredYtVideos = [];
    ytScanBanner.style.display = "none";
    markChanges();
    renderClientTabs();
    updateActiveClientProfile();
    updateGlobalStats();
    renderCatalog();
    showToast("Added all new uploads to Personal Project!", "success");
  });

  btnDismissYtBanner.addEventListener("click", () => {
    ytScanBanner.style.display = "none";
  });

  // ── GIT COMMIT & SAVE ──
  btnSaveAndCommit.addEventListener("click", openCommitModal);
  btnQuickCommit.addEventListener("click", openCommitModal);

  function openCommitModal() {
    let totalWorks = 0;
    const clientCount = Object.keys(state.clients).length;
    for (const c of Object.values(state.clients)) {
      totalWorks += c.works?.length || 0;
    }

    summaryTotal.textContent = `${totalWorks} works across ${clientCount} collections`;
    commitTerminalBox.style.display = "none";
    commitTerminalOutput.textContent = "";

    // Conventional commit message auto-generation
    const activeName =
      state.clients[state.activeClientKey]?.name || state.activeClientKey;
    let autoMsg = `feat(catalog): update client collections and works (${totalWorks} works)`;
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
    commitTerminalOutput.textContent =
      "⚙️ Validating clients data schema and assets...\n";

    const commitMsg =
      commitMessageInput.value.trim() ||
      `feat(catalog): update client collections and works`;
    const push = checkPushRemote.checked;

    try {
      commitTerminalOutput.textContent +=
        "📝 Writing clients.json and catalog.json...\n";
      commitTerminalOutput.textContent +=
        "🔄 Syncing script.js and index.html counts...\n";
      commitTerminalOutput.textContent +=
        "⚡ Checking JavaScript syntax with node --check...\n";
      commitTerminalOutput.textContent +=
        "🌿 Staging git changes & committing...\n";

      const res = await apiRequest("/api/admin/clients/save", {
        method: "POST",
        body: {
          clients: state.clients,
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

      // Update state snapshot
      state.originalClients = JSON.parse(JSON.stringify(state.clients));
      state.hasUnsavedChanges = false;
      updateChangesBanner();

      if (res.gitStatus) {
        updateGitStatusUI(res.gitStatus);
      }

      showToast("Portfolio catalog saved & committed to Git!", "success");

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

  // ── CONFIRM PUSH TO GITHUB MODAL ──
  const confirmPushModalBackdrop = document.getElementById(
    "confirmPushModalBackdrop",
  );
  const btnClosePushModal = document.getElementById("btnClosePushModal");
  const btnCancelPushModal = document.getElementById("btnCancelPushModal");
  const btnConfirmPushAction = document.getElementById("btnConfirmPushAction");

  function openPushConfirmModal() {
    if (confirmPushModalBackdrop)
      confirmPushModalBackdrop.style.display = "flex";
  }

  function closePushConfirmModal() {
    if (confirmPushModalBackdrop)
      confirmPushModalBackdrop.style.display = "none";
  }

  if (btnClosePushModal)
    btnClosePushModal.addEventListener("click", closePushConfirmModal);
  if (btnCancelPushModal)
    btnCancelPushModal.addEventListener("click", closePushConfirmModal);
  if (confirmPushModalBackdrop) {
    confirmPushModalBackdrop.addEventListener("click", (e) => {
      if (e.target === confirmPushModalBackdrop) closePushConfirmModal();
    });
  }

  if (btnConfirmPushAction) {
    btnConfirmPushAction.addEventListener("click", async () => {
      closePushConfirmModal();
      await executeGitPush();
    });
  }

  // ── MANUAL GIT PUSH ──
  btnPushRemote.addEventListener("click", openPushConfirmModal);
  if (btnDrawerPush) btnDrawerPush.addEventListener("click", openPushConfirmModal);

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
    if (e.target === gitDrawerBackdrop)
      gitDrawerBackdrop.style.display = "none";
  });

  // ── SECURITY DRAWER ──
  btnSecDashboard.addEventListener("click", () => {
    secDrawerBackdrop.style.display = "flex";
  });
  btnCloseSecDrawer.addEventListener("click", () => {
    secDrawerBackdrop.style.display = "none";
  });
  secDrawerBackdrop.addEventListener("click", (e) => {
    if (e.target === secDrawerBackdrop)
      secDrawerBackdrop.style.display = "none";
  });

  // ── PREVIEW LIGHTBOXES ──
  function openVideoPlayer(videoId, title) {
    playerModalTitle.textContent = title || "VIDEO PREVIEW";
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

  function openImageLightbox(src, title) {
    if (lightboxTitle) lightboxTitle.textContent = title || "ARTWORK PREVIEW";
    if (lightboxImg) lightboxImg.src = src;
    if (imageLightboxBackdrop) imageLightboxBackdrop.style.display = "flex";
  }

  function closeImageLightbox() {
    if (imageLightboxBackdrop) imageLightboxBackdrop.style.display = "none";
    if (lightboxImg) lightboxImg.src = "";
  }

  if (btnCloseLightbox)
    btnCloseLightbox.addEventListener("click", closeImageLightbox);
  if (imageLightboxBackdrop) {
    imageLightboxBackdrop.addEventListener("click", (e) => {
      if (e.target === imageLightboxBackdrop) closeImageLightbox();
    });
  }

  // ── CLIENT STATUS TOGGLE (Banner) ──
  const clientStatusCheck = document.getElementById("clientStatusCheck");
  const clientStatusLabel = document.getElementById("clientStatusLabel");
  if (clientStatusCheck) {
    clientStatusCheck.addEventListener("change", () => {
      const client = state.clients[state.activeClientKey];
      if (!client) return;
      const isOnline = clientStatusCheck.checked;
      client.status = isOnline ? "online" : "offline";
      if (clientStatusLabel)
        clientStatusLabel.textContent = isOnline ? "ONLINE" : "OFFLINE";
      markChanges();
      renderClientTabs();
      showToast(
        `Catalog "${client.name}" set to ${isOnline ? "ONLINE" : "OFFLINE"}.`,
        "info",
      );
    });
  }

  // ── EDIT CLIENT MODAL ──
  const editClientModalBackdrop = document.getElementById(
    "editClientModalBackdrop",
  );
  const editClientForm = document.getElementById("editClientForm");
  const editClientKeyInput = document.getElementById("editClientKey");
  const editClientNameInput = document.getElementById("editClientName");
  const editClientHandleInput = document.getElementById("editClientHandle");
  const editClientAvatarInput = document.getElementById("editClientAvatar");
  const editClientAvatarPreview = document.getElementById(
    "editClientAvatarPreview",
  );
  const editClientAvatarFile = document.getElementById("editClientAvatarFile");
  const editClientDescInput = document.getElementById("editClientDesc");
  const editClientCoverPreview = document.getElementById(
    "editClientCoverPreview",
  );
  const editClientPreviewImgInput = document.getElementById(
    "editClientPreviewImg",
  );
  const editClientCoverFile = document.getElementById("editClientCoverFile");
  const editClientStatusInput = document.getElementById("editClientStatus");
  const editClientStatusLabel = document.getElementById(
    "editClientStatusLabel",
  );
  const editClientLinksList = document.getElementById("editClientLinksList");
  const btnAddClientLink = document.getElementById("btnAddClientLink");
  const btnEditClientInfo = document.getElementById("btnEditClientInfo");
  const btnCloseEditClientModal = document.getElementById(
    "btnCloseEditClientModal",
  );
  const btnCancelEditClient = document.getElementById("btnCancelEditClient");

  function syncEditAvatarPreview(val) {
    if (!editClientAvatarPreview) return;
    const v = (val || "").trim();
    const isImg = v.includes("/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(v);
    if (isImg) {
      editClientAvatarPreview.innerHTML = `<img src="${v}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.onerror=null;this.parentElement.textContent='?'" />`;
    } else {
      editClientAvatarPreview.textContent =
        v || (editClientNameInput?.value?.charAt(0) || "?").toUpperCase();
    }
  }

  function syncEditCoverPreview(val) {
    if (!editClientCoverPreview) return;
    const v = (val || "").trim();
    editClientCoverPreview.src = v || "img/personal_preview.jpg";
  }

  function openEditClientModal() {
    const key = state.activeClientKey;
    const client = state.clients[key] || {};
    if (editClientKeyInput) editClientKeyInput.value = key;
    if (editClientNameInput) editClientNameInput.value = client.name || "";
    if (editClientHandleInput)
      editClientHandleInput.value = client.handle || "";
    if (editClientAvatarInput)
      editClientAvatarInput.value = client.avatar || "";
    syncEditAvatarPreview(client.avatar || client.name?.charAt(0) || "");

    const coverSrc = client.previewImg || "";
    if (editClientPreviewImgInput) editClientPreviewImgInput.value = coverSrc;
    syncEditCoverPreview(coverSrc);

    if (editClientDescInput) editClientDescInput.value = client.desc || "";
    const isOnline = client.status !== "offline";
    if (editClientStatusInput) editClientStatusInput.checked = isOnline;
    syncEditStatusLabel(isOnline);
    renderEditLinkRows(client.links || []);
    if (editClientModalBackdrop) editClientModalBackdrop.style.display = "flex";
  }

  function closeEditClientModal() {
    if (editClientModalBackdrop) editClientModalBackdrop.style.display = "none";
  }

  function syncEditStatusLabel(isOnline) {
    if (!editClientStatusLabel) return;
    editClientStatusLabel.textContent = isOnline ? "ONLINE" : "OFFLINE";
    editClientStatusLabel.className =
      "status-toggle-state-label" + (isOnline ? "" : " offline");
  }

  if (editClientAvatarInput) {
    editClientAvatarInput.addEventListener("input", () =>
      syncEditAvatarPreview(editClientAvatarInput.value),
    );
  }
  if (editClientPreviewImgInput) {
    editClientPreviewImgInput.addEventListener("input", () =>
      syncEditCoverPreview(editClientPreviewImgInput.value),
    );
  }

  if (editClientAvatarFile) {
    editClientAvatarFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) {
        showToast(`Avatar size exceeds 20MB limit.`, "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          showToast("Uploading avatar...", "info");
          const res = await apiRequest("/api/admin/upload-client-avatar", {
            method: "POST",
            body: {
              clientKey: editClientKeyInput?.value || state.activeClientKey,
              fileName: file.name,
              fileData: evt.target.result,
            },
          });
          if (res.success && res.path) {
            if (editClientAvatarInput) editClientAvatarInput.value = res.path;
            syncEditAvatarPreview(res.path);
            showToast("Avatar image uploaded!", "success");
          }
        } catch (err) {
          showToast(`Avatar upload failed: ${err.message}`, "error");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (editClientCoverFile) {
    editClientCoverFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) {
        showToast(`Catalog cover size exceeds 20MB limit.`, "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          showToast("Uploading cover image...", "info");
          const res = await apiRequest("/api/admin/upload-catalog-cover", {
            method: "POST",
            body: {
              clientKey: editClientKeyInput?.value || state.activeClientKey,
              fileName: file.name,
              fileData: evt.target.result,
            },
          });
          if (res.success && res.path) {
            if (editClientPreviewImgInput)
              editClientPreviewImgInput.value = res.path;
            syncEditCoverPreview(res.path);
            showToast("Catalog cover updated!", "success");
          }
        } catch (err) {
          showToast(`Cover upload failed: ${err.message}`, "error");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (editClientStatusInput) {
    editClientStatusInput.addEventListener("change", () =>
      syncEditStatusLabel(editClientStatusInput.checked),
    );
  }

  // Render editable link rows
  function renderEditLinkRows(links) {
    if (!editClientLinksList) return;
    editClientLinksList.innerHTML = "";
    links.forEach((link, i) => addEditLinkRow(link, i));
  }

  function addEditLinkRow(link = {}, index) {
    const row = document.createElement("div");
    row.className = "link-manager-row";
    row.dataset.idx = index !== undefined ? index : Date.now();
    row.innerHTML = `
      <input type="text" placeholder="Platform (e.g. YouTube)" class="lm-platform" value="${link.platform || ""}" />
      <input type="url" placeholder="URL (https://...)" class="lm-url" value="${link.url || ""}" />
      <input type="text" placeholder="Icon path (img/icons/...)" class="lm-icon" value="${link.icon || ""}" />
      <button type="button" class="link-del-btn" title="Remove">×</button>
    `;
    row
      .querySelector(".link-del-btn")
      .addEventListener("click", () => row.remove());
    if (editClientLinksList) editClientLinksList.appendChild(row);
  }

  if (btnAddClientLink) {
    btnAddClientLink.addEventListener("click", () => addEditLinkRow());
  }

  if (btnEditClientInfo) {
    btnEditClientInfo.addEventListener("click", openEditClientModal);
  }
  if (btnCloseEditClientModal) {
    btnCloseEditClientModal.addEventListener("click", closeEditClientModal);
  }
  if (btnCancelEditClient) {
    btnCancelEditClient.addEventListener("click", closeEditClientModal);
  }
  if (editClientModalBackdrop) {
    editClientModalBackdrop.addEventListener("click", (e) => {
      if (e.target === editClientModalBackdrop) closeEditClientModal();
    });
  }

  if (editClientForm) {
    editClientForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const key = editClientKeyInput
        ? editClientKeyInput.value
        : state.activeClientKey;
      const client = state.clients[key];
      if (!client) return;

      client.name = editClientNameInput.value.trim() || client.name;
      client.handle = editClientHandleInput.value.trim();
      client.avatar =
        editClientAvatarInput.value.trim() ||
        client.name.charAt(0).toUpperCase();
      if (editClientPreviewImgInput) {
        client.previewImg = editClientPreviewImgInput.value.trim();
      }
      client.desc = editClientDescInput.value.trim();
      client.status = editClientStatusInput.checked ? "online" : "offline";

      // Collect links from rows
      const rows = editClientLinksList
        ? editClientLinksList.querySelectorAll(".link-manager-row")
        : [];
      const links = [];
      rows.forEach((row) => {
        const platform = row.querySelector(".lm-platform")?.value.trim() || "";
        const url = row.querySelector(".lm-url")?.value.trim() || "";
        const icon = row.querySelector(".lm-icon")?.value.trim() || "";
        if (url) links.push({ platform, url, icon, label: platform });
      });
      client.links = links;

      markChanges();
      closeEditClientModal();
      renderClientTabs();
      updateActiveClientProfile();
      showToast(
        `Client "${client.name}" updated! Click SAVE & COMMIT to persist.`,
        "success",
      );
    });
  }

  // ── NAVBAR WORK STATUS TOGGLE (HOMEPAGE WIDGET) ──
  function updateNavWorkStatusUI(isAvailable) {
    if (navWorkStatusToggle) {
      navWorkStatusToggle.checked = Boolean(isAvailable);
    }
    if (navWorkStatusLabel) {
      navWorkStatusLabel.textContent = isAvailable
        ? "AVAILABLE FOR WORK"
        : "CURRENTLY UNAVAILABLE";
      navWorkStatusLabel.style.color = isAvailable ? "#22c55e" : "#ff4d4f";
    }
  }

  async function loadWorkStatus() {
    try {
      const data = await apiRequest("/api/admin/about");
      if (data) {
        const isAvail = data.workStatus !== "unavailable";
        updateNavWorkStatusUI(isAvail);
      }
    } catch (err) {
      console.warn("Could not load initial work status:", err.message);
    }
  }

  if (navWorkStatusToggle) {
    navWorkStatusToggle.addEventListener("change", async () => {
      const isAvail = navWorkStatusToggle.checked;
      updateNavWorkStatusUI(isAvail);
      try {
        const res = await apiRequest("/api/admin/work-status", {
          method: "POST",
          body: {
            status: isAvail ? "available" : "unavailable",
            isAvailable: isAvail,
          },
        });
        if (res.gitStatus) {
          updateGitStatusUI(res.gitStatus);
        }
        showToast(
          `Work status set to ${isAvail ? "AVAILABLE FOR WORK" : "CURRENTLY UNAVAILABLE"} and committed!`,
          "success",
        );
      } catch (err) {
        updateNavWorkStatusUI(!isAvail);
        showToast(`Failed to update work status: ${err.message}`, "error");
      }
    });
  }

  // ── ABOUT SECTION MANAGER ──
  const aboutManagerModalBackdrop = document.getElementById(
    "aboutManagerModalBackdrop",
  );
  const btnAboutManager = document.getElementById("btnAboutManager");
  const btnCloseAboutModal = document.getElementById("btnCloseAboutModal");
  const btnCancelAbout = document.getElementById("btnCancelAbout");
  const aboutManagerForm = document.getElementById("aboutManagerForm");
  const btnSaveAbout = document.getElementById("btnSaveAbout");
  const aboutAvatarThumb =
    document.getElementById("aboutAvatarThumb") ||
    document.getElementById("aboutAvatarPreview");
  const aboutAvatarSrc = document.getElementById("aboutAvatarSrc");
  const aboutAvatarUpload =
    document.getElementById("aboutAvatarUpload") ||
    document.getElementById("aboutAvatarFile");
  const aboutAvatarStatus = document.getElementById("aboutAvatarStatus");
  const btnAutoTranslate =
    document.getElementById("btnAutoTranslate") ||
    document.getElementById("btnAutoTranslateAbout");

  // Multilingual textareas
  const aboutOverviewEn = document.getElementById("aboutOverviewEn");
  const aboutBackgroundEn = document.getElementById("aboutBackgroundEn");
  const aboutOverviewTh = document.getElementById("aboutOverviewTh");
  const aboutBackgroundTh = document.getElementById("aboutBackgroundTh");
  const aboutOverviewJp = document.getElementById("aboutOverviewJp");
  const aboutBackgroundJp = document.getElementById("aboutBackgroundJp");
  const aboutOverviewCn = document.getElementById("aboutOverviewCn");
  const aboutBackgroundCn = document.getElementById("aboutBackgroundCn");

  async function openAboutModal() {
    try {
      const data = await apiRequest("/api/admin/about");
      if (data) {
        // Sync navbar work status
        const isAvail = data.workStatus !== "unavailable";
        updateNavWorkStatusUI(isAvail);

        // Avatar
        if (data.avatar) {
          if (aboutAvatarThumb) aboutAvatarThumb.src = data.avatar;
          if (aboutAvatarSrc) aboutAvatarSrc.value = data.avatar;
        }
        if (aboutAvatarStatus) aboutAvatarStatus.textContent = "Ready";

        // Multilingual fields
        if (aboutOverviewEn) aboutOverviewEn.value = data.overview?.en || "";
        if (aboutBackgroundEn)
          aboutBackgroundEn.value = data.background?.en || "";
        if (aboutOverviewTh) aboutOverviewTh.value = data.overview?.th || "";
        if (aboutBackgroundTh)
          aboutBackgroundTh.value = data.background?.th || "";
        if (aboutOverviewJp) aboutOverviewJp.value = data.overview?.jp || "";
        if (aboutBackgroundJp)
          aboutBackgroundJp.value = data.background?.jp || "";
        if (aboutOverviewCn) aboutOverviewCn.value = data.overview?.cn || "";
        if (aboutBackgroundCn)
          aboutBackgroundCn.value = data.background?.cn || "";
      }

      // Default active tab to English
      selectAboutLangTab("en");

      if (aboutManagerModalBackdrop) {
        aboutManagerModalBackdrop.style.display = "flex";
      }
    } catch (err) {
      showToast("Could not load About section: " + err.message, "error");
    }
  }

  function closeAboutModal() {
    if (aboutManagerModalBackdrop) {
      aboutManagerModalBackdrop.style.display = "none";
    }
  }

  // Language Tabs Switching
  function selectAboutLangTab(lang) {
    const tabs = document.querySelectorAll(".about-lang-tab");
    const panes = document.querySelectorAll(".about-lang-pane");
    tabs.forEach((tab) => {
      if (tab.dataset.lang === lang) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });
    panes.forEach((pane) => {
      if (pane.dataset.pane === lang) {
        pane.classList.add("active");
        pane.style.display = "flex";
      } else {
        pane.classList.remove("active");
        pane.style.display = "none";
      }
    });
  }

  document.querySelectorAll(".about-lang-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      selectAboutLangTab(tab.dataset.lang);
    });
  });

  if (aboutAvatarSrc) {
    aboutAvatarSrc.addEventListener("input", () => {
      const val = aboutAvatarSrc.value.trim();
      if (aboutAvatarThumb && val) {
        aboutAvatarThumb.src = val;
      }
    });
  }

  // Avatar Upload (Max 20MB)
  if (aboutAvatarUpload) {
    aboutAvatarUpload.addEventListener("change", () => {
      const file = aboutAvatarUpload.files?.[0];
      if (!file) return;

      if (file.size > 20 * 1024 * 1024) {
        showToast("Avatar image exceeds 20MB limit.", "error");
        if (aboutAvatarStatus)
          aboutAvatarStatus.textContent = "⚠️ Exceeds 20MB";
        return;
      }

      if (aboutAvatarStatus)
        aboutAvatarStatus.textContent = `Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB...`;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const res = await apiRequest("/api/admin/upload-about-avatar", {
            method: "POST",
            body: {
              fileName: file.name,
              fileData: evt.target.result,
            },
          });
          if (res.success && res.path) {
            if (aboutAvatarThumb) {
              aboutAvatarThumb.src = res.path + "?t=" + Date.now();
            }
            if (aboutAvatarStatus) {
              aboutAvatarStatus.textContent = `✓ Uploaded: ${file.name}`;
            }
            showToast("About avatar image updated!", "success");
          }
        } catch (err) {
          if (aboutAvatarStatus) aboutAvatarStatus.textContent = "Upload failed";
          showToast(`Avatar upload failed: ${err.message}`, "error");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Auto-Translate Button (Translates English to Thai, Japanese, Chinese)
  if (btnAutoTranslate) {
    btnAutoTranslate.addEventListener("click", async () => {
      const ovEn = aboutOverviewEn ? aboutOverviewEn.value.trim() : "";
      const bgEn = aboutBackgroundEn ? aboutBackgroundEn.value.trim() : "";

      if (!ovEn && !bgEn) {
        showToast(
          "Please enter English Overview or Background first to auto-translate.",
          "error",
        );
        return;
      }

      btnAutoTranslate.disabled = true;
      const originalText = btnAutoTranslate.innerHTML;
      btnAutoTranslate.textContent = "TRANSLATING (TH, JP, CN)...";

      try {
        if (ovEn) {
          const resOv = await apiRequest("/api/admin/translate", {
            method: "POST",
            body: { text: ovEn },
          });
          const t = resOv.translations || {};
          if (t.th && aboutOverviewTh) aboutOverviewTh.value = t.th;
          if (t.jp && aboutOverviewJp) aboutOverviewJp.value = t.jp;
          if (t.cn && aboutOverviewCn) aboutOverviewCn.value = t.cn;
        }

        if (bgEn) {
          const resBg = await apiRequest("/api/admin/translate", {
            method: "POST",
            body: { text: bgEn },
          });
          const t = resBg.translations || {};
          if (t.th && aboutBackgroundTh) aboutBackgroundTh.value = t.th;
          if (t.jp && aboutBackgroundJp) aboutBackgroundJp.value = t.jp;
          if (t.cn && aboutBackgroundCn) aboutBackgroundCn.value = t.cn;
        }

        showToast(
          "Auto-translated overview & background to Thai, Japanese, and Chinese!",
          "success",
        );
      } catch (err) {
        showToast(`Auto-translate failed: ${err.message}`, "error");
      } finally {
        btnAutoTranslate.disabled = false;
        btnAutoTranslate.innerHTML = originalText;
      }
    });
  }

  // Submit About Manager Form
  if (aboutManagerForm) {
    aboutManagerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (btnSaveAbout) {
        btnSaveAbout.disabled = true;
        btnSaveAbout.textContent = "SAVING & COMMITTING...";
      }

      try {
        const avatarSrc = (
          aboutAvatarSrc?.value.trim() ||
          aboutAvatarThumb?.getAttribute("src") ||
          "img/about_avatar.jpg"
        ).split("?")[0];
        const payload = {
          workStatus: navWorkStatusToggle?.checked
            ? "available"
            : "unavailable",
          avatar: avatarSrc,
          overview: {
            en: aboutOverviewEn ? aboutOverviewEn.value.trim() : "",
            th: aboutOverviewTh ? aboutOverviewTh.value.trim() : "",
            jp: aboutOverviewJp ? aboutOverviewJp.value.trim() : "",
            cn: aboutOverviewCn ? aboutOverviewCn.value.trim() : "",
          },
          background: {
            en: aboutBackgroundEn ? aboutBackgroundEn.value.trim() : "",
            th: aboutBackgroundTh ? aboutBackgroundTh.value.trim() : "",
            jp: aboutBackgroundJp ? aboutBackgroundJp.value.trim() : "",
            cn: aboutBackgroundCn ? aboutBackgroundCn.value.trim() : "",
          },
        };

        const res = await apiRequest("/api/admin/about", {
          method: "POST",
          body: payload,
        });

        if (res.gitStatus) {
          updateGitStatusUI(res.gitStatus);
        }

        showToast(
          "About section saved & committed to Git!",
          "success",
        );
        closeAboutModal();
      } catch (err) {
        showToast(`Failed to save About section: ${err.message}`, "error");
      } finally {
        if (btnSaveAbout) {
          btnSaveAbout.disabled = false;
          btnSaveAbout.innerHTML =
            '<img src="img/icons/sync.png" class="btn-icon-svg" alt="" /> SAVE &amp; COMMIT ABOUT SECTION';
        }
      }
    });
  }

  if (btnAboutManager)
    btnAboutManager.addEventListener("click", openAboutModal);
  if (btnCloseAboutModal)
    btnCloseAboutModal.addEventListener("click", closeAboutModal);
  if (btnCancelAbout)
    btnCancelAbout.addEventListener("click", closeAboutModal);
  if (aboutManagerModalBackdrop) {
    aboutManagerModalBackdrop.addEventListener("click", (e) => {
      if (e.target === aboutManagerModalBackdrop) closeAboutModal();
    });
  }

  // ── MAIN SOCIAL MEDIA MANAGER ──
  const socialManagerModalBackdrop = document.getElementById(
    "socialManagerModalBackdrop",
  );
  const btnSocialManager = document.getElementById("btnSocialManager");
  const btnCloseSocialModal = document.getElementById("btnCloseSocialModal");
  const btnCancelSocial = document.getElementById("btnCancelSocial");
  const socialManagerForm = document.getElementById("socialManagerForm");
  const btnSaveSocial = document.getElementById("btnSaveSocial");
  const btnAddMainSocialLink = document.getElementById("btnAddMainSocialLink");
  const mainSocialLinksList = document.getElementById("mainSocialLinksList");

  const PLATFORM_PRESETS = [
    {
      platform: "YouTube",
      icon: "img/icons/Platform=YouTube, Color=Negative.png",
      placeholder: "https://www.youtube.com/@channel",
    },
    {
      platform: "Instagram",
      icon: "img/icons/Platform=Instagram, Color=Negative.png",
      placeholder: "https://www.instagram.com/username/",
    },
    {
      platform: "Twitter / X",
      icon: "img/icons/Platform=X (Twitter), Color=Negative.png",
      placeholder: "https://x.com/username",
    },
    {
      platform: "Twitch",
      icon: "img/icons/Platform=Twitch, Color=Negative.png",
      placeholder: "https://www.twitch.tv/username",
    },
    {
      platform: "TikTok",
      icon: "img/icons/Platform=TikTok, Color=Negative.png",
      placeholder: "https://www.tiktok.com/@username",
    },
    {
      platform: "Facebook",
      icon: "img/icons/Platform=Facebook, Color=Negative.png",
      placeholder: "https://web.facebook.com/username",
    },
    {
      platform: "SoundCloud",
      icon: "img/icons/Platform=SoundCloud, Color=Negative.png",
      placeholder: "https://soundcloud.com/username",
    },
    {
      platform: "Discord",
      icon: "img/icons/Platform=Discord, Color=Negative.png",
      placeholder: "username.tag (click to copy)",
    },
  ];

  async function openSocialModal() {
    try {
      const data = await apiRequest("/api/admin/social-links");
      const links =
        Array.isArray(data?.links) && data.links.length > 0
          ? data.links
          : PLATFORM_PRESETS;
      renderSocialLinkRows(links);
      if (socialManagerModalBackdrop) {
        socialManagerModalBackdrop.style.display = "flex";
      }
    } catch (err) {
      showToast("Could not load social links: " + err.message, "error");
    }
  }

  function closeSocialModal() {
    if (socialManagerModalBackdrop) {
      socialManagerModalBackdrop.style.display = "none";
    }
  }

  function renderSocialLinkRows(links) {
    if (!mainSocialLinksList) return;
    mainSocialLinksList.innerHTML = "";
    links.forEach((link) => {
      addMainSocialLinkRow(link);
    });
  }

  function addMainSocialLinkRow(link = {}) {
    const row = document.createElement("div");
    row.className = "link-manager-row";
    row.style.alignItems = "center";
    const isDiscord = link.platform === "Discord" || !!link.isDiscord;
    const urlVal = isDiscord
      ? link.discordTag || link.url || ""
      : link.url || "";

    row.innerHTML = `
      <input type="text" placeholder="Platform (e.g. YouTube, Discord)" class="lm-platform" value="${link.platform || ""}" style="max-width: 140px;" />
      <input type="text" placeholder="${isDiscord ? "Discord Tag (click to copy)" : "URL (https://...)"}" class="lm-url" value="${urlVal}" style="flex: 2;" />
      <input type="text" placeholder="Icon path: img/icons/..." class="lm-icon" value="${link.icon || ""}" style="flex: 1.5;" />
      <button type="button" class="link-del-btn" title="Remove link">×</button>
    `;

    const platformInput = row.querySelector(".lm-platform");
    const iconInput = row.querySelector(".lm-icon");
    const urlInput = row.querySelector(".lm-url");

    platformInput.addEventListener("input", () => {
      const val = platformInput.value.trim().toLowerCase();
      const match = PLATFORM_PRESETS.find(
        (p) =>
          p.platform.toLowerCase() === val ||
          p.platform.toLowerCase().includes(val),
      );
      if (match && !iconInput.value) {
        iconInput.value = match.icon;
      }
      if (val.includes("discord")) {
        urlInput.placeholder = "Discord Tag: username.tag";
      } else {
        urlInput.placeholder = "URL (https://...)";
      }
    });

    row
      .querySelector(".link-del-btn")
      .addEventListener("click", () => row.remove());
    if (mainSocialLinksList) mainSocialLinksList.appendChild(row);
  }

  if (btnAddMainSocialLink) {
    btnAddMainSocialLink.addEventListener("click", () => {
      addMainSocialLinkRow();
    });
  }

  if (socialManagerForm) {
    socialManagerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (btnSaveSocial) {
        btnSaveSocial.disabled = true;
        btnSaveSocial.textContent = "SAVING & COMMITTING...";
      }

      try {
        const rows = mainSocialLinksList
          ? mainSocialLinksList.querySelectorAll(".link-manager-row")
          : [];
        const links = [];
        rows.forEach((row) => {
          const platform =
            row.querySelector(".lm-platform")?.value.trim() || "";
          const url = row.querySelector(".lm-url")?.value.trim() || "";
          const icon = row.querySelector(".lm-icon")?.value.trim() || "";
          if (platform || url) {
            const isDiscord = platform.toLowerCase().includes("discord");
            links.push({
              platform,
              url: isDiscord ? "" : url,
              discordTag: isDiscord ? url : "",
              isDiscord,
              icon,
              label: platform,
            });
          }
        });

        const res = await apiRequest("/api/admin/social-links", {
          method: "POST",
          body: { links },
        });

        if (res.gitStatus) {
          updateGitStatusUI(res.gitStatus);
        }

        showToast(
          "Main social media links saved & committed to Git!",
          "success",
        );
        closeSocialModal();
      } catch (err) {
        showToast(`Failed to save social links: ${err.message}`, "error");
      } finally {
        if (btnSaveSocial) {
          btnSaveSocial.disabled = false;
          btnSaveSocial.innerHTML =
            '<img src="img/icons/sync.png" class="btn-icon-svg" alt="" /> SAVE &amp; COMMIT SOCIAL LINKS';
        }
      }
    });
  }

  if (btnSocialManager)
    btnSocialManager.addEventListener("click", openSocialModal);
  if (btnCloseSocialModal)
    btnCloseSocialModal.addEventListener("click", closeSocialModal);
  if (btnCancelSocial)
    btnCancelSocial.addEventListener("click", closeSocialModal);
  if (socialManagerModalBackdrop) {
    socialManagerModalBackdrop.addEventListener("click", (e) => {
      if (e.target === socialManagerModalBackdrop) closeSocialModal();
    });
  }

  // ── CONTACT INBOX / MESSAGES ──
  const contactModalBackdrop = document.getElementById("contactModalBackdrop");
  const btnContactList = document.getElementById("btnContactList");
  const inboxUnreadBadge = document.getElementById("inboxUnreadBadge");
  const btnRefreshContacts = document.getElementById("btnRefreshContacts");
  const btnCloseContactModal = document.getElementById("btnCloseContactModal");
  const btnCloseContactFooter = document.getElementById(
    "btnCloseContactFooter",
  );
  const contactMessagesContainer = document.getElementById(
    "contactMessagesContainer",
  );
  const contactModalSubtitle = document.getElementById("contactModalSubtitle");

  async function updateInboxBadge() {
    try {
      const data = await apiRequest("/api/admin/contacts");
      const list = Array.isArray(data?.contacts) ? data.contacts : [];
      const unread = list.filter((m) => !m.isRead && !m.read).length;
      if (inboxUnreadBadge) {
        if (unread > 0) {
          inboxUnreadBadge.textContent = unread;
          inboxUnreadBadge.style.display = "inline-block";
        } else {
          inboxUnreadBadge.style.display = "none";
        }
      }
      return list;
    } catch (e) {
      return [];
    }
  }

  async function loadContactMessages() {
    if (!contactMessagesContainer) return;
    contactMessagesContainer.innerHTML =
      '<div style="color:#888; padding:20px; text-align:center;">Loading messages...</div>';

    try {
      const data = await apiRequest("/api/admin/contacts");
      const list = Array.isArray(data?.contacts) ? data.contacts : [];
      const unreadCount = list.filter((m) => !m.isRead && !m.read).length;

      if (contactModalSubtitle) {
        contactModalSubtitle.textContent = `${list.length} total message${list.length === 1 ? "" : "s"} • ${unreadCount} unread`;
      }

      if (inboxUnreadBadge) {
        if (unreadCount > 0) {
          inboxUnreadBadge.textContent = unreadCount;
          inboxUnreadBadge.style.display = "inline-block";
        } else {
          inboxUnreadBadge.style.display = "none";
        }
      }

      if (list.length === 0) {
        contactMessagesContainer.innerHTML = `
          <div style="padding: 40px 20px; text-align: center; color: #888;">
            <div style="font-size: 32px; margin-bottom: 12px;">📬</div>
            <div style="font-size: 15px; font-weight: 500; color: #bbb;">No contact messages yet</div>
            <div style="font-size: 13px; color: #666; margin-top: 4px;">Inquiries submitted via the Contact form will appear here.</div>
          </div>
        `;
        return;
      }

      // Sort newest first
      const sorted = [...list].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
      contactMessagesContainer.innerHTML = "";

      sorted.forEach((msg) => {
        const isRead = Boolean(msg.read || msg.isRead);
        const card = document.createElement("div");
        card.className = `contact-inbox-card ${isRead ? "read" : "unread"}`;
        card.dataset.id = msg.id;

        const dateStr = msg.date
          ? new Date(msg.date).toLocaleString()
          : "Unknown date";
        card.innerHTML = `
          <div class="contact-card-header">
            <div class="contact-sender-info">
              <span class="contact-sender-name">${escapeHtml(msg.name || "Anonymous")}</span>
              <a href="mailto:${escapeHtml(msg.email || "")}" class="contact-sender-email">${escapeHtml(msg.email || "")}</a>
              <span class="contact-badge ${isRead ? "read" : "new"}">${isRead ? "READ" : "NEW INQUIRY"}</span>
            </div>
            <div class="contact-date-info">
              <span class="contact-send-date">📅 ${escapeHtml(dateStr)}</span>
            </div>
          </div>
          <div class="contact-card-body">
            <div class="contact-message-text">${escapeHtml(msg.inquiry || msg.message || "(No message body)")}</div>
          </div>
          <div class="contact-card-actions">
            <button type="button" class="btn btn-xs btn-outline btn-toggle-read">
              ${isRead ? "Mark as Unread" : "✓ Mark as Read"}
            </button>
            <button type="button" class="btn btn-xs btn-danger-ghost btn-del-contact" title="Delete inquiry">
              🗑 Delete
            </button>
          </div>
        `;

        // Toggle read
        card
          .querySelector(".btn-toggle-read")
          .addEventListener("click", async () => {
            try {
              await apiRequest("/api/admin/contacts/toggle-read", {
                method: "POST",
                body: { id: msg.id, isRead: !isRead, read: !isRead },
              });
              await loadContactMessages();
            } catch (err) {
              showToast("Failed to update message: " + err.message, "error");
            }
          });

        // Delete
        card
          .querySelector(".btn-del-contact")
          .addEventListener("click", async () => {
            if (!confirm(`Delete contact message from "${msg.name}"?`)) return;
            try {
              await apiRequest(
                `/api/admin/contacts/${encodeURIComponent(msg.id)}`,
                {
                  method: "DELETE",
                },
              );
              showToast("Contact message deleted.", "info");
              await loadContactMessages();
            } catch (err) {
              showToast("Failed to delete message: " + err.message, "error");
            }
          });

        contactMessagesContainer.appendChild(card);
      });
    } catch (err) {
      contactMessagesContainer.innerHTML = `<div style="color:#ff4d4f; padding:20px;">Error loading messages: ${err.message}</div>`;
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function openContactModal() {
    loadContactMessages();
    if (contactModalBackdrop) {
      contactModalBackdrop.style.display = "flex";
    }
  }

  function closeContactModal() {
    if (contactModalBackdrop) {
      contactModalBackdrop.style.display = "none";
    }
  }

  if (btnContactList)
    btnContactList.addEventListener("click", openContactModal);
  if (btnRefreshContacts)
    btnRefreshContacts.addEventListener("click", loadContactMessages);
  if (btnCloseContactModal)
    btnCloseContactModal.addEventListener("click", closeContactModal);
  if (btnCloseContactFooter)
    btnCloseContactFooter.addEventListener("click", closeContactModal);
  if (contactModalBackdrop) {
    contactModalBackdrop.addEventListener("click", (e) => {
      if (e.target === contactModalBackdrop) closeContactModal();
    });
  }

  // Global ESC key listener
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAddClientModal();
      closeEditClientModal();
      closeAboutModal();
      closeSocialModal();
      closeContactModal();
      closePushConfirmModal();
      closeVideoModal();
      closeCommitModal();
      closeVideoPlayer();
      closeImageLightbox();
      if (gitDrawerBackdrop) gitDrawerBackdrop.style.display = "none";
      if (secDrawerBackdrop) secDrawerBackdrop.style.display = "none";
    }
  });

  // Start app
  init();
})();
