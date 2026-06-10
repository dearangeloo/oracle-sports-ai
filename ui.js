// OracleSports.ai — UI Utilities

// ── Toast Notifications ──────────────────────────────
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Modal ─────────────────────────────────────────────
export function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
export function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
export function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('open');
  });
  document.body.style.overflow = '';
}

// ── Particles Canvas ─────────────────────────────────
export function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const PARTICLE_COUNT = 80;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,168,255,${p.alpha})`;
      ctx.fill();
    });
    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,168,255,${0.06 * (1 - dist/100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  draw();
  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });
}

// ── Scroll Reveal ─────────────────────────────────────
export function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

// ── Navbar Scroll ─────────────────────────────────────
export function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', update, { passive: true });
  update();

  // Hamburger
  const ham = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (ham && links) {
    ham.addEventListener('click', () => links.classList.toggle('mobile-open'));
  }

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });
}

// ── Countdown Timer ───────────────────────────────────
export function initCountdown(targetDateStr) {
  const target = new Date(targetDateStr).getTime();
  const days    = document.getElementById('cd-days');
  const hours   = document.getElementById('cd-hours');
  const minutes = document.getElementById('cd-minutes');
  const seconds = document.getElementById('cd-seconds');
  if (!days) return;

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) { days.textContent = hours.textContent = minutes.textContent = seconds.textContent = '00'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    days.textContent    = String(d).padStart(2, '0');
    hours.textContent   = String(h).padStart(2, '0');
    minutes.textContent = String(m).padStart(2, '0');
    seconds.textContent = String(s).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
}

// ── Rollover Calculator ───────────────────────────────
export function initCalculator() {
  const form   = document.getElementById('calc-form');
  const tbody  = document.getElementById('calc-tbody');
  if (!form || !tbody) return;

  form.addEventListener('input', () => {
    const start = parseFloat(document.getElementById('calc-start').value) || 0;
    const days  = parseInt(document.getElementById('calc-days').value)    || 7;
    const type  = document.getElementById('calc-challenge').value;
    const odds  = type === 'safe' ? 1.5 : type === 'growth' ? 2.0 : 4.0;

    tbody.innerHTML = '';
    let stake = start;
    for (let i = 1; i <= days; i++) {
      const win = +(stake * odds).toFixed(2);
      const tr  = document.createElement('tr');
      tr.innerHTML = `
        <td>Day ${i}</td>
        <td>₦${stake.toLocaleString()}</td>
        <td>${odds}</td>
        <td class="win-cell">₦${win.toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
      stake = win;
    }
    // Update projected final
    const el = document.getElementById('calc-projected');
    if (el) el.textContent = `₦${stake.toLocaleString()}`;
  });
}

// ── Confidence Arc Meter ──────────────────────────────
export function drawConfidenceArc(svgEl, pct, color = '#00A8FF') {
  if (!svgEl) return;
  const r   = 50; const cx = 70; const cy = 70;
  const arc = (pct / 100) * Math.PI;
  const x   = cx + r * Math.cos(Math.PI - arc);
  const y   = cy - r * Math.sin(arc) + r;
  const large = arc > Math.PI / 2 ? 1 : 0;

  svgEl.innerHTML = `
    <path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" 
          fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="8" stroke-linecap="round"/>
    <path d="M${cx-r} ${cy} A${r} ${r} 0 ${large} 1 ${x} ${y}" 
          fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
          style="filter:drop-shadow(0 0 6px ${color})"/>
    <text x="${cx}" y="${cy+8}" text-anchor="middle" 
          fill="${color}" font-family="Orbitron,sans-serif" font-size="18" font-weight="700">${pct}%</text>
  `;
}

// ── Number Counter Animation ──────────────────────────
export function animateCount(el, target, duration = 1800, prefix = '', suffix = '') {
  if (!el) return;
  const start = Date.now();
  const step = () => {
    const pct  = Math.min((Date.now() - start) / duration, 1);
    const ease = 1 - Math.pow(1 - pct, 3);
    el.textContent = prefix + Math.floor(ease * target).toLocaleString() + suffix;
    if (pct < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
