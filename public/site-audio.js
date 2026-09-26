(() => {
  if (window.FelixAudio) return;
  const positionKey = 'felix-bgm-position';
  const events = ['pointerdown', 'touchstart', 'keydown'];
  let audio;
  let retryBound = false;
  let fadeTimer;
  const resume = () => {
    if (!audio) return;
    audio.play().then(() => {
      events.forEach(name => document.removeEventListener(name, resume));
      retryBound = false;
      clearInterval(fadeTimer);
      fadeTimer = setInterval(() => {
        audio.volume = Math.min(0.35, audio.volume + 0.02);
        if (audio.volume >= 0.35 || audio.paused) clearInterval(fadeTimer);
      }, 60);
    }).catch(() => {
      if (retryBound) return;
      retryBound = true;
      events.forEach(name => document.addEventListener(name, resume, { passive: true }));
    });
  };
  window.FelixAudio = { start() {
    if (audio) return;
    audio = new Audio('/audio/the-horizons-gentle-bend.mp3');
    audio.dataset.siteBgm = 'true';
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.hidden = true;
    audio.setAttribute('aria-hidden', 'true');
    audio.addEventListener('loadedmetadata', () => {
      try {
        const position = Number(sessionStorage.getItem(positionKey));
        if (Number.isFinite(position) && position > 0 && position < audio.duration) audio.currentTime = position;
      } catch { /* Storage may be unavailable. */ }
    }, { once: true });
    document.body.appendChild(audio);
    window.addEventListener('pagehide', () => {
      try { sessionStorage.setItem(positionKey, String(audio.currentTime)); } catch { /* Optional continuity. */ }
      audio.pause();
      clearInterval(fadeTimer);
    });
    window.addEventListener('pageshow', event => { if (event.persisted) resume(); });
    resume();
  } };
  if (/^\/lab\/?$/.test(location.pathname) || location.pathname.startsWith('/portfolio/')) window.FelixAudio.start();
})();
