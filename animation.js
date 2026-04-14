/* =============================================
   CYBER GEAR REGIMENT — BACKGROUND ANIMATION
   Matrix rain + grid pulse + particle network
   ============================================= */

(function () {
  const canvas = document.getElementById('bgCanvas');
  const ctx    = canvas.getContext('2d');

  /* ---- Resize ---- */
  let W, H;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---- Palette ---- */
  const CYAN    = '#ff1e2e';   /* primary red */
  const MAGENTA = '#8a0018';   /* deep maroon */
  const PURPLE  = '#cc0010';   /* secondary red */
  const GREEN   = '#ff6070';   /* glow red */

  /* ============================================================
     LAYER 1 — MATRIX RAIN
     ============================================================ */
  const FONT_SIZE  = 14;
  const CHARS      = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFX><|[]{}#';
  let   columns    = [];
  const COL_ALPHA  = 0.55; // drop opacity

  function initColumns() {
    const cols = Math.floor(W / FONT_SIZE);
    columns = Array.from({ length: cols }, () => ({
      y:     Math.random() * -100,
      speed: 0.4 + Math.random() * 1.2,
      color: Math.random() < 0.12 ? MAGENTA : CYAN,
      bright: Math.random() < 0.08,
    }));
  }
  initColumns();
  window.addEventListener('resize', initColumns);

  function drawRain() {
    ctx.font = `${FONT_SIZE}px 'Share Tech Mono', monospace`;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const x   = i * FONT_SIZE;
      const y   = col.y * FONT_SIZE;

      /* Leading bright character */
      if (col.bright) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
      } else {
        ctx.fillStyle = col.color;
        ctx.globalAlpha = COL_ALPHA;
      }
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillText(ch, x, y);

      /* Trail characters fade */
      for (let t = 1; t <= 6; t++) {
        ctx.globalAlpha = Math.max(0, COL_ALPHA - t * 0.09);
        const tc = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(tc, x, y - t * FONT_SIZE);
      }

      col.y += col.speed;
      if (y > H + FONT_SIZE * 8) {
        col.y     = -(Math.random() * 30 + 5);
        col.speed = 0.4 + Math.random() * 1.2;
        col.bright = Math.random() < 0.08;
        col.color  = Math.random() < 0.12 ? MAGENTA : CYAN;
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     LAYER 2 — PERSPECTIVE GRID
     ============================================================ */
  let gridOffset = 0;

  function drawGrid() {
    const LINES   = 22;
    const COLS    = 20;
    const horizon = H * 0.48;
    const baseAlpha = 0.13;

    ctx.strokeStyle = '#ff1e2e';
    ctx.lineWidth   = 1;

    /* Horizontal lines (receding) */
    for (let i = 0; i <= LINES; i++) {
      const t   = ((i / LINES) + (gridOffset / H)) % 1;
      const ease = Math.pow(t, 2.4);
      const y   = horizon + (H - horizon) * ease;
      const spread = W * 0.5 * ease;
      const alpha  = baseAlpha * ease * 2;
      ctx.globalAlpha = Math.min(alpha, baseAlpha * 1.8);
      ctx.beginPath();
      ctx.moveTo(W / 2 - spread, y);
      ctx.lineTo(W / 2 + spread, y);
      ctx.stroke();
    }

    /* Vertical lines */
    for (let j = 0; j <= COLS; j++) {
      const tx = (j / COLS) - 0.5;
      const x0  = W / 2 + tx * W * 0.35;
      const x1  = W / 2 + tx * W;
      ctx.globalAlpha = baseAlpha * 0.9;
      ctx.beginPath();
      ctx.moveTo(x0, horizon);
      ctx.lineTo(x1, H);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    gridOffset = (gridOffset + 0.55) % H;
  }

  /* ============================================================
     LAYER 3 — PARTICLE NETWORK
     ============================================================ */
  const PARTICLE_COUNT = 70;
  let particles = [];

  function Particle() {
    return {
      x:   Math.random() * W,
      y:   Math.random() * H,
      vx:  (Math.random() - 0.5) * 0.4,
      vy:  (Math.random() - 0.5) * 0.4,
      r:   1 + Math.random() * 2,
      col: [CYAN, PURPLE, GREEN][Math.floor(Math.random() * 3)],
    };
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, Particle);
  }
  initParticles();
  window.addEventListener('resize', initParticles);

  function drawParticles() {
    const CONNECT_DIST = 140;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      /* Node dot */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col;
      ctx.globalAlpha = 0.6;
      ctx.fill();

      /* Connections */
      for (let j = i + 1; j < particles.length; j++) {
        const q  = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_DIST) {
          const alpha = (1 - d / CONNECT_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = '#ff3040';
          ctx.lineWidth   = 0.8;
          ctx.globalAlpha = alpha;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     LAYER 4 — HEXAGONAL PULSE RINGS
     ============================================================ */
  const rings = [];
  function spawnRing() {
    rings.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0,
      maxR: 60 + Math.random() * 80,
      col: [CYAN, MAGENTA, PURPLE, GREEN][Math.floor(Math.random() * 4)],
      speed: 0.6 + Math.random() * 0.8,
    });
  }
  setInterval(spawnRing, 900);

  function drawRings() {
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      ring.r += ring.speed;
      const alpha = (1 - ring.r / ring.maxR) * 0.45;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.col;
      ctx.lineWidth   = 1.2;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (ring.r >= ring.maxR) rings.splice(i, 1);
    }
  }

  /* ============================================================
     MAIN RENDER LOOP
     ============================================================ */
  function render() {
    /* Dark fade — leaves ghost trails for matrix effect */
    ctx.fillStyle = 'rgba(8,3,3,0.28)';
    ctx.fillRect(0, 0, W, H);

    drawGrid();
    drawRain();
    drawParticles();
    drawRings();

    requestAnimationFrame(render);
  }

  render();
})();
