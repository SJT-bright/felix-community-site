// Background for the personal portfolio.
import { mountStarTrail } from './star-trail.js';
import { createGalaxyField, drawGalaxyField } from './galaxy-field.js';

let activeSceneCleanup;

const SETTINGS = {
  frameMs: 1000 / 30,
  crossingMs: 2200, // Larger values make chapter-entry trails travel more slowly.
  crossingCooldown: 1500,
  ambientInterval: 12500,
  chapters: '.scroll-track, #image-archive, .scroll-expand, #project-showcase, #portfolio-gallery, .lab-gateway, .lab-hero, .lab-topics, .lab-results, .lab-exchange, .lab-contact, #dome-section',
  chapterTextSelectors: 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, figcaption, strong, span, a[href], button, .lab-button, .lab-page__kicker',
  reveals: [
    '.identity',
    '.hero-lead',
    '.contact',
    '.hero-note',
    '.gallery-header',
    '.project-showcase__header',
    '.project-showcase__item',
    '.portfolio-gateway__copy',
    '.portfolio-gateway__action',
    '.project-card__content .project-card__number',
    '.project-card__content h3',
    '.project-card__description',
    '.project-card__cue',
  ].join(','),
};

export function mountCosmicScene() {
  activeSceneCleanup?.();
  const layer = document.createElement('div');
  layer.className = 'cosmic-scene';
  layer.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  layer.append(canvas);
  document.body.prepend(layer);
  document.body.classList.add('cosmic-site');
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => { layer.remove(); document.body.classList.remove('cosmic-site'); };
  const cleanupStarTrail = mountStarTrail();

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(any-pointer: fine)');
  const palette = getComputedStyle(layer);
  const colors = ['--cosmos-star', '--cosmos-blue', '--cosmos-distant'].map(name => palette.getPropertyValue(name).trim());
  let width = 1, height = 1, dpr = 1, field = null, trails = [];
  const pointer = { x: 0, y: 0 };
  const camera = { x: 0, y: 0 };
  let resizeRaf = 0;
  let raf = 0, lastFrame = 0, time = 0, lastBurst = -Infinity;
  let nextAmbient = SETTINGS.ambientInterval, scrollTarget = scrollY, scrollPosition = scrollY;
  let destroyed = false;
  const paused = () => document.hidden || document.body.matches('.site-loading, .home-intro-pending, .video-playing, .portfolio-transition-active');

  function resize() {
    resizeRaf = 0;
    const nextWidth = innerWidth, nextHeight = innerHeight;
    const nextDpr = Math.min(devicePixelRatio || 1, 1.5, 2400 / Math.max(nextWidth, nextHeight));
    if (nextWidth !== width || nextHeight !== height || nextDpr !== dpr) {
      width = nextWidth; height = nextHeight; dpr = nextDpr;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      field?.dispose(); field = null;
    }
    if (!paused()) render();
    observeChapters();
  }

  function onResize() {
    if (!resizeRaf) resizeRaf = requestAnimationFrame(resize);
  }

  function onPointerMove(event) {
    if (motion.matches || paused() || !finePointer.matches || event.pointerType === 'touch') return;
    pointer.x = Math.max(-1, Math.min(1, event.clientX / Math.max(width, 1) * 2 - 1));
    pointer.y = Math.max(-1, Math.min(1, event.clientY / Math.max(height, 1) * 2 - 1));
  }
  function resetPointer() { pointer.x = 0; pointer.y = 0; }
  function onPointerOut(event) { if (!event.relatedTarget) resetPointer(); }

  function cross(count = 3) {
    if (motion.matches || paused()) return;
    const now = performance.now();
    if (now - lastBurst < SETTINGS.crossingCooldown) return;
    lastBurst = now;
    for (let i = 0; i < count; i += 1) {
      trails.push({ born: time + i * 320, y: 0.12 + i * 0.23, x: 0.1 + i * 0.16, length: Math.min(width * 0.22, 240) });
    }
    nextAmbient = time + SETTINGS.ambientInterval;
    layer.dataset.crossing = String(Number(layer.dataset.crossing || 0) + 1);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    field ??= createGalaxyField(width, height);
    if (field) drawGalaxyField(ctx, field, width, height, camera, time, motion.matches);
    layer.dataset.galaxyReady = String(Boolean(field));
    layer.dataset.cameraX = camera.x.toFixed(3);
    layer.dataset.cameraY = camera.y.toFixed(3);
    for (const trail of trails) {
      const p = (time - trail.born) / SETTINGS.crossingMs;
      if (p < 0 || p > 1) continue;
      const x = trail.x * width + p * width * 0.95;
      const y = trail.y * height + p * width * 0.23;
      const tailX = x - trail.length, tailY = y - trail.length * 0.24;
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.85;
      const gradient = ctx.createLinearGradient(tailX, tailY, x, y);
      gradient.addColorStop(0, palette.getPropertyValue('--cosmos-clear').trim());
      gradient.addColorStop(0.75, colors[1]);
      gradient.addColorStop(1, colors[0]);
      ctx.strokeStyle = gradient; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = colors[0];
      ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    raf = 0;
    if (destroyed) return;
    // A frame can observe a media preference before its change event arrives.
    // Settle the static scene as well as stopping the loop in that case.
    if (motion.matches || paused()) { syncAnimation(); return; }
    const elapsed = now - lastFrame;
    if (elapsed >= SETTINGS.frameMs) {
      time += Math.min(elapsed, 64);
      lastFrame = now;
      const blend = 1 - Math.exp(-Math.min(elapsed, 64) / 220);
      scrollPosition += (scrollTarget - scrollPosition) * blend;
      camera.x += (pointer.x - camera.x) * blend;
      camera.y += (pointer.y + Math.sin(scrollPosition / 1800) * 0.16 - camera.y) * blend;
      trails = trails.filter(trail => time - trail.born < SETTINGS.crossingMs);
      if (time > nextAmbient) cross(1);
      render();
    }
    raf = requestAnimationFrame(tick);
  }

  function syncAnimation() {
    cancelAnimationFrame(raf); raf = 0;
    layer.dataset.paused = String(paused() || motion.matches);
    if (motion.matches) {
      trails = []; resetPointer(); camera.x = 0; camera.y = 0;
      render();
    }
    if (!paused() && !motion.matches && !destroyed) {
      if (!field) render();
      lastFrame = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  let chapterObserver, revealObserver;
  const chapters = [...document.querySelectorAll(SETTINGS.chapters)];
  const isRevealCandidate = (node) => (
    node instanceof HTMLElement &&
    !node.closest('[data-profile-landing], [data-wormhole-prelude], [data-reveal-managed]') &&
    // Reveal controls as a unit: translated labels can stay outside a clipped
    // button forever and never become visible to IntersectionObserver.
    !node.parentElement?.closest('a[href], button, [role="button"]') &&
    !node.hidden &&
    !node.matches('[aria-hidden="true"]') &&
    !node.closest('[aria-hidden="true"]') &&
    node.textContent?.trim()
  );
  const getRevealTargets = () => {
    const seen = new Set();
    const grouped = [];

    for (const chapter of chapters) {
      const chapterNodes = [...chapter.querySelectorAll(SETTINGS.chapterTextSelectors)]
        .filter(isRevealCandidate);
      chapterNodes.forEach((node, index) => {
        if (seen.has(node)) return;
        seen.add(node);
        node.style.setProperty('--text-rhythm-delay', `${Math.min(index, 10) * 55}ms`);
        grouped.push(node);
      });
    }

    [...document.querySelectorAll(SETTINGS.reveals)].forEach((node) => {
      if (!isRevealCandidate(node) || seen.has(node)) return;
      seen.add(node);
      node.style.setProperty('--text-rhythm-delay', '0ms');
      grouped.push(node);
    });

    return grouped;
  };

  function observeChapters() {
    if (!('IntersectionObserver' in window)) return;
    chapterObserver?.disconnect();
    const activeChapters = new Set();
    chapterObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('cosmic-chapter-active', entry.isIntersecting);
        if (entry.isIntersecting) {
          if (!activeChapters.has(entry.target)) {
            activeChapters.add(entry.target);
            cross();
          }
        } else {
          activeChapters.delete(entry.target);
        }
      }
      layer.classList.toggle('cosmic-chapter-active', activeChapters.size > 0);
    // Pixel margins follow viewport height; percentage margins follow width and
    // can collapse the observation area on an ultrawide display.
    }, { rootMargin: `-${Math.round(innerHeight * 0.2)}px 0px -${Math.round(innerHeight * 0.3)}px 0px`, threshold: 0 });
    chapters.forEach(chapter => chapterObserver.observe(chapter));
  }
  if ('IntersectionObserver' in window) {
    if (!motion.matches) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('cosmic-revealed');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      const reveals = getRevealTargets();
      reveals.forEach((node) => {
        node.classList.add('cosmic-reveal');
        revealObserver.observe(node);
      });
    }
  }
  let completed = document.body.classList.contains('video-complete');
  const bodyObserver = new MutationObserver(() => {
    const nextCompleted = document.body.classList.contains('video-complete');
    if (nextCompleted && !completed) cross();
    completed = nextCompleted;
    syncAnimation();
  });
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const onScroll = () => { scrollTarget = scrollY; };
  const onPageShow = () => { syncAnimation(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize, { passive: true });
  addEventListener('pointermove', onPointerMove, { passive: true, capture: true });
  addEventListener('pointerout', onPointerOut, { passive: true });
  addEventListener('blur', resetPointer);
  finePointer.addEventListener('change', resetPointer);
  addEventListener('pageshow', onPageShow);
  document.addEventListener('visibilitychange', syncAnimation);
  motion.addEventListener('change', syncAnimation);
  resize(); syncAnimation();

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    cleanupStarTrail();
    cancelAnimationFrame(raf); cancelAnimationFrame(resizeRaf);
    field?.dispose(); field = null;
    canvas.width = canvas.height = 1;
    chapterObserver?.disconnect(); revealObserver?.disconnect(); bodyObserver.disconnect();
    removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); removeEventListener('pageshow', onPageShow);
    removeEventListener('pointermove', onPointerMove, true);
    removeEventListener('pointerout', onPointerOut); removeEventListener('blur', resetPointer);
    finePointer.removeEventListener('change', resetPointer);
    document.removeEventListener('visibilitychange', syncAnimation);
    motion.removeEventListener('change', syncAnimation);
    const reveals = getRevealTargets();
    reveals.forEach(node => {
      node.classList.remove('cosmic-reveal', 'cosmic-revealed');
      node.style.removeProperty('--text-rhythm-delay');
    });
    chapters.forEach(node => node.classList.remove('cosmic-chapter-active'));
    layer.remove(); document.body.classList.remove('cosmic-site');
    if (activeSceneCleanup === cleanup) activeSceneCleanup = null;
  };
  activeSceneCleanup = cleanup;
  return cleanup;
}
