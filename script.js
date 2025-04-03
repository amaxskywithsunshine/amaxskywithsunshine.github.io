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

let index = 0;
let musicStarted = false;

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
  setTimeout(showNextText, 2500);
}

// Wait for everything to load before starting the intro
window.onload = () => {
  // Wait for the music to load and play
  music.volume = 1;
  music.muted = false;
  music.play().then(() => {
    musicStarted = true;
    muteBtn.textContent = "🔊";
    showNextText();  // Start the text animation once everything is loaded
  }).catch(() => {
    document.addEventListener("click", () => {
      if (!musicStarted) {
        music.volume = 1;
        music.muted = false;
        music.play().catch(() => {});
        muteBtn.textContent = "🔊";
        musicStarted = true;
        showNextText();  // Start the text animation on user interaction if music fails to play initially
      }
    }, { once: true });
  });

  muteBtn.addEventListener("click", () => {
    music.muted = !music.muted;
    muteBtn.textContent = music.muted ? "🔇" : "🔊";
  });

  const youtubeLinks = [
    "https://www.youtube.com/watch?v=4gGzsHAM4mA",
    "https://www.youtube.com/watch?v=NiYcw0yX2VY",
    "https://www.youtube.com/watch?v=12LgU_nqrtE",
    "https://www.youtube.com/watch?v=QpnHcE5G0ks",
    "https://www.youtube.com/watch?v=e2Y3ahUBLtA",
    "https://www.youtube.com/watch?v=R3zzz9GDyfs",
    "https://www.youtube.com/watch?v=Rh4dEbGAAcw",
    "https://www.youtube.com/watch?v=CtLN40lz-Uc",
    "https://www.youtube.com/watch?v=fjyGz_GMzFA",
    "https://www.youtube.com/watch?v=P5uiNuZG46s",
    "https://www.youtube.com/watch?v=mw1IRZfXKtQ",
    "https://www.youtube.com/watch?v=XgDKkSS0aPw",
    "https://www.youtube.com/watch?v=gNO7aiqYkSQ",
    "https://www.youtube.com/watch?v=Rc__qEAHGAU",
    "https://www.youtube.com/watch?v=Taiw_SjScNY",
    "https://www.youtube.com/watch?v=pIadIlqLQkA",
    "https://www.youtube.com/watch?v=UwdviMsePOM",
    "https://www.youtube.com/watch?v=esQ-jfzJ04A",
    "https://www.youtube.com/watch?v=dxugkftLswo",
    "https://www.youtube.com/watch?v=BrdejjaK67k",
    "https://www.youtube.com/watch?v=HwNbl7GiEIw",
    "https://www.youtube.com/watch?v=L8acuOgBb1g",
    "https://www.youtube.com/watch?v=wGVq2o19UUM",
    "https://www.youtube.com/watch?v=J0dSfjzMF2c"
  ];

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
};
