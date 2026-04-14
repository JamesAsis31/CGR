/* =============================================
   CYBER GEAR REGIMENT — MAIN JS
   Counter animations, scroll fx, form handler
   ============================================= */

/* ---------- Animated Counters ---------- */
function animateCounter(el, target, duration) {
  let start = null;
  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(step);
}

/* Run counters when hero is in view */
const counterTargets = [
  { id: 'count1', value: 1247 },
  { id: 'count2', value: 389  },
  { id: 'count3', value: 72   },
];

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      counterTargets.forEach(ct => {
        const el = document.getElementById(ct.id);
        if (el) animateCounter(el, ct.value, 2200);
      });
      heroObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const hero = document.querySelector('.hero');
if (hero) heroObserver.observe(hero);

/* ---------- Scroll-Reveal for Cards / Sections ---------- */
const revealEls = document.querySelectorAll(
  '.op-card, .gear-item, .team-card, .about-card, .section-title, .about-text'
);

revealEls.forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.65s ease, transform 0.65s ease';
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings
      const siblings = Array.from(entry.target.parentElement.children);
      const delay    = siblings.indexOf(entry.target) * 80;
      setTimeout(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }, delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

/* ---------- Glitch on Hover (nav logo & footer logo) ---------- */
document.querySelectorAll('.nav-logo, .footer-logo').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.animation = 'glitchMain 0.4s';
    el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
  });
});

/* ---------- Contact Form Handler ---------- */
function handleForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const orig = btn.textContent;
  btn.textContent = 'TRANSMITTING...';
  btn.disabled    = true;

  setTimeout(() => {
    btn.textContent = '&#10003; MESSAGE ENCRYPTED';
    btn.style.background = 'var(--primary)';
    btn.style.color      = '#fff';
    setTimeout(() => {
      btn.innerHTML  = orig;
      btn.disabled   = false;
      btn.style.background = '';
      btn.style.color      = '';
      e.target.reset();
    }, 2800);
  }, 1400);
}

/* ---------- Active Nav Highlight on Scroll ---------- */
const sections  = document.querySelectorAll('.section');
const navAnchors = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navAnchors.forEach(a => {
      a.style.color      = a.getAttribute('href') === `#${id}` ? 'var(--primary)' : '';
      a.style.textShadow = a.getAttribute('href') === `#${id}` ? '0 0 8px var(--primary)' : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => navObserver.observe(s));

/* ---------- Nav & Button Sound Hooks ---------- */
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('mouseenter', () => {
    if (window.CGRSound) try { CGRSound.hoverBlip(); } catch (_) {}
  });
  link.addEventListener('click', () => {
    if (window.CGRSound) try { CGRSound.uiClick(); } catch (_) {}
  });
});
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    if (window.CGRSound) try { CGRSound.hoverBlip(); } catch (_) {}
  });
  btn.addEventListener('click', () => {
    if (window.CGRSound) try { CGRSound.uiClick(); } catch (_) {}
  });
});

/* ---------- Terminal Typing Effect in hero-badge ---------- */
(function () {
  const badge = document.querySelector('.hero-badge');
  if (!badge) return;
  const messages = [
    '[ SYSTEM ONLINE ]',
    '[ ALL SYSTEMS NOMINAL ]',
    '[ ENCRYPTION ACTIVE ]',
    '[ DARK GRID CONNECTED ]',
  ];
  let mi = 0;
  function typeBadge() {
    let txt = '';
    let ci  = 0;
    badge.textContent = '';
    function type() {
      if (ci < messages[mi].length) {
        txt += messages[mi][ci++];
        badge.textContent = txt;
        // Only play typing sound when hero is visible (near top of page)
        if (window.CGRSound && window.scrollY < window.innerHeight * 0.6) {
          try { CGRSound.typeKey(); } catch (_) {}
        }
        setTimeout(type, 45);
      } else {
        setTimeout(() => {
          mi = (mi + 1) % messages.length;
          typeBadge();
        }, 3200);
      }
    }
    type();
  }
  // Start typing the first message immediately after hero entrance
  setTimeout(typeBadge, 300);
})();
