// OracleSports.ai — Paystack Payment Service
import CONFIG from '../config.js';
import { updateUserProfile, currentUser } from './firebase.js';
import { showToast } from './ui.js';

export function initPaystack(plan, email, onSuccess) {
  const planConfig = CONFIG.PLANS[plan];
  if (!planConfig) { showToast('Invalid plan selected', 'error'); return; }

  if (!window.PaystackPop) {
    showToast('Payment system loading, please try again.', 'error');
    return;
  }

  const handler = window.PaystackPop.setup({
    key:       CONFIG.PAYSTACK_PUBLIC_KEY,
    email,
    amount:    planConfig.amount, // in kobo
    currency:  'NGN',
    ref:       `OS_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
    metadata: {
      custom_fields: [
        { display_name: 'Plan',    variable_name: 'plan',    value: planConfig.code },
        { display_name: 'User',    variable_name: 'user_id', value: currentUser()?.uid || '' },
      ]
    },
    callback: async (response) => {
      if (response.status === 'success') {
        await activatePlan(plan, response.reference);
        showToast(`🎉 ${planConfig.name} activated!`, 'success');
        if (onSuccess) onSuccess(response);
      }
    },
    onClose: () => { showToast('Payment cancelled', 'info'); }
  });

  handler.openIframe();
}

export async function initChallengePay(challengeKey, email, onSuccess) {
  const ch = CONFIG.CHALLENGES[challengeKey];
  if (!ch) return;

  const handler = window.PaystackPop.setup({
    key:      CONFIG.PAYSTACK_PUBLIC_KEY,
    email,
    amount:   ch.price * 100, // to kobo
    currency: 'NGN',
    ref:      `CH_${challengeKey}_${Date.now()}`,
    metadata: {
      custom_fields: [
        { display_name: 'Challenge', variable_name: 'challenge', value: ch.name },
        { display_name: 'User',      variable_name: 'user_id',   value: currentUser()?.uid || '' },
      ]
    },
    callback: async (response) => {
      if (response.status === 'success') {
        const { joinChallenge } = await import('./firebase.js');
        await joinChallenge(currentUser().uid, challengeKey);
        showToast(`✅ Joined ${ch.name}!`, 'success');
        if (onSuccess) onSuccess(response);
      }
    },
    onClose: () => { showToast('Payment cancelled', 'info'); }
  });

  handler.openIframe();
}

async function activatePlan(plan, reference) {
  const user = currentUser();
  if (!user) return;
  await updateUserProfile(user.uid, {
    plan,
    planActivatedAt: new Date().toISOString(),
    paystackRef: reference,
  });
}

export function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', minimumFractionDigits: 0
  }).format(amount);
}
