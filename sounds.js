/* =============================================
   CYBER GEAR REGIMENT — SOUND ENGINE v2
   All sounds synthesized via Web Audio API.
   No external audio files required.
   ============================================= */
window.CGRSound = (() => {

  /* ============================================
     AUDIO CONTEXT — create immediately and try
     to auto-unlock; queue any sounds that fire
     before the browser allows audio.
     ============================================ */
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx      = new AudioCtx();

  const master = ctx.createGain();
  master.gain.value = 0.68;
  master.connect(ctx.destination);

  // Shared reverb convolver (synthetic impulse response)
  const reverb = (() => {
    const secs  = 2.4;
    const decay = 0.72;
    const len   = Math.ceil(ctx.sampleRate * secs);
    const buf   = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    conv.connect(master);
    return conv;
  })();

  /* ---- Autoplay / unlock logic ---- */
  let unlocked = false;
  const queue  = [];

  function flushQueue() {
    unlocked = true;
    queue.splice(0).forEach(fn => { try { fn(); } catch (_) {} });
  }

  function tryUnlock() {
    ctx.resume().then(() => {
      if (ctx.state === 'running') flushQueue();
    });
  }

  // Attempt immediately — works on many browsers after navigation
  tryUnlock();

  // Fallback: unlock on first real interaction
  ['pointerdown', 'keydown', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, tryUnlock, { once: true, capture: true })
  );

  /* ---- Schedule helper: runs fn() now if unlocked, else queues it ---- */
  function play(fn) {
    if (unlocked || ctx.state === 'running') {
      unlocked = true;
      try { fn(); } catch (_) {}
    } else {
      queue.push(fn);
      tryUnlock();
    }
  }

  const T = () => ctx.currentTime;

  /* ============================================
     ROUTING HELPERS
     ============================================ */

  // Route a gain node dry+wet simultaneously
  function wetConnect(gainNode, dryAmt, wetAmt) {
    const dG = ctx.createGain(); dG.gain.value = dryAmt;
    const wG = ctx.createGain(); wG.gain.value = wetAmt;
    gainNode.connect(dG); dG.connect(master);
    gainNode.connect(wG); wG.connect(reverb);
  }

  // Build a noise buffer source of given length (seconds)
  function makeNoise(dur) {
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  // Hard-clip waveshaper curve (amount = distortion 1–20)
  function makeClipCurve(amount) {
    const n = 256;
    const curve = new Float32Array(n);
    const k = amount;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / (n - 1) - 1;
      curve[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /* ============================================
     SOUND FUNCTIONS
     ============================================ */

  /* ---------- LOADING STEP ACTIVATES ----------
     Modem-style data burst — rapid square-wave
     frequency hops like a dial-up handshake     */
  function stepActivate() {
    play(() => {
      const t = T();
      // Rapid-fire frequency hops — modem/terminal data sound
      const freqs = [1400, 2100, 980, 1750, 2400, 1200, 1900];
      freqs.forEach((freq, i) => {
        const st = t + i * 0.022;
        const o  = ctx.createOscillator();
        const g  = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(freq, st);
        g.gain.setValueAtTime(0.055, st);
        g.gain.setValueAtTime(0.055, st + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.020);
        o.connect(g); g.connect(master);
        o.start(st); o.stop(st + 0.024);
      });

      // Underlying static hiss — like data over a wire
      const ns = makeNoise(0.16);
      const bf = ctx.createBiquadFilter();
      bf.type = 'bandpass'; bf.frequency.value = 2200; bf.Q.value = 1.2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.04, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      ns.connect(bf); bf.connect(ng); ng.connect(master);
      ns.start(t); ns.stop(t + 0.18);
    });
  }

  /* ---------- LOADING STEP DONE ----------
     Two terse square-wave terminal confirm beeps
     like a Unix process exit code 0             */
  function stepComplete() {
    play(() => {
      const t = T();
      // Two flat square beeps — cold, clinical confirmation
      [[880, 0], [880, 0.07]].forEach(([freq, delay]) => {
        const st = t + delay;
        const o  = ctx.createOscillator();
        const g  = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(freq, st);
        g.gain.setValueAtTime(0.055, st);
        g.gain.setValueAtTime(0.055, st + 0.038);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.042);
        o.connect(g); g.connect(master);
        o.start(st); o.stop(st + 0.05);
      });
    });
  }

  /* ---------- ACCESS GRANTED ----------
     Terminal system alert — fast data burst,
     flat confirmation tone, then static clear.  
     No music. Cold. Functional. Hacker.         */
  function accessGranted() {
    play(() => {
      const t = T();

      // Phase 1: rapid data spray (0–0.28s) — like bytes flooding in
      const dataFreqs = [1200,2400,600,1800,900,2100,1500,800,2800,1100,2200,700];
      dataFreqs.forEach((freq, i) => {
        const st = t + i * 0.024;
        const o  = ctx.createOscillator();
        const g  = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(freq, st);
        g.gain.setValueAtTime(0.06, st);
        g.gain.setValueAtTime(0.06, st + 0.019);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.022);
        o.connect(g); g.connect(master);
        o.start(st); o.stop(st + 0.026);
      });

      // Phase 2: noise static burst (0.30s)
      const ns1 = makeNoise(0.12);
      const bp1 = ctx.createBiquadFilter();
      bp1.type = 'bandpass'; bp1.frequency.value = 1800; bp1.Q.value = 1.0;
      const ng1 = ctx.createGain();
      ng1.gain.setValueAtTime(0.10, t + 0.30);
      ng1.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      ns1.connect(bp1); bp1.connect(ng1); ng1.connect(master);
      ns1.start(t + 0.30); ns1.stop(t + 0.45);

      // Phase 3: three flat terminal confirmation tones (0.45s)
      [[1000, 0.45], [1000, 0.52], [1400, 0.59]].forEach(([freq, delay]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(freq, t + delay);
        g.gain.setValueAtTime(0.10, t + delay);
        g.gain.setValueAtTime(0.10, t + delay + 0.048);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.055);
        o.connect(g); g.connect(master);
        o.start(t + delay); o.stop(t + delay + 0.066);
      });

      // Phase 4: white noise tail clears like a terminal wipe (0.72s)
      const ns2 = makeNoise(0.35);
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 3000;
      const ng2 = ctx.createGain();
      ng2.gain.setValueAtTime(0.08, t + 0.72);
      ng2.gain.exponentialRampToValueAtTime(0.0001, t + 1.06);
      ns2.connect(hpf); hpf.connect(ng2); ng2.connect(master);
      ns2.start(t + 0.72); ns2.stop(t + 1.10);
    });
  }

  /* ---------- GLITCH BURST ----------
     Distorted FM chaos — harsh, digital, fast   */
  function glitchBurst() {
    play(() => {
      const t = T();
      const clipCurve = makeClipCurve(14);

      for (let i = 0; i < 10; i++) {
        const st    = t + i * 0.060;
        const bFreq = 100 + Math.random() * 700;

        // FM into distortion
        const mod     = ctx.createOscillator();
        const modEnv  = ctx.createGain();
        const car     = ctx.createOscillator();
        const wshaper = ctx.createWaveShaper();
        const ampG    = ctx.createGain();

        mod.type = 'sawtooth';
        mod.frequency.setValueAtTime(bFreq * 0.5, st);
        modEnv.gain.setValueAtTime(bFreq * 3, st);
        modEnv.gain.exponentialRampToValueAtTime(0.1, st + 0.055);

        car.type = 'sawtooth';
        car.frequency.setValueAtTime(bFreq, st);
        car.frequency.linearRampToValueAtTime(bFreq * (0.3 + Math.random() * 0.9), st + 0.055);

        wshaper.curve = clipCurve;

        ampG.gain.setValueAtTime(0.22 - i * 0.016, st);
        ampG.gain.exponentialRampToValueAtTime(0.0001, st + 0.065);

        mod.connect(modEnv); modEnv.connect(car.frequency);
        car.connect(wshaper); wshaper.connect(ampG);
        wetConnect(ampG, 0.65, 0.15);

        mod.start(st); car.start(st);
        mod.stop(st + 0.08); car.stop(st + 0.08);

        // Companion noise burst
        const ns = makeNoise(0.055);
        const bf = ctx.createBiquadFilter();
        bf.type = 'bandpass';
        bf.frequency.value = 600 + Math.random() * 4000;
        bf.Q.value = 3.5;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.16 - i * 0.010, st);
        ng.gain.exponentialRampToValueAtTime(0.0001, st + 0.060);
        ns.connect(bf); bf.connect(ng);
        ng.connect(master);
        ns.start(st); ns.stop(st + 0.07);
      }
    });
  }

  /* ---------- IMPACT FLASH ----------
     Explosive sub punch + high crack           */
  function impactFlash() {
    play(() => {
      const t = T();

      // Deep sub thud
      const sub  = ctx.createOscillator();
      const subG = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(90, t);
      sub.frequency.exponentialRampToValueAtTime(26, t + 0.22);
      subG.gain.setValueAtTime(0.70, t);
      subG.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      sub.connect(subG); subG.connect(master);
      sub.start(t); sub.stop(t + 0.30);

      // Mid transient click
      const mid  = ctx.createOscillator();
      const midG = ctx.createGain();
      mid.type = 'sine';
      mid.frequency.setValueAtTime(380, t);
      mid.frequency.exponentialRampToValueAtTime(70, t + 0.07);
      midG.gain.setValueAtTime(0.32, t);
      midG.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      mid.connect(midG); midG.connect(master);
      mid.start(t); mid.stop(t + 0.11);

      // High-frequency crack
      const ns = makeNoise(0.14);
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 3500;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.38, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      ns.connect(hpf); hpf.connect(ng);
      wetConnect(ng, 0.65, 0.55);
      ns.start(t); ns.stop(t + 0.18);
    });
  }

  /* ---------- SCAN SWEEP ----------
     Filtered sawtooth rising with reverb tail  */
  function scanSweep() {
    play(() => {
      const t = T();

      // Primary sweep — filtered sawtooth
      const saw  = ctx.createOscillator();
      const flt  = ctx.createBiquadFilter();
      const sawG = ctx.createGain();
      saw.type = 'sawtooth';
      saw.frequency.setValueAtTime(80, t);
      saw.frequency.exponentialRampToValueAtTime(3800, t + 0.58);
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(160, t);
      flt.frequency.exponentialRampToValueAtTime(6000, t + 0.58);
      flt.Q.value = 4;
      sawG.gain.setValueAtTime(0.0, t);
      sawG.gain.linearRampToValueAtTime(0.28, t + 0.04);
      sawG.gain.linearRampToValueAtTime(0.32, t + 0.28);
      sawG.gain.exponentialRampToValueAtTime(0.0001, t + 0.60);
      saw.connect(flt); flt.connect(sawG);
      wetConnect(sawG, 0.42, 0.80);
      saw.start(t); saw.stop(t + 0.65);

      // Thin overtone sine sweep
      const hi  = ctx.createOscillator();
      const hiG = ctx.createGain();
      hi.type = 'sine';
      hi.frequency.setValueAtTime(480, t);
      hi.frequency.exponentialRampToValueAtTime(9600, t + 0.58);
      hiG.gain.setValueAtTime(0.07, t);
      hiG.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
      hi.connect(hiG);
      wetConnect(hiG, 0.30, 0.90);
      hi.start(t); hi.stop(t + 0.62);
    });
  }

  /* ---------- BUTTON CLICK ----------
     Resonant transient + filtered noise        */
  function uiClick() {
    play(() => {
      const t = T();
      // Falling resonant click
      const o  = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(2400, t);
      o.frequency.exponentialRampToValueAtTime(700, t + 0.035);
      og.gain.setValueAtTime(0.15, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      o.connect(og); og.connect(master);
      o.start(t); o.stop(t + 0.04);

      // Noise body
      const ns = makeNoise(0.022);
      const bf = ctx.createBiquadFilter();
      bf.type = 'bandpass'; bf.frequency.value = 3000; bf.Q.value = 2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.20, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
      ns.connect(bf); bf.connect(ng); ng.connect(master);
      ns.start(t); ns.stop(t + 0.03);
    });
  }

  /* ---------- HOVER BLIP ---------- */
  function hoverBlip() {
    play(() => {
      const t = T();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1400, t);
      o.frequency.exponentialRampToValueAtTime(900, t + 0.018);
      g.gain.setValueAtTime(0.042, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.025);
    });
  }

  /* ---------- TYPEWRITER KEY ----------
     Tactile clack model — dense layered synthesis:
     - Ultra-short HF crack (key actuating)
     - Clicky mid-noise spike through narrow bandpass
     - Keycap thock (mid-body resonance ~700Hz)
     - Sub bottom-out thud (LPF noise)
     - Tiny reverb room tail                          */
  function typeKey() {
    play(() => {
      const t = T();

      // 1. HF crack — ultra-brief air transient on actuation
      const ns1 = makeNoise(0.003);
      const hp1 = ctx.createBiquadFilter();
      hp1.type = 'highpass'; hp1.frequency.value = 7500;
      const ng1 = ctx.createGain();
      ng1.gain.setValueAtTime(0.75, t);
      ng1.gain.exponentialRampToValueAtTime(0.0001, t + 0.003);
      ns1.connect(hp1); hp1.connect(ng1); ng1.connect(master);
      ns1.start(t); ns1.stop(t + 0.004);

      // 2. Click spike — bandpass noise clipping for the mechanical snap
      const ns2 = makeNoise(0.016);
      const bp2 = ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.value = 1700 + Math.random() * 700;
      bp2.Q.value = 3.8;
      const ws2 = ctx.createWaveShaper();
      ws2.curve = makeClipCurve(10);
      const ng2 = ctx.createGain();
      ng2.gain.setValueAtTime(0.55, t + 0.001);
      ng2.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
      ns2.connect(bp2); bp2.connect(ws2); ws2.connect(ng2); ng2.connect(master);
      ns2.start(t + 0.001); ns2.stop(t + 0.018);

      // 3. Keycap thock — mid body resonance (the satisfying "clack" body)
      const ns3 = makeNoise(0.040);
      const bp3 = ctx.createBiquadFilter();
      bp3.type = 'bandpass';
      bp3.frequency.value = 680 + Math.random() * 180;
      bp3.Q.value = 2.4;
      const ng3 = ctx.createGain();
      ng3.gain.setValueAtTime(0.38, t + 0.003);
      ng3.gain.exponentialRampToValueAtTime(0.0001, t + 0.042);
      ns3.connect(bp3); bp3.connect(ng3); ng3.connect(master);
      ns3.start(t + 0.003); ns3.stop(t + 0.046);

      // 4. Bottom-out sub thud — low-end impact on key travel end
      const ns4 = makeNoise(0.020);
      const lp4 = ctx.createBiquadFilter();
      lp4.type = 'lowpass'; lp4.frequency.value = 200;
      const ng4 = ctx.createGain();
      ng4.gain.setValueAtTime(0.55, t + 0.007);
      ng4.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);
      ns4.connect(lp4); lp4.connect(ng4); ng4.connect(master);
      ns4.start(t + 0.007); ns4.stop(t + 0.028);

      // 5. Room tail — reverbed HF presence gives sense of space
      const ns5 = makeNoise(0.022);
      const hp5 = ctx.createBiquadFilter();
      hp5.type = 'highpass'; hp5.frequency.value = 4200;
      const ng5 = ctx.createGain();
      ng5.gain.setValueAtTime(0.016, t);
      ng5.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
      ns5.connect(hp5); hp5.connect(ng5);
      wetConnect(ng5, 0.0, 0.50);
      ns5.start(t); ns5.stop(t + 0.028);
    });
  }

  /* ============================================
     AMBIENT LOADING DRONE
     Server room hum: bandpass-filtered white
     noise + 60Hz electrical hum + occasional
     random data blips. No music. Pure machine.
     ============================================ */
  let droneNodes = [];
  let droneMainGain = null;

  function startDrone() {
    play(() => {
      droneMainGain = ctx.createGain();
      droneMainGain.gain.setValueAtTime(0.0, ctx.currentTime);
      droneMainGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 2.5);

      const dryG = ctx.createGain(); dryG.gain.value = 1.0;
      droneMainGain.connect(dryG); dryG.connect(master);

      // Layer 1: server room noise — bandpass filtered white noise
      const noiseLen = ctx.sampleRate * 4;
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
      const noiseLoop = ctx.createBufferSource();
      noiseLoop.buffer = noiseBuf;
      noiseLoop.loop   = true;
      const nBp1 = ctx.createBiquadFilter();
      nBp1.type = 'bandpass'; nBp1.frequency.value = 300; nBp1.Q.value = 0.4;
      const nBp2 = ctx.createBiquadFilter();
      nBp2.type = 'bandpass'; nBp2.frequency.value = 900; nBp2.Q.value = 0.3;
      const nGain = ctx.createGain(); nGain.gain.value = 0.022;
      noiseLoop.connect(nBp1); nBp1.connect(nGain);
      noiseLoop.connect(nBp2); nBp2.connect(nGain);
      nGain.connect(droneMainGain);
      noiseLoop.start();
      droneNodes.push(noiseLoop);

      // Layer 2: 60Hz electrical hum (square wave, very low volume)
      const hum  = ctx.createOscillator();
      const humG = ctx.createGain();
      hum.type = 'square';
      hum.frequency.value = 60;
      humG.gain.value = 0.009;
      hum.connect(humG); humG.connect(droneMainGain);
      hum.start();
      droneNodes.push(hum);

      // Layer 3: 120Hz harmonic (adds realism to electrical hum)
      const hum2  = ctx.createOscillator();
      const hum2G = ctx.createGain();
      hum2.type = 'square';
      hum2.frequency.value = 120;
      hum2G.gain.value = 0.004;
      hum2.connect(hum2G); hum2G.connect(droneMainGain);
      hum2.start();
      droneNodes.push(hum2);

      // Layer 4: random sparse data blips
      let blipTimer;
      function scheduleBlip() {
        const delay = 800 + Math.random() * 2200;
        blipTimer = setTimeout(() => {
          if (!droneMainGain) return;
          const bt = ctx.currentTime;
          const bo = ctx.createOscillator();
          const bg = ctx.createGain();
          bo.type = 'square';
          bo.frequency.value = [600, 900, 1200, 1800, 2400][Math.floor(Math.random() * 5)];
          bg.gain.setValueAtTime(0.030, bt);
          bg.gain.setValueAtTime(0.030, bt + 0.012);
          bg.gain.exponentialRampToValueAtTime(0.0001, bt + 0.016);
          bo.connect(bg); bg.connect(master);
          bo.start(bt); bo.stop(bt + 0.020);
          scheduleBlip();
        }, delay);
      }
      scheduleBlip();
      // Store cleanup for blip timer
      droneNodes._blipTimer = blipTimer;
      droneNodes._scheduleBlip = scheduleBlip;
      droneNodes._stopBlip = () => clearTimeout(blipTimer);
    });
  }

  function stopDrone() {
    if (!droneMainGain) return;
    if (droneNodes._stopBlip) droneNodes._stopBlip();
    const t = ctx.currentTime;
    droneMainGain.gain.setValueAtTime(droneMainGain.gain.value, t);
    droneMainGain.gain.linearRampToValueAtTime(0.0, t + 0.70);
    setTimeout(() => {
      droneNodes.forEach(n => { try { if (n.stop) n.stop(); } catch (_) {} });
      droneNodes = [];
      droneMainGain = null;
    }, 900);
  }

  /* ============================================
     AUTO-HOOK GLOBAL UI EVENTS
     ============================================ */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a, button, .btn').forEach(el => {
      el.addEventListener('click', () => { try { uiClick(); } catch (_) {} });
    });
    document.querySelectorAll('.nav-links a, .btn, .team-card, .op-card, .gear-item').forEach(el => {
      el.addEventListener('mouseenter', () => { try { hoverBlip(); } catch (_) {} });
    });
    document.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('keydown', () => { try { typeKey(); } catch (_) {} });
    });
  });

  return {
    stepActivate,
    stepComplete,
    accessGranted,
    glitchBurst,
    impactFlash,
    scanSweep,
    uiClick,
    hoverBlip,
    typeKey,
    startDrone,
    stopDrone,
  };
})();
