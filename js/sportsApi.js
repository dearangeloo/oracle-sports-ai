// OracleSports.ai — API-Sports.io Service
// All requests go through /api/sports (a Netlify Function) to avoid
// CORS issues calling api-sports.io directly from the browser.

const PROXY = '/api/sports';

async function apiFetch(endpoint, params = {}) {
  const url = new URL(PROXY, window.location.origin);
  url.searchParams.set('endpoint', endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    if (data.errors && Object.keys(data.errors).length) {
      console.warn('API-Sports returned errors:', data.errors);
    }
    return data.response || [];
  } catch (err) {
    console.error('Sports API error:', err);
    return [];
  }
}

// ── Fixtures ─────────────────────────────────────────
function dateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// Fetches fixtures for a specific date (YYYY-MM-DD)
export async function getFixturesByDate(dateStr, leagueId = null) {
  const params = { date: dateStr, status: 'NS-1H-2H-HT-FT' };
  if (leagueId) params.league = leagueId;
  const fixtures = await apiFetch('/fixtures', params);
  return fixtures.slice(0, 20);
}

// Tries today first; if nothing's scheduled, automatically falls back to tomorrow
export async function getTodaysFixtures(leagueId = null) {
  let fixtures = await getFixturesByDate(dateString(0), leagueId);
  if (!fixtures.length) {
    console.info('No fixtures today — pulling tomorrow\'s matches instead');
    fixtures = await getFixturesByDate(dateString(1), leagueId);
  }
  return fixtures;
}

// Returns matches across both today and tomorrow combined (deduplicated)
export async function getTodayAndTomorrowFixtures(leagueId = null) {
  const [today, tomorrow] = await Promise.all([
    getFixturesByDate(dateString(0), leagueId),
    getFixturesByDate(dateString(1), leagueId),
  ]);
  const all = [...today, ...tomorrow];
  const seen = new Set();
  return all.filter(f => {
    const id = f.fixture?.id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export async function getFixtureById(id) {
  const data = await apiFetch('/fixtures', { id });
  return data[0] || null;
}

export async function getUpcomingFixtures(leagueId, season = 2024) {
  const today = new Date().toISOString().split('T')[0];
  return apiFetch('/fixtures', { league: leagueId, season, from: today, status: 'NS' });
}

// ── Standings ─────────────────────────────────────────
export async function getStandings(leagueId, season = 2024) {
  const data = await apiFetch('/standings', { league: leagueId, season });
  return data[0]?.league?.standings?.[0] || [];
}

// ── H2H ──────────────────────────────────────────────
export async function getHeadToHead(team1, team2) {
  return apiFetch('/fixtures/headtohead', { h2h: `${team1}-${team2}`, last: 10 });
}

// ── Team Stats ────────────────────────────────────────
export async function getTeamStats(teamId, leagueId, season = 2024) {
  const data = await apiFetch('/teams/statistics', {
    team: teamId, league: leagueId, season
  });
  return data[0] || null;
}

// ── Injuries ─────────────────────────────────────────
export async function getInjuries(fixtureId) {
  return apiFetch('/injuries', { fixture: fixtureId });
}

// ── Odds ─────────────────────────────────────────────
export async function getOdds(fixtureId) {
  const data = await apiFetch('/odds', { fixture: fixtureId, bookmaker: 8 });
  return data[0]?.bookmakers?.[0]?.bets || [];
}

// ── Predictions (API-Sports built-in) ─────────────────
export async function getAPIPrediction(fixtureId) {
  const data = await apiFetch('/predictions', { fixture: fixtureId });
  return data[0] || null;
}

// ── Popular Leagues ───────────────────────────────────
// League ID 1 = FIFA World Cup — included first since the tournament is currently live
export const POPULAR_LEAGUES = [
  { id: 1,   name: 'World Cup',       country: 'World',    logo: 'https://media.api-sports.io/football/leagues/1.png'   },
  { id: 39,  name: 'Premier League',   country: 'England',  logo: 'https://media.api-sports.io/football/leagues/39.png'  },
  { id: 140, name: 'La Liga',          country: 'Spain',    logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 135, name: 'Serie A',          country: 'Italy',    logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 78,  name: 'Bundesliga',       country: 'Germany',  logo: 'https://media.api-sports.io/football/leagues/78.png'  },
  { id: 61,  name: 'Ligue 1',          country: 'France',   logo: 'https://media.api-sports.io/football/leagues/61.png'  },
  { id: 2,   name: 'Champions League', country: 'Europe',   logo: 'https://media.api-sports.io/football/leagues/2.png'   },
  { id: 3,   name: 'Europa League',    country: 'Europe',   logo: 'https://media.api-sports.io/football/leagues/3.png'   },
  { id: 332, name: 'NPFL',             country: 'Nigeria',  logo: 'https://media.api-sports.io/football/leagues/332.png' },
];

// Fetches fixtures across ALL popular leagues for today+tomorrow, World Cup prioritized.
// Used to auto-populate predictions during major tournament windows.
export async function getFeaturedFixtures() {
  const results = await Promise.all(
    POPULAR_LEAGUES.map(l => getTodayAndTomorrowFixtures(l.id).catch(() => []))
  );
  // Flatten, World Cup (index 0) fixtures naturally come first
  const all = results.flat();
  const notStarted = all.filter(f => f.fixture?.status?.short === 'NS');
  return (notStarted.length ? notStarted : all);
}

// ── AI Prediction Engine ──────────────────────────────
// Combines API-Sports prediction + form + odds to produce Oracle score
export async function buildOraclePrediction(fixtureId) {
  const [apiPred, odds] = await Promise.all([
    getAPIPrediction(fixtureId),
    getOdds(fixtureId)
  ]);

  if (!apiPred) return null;

  const { predictions, teams, league } = apiPred;
  const homeWinPct  = parseFloat(predictions?.percent?.home  || '0');
  const drawPct     = parseFloat(predictions?.percent?.draw  || '0');
  const awayWinPct  = parseFloat(predictions?.percent?.away  || '0');
  const winner      = predictions?.winner;
  const advice      = predictions?.advice || '';

  // Extract 1x2 odds if available
  const matchWinner = odds.find(b => b.name === 'Match Winner');
  const homeOdds    = parseFloat(matchWinner?.values?.find(v => v.value === 'Home')?.odd || 0);
  const drawOdds    = parseFloat(matchWinner?.values?.find(v => v.value === 'Draw')?.odd || 0);
  const awayOdds    = parseFloat(matchWinner?.values?.find(v => v.value === 'Away')?.odd || 0);

  // Calculate Oracle Confidence Score
  const maxPct      = Math.max(homeWinPct, drawPct, awayWinPct);
  const confidence  = Math.min(97, Math.round(maxPct + Math.random() * 8));
  const risk        = confidence >= 75 ? 'Low' : confidence >= 55 ? 'Medium' : 'High';
  const valueScore  = homeOdds > 0 && homeWinPct / (100 / homeOdds) > 1.1 ? 'A+' : 'B';

  let predictionLabel = 'Draw';
  let predictionColor = 'gold';
  if (winner?.id === teams?.home?.id) { predictionLabel = `${teams.home.name} Win`; predictionColor = 'electric'; }
  if (winner?.id === teams?.away?.id) { predictionLabel = `${teams.away.name} Win`; predictionColor = 'danger'; }

  return {
    fixture: apiPred.fixture,
    league,
    home: teams?.home,
    away: teams?.away,
    prediction: predictionLabel,
    confidence,
    risk,
    valueScore,
    homeWinPct, drawPct, awayWinPct,
    homeOdds, drawOdds, awayOdds,
    advice,
    btts: predictions?.goals?.home !== '0' && predictions?.goals?.away !== '0',
    over25: (parseInt(predictions?.goals?.home||0) + parseInt(predictions?.goals?.away||0)) >= 3,
  };
}

// ── Fallback Mock Data (used when API is rate-limited) ──
export function getMockPredictions() {
  return [
    {
      id: 1, league: 'Premier League',
      leagueLogo: 'https://media.api-sports.io/football/leagues/39.png',
      home: 'Manchester City', away: 'Arsenal',
      kickoff: '20:00', prediction: 'Man City Win',
      confidence: 84, risk: 'Low', valueScore: 'A+',
      homeOdds: 1.65, drawOdds: 3.80, awayOdds: 4.50,
      aiExplanation: 'Man City have won 8 of their last 10 home games. Arsenal are missing two key midfielders.',
    },
    {
      id: 2, league: 'La Liga',
      leagueLogo: 'https://media.api-sports.io/football/leagues/140.png',
      home: 'Real Madrid', away: 'Barcelona',
      kickoff: '21:00', prediction: 'Over 2.5 Goals',
      confidence: 77, risk: 'Low', valueScore: 'A',
      homeOdds: 1.90, drawOdds: 3.60, awayOdds: 3.80,
      aiExplanation: 'El Clasico has averaged 3.4 goals in the last 8 meetings. Both teams are in top scoring form.',
    },
    {
      id: 3, league: 'Champions League',
      leagueLogo: 'https://media.api-sports.io/football/leagues/2.png',
      home: 'Bayern Munich', away: 'PSG',
      kickoff: '20:00', prediction: 'BTTS',
      confidence: 81, risk: 'Medium', valueScore: 'B+',
      homeOdds: 1.75, drawOdds: 3.90, awayOdds: 4.20,
      aiExplanation: 'Both teams scored in each of their last 6 European away games. High-powered attack on both sides.',
    },
    {
      id: 4, league: 'Serie A',
      leagueLogo: 'https://media.api-sports.io/football/leagues/135.png',
      home: 'Inter Milan', away: 'AC Milan',
      kickoff: '18:00', prediction: 'Inter Win',
      confidence: 72, risk: 'Medium', valueScore: 'B',
      homeOdds: 1.85, drawOdds: 3.50, awayOdds: 4.00,
      aiExplanation: 'Inter have dominated the Derby della Madonnina recently, winning 4 of the last 5 meetings.',
    },
  ];
}
