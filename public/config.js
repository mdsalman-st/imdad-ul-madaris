(function () {
  if (!window.IMDAD_API_BASE) {
    window.IMDAD_API_BASE = 'https://imdad-backend-1.onrender.com';
  }
  if (!window.IMDAD_AUTH_API_BASE) {
    window.IMDAD_AUTH_API_BASE = 'https://imdad-backend-1.onrender.com/api';
  }

})();

window.getImdadUserId = function (user) {
  if (!user) return null;
  return user.userId || user._id || user.id || null;
};

// ==================== OFFLINE SYNC ====================
async function syncOfflineDonations() {
  if (!navigator.onLine) return;
  const pending = JSON.parse(localStorage.getItem('imdad_pending_donations') || '[]');
  if (!pending.length) return;
  
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const remaining = [];
  for (const donation of pending) {
    try {
      const res = await fetch(window.IMDAD_API_BASE + '/api/donations', {
        method: 'POST',
        headers,
        body: JSON.stringify(donation)
      });
      if (!res.ok) throw new Error('Sync failed');
    } catch (e) {
      remaining.push(donation);
    }
  }
  
  if (remaining.length === 0) {
    localStorage.removeItem('imdad_pending_donations');
  } else {
    localStorage.setItem('imdad_pending_donations', JSON.stringify(remaining));
  }
}

window.addEventListener('online', syncOfflineDonations);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(syncOfflineDonations, 1000);
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(syncOfflineDonations, 1000));
}
