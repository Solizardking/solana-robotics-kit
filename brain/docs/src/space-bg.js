/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * Animated outer-space backdrop for the Meta Mesh home page: parallax star
 * layers, drifting nebula glows in the Solana palette, and occasional
 * shooting stars. Renders on a fixed canvas behind the page content and
 * respects prefers-reduced-motion.
 */

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.createElement("canvas");
canvas.id = "space-bg";
canvas.setAttribute("aria-hidden", "true");
document.body.prepend(canvas);
document.body.classList.add("space-on");

const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let stars = [];
let comets = [];

const NEBULAE = [
  { color: "20, 241, 149", x: 0.18, y: 0.28, r: 0.5, drift: 0.9, alpha: 0.05 },
  { color: "153, 69, 255", x: 0.82, y: 0.2, r: 0.55, drift: 1.4, alpha: 0.055 },
  { color: "0, 209, 255", x: 0.6, y: 0.85, r: 0.45, drift: 1.1, alpha: 0.04 },
];

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  seedStars();
}

function seedStars() {
  const count = Math.min(340, Math.floor((width * height) / 5200));
  stars = Array.from({ length: count }, () => {
    const depth = Math.random(); // 0 far .. 1 near
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      depth,
      size: 0.4 + depth * 1.5,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 1.6,
      hue: Math.random(),
    };
  });
}

function starColor(hue, alpha) {
  if (hue > 0.93) return `rgba(20, 241, 149, ${alpha})`;
  if (hue > 0.86) return `rgba(153, 69, 255, ${alpha})`;
  if (hue > 0.79) return `rgba(0, 209, 255, ${alpha})`;
  return `rgba(226, 236, 248, ${alpha})`;
}

function spawnComet() {
  const fromLeft = Math.random() > 0.5;
  comets.push({
    x: fromLeft ? -40 : Math.random() * width,
    y: fromLeft ? Math.random() * height * 0.5 : -40,
    vx: 320 + Math.random() * 260,
    vy: 140 + Math.random() * 120,
    life: 0,
    maxLife: 1.1 + Math.random() * 0.5,
  });
}

let last = performance.now();
let cometTimer = 4 + Math.random() * 6;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  ctx.clearRect(0, 0, width, height);

  // Nebula glows drifting slowly.
  for (const nebula of NEBULAE) {
    const nx = (nebula.x + 0.04 * Math.sin(t * 0.05 * nebula.drift)) * width;
    const ny = (nebula.y + 0.05 * Math.cos(t * 0.04 * nebula.drift + 2)) * height;
    const radius = nebula.r * Math.max(width, height);
    const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
    glow.addColorStop(0, `rgba(${nebula.color}, ${nebula.alpha})`);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  // Parallax starfield with twinkle.
  const scrollDrift = window.scrollY * 0.06;
  for (const star of stars) {
    if (!REDUCED_MOTION) {
      star.x -= dt * (2 + star.depth * 7);
      if (star.x < -2) star.x = width + 2;
    }
    const y = ((star.y - scrollDrift * star.depth) % height + height) % height;
    const twinkle = REDUCED_MOTION
      ? 0.75
      : 0.55 + 0.45 * Math.sin(star.twinkle + t * star.twinkleSpeed);
    ctx.fillStyle = starColor(star.hue, 0.25 + 0.6 * twinkle * (0.4 + star.depth * 0.6));
    const size = star.size * (0.8 + 0.4 * twinkle);
    ctx.fillRect(star.x, y, size, size);
  }

  // Shooting stars.
  if (!REDUCED_MOTION) {
    cometTimer -= dt;
    if (cometTimer <= 0) {
      spawnComet();
      cometTimer = 7 + Math.random() * 12;
    }
    for (const comet of comets) {
      comet.life += dt;
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt;
      const fade = Math.sin(Math.min(1, comet.life / comet.maxLife) * Math.PI);
      const tail = 90;
      const gradient = ctx.createLinearGradient(
        comet.x,
        comet.y,
        comet.x - tail,
        comet.y - tail * (comet.vy / comet.vx)
      );
      gradient.addColorStop(0, `rgba(232, 255, 244, ${0.85 * fade})`);
      gradient.addColorStop(1, "rgba(20, 241, 149, 0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(comet.x - tail, comet.y - tail * (comet.vy / comet.vx));
      ctx.stroke();
    }
    comets = comets.filter(
      (comet) =>
        comet.life < comet.maxLife && comet.x < width + 120 && comet.y < height + 120
    );
  }

  if (!REDUCED_MOTION) requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
