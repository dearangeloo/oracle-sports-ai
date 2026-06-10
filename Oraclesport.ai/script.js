/* ========================================
   ORACLESPORTS.AI — MAIN SCRIPT
   ======================================== */

// ---- FIREBASE CONFIG ----
const firebaseConfig = {
  apiKey: "AIzaSyAA0Mu8cCBQ4cfZr3XyAuPDQAwpvYKj7Ls",
  authDomain: "oracle-sports-ai.firebaseapp.com",
  databaseURL: "https://oracle-sports-ai-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "oracle-sports-ai",
  storageBucket: "oracle-sports-ai.firebasestorage.app",
  messagingSenderId: "334017049843",
  appId: "1:334017049843:web:c6a17114cd652b78a1f386"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ---- PAYSTACK ----
const PAYSTACK_PUBLIC_KEY = "pk_live_da105e2c3fff1091dfa5f2c0b5b5280a3928b9ab";

// ---- API-SPORTS ----
const SPORTS_API_KEY = "1c6ddc2ed65130be2216d9a5b5c01fa8";
const SPORTS_API_BASE = "https://v3.football.api-sports.io";

// ========================================
//  DOM READY
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initNavbar();
  initHeroCounters();
  initAIAssistant();
  initConfidenceMeter();
  renderPredictions();
  loadMatchCenter();
  initCountdown();
  initCalculator();
  initMission();
  renderHistoryTable();
  renderLeaderboard();
  renderTestimonials();
  initAuthModal();
  initPaymentModal();
  initTicker();
  initScrollAnimations();
  initHamburger();
});

// ========================================
//  PARTICLES BACKGROUND
// ========================================
function initParticles() {
  const bg = document.getElementById("particles-bg");
  const canvas = document.createElement("canvas");
  bg.appendChild(canvas);
  canvas.style.cssText = "width:100%;height:100%;position:absolute;inset:0;";
  const ctx = canvas.getContext("2d");
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? "0,168,255" : "255,215,0"
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    // Draw connections
    particles.forEach((a, i) => {
      particles.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,168,255,${0.04 * (1 - d / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ========================================
//  NAVBAR SCROLL
// ========================================
function initNavbar() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 60);
  });
  // Active link on scroll
  const sections = document.querySelectorAll("section[id]");
  const links = document.querySelectorAll(".nav-link");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove("active"));
        const active = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
        if (active) active.classList.add("active");
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
}

// ========================================
//  HAMBURGER MENU
// ========================================
function initHamburger() {
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("navLinks");
  btn.addEventListener("click", () => nav.classList.toggle("open"));
  document.addEventListener("click", e => {
    if (!btn.contains(e.target) && !nav.contains(e.target)) nav.classList.remove("open");
  });
}

// ========================================
//  HERO COUNTERS
// ========================================
function initHeroCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}
function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const duration = 1800;
  const start = performance.now();
  function update(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(ease * target).toLocaleString();
    if (t < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ========================================
//  AI ASSISTANT PANEL
// ========================================
function initAIAssistant() {
  const btn = document.getElementById("aiAssistantBtn");
  const panel = document.getElementById("aiPanel");
  const close = document.getElementById("aiClose");
  btn.addEventListener("click", () => panel.classList.toggle("open"));
  close.addEventListener("click", () => panel.classList.remove("open"));
  document.addEventListener("click", e => {
    if (!btn.contains(e.target) && !panel.contains(e.target)) panel.classList.remove("open");
  });
}

// ========================================
//  CONFIDENCE METER ANIMATION
// ========================================
function initConfidenceMeter() {
  const ring = document.getElementById("confRingFill");
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      const pct = 91;
      const circumference = 502;
      const offset = circumference - (pct / 100) * circumference;
      ring.style.transition = "stroke-dashoffset 1.5s ease";
      ring.style.strokeDashoffset = offset;
      observer.disconnect();
    }
  }, { threshold: 0.5 });
  const section = document.querySelector(".confidence-section");
  if (section) observer.observe(section);
}

// ========================================
//  PREDICTION CARDS (Static AI-generated)
// ========================================
const PREDICTIONS = [
  {
    league: "⚽ PREMIER LEAGUE",
    match: "Liverpool vs Newcastle",
    prediction: "Liverpool Win",
    confidence: "84%",
    risk: "Low",
    riskClass: "risk-low",
    explanation: "Liverpool have W5 in last 6 home games. Newcastle's key striker is doubtful. xG differential favours Liverpool by +1.3.",
    locked: "Premium: Asian Handicap -0.5 Value Pick"
  },
  {
    league: "🏆 LA LIGA",
    match: "Barcelona vs Atletico Madrid",
    prediction: "BTTS — Yes",
    confidence: "79%",
    risk: "Medium",
    riskClass: "risk-med",
    explanation: "Both sides have scored in 5 consecutive head-to-heads. Barcelona's defence has allowed 1+ goals in 7 of last 8 home fixtures.",
    locked: "Premium: Correct Score Analysis"
  },
  {
    league: "⚽ BUNDESLIGA",
    match: "Bayern Munich vs Dortmund",
    prediction: "Over 2.5 Goals",
    confidence: "88%",
    risk: "Low",
    riskClass: "risk-low",
    explanation: "Der Klassiker averages 3.8 goals over the last 10 meetings. Both teams in top-5 for xG this season.",
    locked: "Premium: First Goalscorer Insight"
  },
  {
    league: "🏆 SERIE A",
    match: "Inter Milan vs AC Milan",
    prediction: "Inter Win or Draw",
    confidence: "76%",
    risk: "Low",
    riskClass: "risk-low",
    explanation: "Inter unbeaten in last 9 home derbies. AC Milan missing 2 first-choice defenders. Form index: Inter 7.8 vs 5.4.",
    locked: "Premium: Double Chance Odds Analysis"
  }
];

function renderPredictions() {
  const grid = document.getElementById("predictionsGrid");
  if (!grid) return;
  grid.innerHTML = PREDICTIONS.map(p => `
    <div class="pred-card">
      <div class="pred-league">${p.league}</div>
      <div class="pred-match">${p.match}</div>
      <div class="pred-meta">
        <span class="pred-tag prediction"><i class="fas fa-robot"></i> ${p.prediction}</span>
        <span class="pred-tag confidence"><i class="fas fa-chart-line"></i> ${p.confidence}</span>
        <span class="pred-tag ${p.riskClass}"><i class="fas fa-shield-alt"></i> ${p.risk} Risk</span>
      </div>
      <p class="pred-explanation">${p.explanation}</p>
      <div class="pred-locked">
        <i class="fas fa-lock"></i>
        <span>🔒 ${p.locked}</span>
      </div>
    </div>
  `).join("");
}

// ========================================
//  MATCH CENTER — API-SPORTS
// ========================================
async function loadMatchCenter() {
  const grid = document.getElementById("matchCenterGrid");
  if (!grid) return;

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(`${SPORTS_API_BASE}/fixtures?date=${today}&league=39,140,78,135,61,2&season=2024`, {
      headers: {
        "x-apisports-key": SPORTS_API_KEY
      }
    });
    const data = await res.json();

    if (data.response && data.response.length > 0) {
      const fixtures = data.response.slice(0, 12);
      grid.innerHTML = fixtures.map(f => buildMatchCard(f)).join("");
    } else {
      grid.innerHTML = renderDemoMatches();
    }
  } catch (err) {
    console.warn("API error, using demo data:", err);
    grid.innerHTML = renderDemoMatches();
  }
}

function buildMatchCard(fixture) {
  const home = fixture.teams.home.name;
  const away = fixture.teams.away.name;
  const league = fixture.league.name;
  const time = new Date(fixture.fixture.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const status = fixture.fixture.status.short;
  const homeG = fixture.goals.home;
  const awayG = fixture.goals.away;
  const score = (homeG !== null) ? `${homeG} - ${awayG}` : time;

  // Mock probabilities (would be from odds endpoint in premium)
  const homeProb = Math.floor(Math.random() * 30 + 35);
  const drawProb = Math.floor(Math.random() * 15 + 20);
  const awayProb = 100 - homeProb - drawProb;

  return `
    <div class="match-card">
      <div class="mc-league">${league}</div>
      <div class="mc-teams">
        <div class="mc-team">${home}</div>
        <div class="mc-vs">${score}</div>
        <div class="mc-team">${away}</div>
      </div>
      <div class="mc-probabilities">
        <div class="mc-prob"><span class="mc-prob-label">Home</span><span class="mc-prob-val home">${homeProb}%</span></div>
        <div class="mc-prob"><span class="mc-prob-label">Draw</span><span class="mc-prob-val draw">${drawProb}%</span></div>
        <div class="mc-prob"><span class="mc-prob-label">Away</span><span class="mc-prob-val away">${awayProb}%</span></div>
      </div>
      <div class="mc-tags">
        <span class="mc-tag">BTTS Analysis</span>
        <span class="mc-tag">Over/Under</span>
        <span class="mc-tag">Form Index</span>
      </div>
    </div>
  `;
}

function renderDemoMatches() {
  const matches = [
    { home: "Man City", away: "Arsenal", league: "Premier League", score: "17:30", homeP: 55, drawP: 22, awayP: 23 },
    { home: "Real Madrid", away: "Barcelona", league: "La Liga", score: "20:00", homeP: 43, drawP: 27, awayP: 30 },
    { home: "Bayern Munich", away: "Leverkusen", league: "Bundesliga", score: "18:30", homeP: 58, drawP: 18, awayP: 24 },
    { home: "PSG", away: "Lyon", league: "Ligue 1", score: "21:00", homeP: 62, drawP: 20, awayP: 18 },
    { home: "Juventus", away: "Napoli", league: "Serie A", score: "19:45", homeP: 40, drawP: 28, awayP: 32 },
    { home: "Chelsea", away: "Tottenham", league: "Premier League", score: "16:00", homeP: 45, drawP: 25, awayP: 30 },
  ];
  return matches.map(m => `
    <div class="match-card">
      <div class="mc-league">⚽ ${m.league.toUpperCase()}</div>
      <div class="mc-teams">
        <div class="mc-team">${m.home}</div>
        <div class="mc-vs">${m.score}</div>
        <div class="mc-team">${m.away}</div>
      </div>
      <div class="mc-probabilities">
        <div class="mc-prob"><span class="mc-prob-label">Home</span><span class="mc-prob-val home">${m.homeP}%</span></div>
        <div class="mc-prob"><span class="mc-prob-label">Draw</span><span class="mc-prob-val draw">${m.drawP}%</span></div>
        <div class="mc-prob"><span class="mc-prob-label">Away</span><span class="mc-prob-val away">${m.awayP}%</span></div>
      </div>
      <div class="mc-tags">
        <span class="mc-tag">BTTS Analysis</span>
        <span class="mc-tag">Over/Under</span>
        <span class="mc-tag">Form Index</span>
        <span class="mc-tag">H2H</span>
      </div>
    </div>
  `).join("");
}

// ---- Match Center Search ----
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchMatchBtn");
  const searchInput = document.getElementById("matchSearch");
  const leagueFilter = document.getElementById("leagueFilter");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const q = searchInput?.value?.toLowerCase();
      const cards = document.querySelectorAll(".match-card");
      cards.forEach(c => {
        const text = c.textContent.toLowerCase();
        c.style.display = (!q || text.includes(q)) ? "" : "none";
      });
    });
  }
});

// ========================================
//  COUNTDOWN TIMER
// ========================================
function initCountdown() {
  const target = new Date();
  target.setDate(target.getDate() + 2);
  target.setHours(13, 45, 0, 0);

  function update() {
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) { clearInterval(interval); return; }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = n => String(n).padStart(2, "0");
    document.getElementById("cd-days").textContent = pad(days);
    document.getElementById("cd-hours").textContent = pad(hours);
    document.getElementById("cd-mins").textContent = pad(mins);
    document.getElementById("cd-secs").textContent = pad(secs);
  }
  update();
  const interval = setInterval(update, 1000);
}

// ========================================
//  ROLLOVER CALCULATOR
// ========================================
function initCalculator() {
  const btn = document.getElementById("calcBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const start = parseFloat(document.getElementById("calcStart").value);
    const odds = parseFloat(document.getElementById("calcChallenge").value);
    const days = parseInt(document.getElementById("calcDays").value);

    if (!start || !days || start <= 0 || days <= 0) {
      alert("Please enter valid Starting Amount and Number of Days.");
      return;
    }

    const results = document.getElementById("calcResults");
    const tbody = document.getElementById("calcTableBody");
    results.style.display = "block";

    let rows = "";
    let amount = start;
    const winRate = odds <= 1.5 ? 0.84 : odds <= 2.0 ? 0.72 : 0.55;

    for (let d = 1; d <= Math.min(days, 30); d++) {
      const stake = amount.toFixed(2);
      const win = (amount * odds).toFixed(2);
      const isWin = Math.random() < winRate;
      const next = isWin ? amount * odds : amount * 0.05;
      amount = Math.max(next, start * 0.05);
      rows += `<tr><td>${d}</td><td>₦${parseFloat(stake).toLocaleString()}</td><td>${odds}</td><td>₦${parseFloat(win).toLocaleString()}</td></tr>`;
    }
    tbody.innerHTML = rows;

    // Show summary based on projected growth
    const projected = start * Math.pow(odds * winRate + (1 - winRate) * 0.1, days);
    const final = Math.max(projected, start * 0.2);
    const profit = final - start;
    const roi = ((profit / start) * 100).toFixed(1);

    document.getElementById("calcFinal").textContent = `₦${final.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    document.getElementById("calcProfit").textContent = `₦${profit.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    document.getElementById("calcROI").textContent = `${roi}%`;
  });
}

// ========================================
//  DAILY MISSION
// ========================================
let missionCompleted = 0;
function initMission() {
  missionCompleted = 0;
  updateMissionProgress();
}
function completeMissionTask(id) {
  const task = document.getElementById(id);
  if (!task || task.classList.contains("done")) return;
  task.classList.add("done");
  missionCompleted++;
  updateMissionProgress();
}
function updateMissionProgress() {
  const pct = (missionCompleted / 3) * 100;
  document.getElementById("missionProgress").style.width = pct + "%";
  document.getElementById("missionLabel").textContent = `${missionCompleted} / 3 completed`;
}
window.completeMissionTask = completeMissionTask;

// ========================================
//  PREDICTION HISTORY TABLE
// ========================================
const HISTORY = [
  { date: "10 Jun", match: "Man City vs Arsenal", pred: "Man City Win", odds: "1.65", conf: "82%", result: "WIN" },
  { date: "10 Jun", match: "Real Madrid vs Sevilla", pred: "Over 2.5 Goals", odds: "1.80", conf: "77%", result: "WIN" },
  { date: "09 Jun", match: "PSG vs Nice", pred: "PSG Win", odds: "1.45", conf: "89%", result: "WIN" },
  { date: "09 Jun", match: "Chelsea vs Wolves", pred: "BTTS Yes", odds: "1.70", conf: "74%", result: "LOSS" },
  { date: "08 Jun", match: "Bayern vs Stuttgart", pred: "Bayern -1.5", odds: "1.75", conf: "80%", result: "WIN" },
  { date: "08 Jun", match: "Barcelona vs Valencia", pred: "Barcelona Win", odds: "1.55", conf: "86%", result: "WIN" },
  { date: "07 Jun", match: "Liverpool vs Everton", pred: "Liverpool Win", odds: "1.50", conf: "91%", result: "WIN" },
  { date: "07 Jun", match: "Juventus vs Lazio", pred: "Draw", odds: "3.40", conf: "58%", result: "LOSS" },
];
function renderHistoryTable() {
  const tbody = document.getElementById("historyBody");
  if (!tbody) return;
  tbody.innerHTML = HISTORY.map(h => `
    <tr>
      <td>${h.date}</td>
      <td>${h.match}</td>
      <td>${h.pred}</td>
      <td>${h.odds}</td>
      <td>${h.conf}</td>
      <td class="${h.result === 'WIN' ? 'result-win' : 'result-loss'}">${h.result === 'WIN' ? '✅ WIN' : '❌ LOSS'}</td>
    </tr>
  `).join("");
}

// ========================================
//  LEADERBOARD
// ========================================
const LEADERBOARD_DATA = {
  winrate: [
    { name: "OracleKing_NG", sub: "Grand Oracle · 3,200 XP", val: "94%", initials: "OK" },
    { name: "BetMaster_Abuja", sub: "Oracle Master · 2,800 XP", val: "91%", initials: "BM" },
    { name: "StrikeZone_Lagos", sub: "AI Strategist · 2,100 XP", val: "88%", initials: "SZ" },
    { name: "ValueHunter_PH", sub: "Sports Researcher · 1,600 XP", val: "85%", initials: "VH" },
    { name: "DataScout_Enugu", sub: "Data Scout · 900 XP", val: "82%", initials: "DS" },
  ],
  roi: [
    { name: "HighROI_Warri", sub: "Grand Oracle · 3,100 XP", val: "+147%", initials: "HR" },
    { name: "ProfitKing_IBD", sub: "Oracle Master · 2,600 XP", val: "+123%", initials: "PK" },
    { name: "EdgeSeeker_KD", sub: "AI Strategist · 2,000 XP", val: "+98%", initials: "ES" },
    { name: "OddsBreaker_CT", sub: "Sports Researcher · 1,400 XP", val: "+74%", initials: "OB" },
    { name: "ValueBet_Abj", sub: "Data Scout · 800 XP", val: "+61%", initials: "VB" },
  ],
  streak: [
    { name: "StreakGod_LOS", sub: "Grand Oracle · 3,500 XP", val: "31 days", initials: "SG" },
    { name: "ConsistencyKing", sub: "Oracle Master · 3,000 XP", val: "24 days", initials: "CK" },
    { name: "UnstoppableNG", sub: "AI Strategist · 2,200 XP", val: "19 days", initials: "UN" },
    { name: "IronWill_Benin", sub: "Sports Researcher · 1,700 XP", val: "15 days", initials: "IW" },
    { name: "Relentless_PH", sub: "Data Scout · 1,000 XP", val: "12 days", initials: "RP" },
  ],
  xp: [
    { name: "XPGod_Owerri", sub: "Grand Oracle · 18,400 XP", val: "18,400", initials: "XG" },
    { name: "GrindMaster_LG", sub: "Grand Oracle · 16,200 XP", val: "16,200", initials: "GM" },
    { name: "TopAnalyst_ABJ", sub: "Oracle Master · 12,800 XP", val: "12,800", initials: "TA" },
    { name: "DataKing_KN", sub: "Oracle Master · 11,300 XP", val: "11,300", initials: "DK" },
    { name: "OracleFan_IB", sub: "AI Strategist · 8,700 XP", val: "8,700", initials: "OF" },
  ]
};

function renderLeaderboard(tab = "winrate") {
  const list = document.getElementById("leaderboardList");
  if (!list) return;
  const data = LEADERBOARD_DATA[tab];
  const rankClasses = ["gold", "silver", "bronze", "", ""];
  const medals = ["🥇", "🥈", "🥉", "4", "5"];
  list.innerHTML = data.map((item, i) => `
    <div class="lb-item">
      <span class="lb-rank ${rankClasses[i]}">${medals[i]}</span>
      <div class="lb-avatar">${item.initials}</div>
      <div class="lb-info">
        <div class="lb-name">${item.name}</div>
        <div class="lb-sub">${item.sub}</div>
      </div>
      <div class="lb-val">${item.val}</div>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".lb-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".lb-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderLeaderboard(tab.dataset.tab);
    });
  });
});

// ========================================
//  TESTIMONIALS SLIDER
// ========================================
const TESTIMONIALS = [
  { name: "Chukwuemeka A.", loc: "Lagos, Nigeria", stars: 5, text: "OracleSports.AI completely changed how I approach sports betting. The 1.5 challenge turned ₦5,000 into ₦34,000 over 30 days. The AI analysis is incredibly detailed." },
  { name: "Tunde B.", loc: "Abuja, Nigeria", stars: 5, text: "The confidence meter and risk ratings are spot on. I no longer guess — I make informed decisions. The rollover calculator helped me plan my bankroll perfectly." },
  { name: "Amina K.", loc: "Kano, Nigeria", stars: 5, text: "I love the XP system and missions. Makes it fun and keeps me disciplined. The leaderboard motivates me to stay consistent every single day." },
  { name: "Efe O.", loc: "Warri, Nigeria", stars: 4, text: "The match center is next level. Head-to-head stats, form analysis, BTTS predictions — everything in one place. Worth every naira of the premium plan." },
  { name: "Seun M.", loc: "Ibadan, Nigeria", stars: 5, text: "Just hit my 30-day streak! The daily missions keep me engaged and the Oracle AI assistant gives me quick insights before every match. Amazing platform." },
  { name: "Ikenna R.", loc: "Enugu, Nigeria", stars: 5, text: "Best sports AI platform for Nigerians. The Paystack integration made payment seamless. I went from Rookie Analyst to AI Strategist in just 3 weeks!" },
];

let currentSlide = 0;
function renderTestimonials() {
  const track = document.getElementById("tSliderTrack");
  const dots = document.getElementById("tsDots");
  if (!track) return;

  track.innerHTML = TESTIMONIALS.map(t => `
    <div class="testimonial-card">
      <div class="t-stars">${"★".repeat(t.stars)}${"☆".repeat(5 - t.stars)}</div>
      <p class="t-text">"${t.text}"</p>
      <div class="t-author">
        <div class="t-avatar">${t.name.charAt(0)}</div>
        <div>
          <div class="t-name">${t.name}</div>
          <div class="t-loc">${t.loc}</div>
        </div>
      </div>
    </div>
  `).join("");

  // Dots
  dots.innerHTML = TESTIMONIALS.map((_, i) =>
    `<div class="ts-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`
  ).join("");

  document.getElementById("tsPrev")?.addEventListener("click", () => {
    currentSlide = (currentSlide - 1 + TESTIMONIALS.length) % TESTIMONIALS.length;
    updateSlider();
  });
  document.getElementById("tsNext")?.addEventListener("click", () => {
    currentSlide = (currentSlide + 1) % TESTIMONIALS.length;
    updateSlider();
  });

  // Auto slide
  setInterval(() => {
    currentSlide = (currentSlide + 1) % TESTIMONIALS.length;
    updateSlider();
  }, 4000);
}

function updateSlider() {
  const track = document.getElementById("tSliderTrack");
  if (!track) return;
  const cardW = track.querySelector(".testimonial-card")?.offsetWidth + 24 || 364;
  track.style.transform = `translateX(-${currentSlide * cardW}px)`;
  document.querySelectorAll(".ts-dot").forEach((d, i) =>
    d.classList.toggle("active", i === currentSlide)
  );
}
window.goToSlide = function(i) {
  currentSlide = i;
  updateSlider();
};

// ========================================
//  TICKER DUPLICATE FOR SEAMLESS LOOP
// ========================================
function initTicker() {
  const el = document.getElementById("tickerItems");
  if (!el) return;
  el.innerHTML += el.innerHTML; // duplicate for seamless loop
}

// ========================================
//  AUTH MODAL
// ========================================
function initAuthModal() {
  const modal = document.getElementById("authModal");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const startFreeBtn = document.getElementById("startFreeBtn");
  const modalClose = document.getElementById("modalClose");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  function openLogin() { modal.classList.add("open"); showTab("login"); }
  function openRegister() { modal.classList.add("open"); showTab("signup"); }
  function showTab(tab) {
    if (tab === "login") {
      loginForm.classList.add("active"); signupForm.classList.remove("active");
      loginTab.classList.add("active"); signupTab.classList.remove("active");
    } else {
      signupForm.classList.add("active"); loginForm.classList.remove("active");
      signupTab.classList.add("active"); loginTab.classList.remove("active");
    }
    clearAuthMsg();
  }

  loginBtn?.addEventListener("click", e => { e.preventDefault(); openLogin(); });
  registerBtn?.addEventListener("click", e => { e.preventDefault(); openRegister(); });
  startFreeBtn?.addEventListener("click", e => { e.preventDefault(); openRegister(); });
  modalClose?.addEventListener("click", () => modal.classList.remove("open"));
  modal?.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
  loginTab?.addEventListener("click", () => showTab("login"));
  signupTab?.addEventListener("click", () => showTab("signup"));
  document.getElementById("goRegister")?.addEventListener("click", e => { e.preventDefault(); showTab("signup"); });
  document.getElementById("goLogin")?.addEventListener("click", e => { e.preventDefault(); showTab("login"); });

  // Login
  document.getElementById("loginSubmit")?.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;
    if (!email || !pass) return showAuthMsg("Please fill all fields.", "error");
    try {
      await auth.signInWithEmailAndPassword(email, pass);
      showAuthMsg("Login successful! Welcome back.", "success");
      setTimeout(() => modal.classList.remove("open"), 1200);
    } catch (err) {
      showAuthMsg(err.message, "error");
    }
  });

  // Register
  document.getElementById("signupSubmit")?.addEventListener("click", async () => {
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const pass = document.getElementById("signupPassword").value;
    if (!name || !email || !pass) return showAuthMsg("Please fill all fields.", "error");
    if (pass.length < 6) return showAuthMsg("Password must be at least 6 characters.", "error");
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: name });
      // Save user to DB
      await db.ref("users/" + cred.user.uid).set({
        name, email,
        xp: 10, coins: 5, level: 1, streak: 0,
        joinedAt: Date.now(), plan: "free"
      });
      showAuthMsg("Account created! Welcome to OracleSports.AI 🎉", "success");
      setTimeout(() => modal.classList.remove("open"), 1400);
    } catch (err) {
      showAuthMsg(err.message, "error");
    }
  });

  // Google Auth
  const googleProvider = new firebase.auth.GoogleAuthProvider();
  async function googleAuth() {
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      const snap = await db.ref("users/" + user.uid).get();
      if (!snap.exists()) {
        await db.ref("users/" + user.uid).set({
          name: user.displayName, email: user.email,
          xp: 10, coins: 5, level: 1, streak: 0,
          joinedAt: Date.now(), plan: "free"
        });
      }
      showAuthMsg("Logged in with Google! ✅", "success");
      setTimeout(() => modal.classList.remove("open"), 1200);
    } catch (err) {
      showAuthMsg(err.message, "error");
    }
  }
  document.getElementById("googleLogin")?.addEventListener("click", googleAuth);
  document.getElementById("googleSignup")?.addEventListener("click", googleAuth);

  // Auth state
  auth.onAuthStateChanged(user => {
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    if (user) {
      if (loginBtn) { loginBtn.textContent = user.displayName?.split(" ")[0] || "Account"; loginBtn.href = "#"; }
      if (registerBtn) { registerBtn.textContent = "Logout"; registerBtn.onclick = (e) => { e.preventDefault(); auth.signOut(); }; }
    } else {
      if (loginBtn) loginBtn.textContent = "Login";
      if (registerBtn) { registerBtn.textContent = "Register"; registerBtn.onclick = null; }
    }
  });
}

function showAuthMsg(msg, type) {
  const el = document.getElementById("authMessage");
  if (!el) return;
  el.textContent = msg;
  el.className = `auth-message ${type}`;
}
function clearAuthMsg() {
  const el = document.getElementById("authMessage");
  if (el) el.className = "auth-message";
}

// ========================================
//  PAYMENT MODAL (PAYSTACK)
// ========================================
function initPaymentModal() {
  const modal = document.getElementById("paymentModal");
  const closeBtn = document.getElementById("payModalClose");
  closeBtn?.addEventListener("click", () => modal.classList.remove("open"));
  modal?.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });

  // Challenge join buttons
  document.querySelectorAll(".ch-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      const amount = btn.dataset.amount;
      openPaymentModal(plan, amount);
    });
  });
}

function openPaymentModal(plan, amount) {
  const modal = document.getElementById("paymentModal");
  const details = document.getElementById("payDetails");
  const planNames = { safe: "Oracle Safe Growth (1.5 Challenge)", growth: "Oracle Growth Plus (2.0 Challenge)", accelerator: "Oracle Accelerator (4.0 Challenge)", premium: "Premium Plan", elite: "Elite Plan" };
  details.innerHTML = `<strong>${planNames[plan] || plan}</strong><br/>Amount: ₦${(parseInt(amount) / 100).toLocaleString()}`;
  modal.dataset.plan = plan;
  modal.dataset.amount = amount;

  // Pre-fill email if logged in
  const user = auth.currentUser;
  if (user) document.getElementById("payEmail").value = user.email;

  modal.classList.add("open");

  document.getElementById("payNowBtn").onclick = () => {
    const email = document.getElementById("payEmail").value.trim();
    if (!email) return alert("Please enter your email.");
    initiatePaystackPayment(email, parseInt(amount), plan);
  };
}

function initiatePaystackPayment(email, amount, plan) {
  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount,
    currency: "NGN",
    ref: "OSP-" + Date.now(),
    metadata: { plan },
    callback: async function(response) {
      document.getElementById("paymentModal").classList.remove("open");
      alert(`Payment successful! ✅ Reference: ${response.reference}\nYour ${plan} plan is now active.`);
      // Update Firebase if logged in
      const user = auth.currentUser;
      if (user) {
        await db.ref("users/" + user.uid).update({ plan });
        await db.ref("payments/" + response.reference).set({
          userId: user.uid, email, amount, plan,
          reference: response.reference,
          paidAt: Date.now()
        });
      }
    },
    onClose: function() {}
  });
  handler.openIframe();
}

// Payment from pricing cards
window.initiatePayment = function(btn) {
  const plan = btn.dataset.plan;
  const amount = btn.dataset.amount;
  openPaymentModal(plan, amount);
};

// ========================================
//  SCROLL ANIMATIONS (Intersection Observer)
// ========================================
function initScrollAnimations() {
  const animateEls = document.querySelectorAll(".pred-card, .challenge-card, .stat-card, .xp-level-card, .xp-earn-item, .pricing-card, .match-card");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = "1";
        e.target.style.transform = "translateY(0)";
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  animateEls.forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    observer.observe(el);
  });
}
