/* =============================================
   CYBER GEAR REGIMENT — LOADER
   ============================================= */
(function () {

  /* ---- Mini matrix rain on loader canvas ---- */
  const canvas = document.getElementById('loaderCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const FONT  = 13;
  const CHARS = 'アイウエオサシスセソタチ0123456789ABCDEFX><|[]#';
  let cols    = [];

  function initCols() {
    const n = Math.floor(W / FONT);
    cols = Array.from({ length: n }, () => ({
      y:     Math.random() * -60,
      speed: 0.5 + Math.random() * 1.0,
    }));
  }
  initCols();

  function rainTick() {
    ctx.fillStyle = 'rgba(8,3,3,0.2)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${FONT}px 'Share Tech Mono', monospace`;

    for (let i = 0; i < cols.length; i++) {
      const x = i * FONT;
      const y = cols[i].y * FONT;
      ctx.fillStyle = Math.random() < 0.05 ? '#ff6070' : '#ff1e2e';
      ctx.globalAlpha = 0.55;
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y);
      ctx.globalAlpha = 1;
      cols[i].y += cols[i].speed;
      if (y > H + FONT * 5) {
        cols[i].y     = -(Math.random() * 20 + 3);
        cols[i].speed = 0.5 + Math.random() * 1.0;
      }
    }
  }

  let rainRaf = requestAnimationFrame(function loop() {
    rainTick();
    rainRaf = requestAnimationFrame(loop);
  });

  /* ---- Loading sequence ---- */
  const bar      = document.getElementById('loaderBar');
  const pctLabel = document.getElementById('loaderPct');
  const status   = document.getElementById('loaderStatus');
  const gridItems = [
    document.getElementById('lg1'),
    document.getElementById('lg2'),
    document.getElementById('lg3'),
    document.getElementById('lg4'),
  ];

  const steps = [
    { pct: 18,  status: 'INITIALIZING NEURAL UPLINK...',   grid: 0 },
    { pct: 42,  status: 'ENCRYPTING DATA STREAMS...',       grid: 1 },
    { pct: 67,  status: 'CONNECTING TO DARK GRID...',       grid: 2 },
    { pct: 88,  status: 'LOADING OPERATIVE REGISTRY...',    grid: 3 },
    { pct: 100, status: 'ACCESS GRANTED — WELCOME, OPERATIVE', grid: -1 },
  ];

  let stepIdx = 0;
  let currentPct = 0;

  function animateTo(targetPct, onDone) {
    const tick = setInterval(() => {
      currentPct = Math.min(currentPct + 1, targetPct);
      bar.style.width    = currentPct + '%';
      pctLabel.textContent = currentPct + '%';
      if (currentPct >= targetPct) {
        clearInterval(tick);
        if (onDone) onDone();
      }
    }, 18);
  }

  function runStep() {
    if (stepIdx >= steps.length) return;
    const s = steps[stepIdx];

    // Activate current grid item
    if (s.grid >= 0) {
      gridItems[s.grid].classList.add('active');
    }

    status.textContent = s.status;
    if (window.CGRSound) CGRSound.stepActivate();

    animateTo(s.pct, () => {
      // Mark grid item done
      if (s.grid >= 0) {
        gridItems[s.grid].classList.remove('active');
        gridItems[s.grid].classList.add('done');
        if (window.CGRSound) CGRSound.stepComplete();
      }

      stepIdx++;
      if (stepIdx < steps.length) {
        setTimeout(runStep, 300);
      } else {
        // All done — pause then dismiss
        if (window.CGRSound) CGRSound.accessGranted();
        setTimeout(dismiss, 900);
      }
    });
  }

  /* ---- Cyberpunk glitch transition ---- */
  function dismiss() {
    const loader = document.getElementById('loader');
    if (window.CGRSound) { CGRSound.stopDrone(); CGRSound.glitchBurst(); }

    // Phase 1: rapid glitch slices on the loader
    let glitchCount = 0;
    const glitchInterval = setInterval(() => {
      const offsetX = (Math.random() - 0.5) * 24;
      const offsetY = (Math.random() - 0.5) * 8;
      const skew    = (Math.random() - 0.5) * 6;
      const brightness = 0.5 + Math.random() * 2.5;
      loader.style.transform  = `translate(${offsetX}px, ${offsetY}px) skewX(${skew}deg)`;
      loader.style.filter     = `brightness(${brightness}) saturate(2)`;
      loader.style.opacity    = (0.3 + Math.random() * 0.7).toString();
      glitchCount++;
      if (glitchCount > 14) {
        clearInterval(glitchInterval);
        loader.style.transform = '';
        loader.style.filter    = '';
        loader.style.opacity   = '1';
        phaseWhiteFlash();
      }
    }, 55);
  }

  function phaseWhiteFlash() {
    // Phase 2: blinding white flash overlay
    const flash = document.createElement('div');
    flash.id = 'cyberFlash';
    flash.style.cssText = `
      position:fixed; inset:0; z-index:99999;
      background:#fff;
      opacity:0;
      pointer-events:none;
      transition: opacity 0.08s ease;
    `;
    document.body.appendChild(flash);

    // Reveal main page now so it's ready under the flash
    document.body.classList.remove('loading');
    cancelAnimationFrame(rainRaf);

    // Execute flash sequence
    requestAnimationFrame(() => {
      flash.style.opacity = '1';
      if (window.CGRSound) CGRSound.impactFlash();
      setTimeout(() => {
        // Phase 3: split wipe — loader tears apart horizontally
        const loader = document.getElementById('loader');
        loader.style.transition = 'none';
        loader.style.clipPath   = 'inset(0 0 0 0)';

        const topHalf    = loader.cloneNode(true);
        const bottomHalf = loader.cloneNode(true);
        topHalf.id    = 'loaderTop';
        bottomHalf.id = 'loaderBot';
        topHalf.style.cssText    = `position:fixed;inset:0;z-index:9998;clip-path:inset(0 0 50% 0);transition:transform 0.5s cubic-bezier(.4,0,.2,1),opacity 0.5s ease;`;
        bottomHalf.style.cssText = `position:fixed;inset:0;z-index:9998;clip-path:inset(50% 0 0 0);transition:transform 0.5s cubic-bezier(.4,0,.2,1),opacity 0.5s ease;`;
        document.body.appendChild(topHalf);
        document.body.appendChild(bottomHalf);
        loader.remove();

        // Dim flash
        flash.style.transition = 'opacity 0.25s ease';
        flash.style.opacity    = '0';

        // Red chromatic aberration overlay
        const chromaR = document.createElement('div');
        chromaR.style.cssText = `position:fixed;inset:0;z-index:9997;background:rgba(255,30,46,0.18);mix-blend-mode:screen;pointer-events:none;transition:opacity 0.6s ease;`;
        document.body.appendChild(chromaR);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Tear halves apart
            topHalf.style.transform    = 'translateY(-105vh)';
            topHalf.style.opacity      = '0';
            bottomHalf.style.transform = 'translateY(105vh)';
            bottomHalf.style.opacity   = '0';

            // Horizontal scan line sweeps down
            const scanLine = document.createElement('div');
            scanLine.style.cssText = `
              position:fixed; left:0; top:-4px; width:100%; height:4px;
              background: linear-gradient(90deg, transparent, #ff1e2e, #fff, #ff1e2e, transparent);
              box-shadow: 0 0 18px #ff1e2e, 0 0 40px rgba(255,30,46,0.6);
              z-index:9999;
              transition: top 0.55s cubic-bezier(.4,0,.2,1);
              pointer-events:none;
            `;
            document.body.appendChild(scanLine);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                scanLine.style.top = '101vh';
                if (window.CGRSound) CGRSound.scanSweep();
              });
            });

            // Clean up everything after animation completes
            setTimeout(() => {
              [topHalf, bottomHalf, flash, chromaR, scanLine].forEach(el => el.remove());

              // Phase 4: hero content slams in with stagger
              heroEntrance();
            }, 620);
          });
        });
      }, 120);
    });
  }

  function heroEntrance() {
    // Briefly pulse a red vignette on the main page
    const vignette = document.createElement('div');
    vignette.style.cssText = `
      position:fixed; inset:0; z-index:200; pointer-events:none;
      background: radial-gradient(ellipse at center, transparent 30%, rgba(255,30,46,0.55) 100%);
      opacity:1; transition: opacity 1.2s ease;
    `;
    document.body.appendChild(vignette);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { vignette.style.opacity = '0'; });
    });
    setTimeout(() => vignette.remove(), 1300);

    // Stagger-animate hero children into view
    const hero = document.querySelector('.hero');
    if (!hero) return;
    hero.scrollIntoView({ behavior: 'auto' });

    const children = Array.from(hero.children);
    children.forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = `opacity 0.55s ease ${i * 100}ms, transform 0.55s ease ${i * 100}ms`;
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        children.forEach(el => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        });
      });
    });
  }

  // Wait for user click on the init overlay (browser autoplay policy requires a gesture)
  const initOverlay = document.getElementById('loader-init');

  function startSequence() {
    // Fade out and remove the overlay
    initOverlay.classList.add('hide');
    setTimeout(() => initOverlay.remove(), 380);

    // Start audio immediately after gesture
    if (window.CGRSound) CGRSound.startDrone();

    // Kick off loading sequence
    setTimeout(runStep, 600);
  }

  initOverlay.addEventListener('click', startSequence, { once: true });
  // Also allow any keypress to start
  document.addEventListener('keydown', startSequence, { once: true });

})();
