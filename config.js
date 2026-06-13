// OracleSports.ai — Central Configuration
// ⚠️ For production: move sensitive keys to Netlify Environment Variables
// In Netlify dashboard: Site Settings → Environment Variables

const CONFIG = {
  // API-Sports.io
  SPORTS_API_KEY: '1c6ddc2ed65130be2216d9a5b5c01fa8',
  SPORTS_API_BASE: 'https://v3.football.api-sports.io',

  // Paystack
  PAYSTACK_PUBLIC_KEY: 'pk_live_da105e2c3fff1091dfa5f2c0b5b5280a3928b9ab',

  // OneSignal
  ONESIGNAL_APP_ID: 'b9745464-6be4-4130-a1c3-64b4d0516c01',

  // Firebase
  FIREBASE: {
    apiKey: 'AIzaSyAA0Mu8cCBQ4cfZr3XyAuPDQAwpvYKj7Ls',
    authDomain: 'oracle-sports-ai.firebaseapp.com',
    databaseURL: 'https://oracle-sports-ai-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'oracle-sports-ai',
    storageBucket: 'oracle-sports-ai.firebasestorage.app',
    messagingSenderId: '334017049843',
    appId: '1:334017049843:web:c6a17114cd652b78a1f386'
  },

  // Plans
  PLANS: {
    premium: { name: 'Oracle Premium', amount: 250000, code: 'PREMIUM' }, // ₦2,500 in kobo
    elite:   { name: 'Oracle Elite',   amount: 500000, code: 'ELITE'   }, // ₦5,000 in kobo
  },

  // Challenges
  CHALLENGES: {
    safe:        { name: 'Oracle Safe Growth',  odds: 1.5, price: 2500, risk: 'Low'    },
    growth_plus: { name: 'Oracle Growth Plus',  odds: 2.0, price: 2000, risk: 'Medium' },
    accelerator: { name: 'Oracle Accelerator',  odds: 4.0, price: 1500, risk: 'High'   },
  }
};

export default CONFIG;
