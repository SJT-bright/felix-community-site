// Procedural Milky Way artwork. Textures are baked only on viewport changes;
// the live layer projects a small star cloud through a moving perspective camera.
export const GALAXY_LIMITS = Object.freeze({ maxTextureEdge: 1920, maxNoiseEdge: 680, overscan: 100, maxStars: 190, mobileStars: 72 });
const TAU = Math.PI * 2;

export function galaxyRandom(seed = 416873) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

export function projectGalaxyStar(star, width, height, camera = { x: 0, y: 0 }, time = 0) {
  const focal = Math.max(width, height) * 0.82;
  const depth = focal + star.z * focal;
  const scale = focal / depth;
  const drift = Math.sin(time / 65000 + star.phase) * 5;
  return {
    x: width * 0.5 + (star.x * width - camera.x * 100 + drift) * scale,
    y: height * 0.5 + (star.y * height - camera.y * 72) * scale,
    radius: Math.max(0.35, star.radius * scale),
    scale,
  };
}

function makeNoise(random) {
  const size = 128;
  const values = Float32Array.from({ length: size * size }, random);
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const get = (a, b) => values[((b % size + size) % size) * size + ((a % size + size) % size)];
    return (get(ix, iy) * (1 - fx) + get(ix + 1, iy) * fx) * (1 - fy)
      + (get(ix, iy + 1) * (1 - fx) + get(ix + 1, iy + 1) * fx) * fy;
  };
}

const bandY = (x) => 0.87 - x * 0.76 + Math.sin(x * 7) * 0.055;

export function createGalaxyField(width, height, ownerDocument = document) {
  const mobile = width < 768;
  const random = galaxyRandom();
  const margin = GALAXY_LIMITS.overscan;
  const w = width + margin * 2, h = height + margin * 2;
  const resolution = Math.min(1.25, GALAXY_LIMITS.maxTextureEdge / Math.max(w, h));
  const makeCanvas = () => {
    const canvas = ownerDocument.createElement('canvas');
    canvas.width = Math.round(w * resolution); canvas.height = Math.round(h * resolution);
    return canvas;
  };
  const distant = makeCanvas(), nebula = makeCanvas();
  const far = distant.getContext('2d'), cloud = nebula.getContext('2d');
  if (!far || !cloud) return null;
  far.scale(resolution, resolution); cloud.scale(resolution, resolution);

  // Very fine, irregular stars across the entire sky, with quiet dark space between them.
  const farCount = Math.min(mobile ? 1700 : 4800, Math.max(1000, w * h / 340));
  for (let i = 0; i < farCount; i += 1) {
    const x = random() * w, y = random() * h;
    far.fillStyle = i % 9 === 0 ? '#9cbcf2' : '#d7e3f8';
    far.globalAlpha = 0.15 + Math.pow(random(), 2) * 0.65;
    const radius = 0.22 + Math.pow(random(), 4) * 0.85;
    far.beginPath(); far.arc(x, y, radius, 0, TAU); far.fill();
  }

  // A low-resolution fractal density field creates the gas and dark dust lanes.
  // Upscaling the soft gas is intentional; the fine starlight is baked separately below.
  const fog = ownerDocument.createElement('canvas');
  const fogScale = Math.min(1, (mobile ? 400 : GALAXY_LIMITS.maxNoiseEdge) / Math.max(w, h));
  fog.width = Math.max(1, Math.round(w * fogScale)); fog.height = Math.max(1, Math.round(h * fogScale));
  const fogContext = fog.getContext('2d');
  if (fogContext) {
    const pixels = fogContext.createImageData(fog.width, fog.height);
    const noise = makeNoise(random);
    for (let y = 0; y < fog.height; y += 1) {
      for (let x = 0; x < fog.width; x += 1) {
        const u = x / fog.width, v = y / fog.height;
        const coarse = noise(u * 8, v * 7);
        const grain = noise(u * 36 + coarse * 2, v * 32) * 0.5 + noise(u * 88, v * 72) * 0.3 + noise(u * 170, v * 138) * 0.2;
        const distance = v - bandY(u) + (coarse - 0.5) * 0.11;
        const envelope = Math.exp(-Math.pow(distance / 0.15, 2));
        const spine = Math.exp(-Math.pow(distance / 0.047, 2));
        const rift = Math.exp(-Math.pow((distance + 0.012 + (noise(u * 22, v * 16) - 0.5) * 0.04) / 0.018, 2));
        const core = Math.exp(-Math.pow((u - 0.65) / 0.32, 2));
        const density = Math.max(0, (envelope * 0.29 + spine * 0.55) * (grain * 1.3 + 0.04) * (1 - rift * 0.8));
        const index = (y * fog.width + x) * 4;
        pixels.data[index] = 82 + core * spine * 100 + grain * 22;
        pixels.data[index + 1] = 94 + core * spine * 89 + grain * 20;
        pixels.data[index + 2] = 154 + core * spine * 44 + grain * 26;
        pixels.data[index + 3] = Math.min(200, density * 300);
      }
    }
    fogContext.putImageData(pixels, 0, 0);
    cloud.drawImage(fog, 0, 0, w, h);
  }
  fog.width = fog.height = 1;

  // Thousands of subpixel grains follow the same curved band, not a uniform dot texture.
  const grains = mobile ? 7500 : 21000;
  for (let i = 0; i < grains; i += 1) {
    const u = random();
    const spread = (random() + random() + random() - 1.5) * 0.16;
    const v = bandY(u) + spread;
    const darkLane = Math.abs(spread + 0.012 + Math.sin(u * 24) * 0.012) < 0.014;
    cloud.globalAlpha = (0.12 + random() * 0.52) * (darkLane ? 0.18 : 1);
    cloud.fillStyle = i % 7 === 0 ? '#e5d9cf' : i % 3 === 0 ? '#a3b4ef' : '#ced9f1';
    const radius = 0.17 + Math.pow(random(), 3) * 0.52;
    cloud.beginPath(); cloud.arc(u * w, v * h, radius, 0, TAU); cloud.fill();
  }
  cloud.globalAlpha = far.globalAlpha = 1;

  const stars = Array.from({ length: mobile ? GALAXY_LIMITS.mobileStars : GALAXY_LIMITS.maxStars }, (_, i) => {
    const z = 0.12 + random() * 2.7;
    return {
      x: (random() - 0.5) * (1 + z) * 1.2,
      y: (random() - 0.5) * (1 + z) * 1.2,
      z,
      phase: random() * TAU,
      radius: 0.8 + random() * 1.5,
      glow: i % 13 === 0,
      warm: i % 11 === 0,
    };
  });

  return {
    distant, nebula, stars, width: w, height: h, margin,
    dispose() { distant.width = distant.height = nebula.width = nebula.height = 1; stars.length = 0; },
  };
}

export function drawGalaxyField(ctx, field, width, height, camera, time, reducedMotion) {
  const drift = reducedMotion ? 0 : Math.sin(time / 80000) * 7;
  const x = reducedMotion ? 0 : camera.x, y = reducedMotion ? 0 : camera.y;
  ctx.globalAlpha = 0.85;
  ctx.drawImage(field.distant, -field.margin - x * 8, -field.margin - y * 6, field.width, field.height);
  // The broad stellar cloud sits between distant stars and the projected near field.
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(reducedMotion ? 0 : x * 0.004);
  ctx.globalAlpha = 0.9;
  ctx.drawImage(field.nebula, -field.width / 2 - x * 25 + drift, -field.height / 2 - y * 17, field.width, field.height);
  ctx.restore();
  for (const star of field.stars) {
    const point = projectGalaxyStar(star, width, height, reducedMotion ? { x: 0, y: 0 } : camera, reducedMotion ? 0 : time);
    if (point.x < -10 || point.x > width + 10 || point.y < -10 || point.y > height + 10) continue;
    const twinkle = reducedMotion ? 0.72 : 0.68 + Math.sin(time / 2300 + star.phase) * 0.18;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = star.warm ? '#e5d9c9' : '#e2edff';
    ctx.beginPath(); ctx.arc(point.x, point.y, point.radius, 0, TAU); ctx.fill();
    if (star.glow) {
      ctx.globalAlpha = twinkle * 0.10;
      ctx.beginPath(); ctx.arc(point.x, point.y, point.radius * 4.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = twinkle * 0.28;
      ctx.fillRect(point.x - point.radius * 3, point.y - 0.3, point.radius * 6, 0.6);
      ctx.fillRect(point.x - 0.3, point.y - point.radius * 3, 0.6, point.radius * 6);
    }
  }
  ctx.globalAlpha = 1;
}
