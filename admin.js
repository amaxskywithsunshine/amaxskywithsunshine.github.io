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
  const btnOpenAddClientModal = document.getElementById("btnOpenAddClientModal");
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

  const imageLightboxBackdrop = document.getElementById("imageLightboxBackdrop");
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

    // Password visibility toggle
    if (btnTogglePw && adminKeyInput) {
      btnTogglePw.addEventListener("click", () => {
        adminKeyInput.type = adminKeyInput.type === "password" ? "text" : "password";
        btnTogglePw.textContent = adminKeyInput.type === "password" ? "👁️" : "🙈";
      });
    }

    // Login Form Submit
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

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

      if (data.authenticated && state.hwidValid) {
        enterDashboard();
      } else {
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

  function updateHardwareUI(data) {
    if (diagHwid) diagHwid.textContent = data.currentHwid || "UNKNOWN";
    if (diagHost) diagHost.textContent = `${data.systemInfo?.hostname || "Local"} (${data.systemInfo?.platform || "OS"})`;

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
      if (statHostLabel) statHostLabel.textContent = `HOST: ${data.systemInfo?.hostname || "iTxAmax"}`;
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
        if (navHwidBadge) navHwidBadge.className = "navbar-status-pill mismatch";
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
    loadAllClients();
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
      `
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

      const card = document.createElement("button");
      card.type = "button";
      card.className = `client-box-tab ${isActive ? "active" : ""}`;
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
              <span class="status-dot-sm"></span> ONLINE
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
    const rawKey = inputClientKey.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
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
    const avatar = (inputClientAvatar.value.trim() || name.charAt(0) || "C").toUpperCase();
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

    showToast(`Created client collection "${name}". Remember to click SAVE & COMMIT!`, "success");
  }

  // ── ACTIVE CLIENT PROFILE & CLEAN SOCIAL ICONS ──
  function updateActiveClientProfile() {
    const client = state.clients[state.activeClientKey] || {};
    const works = client.works || [];

    if (activeClientAvatar) {
      activeClientAvatar.textContent = client.avatar || state.activeClientKey.charAt(0).toUpperCase();
    }
    if (activeClientName) activeClientName.textContent = client.name || state.activeClientKey;
    if (activeClientHandle) activeClientHandle.textContent = client.handle || "";
    if (activeClientDesc) activeClientDesc.textContent = client.desc || "";

    if (btnAddWorkLabel) {
      btnAddWorkLabel.textContent = `ADD WORK (${client.name || state.activeClientKey})`;
    }

    // USER REQUIREMENT: Social icons sized appropriately without text <span>
    if (activeClientLinks) {
      if (Array.isArray(client.links) && client.links.length > 0) {
        activeClientLinks.innerHTML = client.links
          .map(
            (link) => `
            <a href="${link.url}" target="_blank" rel="noopener" class="client-icon-btn" title="${link.platform || ''}${link.label ? `: ${link.label}` : ''}">
              ${link.icon ? `<img src="${link.icon}" alt="${link.platform || 'Link'}" class="client-link-icon" />` : `<span class="icon-fallback">${(link.platform || "L").charAt(0)}</span>`}
            </a>
          `
          )
          .join("");
      } else {
        activeClientLinks.innerHTML = "";
      }
    }

    // Update filter counts for active client
    const videoWorks = works.filter((w) => w.type === "video" || (!w.type && (w.videoId || w.id)));
    const imageWorks = works.filter((w) => w.type === "image" || (!w.videoId && !w.id && w.src));

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
      const isImage = item.type === "image" || (!item.videoId && !item.id && item.src);
      const isVideo = !isImage;

      if (state.filterType === "video" && !isVideo) return false;
      if (state.filterType === "image" && !isImage) return false;

      if (!query) return true;
      const title = (item.title || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const idOrSrc = String(item.videoId || item.id || item.src || "").toLowerCase();

      return title.includes(query) || cat.includes(query) || idOrSrc.includes(query);
    });

    catalogContainer.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    filtered.forEach((item) => {
      const realIndex = works.indexOf(item);
      const isImage = item.type === "image" || (!item.videoId && !item.id && item.src);
      const cat = item.category || (isImage ? "Stream Artwork" : "Motion Graphic");

      let thumbUrl = "";
      if (isImage) {
        thumbUrl = item.src || "img/personal_preview.jpg";
      } else {
        const vid = extractVideoId(item.videoId || item.id);
        thumbUrl = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : (item.src || "img/personal_preview.jpg");
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
      row.querySelector('[data-action="up"]').addEventListener("click", () => moveItem(realIndex, -1));
      row.querySelector('[data-action="down"]').addEventListener("click", () => moveItem(realIndex, 1));
      row.querySelector('[data-action="edit"]').addEventListener("click", () => openEditModal(realIndex));
      row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteItem(realIndex));

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

    const confirmDel = confirm(`Are you sure you want to remove:\n"${item.title}" from ${state.clients[state.activeClientKey]?.name}?`);
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
    selectExistingImage.value = "";
    inputVideoTitle.value = "";
    inputCategory.value = state.activeClientKey === "aihara" ? "Stream Thumbnail" : "Motion Graphic";
    inputVideoDate.value = new Date().toISOString().split("T")[0];

    updateWorkTypeVisibility();
    videoModalBackdrop.style.display = "flex";
  }

  function openEditModal(index) {
    const works = state.clients[state.activeClientKey]?.works || [];
    const item = works[index];
    if (!item) return;

    videoModalTitle.textContent = `EDIT WORK (${state.clients[state.activeClientKey]?.name || ""})`;
    videoEditIndex.value = index;

    const isImage = item.type === "image" || (!item.videoId && !item.id && item.src);
    if (isImage) {
      radioTypeImage.checked = true;
      inputImageSrc.value = item.src || "";
      selectExistingImage.value = item.src || "";
      inputVideoUrl.value = "";
    } else {
      radioTypeVideo.checked = true;
      inputVideoUrl.value = item.videoId || item.id || "";
      inputImageSrc.value = item.src || "";
    }

    inputVideoTitle.value = item.title || "";
    inputCategory.value = item.category || (isImage ? "Stream Thumbnail" : "Motion Graphic");
    inputVideoDate.value = item.pubDate ? item.pubDate.split("T")[0] : new Date().toISOString().split("T")[0];

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
    const cat = inputCategory.value.trim() || (isImage ? "Artwork" : "Motion Graphic");
    const date = inputVideoDate.value || new Date().toISOString().split("T")[0];

    previewTitle.textContent = title;
    previewDate.textContent = isImage ? "" : formatDate(date);
    previewBadge.textContent = cat;

    if (isImage) {
      const src = inputImageSrc.value.trim();
      previewThumb.src = src || "img/personal_preview.jpg";
      if (previewPlayIcon) previewPlayIcon.style.display = "none";
    } else {
      const vid = extractVideoId(inputVideoUrl.value);
      if (vid) {
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
    const category = inputCategory.value.trim() || (isImage ? "Stream Thumbnail" : "Motion Graphic");
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
      const vid = extractVideoId(inputVideoUrl.value);
      if (!vid) {
        showToast("Valid YouTube Video ID or URL is required.", "error");
        return;
      }
      const date = inputVideoDate.value ? new Date(inputVideoDate.value).toISOString() : new Date().toISOString();
      item = {
        id: vid,
        videoId: vid,
        title: title,
        category: category,
        type: "video",
        pubDate: date,
        src: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
      };
    }

    if (editIdx >= 0 && editIdx < works.length) {
      works[editIdx] = item;
      showToast(`Updated "${title}"`, "success");
    } else {
      // Add to top of works list
      works.unshift(item);
      showToast(`Added "${title}" to ${state.clients[state.activeClientKey]?.name}!`, "success");
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
        showToast(`Found ${data.newVideos.length} new YouTube uploads!`, "success");
      } else {
        ytScanBanner.style.display = "none";
        showToast("Your video catalog is fully up to date with YouTube!", "success");
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
    const activeName = state.clients[state.activeClientKey]?.name || state.activeClientKey;
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
    commitTerminalOutput.textContent = "⚙️ Validating clients data schema and assets...\n";

    const commitMsg = commitMessageInput.value.trim() || `feat(catalog): update client collections and works`;
    const push = checkPushRemote.checked;

    try {
      commitTerminalOutput.textContent += "📝 Writing clients.json and catalog.json...\n";
      commitTerminalOutput.textContent += "🔄 Syncing script.js and index.html counts...\n";
      commitTerminalOutput.textContent += "⚡ Checking JavaScript syntax with node --check...\n";
      commitTerminalOutput.textContent += "🌿 Staging git changes & committing...\n";

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

  if (btnCloseLightbox) btnCloseLightbox.addEventListener("click", closeImageLightbox);
  if (imageLightboxBackdrop) {
    imageLightboxBackdrop.addEventListener("click", (e) => {
      if (e.target === imageLightboxBackdrop) closeImageLightbox();
    });
  }

  // Global ESC key listener
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAddClientModal();
      closeVideoModal();
      closeCommitModal();
      closeVideoPlayer();
      closeImageLightbox();
      gitDrawerBackdrop.style.display = "none";
      secDrawerBackdrop.style.display = "none";
    }
  });

  // Start app
  init();
})();
