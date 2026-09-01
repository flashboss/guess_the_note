let canvas = null;
let ctx = null;
let frameId = 0;
let rockets = [];
let particles = [];
let running = false;

const COLORS = ["#f5d67b", "#e8c468", "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff85c0"];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function launchRocket() {
  const width = canvas.width;
  const height = canvas.height;
  rockets.push({
    x: rand(width * 0.12, width * 0.88),
    y: height + 8,
    vx: rand(-1.2, 1.2),
    vy: rand(-11, -8),
    color: pickColor(),
    trail: [],
  });
}

function explode(x, y, color) {
  const count = Math.floor(rand(28, 42));
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + rand(-0.2, 0.2);
    const speed = rand(2.5, 6.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(45, 75),
      maxLife: 75,
      color,
      size: rand(1.6, 3.2),
    });
  }
}

function resizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function tick() {
  if (!running || !ctx || !canvas) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  if (Math.random() < 0.08) launchRocket();

  rockets = rockets.filter((rocket) => {
    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 8) rocket.trail.shift();
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    rocket.vy += 0.18;

    rocket.trail.forEach((point, index) => {
      const alpha = (index + 1) / rocket.trail.length;
      ctx.beginPath();
      ctx.fillStyle = rocket.color;
      ctx.globalAlpha = alpha * 0.55;
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    if (rocket.vy >= -1.5) {
      explode(rocket.x, rocket.y, rocket.color);
      return false;
    }
    return rocket.y < height + 20;
  });

  particles = particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.06;
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
  if (!target || running) return;
  canvas = target;
  ctx = canvas.getContext("2d");
  if (!ctx) return;

  running = true;
  rockets = [];
  particles = [];
  canvas.classList.remove("is-hidden");
  resizeCanvas();
  window.addEventListener("resize", onResize);

  for (let i = 0; i < 4; i += 1) {
    window.setTimeout(launchRocket, i * 180);
  }
  frameId = window.requestAnimationFrame(tick);
}

function stopFireworks() {
  running = false;
  window.cancelAnimationFrame(frameId);
  window.removeEventListener("resize", onResize);
  rockets = [];
  particles = [];
  if (canvas) {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.add("is-hidden");
  }
  canvas = null;
  ctx = null;
}

export { startFireworks, stopFireworks };
