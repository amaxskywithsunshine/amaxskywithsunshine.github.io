const texts = [
  "The beautiful blue sky.",
  "The trembling sea.",
  "The sunlight that shines on my face.",
  "I can't stop looking at it.",
];

const container = document.getElementById("text-container");
const mainContent = document.getElementById("main-content");
const music = document.getElementById("bg-music");
const muteBtn = document.getElementById("mute-btn");

let index = 0;
let introFinished = false;
let musicStarted = false;

function showNextText() {
  if (index >= texts.length) {
    introFinished = true;
    const intro = document.getElementById("intro");
    intro.style.transition = "opacity 1s ease";
    intro.style.opacity = 0;

    setTimeout(() => {
      intro.style.display = "none";
      document.body.style.overflow = "auto";
      mainContent.style.display = "block";
    }, 1000);
    return;
  }

  container.textContent = texts[index];
  container.classList.remove("fade-out");
  container.classList.add("fade-in");

  setTimeout(() => {
    container.classList.remove("fade-in");
    container.classList.add("fade-out");
    index++;
    setTimeout(showNextText, 1000);
  }, 2500);
}

showNextText();

// ✅ คลิกเพื่อเริ่มเพลง (แค่ครั้งแรก)
document.addEventListener("click", () => {
  if (!musicStarted) {
    music.volume = 0.1;
    music.muted = false;
    music.play().catch(() => {});
    muteBtn.textContent = "🔊";
    musicStarted = true;
  }
});

// ✅ ปุ่ม mute
muteBtn.addEventListener("click", () => {
  music.muted = !music.muted;
  muteBtn.textContent = music.muted ? "🔇" : "🔊";
});

// ✅ แสดงผลงานจาก YouTube
const youtubeLinks = [
  "https://www.youtube.com/watch?v=4gGzsHAM4mA",
  "https://www.youtube.com/watch?v=NiYcw0yX2VY",
  "https://www.youtube.com/watch?v=12LgU_nqrtE"
];

const videoList = document.getElementById("video-list");

youtubeLinks.forEach(link => {
  const match = link.match(/(?:\?v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    const videoId = match[1];
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const div = document.createElement("div");
    div.className = "video-thumb";
    div.innerHTML = `
      <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">
        <img src="${thumbnailUrl}" alt="YouTube Thumbnail" />
      </a>
    `;
    videoList.appendChild(div);
  }
});
