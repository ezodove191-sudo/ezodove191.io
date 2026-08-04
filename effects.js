// effects.js - auto-extracted from original single-file HTML

/* ===== VISUAL EFFECTS ===== */
function bindTiltEffects() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  let last = 0;
  document.querySelectorAll('.category-card, .list-card, .stat-item').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - last < 32) return; // ~30fps for gradient update
      last = now;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    }, { passive: true });
  });
}

function bindScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  let ticking = false;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = pct + '%';
    ticking = false;
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

function animateNumbers() {
  const nums = document.querySelectorAll('.stat-item .num');
  if (!nums.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.animated) return;
      el.dataset.animated = '1';
      io.unobserve(el);
      const target = el.textContent.trim();
      if (!/^\d+$/.test(target)) return;
      const end = parseInt(target, 10);
      const dur = 1200;
      const startTime = performance.now();
      const step = (now) => {
        const p = Math.min((now - startTime) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = String(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.3 });
  nums.forEach(el => io.observe(el));
}

/* particle canvas (optimized) */
(function initParticles() {
  const canvas = document.getElementById('fx-canvas');
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
  let width, height, particles = [];
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function create() {
    particles = [];
    // fewer particles for smoother frames; no O(n^2) connections
    const count = Math.min(40, Math.max(18, Math.floor((width * height) / 45000)));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        a: Math.random() * 0.35 + 0.12
      });
    }
  }
  let frame = 0;
  function draw() {
    frame++;
    ctx.clearRect(0, 0, width, height);
    // update + draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = width;
      else if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      else if (p.y > height) p.y = 0;
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = '#e8c66a';
      ctx.fill();
    }
    // lightweight connections: only every 3rd frame, limited per particle
    if (frame % 3 === 0) {
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#e8c66a';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        let links = 0;
        const a = particles[i];
        for (let j = i + 1; j < particles.length && links < 3; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < 9000) { // 100px squared
            links++;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  let resizeTid;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTid);
    resizeTid = setTimeout(() => { resize(); create(); }, 150);
  });
  resize(); create(); draw();
})();

/* cursor glow (transform-based, throttle input) */
(function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) return;
  let mx = -500, my = -500, cx = -500, cy = -500, moved = false;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY; moved = true;
  }, { passive: true });
  let rafId;
  function loop() {
    if (moved) {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      moved = Math.abs(mx - cx) > 0.5 || Math.abs(my - cy) > 0.5;
    }
    rafId = requestAnimationFrame(loop);
  }
  loop();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else loop();
  });
})();



/* observe card entrances to avoid animating off-screen elements */
(function observeCardEntrances() {
  if (!window.IntersectionObserver) return;
  // on touch devices keep animations running directly (simpler + avoids stuck paused state)
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });
  document.querySelectorAll('.list-card, .category-card, .stat-item, .detail-block').forEach(el => {
    el.style.animationPlayState = 'paused';
    io.observe(el);
  });
})();



/* ===== SIDEBAR CONTROL ===== */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');

function openSidebar() {
  sidebar?.classList.add('open');
  sidebarOverlay?.classList.add('open');
  hamburgerBtn?.classList.add('active');
}

function closeSidebar() {
  sidebar?.classList.remove('open');
  sidebarOverlay?.classList.remove('open');
  hamburgerBtn?.classList.remove('active');
}

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar?.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
}

if (sidebarClose) {
  sidebarClose.addEventListener('click', closeSidebar);
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', closeSidebar);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
    closeSidebar();
  }
});

window.addEventListener('hashchange', () => {
  saveScroll();
  render();
});
window.addEventListener('beforeunload', saveScroll);
window.addEventListener('pagehide', saveScroll);




/* ===== UNIFIED INTRO (splash ~3s + loading ~2.5s, total ~5.5s) ===== */
(function initIntro() {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) { window.scrollTo(0, 0); return; }

  // Skip on repeat visits within the same session
  if (sessionStorage.getItem('asylum_intro_played') === '1') {
    overlay.remove();
    window.scrollTo(0, 0);
    return;
  }

  const splash = document.getElementById('introSplash');
  const loading = document.getElementById('introLoading');
  const barFill = document.getElementById('introBarFill');
  const statusEl = document.getElementById('introStatus');

  const SPLASH_MS = 3000;
  const LOADING_MS = 2500;
  const FADE_MS = 600;

  const loadingSteps = [
    { pct: 15, text: '正在解密档案...' },
    { pct: 35, text: '加载角色数据...' },
    { pct: 55, text: '同步部门信息...' },
    { pct: 75, text: '校验守则条款...' },
    { pct: 90, text: '初始化安全协议...' },
    { pct: 100, text: '系统就绪' },
  ];

  // Phase 1 → Phase 2 transition
  setTimeout(() => {
    if (splash) splash.classList.remove('active');
    if (loading) loading.classList.add('active');

    // Animate loading bar
    const stepDelay = LOADING_MS / loadingSteps.length;
    let stepIdx = 0;
    function nextStep() {
      if (stepIdx >= loadingSteps.length) {
        // Fade out overlay
        overlay.classList.add('intro-fade-out');
        sessionStorage.setItem('asylum_intro_played', '1');
        setTimeout(() => {
          overlay.remove();
          window.scrollTo(0, 0);
        }, FADE_MS);
        return;
      }
      const step = loadingSteps[stepIdx];
      if (barFill) barFill.style.width = step.pct + '%';
      if (statusEl) statusEl.textContent = step.text;
      stepIdx++;
      setTimeout(nextStep, stepDelay);
    }
    setTimeout(nextStep, 200);
  }, SPLASH_MS);
})();

// Prevent browser from restoring previous scroll position on reload
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

render();
initGlobalSearch();
initFooterBadge();



