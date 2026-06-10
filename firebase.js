// OracleSports.ai — Firebase Service
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, signOut, updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore, doc, setDoc, getDoc, updateDoc,
  collection, addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, increment, arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getDatabase, ref, set, get, update, onValue, push
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import CONFIG from '../config.js';

const app       = initializeApp(CONFIG.FIREBASE);
const auth      = getAuth(app);
const db        = getFirestore(app);
const rtdb      = getDatabase(app);
const gProvider = new GoogleAuthProvider();

// ── Auth ──────────────────────────────────────────────
export async function registerUser(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await createUserProfile(cred.user);
  return cred.user;
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await awardDailyLogin(cred.user.uid);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, gProvider);
  const profile = await getUserProfile(cred.user.uid);
  if (!profile) await createUserProfile(cred.user);
  else await awardDailyLogin(cred.user.uid);
  return cred.user;
}

export function logoutUser() { return signOut(auth); }

export function onAuthChange(cb) { return onAuthStateChanged(auth, cb); }

export function currentUser() { return auth.currentUser; }

// ── User Profile ──────────────────────────────────────
export async function createUserProfile(user) {
  const data = {
    uid: user.uid,
    displayName: user.displayName || 'Oracle User',
    email: user.email,
    photoURL: user.photoURL || null,
    plan: 'free',
    xp: 0, level: 0, coins: 50,
    streak: 0, lastLogin: serverTimestamp(),
    achievements: [], joinedChallenges: [],
    totalPredictions: 0, wins: 0, losses: 0,
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'users', user.uid), data);
  return data;
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  return updateDoc(doc(db, 'users', uid), data);
}

// ── XP & Gamification ────────────────────────────────
const XP_ACTIONS = {
  daily_login:       10,
  prediction_viewed: 5,
  challenge_joined:  20,
  mission_completed: 25,
};

const LEVELS = [
  { name: 'Rookie Analyst',    min: 0 },
  { name: 'Data Scout',        min: 100 },
  { name: 'Sports Researcher', min: 300 },
  { name: 'AI Strategist',     min: 700 },
  { name: 'Oracle Master',     min: 1500 },
  { name: 'Grand Oracle',      min: 3000 },
];

export function getLevelInfo(xp) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.min) lvl = l; }
  const idx  = LEVELS.indexOf(lvl);
  const next = LEVELS[idx + 1];
  const progress = next
    ? ((xp - lvl.min) / (next.min - lvl.min)) * 100
    : 100;
  return { ...lvl, index: idx, next, progress };
}

export async function awardXP(uid, action) {
  const pts = XP_ACTIONS[action] || 0;
  if (!pts) return;
  await updateDoc(doc(db, 'users', uid), { xp: increment(pts) });
  return pts;
}

export async function awardCoins(uid, amount) {
  return updateDoc(doc(db, 'users', uid), { coins: increment(amount) });
}

export async function awardDailyLogin(uid) {
  const profile = await getUserProfile(uid);
  if (!profile) return;
  const lastLogin = profile.lastLogin?.toDate?.() || new Date(0);
  const now       = new Date();
  const sameDay   = lastLogin.toDateString() === now.toDateString();
  if (sameDay) return;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const streak    = lastLogin.toDateString() === yesterday.toDateString()
    ? (profile.streak || 0) + 1
    : 1;
  await updateDoc(doc(db, 'users', uid), {
    xp: increment(XP_ACTIONS.daily_login),
    coins: increment(5),
    streak, lastLogin: serverTimestamp()
  });
  return { xp: XP_ACTIONS.daily_login, coins: 5, streak };
}

// ── Prediction History ────────────────────────────────
export async function savePrediction(uid, prediction) {
  await addDoc(collection(db, 'users', uid, 'predictions'), {
    ...prediction, savedAt: serverTimestamp()
  });
  await awardXP(uid, 'prediction_viewed');
}

export async function getPredictionHistory(uid, count = 20) {
  const q = query(
    collection(db, 'users', uid, 'predictions'),
    orderBy('savedAt', 'desc'), limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Leaderboard ───────────────────────────────────────
export async function getLeaderboard(category = 'xp', count = 20) {
  const q = query(collection(db, 'users'), orderBy(category, 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
}

// ── Challenges ───────────────────────────────────────
export async function joinChallenge(uid, challengeKey) {
  await updateDoc(doc(db, 'users', uid), {
    joinedChallenges: arrayUnion(challengeKey)
  });
  await awardXP(uid, 'challenge_joined');
  // Track in RTDB for live updates
  await set(ref(rtdb, `challenges/${challengeKey}/members/${uid}`), {
    joinedAt: Date.now(), active: true
  });
}

// ── Mission ───────────────────────────────────────────
export function getTodayMission() {
  const missions = [
    { id: 1, title: 'Review Today\'s Match Analysis', desc: 'Check all 4 prediction sets', xp: 50, coins: 10 },
    { id: 2, title: 'Check Confidence Ratings', desc: 'View 3 match confidence scores', xp: 30, coins: 8 },
    { id: 3, title: 'Save One Prediction', desc: 'Bookmark a prediction for later', xp: 25, coins: 5 },
    { id: 4, title: 'Explore the Match Center', desc: 'Search for any match', xp: 40, coins: 10 },
    { id: 5, title: 'Join the Leaderboard', desc: 'View your ranking today', xp: 20, coins: 5 },
  ];
  const day = Math.floor(Date.now() / 86400000);
  return missions[day % missions.length];
}

export { auth, db, rtdb };
