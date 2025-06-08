const texts = [
  "The beautiful blue sky.",
  "The trembling sea.",
  "The sunlight that shines on my face.",
  "I can't stop looking at it."
];

const container = document.getElementById("text-container");
const mainContent = document.getElementById("main-content");
const music = document.getElementById("bg-music");
const muteBtn = document.getElementById("mute-btn");
const splashScreen = document.getElementById("splash-screen");
const clickIcon = document.getElementById("click-icon");
const bgVideo = document.getElementById("bg-video");

let index = 0;
let musicStarted = false;

function waitForVideoLoaded(video) {
  return new Promise(resolve => {
    if (video.readyState >= 3) {
      resolve();
    } else {
      video.addEventListener("canplaythrough", resolve, { once: true });
    }
  });
}

function fadeOutMusic(targetVolume = 0.1, duration = 2000) {
  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = (music.volume - targetVolume) / steps;
  const interval = setInterval(() => {
    if (music.volume - volumeStep <= targetVolume) {
      music.volume = targetVolume;
      clearInterval(interval);
    } else {
      music.volume -= volumeStep;
    }
  }, stepTime);
}

function showNextText() {
  if (index >= texts.length) {
    setTimeout(() => {
      document.getElementById("intro").style.transition = "opacity 1s ease";
      document.getElementById("intro").style.opacity = 0;

      setTimeout(() => {
        document.getElementById("intro").style.display = "none";
        document.body.style.overflow = "auto";
        fadeOutMusic(0.1, 2000);
        mainContent.style.display = "block";
        requestAnimationFrame(() => mainContent.classList.add("visible"));
      }, 1000);
    }, 1000);
    return;
  }

  container.textContent = texts[index];
  container.style.animation = "none";
  container.offsetHeight;
  container.style.animation = "zoomText 2.5s ease forwards";

  index++;
  setTimeout(showNextText, 3500);
}

function startIntro() {
  if (startIntro.started) return;
  startIntro.started = true;

  document.querySelector(".background").style.animation =
    "zoomOut 18s ease-out forwards, blurOut 3s ease-out forwards";

  setTimeout(() => {
    splashScreen.style.transition = "opacity 1s ease";
    splashScreen.style.opacity = 0;
    splashScreen.style.pointerEvents = "none";

    setTimeout(() => {
      splashScreen.style.display = "none";

      music.volume = 0;
      music.muted = false;

      music.play().then(() => {
        musicStarted = true;
        muteBtn.textContent = "🔊";

        const duration = 2000;
        const steps = 20;
        const intervalTime = duration / steps;
        let currentStep = 0;

        const fadeInInterval = setInterval(() => {
          currentStep++;
          music.volume = currentStep / steps;
          if (currentStep >= steps) clearInterval(fadeInInterval);
        }, intervalTime);

        showNextText();
      }).catch(() => {
        document.addEventListener("click", () => {
          if (!musicStarted && music.paused) {
            music.volume = 1;
            music.muted = false;
            music.play().catch(() => {});
            muteBtn.textContent = "🔊";
            musicStarted = true;
            showNextText();
          }
        }, { once: true });
      });
    }, 1000);
  }, 2000);
}

async function init() {
  await Promise.all([
    new Promise(r => window.addEventListener("load", r, { once: true })),
    waitForVideoLoaded(bgVideo),
    document.fonts.ready
  ]);

  splashScreen.style.display = "flex";
  splashScreen.addEventListener("click", startIntro, { once: true });

  muteBtn.addEventListener("click", () => {
    music.muted = !music.muted;
    muteBtn.textContent = music.muted ? "🔇" : "🔊";
  });

  let youtubeLinks = [];
  try {
    const response = await fetch("ytlink.txt");
    const text = await response.text();
    youtubeLinks = text.split(/\r?\n/).filter(line => line.trim() !== "");
  } catch (e) {
    console.error("Failed to load ytlink.txt", e);
  }

  const videoList = document.getElementById("video-list");
  youtubeLinks.forEach(link => {
    const match = link.match(/(?:\?v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      const videoId = match[1];
      const container = document.createElement("div");
      container.className = "video-thumb";

      const img = document.createElement("img");
      img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      img.alt = "YouTube Thumbnail";

      const a = document.createElement("a");
      a.href = `https://www.youtube.com/watch?v=${videoId}`;
      a.target = "_blank";
      a.appendChild(img);

      container.appendChild(a);
      videoList.appendChild(container);

      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
        .then(res => res.json())
        .then(data => {
          a.title = data.title;
          const title = document.createElement("div");
          title.className = "video-title";
          title.textContent = data.title;
          container.appendChild(title);
        })
        .catch(() => {
          const title = document.createElement("div");
          title.className = "video-title";
          title.textContent = "Untitled Video";
          container.appendChild(title);
        });
    }
  });
}

init();