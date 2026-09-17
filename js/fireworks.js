let canvas = null;
let ctx = null;
let frameId = 0;
let rockets = [];
let particles = [];
let running = false;
let dpr = 1;

const COLORS = ["#ffe566", "#ff6b6b", "#6bffb8", "#6bcbff", "#ff85c0", "#ffffff", "#ffd93d"];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function launchRocket() {
  if (!canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  rockets.push({
    x: rand(w * 0.15, w * 0.85),
    y: h + 10 * dpr,
    vx: rand(-1.4, 1.4) * dpr,
    vy: rand(-13, -9) * dpr,
    color: pickColor(),
    trail: [],
  });
}

function explode(x, y, color) {
  const count = Math.floor(rand(48, 72));
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + rand(-0.25, 0.25);
    const speed = rand(3.5, 9) * dpr;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(55, 100),
      maxLife: 100,
      color,
      size: rand(2.5, 5.5) * dpr,
    });
  }
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.max(1, window.innerWidth);
  const cssH = Math.max(1, window.innerHeight);
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  // Identity transform — all physics use device pixels.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function tick() {
  if (!running || !ctx || !canvas) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";

  if (Math.random() < 0.14) launchRocket();

  rockets = rockets.filter((rocket) => {
    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 12) rocket.trail.shift();
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    rocket.vy += 0.22 * dpr;

    rocket.trail.forEach((point, index) => {
      const alpha = (index + 1) / rocket.trail.length;
      ctx.beginPath();
      ctx.fillStyle = rocket.color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.arc(point.x, point.y, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();
    });

    // Burst near upper third of the screen.
    if (rocket.vy >= -1.2 * dpr || rocket.y <= h * 0.28) {
      explode(rocket.x, rocket.y, rocket.color);
      return false;
    }
    return rocket.y < h + 40 * dpr;
  });

  particles = particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.08 * dpr;
    particle.vx *= 0.985;
    particle.life -= 1;

    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.beginPath();
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = alpha;
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    return particle.life > 0;
  });

  ctx.globalAlpha = 1;
  frameId = window.requestAnimationFrame(tick);
}

function onResize() {
  if (running) resizeCanvas();
}

function startFireworks(target = document.getElementById("hofFireworks")) {
  if (!target) return;
  if (running) stopFireworks();

  canvas = target;
  ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    canvas = null;
    return;
  }

  running = true;
  rockets = [];
  particles = [];
  canvas.classList.remove("is-hidden");
  canvas.setAttribute("aria-hidden", "true");
  resizeCanvas();
  window.addEventListener("resize", onResize);

  // Ensure layout is applied before the first launches (display:none → block).
  requestAnimationFrame(() => {
    if (!running) return;
    resizeCanvas();
    for (let i = 0; i < 8; i += 1) {
      window.setTimeout(() => {
        if (running) launchRocket();
      }, i * 140);
    }
    frameId = window.requestAnimationFrame(tick);
  });
}

function stopFireworks() {
  running = false;
  window.cancelAnimationFrame(frameId);
  window.removeEventListener("resize", onResize);
  rockets = [];
  particles = [];
  if (canvas) {
    ctx?.setTransform(1, 0, 0, 1, 0, 0);
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.add("is-hidden");
  }
  canvas = null;
  ctx = null;
}

export { startFireworks, stopFireworks };
