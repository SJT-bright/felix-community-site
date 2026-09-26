// Background music for the homepage. Autoplays on loop, no UI controls.
// Browsers block audible autoplay until the first user gesture, so when the
// initial play() is rejected we silently retry on the first interaction —
// there is deliberately no mute/unmute control, per product decision.

const BGM_URL = "/audio/the-horizons-gentle-bend.mp3";
const BGM_VOLUME = 0.35;

let audio = null;
let startRequested = false;
let gestureBound = false;

function fadeIn() {
  if (!audio) return;
  const step = () => {
    if (!audio || audio.paused) return;
    audio.volume = Math.min(BGM_VOLUME, audio.volume + 0.02);
    if (audio.volume < BGM_VOLUME) setTimeout(step, 60);
  };
  step();
}

function bindGestureRetry() {
  if (gestureBound || !audio) return;
  gestureBound = true;
  const events = ["pointerdown", "touchstart", "keydown"];
  const resume = () => {
    events.forEach(name => document.removeEventListener(name, resume));
    gestureBound = false;
    if (!audio) return;
    audio.play().then(fadeIn).catch(() => bindGestureRetry());
  };
  events.forEach(name => document.addEventListener(name, resume, { passive: true }));
}

export function startBgm() {
  if (startRequested) return;
  startRequested = true;
  try {
    if (!audio) {
      audio = new Audio(BGM_URL);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      audio.setAttribute("aria-hidden", "true");
      audio.style.display = "none";
      (document.body || document.documentElement).appendChild(audio);
    }
    audio
      .play()
      .then(fadeIn)
      .catch(() => bindGestureRetry());
  } catch {
    startRequested = false;
  }
}
