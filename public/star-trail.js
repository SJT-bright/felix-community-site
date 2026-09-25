const MAX_PARTICLES = 320;
const PARTICLE_SPACING = 5;

// One viewport-sized trail is shared by the home, Lab and standalone archive.
export function mountStarTrail({ owner = window } = {}) {
  const doc = owner.document;
  if (!doc.body || !owner.matchMedia || doc.querySelector('[data-site-star-trail]')) return () => {};

  const canvas = doc.createElement('canvas');
  canvas.className = 'site-star-trail';
  canvas.setAttribute('data-site-star-trail', '');
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  doc.body.append(canvas);

  const reducedMotion = owner.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = owner.matchMedia('(any-pointer: fine)');
  const palette = owner.getComputedStyle(canvas);
  const starlight = palette.getPropertyValue('--color-text').trim()
    || palette.getPropertyValue('--cosmos-star').trim() || '#e5f1ff';
  const blue = palette.getPropertyValue('--color-profile-accent').trim()
    || palette.getPropertyValue('--cosmos-blue').trim() || '#88bbf2';
  let particles = [];
  let previous = null;
  let frame = 0;
  let width = 0;
  let height = 0;
  let sample = 0;
  let destroyed = false;

  const enabled = () => !destroyed && !doc.hidden && !reducedMotion.matches
    && finePointer.matches && !doc.body.matches('.site-loading, .home-intro-pending, .video-playing, .portfolio-transition-active');

  function reset() {
    owner.cancelAnimationFrame(frame);
    frame = 0;
    particles = [];
    previous = null;
    context.clearRect(0, 0, width, height);
  }

  function resize() {
    reset();
    width = doc.documentElement.clientWidth || owner.innerWidth;
    height = owner.innerHeight;
    const ratio = Math.min(owner.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(now) {
    frame = 0;
    if (!enabled()) { reset(); return; }
    context.clearRect(0, 0, width, height);
    particles = particles.filter(particle => now - particle.born < particle.life);
    for (const particle of particles) {
      const age = (now - particle.born) / particle.life;
      const drift = age * particle.life / 1000;
      const x = particle.x + particle.vx * drift;
      const y = particle.y + particle.vy * drift + age * age * 9;
      const radius = particle.radius * (1 - age * 0.55);
      context.globalAlpha = Math.pow(1 - age, 1.6) * particle.alpha;
      context.fillStyle = particle.glint ? starlight : blue;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      if (particle.glint) {
        const reach = radius * 3.5;
        context.strokeStyle = starlight;
        context.lineWidth = 0.65;
        context.beginPath();
        context.moveTo(x - reach, y); context.lineTo(x + reach, y);
        context.moveTo(x, y - reach); context.lineTo(x, y + reach);
        context.stroke();
      }
    }
    context.globalAlpha = 1;
    if (particles.length) frame = owner.requestAnimationFrame(draw);
  }

  function move(event) {
    if (event.pointerType === 'touch' || !enabled()) { previous = null; return; }
    const point = { x: event.clientX, y: event.clientY };
    if (!previous) { previous = point; return; }
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const distance = Math.hypot(dx, dy);
    if (distance < PARTICLE_SPACING) return;
    const steps = Math.min(32, Math.ceil(distance / PARTICLE_SPACING));
    const now = owner.performance.now();
    for (let step = 1; step <= steps; step += 1) {
      sample += 1;
      for (let dust = 0; dust < 3; dust += 1) {
        const angle = Math.random() * Math.PI * 2;
        const spread = Math.random() * 13;
        particles.push({
          x: previous.x + dx * step / steps + Math.cos(angle) * spread,
          y: previous.y + dy * step / steps + Math.sin(angle) * spread,
          vx: Math.cos(angle) * (6 + Math.random() * 12) - dx / distance * 8,
          vy: Math.sin(angle) * (6 + Math.random() * 12) - dy / distance * 8,
          radius: 0.4 + Math.random() * 1.1,
          alpha: 0.45 + Math.random() * 0.5,
          life: 550 + Math.random() * 650,
          born: now,
          glint: dust === 0 && sample % 6 === 0,
        });
      }
    }
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    previous = point;
    if (!frame) frame = owner.requestAnimationFrame(draw);
  }

  const leave = () => { previous = null; };
  const pointerOut = event => { if (!event.relatedTarget) leave(); };
  const sync = () => { if (!enabled()) reset(); };
  const bodyObserver = new owner.MutationObserver(sync);
  bodyObserver.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
  // Capture keeps the trail alive over cards and draggable archive controls.
  owner.addEventListener('pointermove', move, { passive: true, capture: true });
  owner.addEventListener('pointerout', pointerOut, { passive: true });
  owner.addEventListener('pointercancel', reset, { passive: true });
  owner.addEventListener('scroll', leave, { passive: true, capture: true });
  owner.addEventListener('resize', resize, { passive: true });
  owner.addEventListener('blur', reset);
  owner.addEventListener('pagehide', reset);
  doc.addEventListener('visibilitychange', sync);

  const mediaCleanups = [reducedMotion, finePointer].map(query => {
    if (query.addEventListener) {
      query.addEventListener('change', sync);
      return () => query.removeEventListener('change', sync);
    }
    query.addListener(sync);
    return () => query.removeListener(sync);
  });
  resize();

  return () => {
    if (destroyed) return;
    destroyed = true;
    reset();
    bodyObserver.disconnect();
    owner.removeEventListener('pointermove', move, true);
    owner.removeEventListener('pointerout', pointerOut);
    owner.removeEventListener('pointercancel', reset);
    owner.removeEventListener('scroll', leave, true);
    owner.removeEventListener('resize', resize);
    owner.removeEventListener('blur', reset);
    owner.removeEventListener('pagehide', reset);
    doc.removeEventListener('visibilitychange', sync);
    mediaCleanups.forEach(cleanup => cleanup());
    canvas.remove();
  };
}
