// OracleSports.ai — Main App Entry Point
import {
  onAuthChange, loginUser, registerUser, loginWithGoogle,
  logoutUser, getUserProfile, getLevelInfo, getTodayMission,
  savePrediction, getPredictionHistory, getLeaderboard, awardXP
} from './firebase.js';
import {
  getTodaysFixtures, getMockPredictions, buildOraclePrediction,
  getAPIPrediction, POPULAR_LEAGUES
} from './sportsApi.js';
import { initPaystack, initChallengePay } from './paystack.js';
import {
  showToast, openModal, closeModal, closeAllModals,
  initParticles, initScrollReveal, initNavbar,
  initCountdown, initCalculator, drawConfidenceArc, animateCount
} from './ui.js';

// ── State ─────────────────────────────────────────────
let currentUser   = null;
let userProfile   = null;
let predictions   = [];
let activeLeague  = null;

// ── DOM Ready ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  initNavbar();
  initScrollReveal();
  initCalculator();

  // Set countdown: next Monday
  const next = new Date();
  next.setDate(next.getDate() + (8 - next.getDay()) % 7 || 7);
  next.setHours(0, 0, 0, 0);
  initCountdown(next.toISOString());

  // Auth state
  onAuthChange(async (user) => {
    currentUser = user;
    if (user) {
      userProfile = await getUserProfile(user.uid);
      renderUserBar(userProfile);
      renderDailyMission();
      renderGamification(userProfile);
    } else {
      renderGuestBar();
    }
  });

  // Load predictions
  await loadPredictions();

  // Load league fixtures for match center
  await loadMatchCenter();

  // Load leaderboard
  await loadLeaderboard();

  // OneSignal init
  initOneSignal();

  // Bind all events
  bindEvents();

  // Animate hero stats
  setTimeout(() => {
    animateCount(document.getElementById('stat-predictions'), 12847, 2000);
    animateCount(document.getElementById('stat-winrate'), 78, 1800, '', '%');
    animateCount(document.getElementById('stat-members'), 3200, 1800, '+');
  }, 600);
});

// ── Load Predictions ──────────────────────────────────
async function loadPredictions() {
  const grid = document.getElementById('predictions-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="loading-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    const fixtures = await getTodaysFixtures();
    if (fixtures.length >= 4) {
      const top4 = fixtures.slice(0, 4);
      const builtPreds = await Promise.all(
        top4.map(f => buildOraclePrediction(f.fixture.id).catch(() => null))
      );
      predictions = builtPreds.filter(Boolean);
    }
  } catch (e) {
    console.warn('Using mock predictions:', e);
  }

  if (!predictions.length) predictions = getMockPredictions();

  grid.innerHTML = predictions.map((p, i) => renderPredictionCard(p, i)).join('');

  // Animate confidence bars
  setTimeout(() => {
    document.querySelectorAll('.confidence-bar-fill').forEach(bar => {
      const w = bar.getAttribute('data-width');
      if (w) bar.style.width = w + '%';
    });
  }, 100);
}

function renderPredictionCard(p, i) {
  const riskClass = (p.risk || 'Low').toLowerCase();
  const letter = i < 4 ? ['A','B','C','D'][i] : i+1;
  return `
    <div class="glass-card prediction-card reveal reveal-delay-${(i%4)+1}" 
         data-id="${p.id || p.fixture?.id || i}" onclick="handlePredictionClick(${i})">
      <div class="pred-header">
        <div class="pred-league">
          ${p.leagueLogo || p.league?.logo
            ? `<img src="${p.leagueLogo||p.league?.logo}" alt="${p.league?.name||p.league}" onerror="this.style.display='none'">`
            : ''}
          <span>Prediction Set ${letter}</span>
        </div>
        <span class="pred-time">${p.kickoff || formatKickoff(p.fixture?.date)}</span>
      </div>
      <div class="pred-teams">
        <div class="pred-team">
          <span class="pred-team-name">${p.home?.name || p.home || '—'}</span>
        </div>
        <span class="pred-vs">VS</span>
        <div class="pred-team">
          <span class="pred-team-name">${p.away?.name || p.away || '—'}</span>
        </div>
      </div>
      <div class="pred-pick">
        <span class="pred-pick-label">Oracle Pick</span>
        <span class="pred-pick-value">${p.prediction || '—'}</span>
      </div>
      <div class="confidence-bar">
        <div class="confidence-bar-label">
          <span>Confidence</span><span>${p.confidence}%</span>
        </div>
        <div class="confidence-bar-track">
          <div class="confidence-bar-fill" data-width="${p.confidence}" style="width:0%"></div>
        </div>
      </div>
      <div class="pred-meta">
        <span class="pred-badge badge-${riskClass}">${p.risk || 'Low'} Risk</span>
        <span class="pred-badge badge-low">Value: ${p.valueScore || 'B'}</span>
        <span class="pred-badge badge-medium">AI Score ${p.confidence}</span>
      </div>
      <div class="pred-locked" onclick="handleUnlockClick(event, ${i})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Premium: Full AI Analysis + Value Bet
      </div>
    </div>`;
}

function formatKickoff(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

window.handlePredictionClick = function(idx) {
  const p = predictions[idx];
  if (!p) return;
  if (currentUser) awardXP(currentUser.uid, 'prediction_viewed');
  showPredictionDetail(p);
};

window.handleUnlockClick = function(e, idx) {
  e.stopPropagation();
  if (!currentUser) { openModal('auth-modal'); return; }
  if (userProfile?.plan === 'free') {
    openModal('pricing-modal');
  } else {
    showPredictionDetail(predictions[idx], true);
  }
};

function showPredictionDetail(p, full = false) {
  const modal = document.getElementById('prediction-modal');
  if (!modal) return;
  const content = modal.querySelector('.prediction-detail-content');
  if (!content) return;
  content.innerHTML = `
    <h3 style="font-family:var(--font-display);margin-bottom:8px">${p.home?.name||p.home} vs ${p.away?.name||p.away}</h3>
    <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:18px">${p.league?.name||p.league}</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px">
      <div style="text-align:center;padding:14px;background:rgba(0,168,255,0.06);border-radius:10px">
        <div style="font-size:1.1rem;font-weight:700;color:var(--electric)">${p.homeWinPct||'—'}%</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">Home Win</div>
      </div>
      <div style="text-align:center;padding:14px;background:rgba(255,215,0,0.06);border-radius:10px">
        <div style="font-size:1.1rem;font-weight:700;color:var(--gold)">${p.drawPct||'—'}%</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">Draw</div>
      </div>
      <div style="text-align:center;padding:14px;background:rgba(255,77,77,0.06);border-radius:10px">
        <div style="font-size:1.1rem;font-weight:700;color:var(--danger)">${p.awayWinPct||'—'}%</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">Away Win</div>
      </div>
    </div>
    <div style="background:rgba(0,210,106,0.06);border:1px solid rgba(0,210,106,0.15);border-radius:10px;padding:16px;margin-bottom:14px">
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px">Oracle Recommendation</div>
      <div style="font-weight:700;color:var(--success);font-size:1rem">${p.prediction}</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:6px">${p.aiExplanation||p.advice||'AI analysis based on form, H2H, and statistical modeling.'}</div>
    </div>
    ${full ? `
    <div style="padding:14px;background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.15);border-radius:10px;margin-bottom:14px">
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px">Odds Analysis</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <span style="font-size:0.82rem">1: <strong style="color:var(--gold)">${p.homeOdds||'N/A'}</strong></span>
        <span style="font-size:0.82rem">X: <strong style="color:var(--gold)">${p.drawOdds||'N/A'}</strong></span>
        <span style="font-size:0.82rem">2: <strong style="color:var(--gold)">${p.awayOdds||'N/A'}</strong></span>
      </div>
      <div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted)">
        BTTS: <strong style="color:${p.btts?'var(--success)':'var(--danger)'}">${p.btts?'Yes':'No'}</strong> &nbsp;|&nbsp;
        Over 2.5: <strong style="color:${p.over25?'var(--success)':'var(--danger)'}">${p.over25?'Yes':'No'}</strong>
      </div>
    </div>` : `
    <div style="text-align:center;padding:14px">
      <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px">Upgrade to Elite for full analysis</p>
      <button class="btn btn-gold btn-sm" onclick="openModal('pricing-modal')">Unlock Premium</button>
    </div>`}
  `;
  openModal('prediction-modal');
}

// ── Match Center ──────────────────────────────────────
async function loadMatchCenter(leagueId = 39) {
  const list = document.getElementById('matches-list');
  if (!list) return;
  list.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  try {
    const fixtures = await getTodaysFixtures(leagueId);
    if (!fixtures.length) throw new Error('No fixtures');
    list.innerHTML = fixtures.slice(0, 10).map(renderMatchItem).join('');
  } catch {
    list.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:30px">No live fixtures found for today. Check back later.</p>`;
  }
}

function renderMatchItem(f) {
  const home  = f.teams?.home?.name || '—';
  const away  = f.teams?.away?.name || '—';
  const gs    = f.goals?.home !== null ? `${f.goals.home} - ${f.goals.away}` : 'vs';
  const logo  = f.league?.logo || '';
  const status= f.fixture?.status?.short || 'NS';
  const statusColor = status==='1H'||status==='2H'||status==='HT' ? 'var(--success)' : 'var(--text-muted)';
  return `
    <div class="glass-card match-item" onclick="loadMatchDetail(${f.fixture.id})">
      ${logo ? `<img class="match-league-logo" src="${logo}" alt="league" onerror="this.style.display='none'">` : ''}
      <div class="match-teams">
        <div class="match-team-row">
          <span>${home}</span>
          <span class="match-score" style="color:${statusColor}">${gs}</span>
        </div>
        <div class="match-team-row">
          <span>${away}</span>
          <span style="font-size:0.68rem;color:${statusColor}">${status}</span>
        </div>
      </div>
      <div class="match-prob">
        <span class="match-prob-pill prob-home">H</span>
        <span class="match-prob-pill prob-draw">D</span>
        <span class="match-prob-pill prob-away">A</span>
      </div>
      <span class="match-conf-badge">AI Ready</span>
    </div>`;
}

window.loadMatchDetail = async function(fixtureId) {
  const pred = await buildOraclePrediction(fixtureId).catch(() => null);
  if (pred) showPredictionDetail(pred, userProfile?.plan !== 'free');
  else showToast('Loading match analysis...', 'info');
};

// ── League Filter ─────────────────────────────────────
window.filterByLeague = async function(leagueId) {
  activeLeague = leagueId;
  document.querySelectorAll('.league-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.id == leagueId);
  });
  await loadMatchCenter(leagueId);
};

// ── Leaderboard ───────────────────────────────────────
async function loadLeaderboard(category = 'xp') {
  const tbody = document.getElementById('lb-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  try {
    const leaders = await getLeaderboard(category, 10);
    tbody.innerHTML = leaders.map(u => `
      <tr>
        <td><span class="lb-rank ${u.rank<=3?'r'+u.rank:''}">${u.rank<=3?['🥇','🥈','🥉'][u.rank-1]:u.rank}</span></td>
        <td><span class="lb-avatar">${(u.displayName||'U').charAt(0).toUpperCase()}</span>${u.displayName||'Anonymous'}</td>
        <td class="lb-win-rate">${u.wins||0}W / ${u.losses||0}L</td>
        <td>${u.streak||0} 🔥</td>
        <td style="color:var(--electric);font-weight:600">${(u.xp||0).toLocaleString()} XP</td>
      </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">No data yet. Be the first!</td></tr>`;
  } catch {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px">Unable to load leaderboard.</td></tr>`;
  }
}

window.switchLeaderboardTab = function(cat, el) {
  document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadLeaderboard(cat);
};

// ── Gamification Render ───────────────────────────────
function renderGamification(profile) {
  if (!profile) return;
  const lvlInfo = getLevelInfo(profile.xp || 0);

  const lvlEl  = document.getElementById('user-level');
  const xpEl   = document.getElementById('user-xp');
  const barEl  = document.getElementById('xp-bar-fill');
  const strEl  = document.getElementById('streak-count');
  const coinEl = document.getElementById('coin-count');

  if (lvlEl)  lvlEl.textContent  = lvlInfo.name;
  if (xpEl)   xpEl.textContent   = `${profile.xp||0} XP`;
  if (barEl)  setTimeout(() => barEl.style.width = lvlInfo.progress + '%', 300);
  if (strEl)  strEl.textContent  = profile.streak || 0;
  if (coinEl) coinEl.textContent = profile.coins || 0;
}

function renderDailyMission() {
  const banner = document.getElementById('mission-banner');
  if (!banner) return;
  const mission = getTodayMission();
  banner.innerHTML = `
    <div class="mission-info">
      <div class="mission-icon">🎯</div>
      <div>
        <div class="mission-title">Daily Mission #${mission.id}: ${mission.title}</div>
        <div class="mission-desc">${mission.desc}</div>
      </div>
    </div>
    <div class="mission-reward">
      <span class="reward-pill">+${mission.xp} XP</span>
      <span class="reward-pill" style="background:rgba(255,215,0,0.1);color:var(--gold);border-color:rgba(255,215,0,0.2)">+${mission.coins} Coins</span>
    </div>`;
  banner.style.display = 'flex';
}

// ── User Bar ──────────────────────────────────────────
function renderUserBar(profile) {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions || !profile) return;
  navActions.innerHTML = `
    <div class="user-bar">
      <div class="avatar">${(profile.displayName||'U').charAt(0).toUpperCase()}</div>
      <span class="coins">🪙 ${profile.coins||0}</span>
      <span class="xp-pill">${profile.xp||0} XP</span>
      <button class="btn-nav-login" onclick="handleLogout()">Logout</button>
    </div>`;
}

function renderGuestBar() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  navActions.innerHTML = `
    <button class="btn-nav-login"   onclick="openModal('auth-modal')">Login</button>
    <button class="btn-nav-register" onclick="openModal('auth-modal')">Register</button>`;
}

// ── Auth Logic ────────────────────────────────────────
window.handleAuthSubmit = async function() {
  const tab  = document.querySelector('.auth-tab.active')?.dataset.tab;
  const email= document.getElementById('auth-email')?.value?.trim();
  const pass = document.getElementById('auth-pass')?.value;
  const name = document.getElementById('auth-name')?.value?.trim();
  if (!email || !pass) { showToast('Please fill in all fields', 'error'); return; }

  const btn = document.getElementById('auth-submit-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }

  try {
    if (tab === 'register') {
      await registerUser(email, pass, name || 'Oracle User');
      showToast('Welcome to OracleSports.ai! 🎉', 'success');
    } else {
      await loginUser(email, pass);
      showToast('Welcome back! 🔥', 'success');
    }
    closeModal('auth-modal');
  } catch (e) {
    const msgs = {
      'auth/email-already-in-use': 'Email already registered.',
      'auth/wrong-password':       'Incorrect password.',
      'auth/user-not-found':       'No account found with this email.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Please enter a valid email.',
    };
    showToast(msgs[e.code] || 'Authentication failed. Try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = tab==='register' ? 'Create Account' : 'Login'; }
  }
};

window.handleGoogleLogin = async function() {
  try {
    await loginWithGoogle();
    closeModal('auth-modal');
    showToast('Signed in with Google! 🎉', 'success');
  } catch (e) {
    showToast('Google login failed. Try again.', 'error');
  }
};

window.handleLogout = async function() {
  await logoutUser();
  showToast('Logged out successfully.', 'info');
};

window.switchAuthTab = function(tab, el) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active'); el.dataset.tab = tab;
  const nameRow = document.getElementById('auth-name-row');
  const btn     = document.getElementById('auth-submit-btn');
  if (nameRow) nameRow.style.display = tab === 'register' ? 'block' : 'none';
  if (btn)     btn.textContent = tab === 'register' ? 'Create Account' : 'Login';
};

// ── Paystack Triggers ─────────────────────────────────
window.subscribePlan = function(plan) {
  if (!currentUser) { openModal('auth-modal'); return; }
  initPaystack(plan, currentUser.email, () => {
    closeAllModals();
    setTimeout(() => location.reload(), 1500);
  });
};

window.joinChallengePay = function(key) {
  if (!currentUser) { openModal('auth-modal'); return; }
  initChallengePay(key, currentUser.email, () => {
    closeAllModals();
    showToast('Challenge joined! Check your dashboard.', 'success');
  });
};

// ── Oracle Assistant ──────────────────────────────────
window.toggleOracle = function() {
  const panel = document.getElementById('oracle-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) loadOraclePick();
};

async function loadOraclePick() {
  const p = predictions[0];
  if (!p) return;
  const matchEl = document.getElementById('oracle-match');
  const pickEl  = document.getElementById('oracle-pick');
  const confEl  = document.getElementById('oracle-conf');
  if (matchEl) matchEl.textContent = `${p.home?.name||p.home} vs ${p.away?.name||p.away}`;
  if (pickEl)  pickEl.textContent  = p.prediction;
  if (confEl)  { confEl.textContent = p.confidence + '%'; }
}

// ── OneSignal ─────────────────────────────────────────
function initOneSignal() {
  if (!window.OneSignal) return;
  window.OneSignal.init({
    appId: '%%ONESIGNAL_APP_ID%%', // replaced at build
    allowLocalhostAsSecureOrigin: true,
    notifyButton: { enable: false },
  });
}

// ── Event Bindings ────────────────────────────────────
function bindEvents() {
  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeAllModals(); });
  });

  // Close oracle on outside click
  document.addEventListener('click', e => {
    const panel = document.getElementById('oracle-panel');
    const btn   = document.getElementById('oracle-btn');
    if (panel?.classList.contains('open') && !panel.contains(e.target) && !btn?.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  // League filter buttons
  document.querySelectorAll('.league-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => filterByLeague(btn.dataset.id));
  });

  // Match search
  const searchInput = document.getElementById('match-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e) => {
      const val = e.target.value.trim();
      if (val.length >= 3) await loadMatchCenter();
    }, 400));
  }
}

function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
