// ==================== DONOR DASHBOARD JS (REDIRECT BUG FIXED) ====================
var API_BASE = window.IMDAD_API_BASE;

// ==================== UTILITIES ====================
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = err ? 'toast error' : 'toast';
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function fetchAPI(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const finalOpts = {
      ...opts,
      headers: { ...headers, ...(opts.headers || {}) },
      signal: controller.signal
    };
    const res = await fetch(API_BASE + url, finalOpts);
    clearTimeout(timeout);
    if (!res.ok) {
      if (res.status === 401 && token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('imdad_user');
        showToast('Session expired. Please login again.', true);
        setTimeout(() => location.href = 'auth.html', 1000);
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server error (${res.status})`);
    }
    return await res.json();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ==================== AUTH (robust key & field detection) ====================
function getUser() {
  try {
    let user = localStorage.getItem('user');
    if (!user) user = localStorage.getItem('imdad_user');
    return JSON.parse(user || 'null');
  } catch (e) {
    return null;
  }
}

function isLoggedIn() {
  const token = localStorage.getItem('token');
  const user = getUser();
  if (!token || !user) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('imdad_user');
      return false;
    }
  } catch (e) {}
  return true;
}

// Helper to get user ID (supports both userId and _id)
function getUserId(user) {
  return user.userId || user._id;
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  try {
    const userData = getUser();
    // #region agent log
    if (window.__imdadDebugLog) window.__imdadDebugLog('donor-madrasa-dashboard.js:init', 'Dashboard auth check', { loggedIn: isLoggedIn(), hasUser: !!userData, userId: getUserId(userData), role: userData && userData.role }, 'C');
    // #endregion

    if (!isLoggedIn() || !userData || !getUserId(userData)) {
      window.location.href = 'auth.html';
      return;
    }

    if (userData.role !== 'donor') {
      window.location.href = 'madrasa-dashboard.html';
      return;
    }

    const avatar = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const phoneEl = document.getElementById('userPhone');
    if (avatar) avatar.textContent = (userData.name || 'D').charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = userData.name || 'Donor';
    if (phoneEl) phoneEl.textContent = '📱 ' + (userData.phone || 'Not provided');

    const userId = getUserId(userData);
    loadZakatTracker(userId);
    loadRecentDonations(userId);
  } catch (err) {
    console.error('Donor dashboard init failed:', err);
  } finally {
    document.body.style.visibility = 'visible';
  }
});

// ==================== LOGOUT ====================
window.logoutUser = function() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('imdad_user');
  sessionStorage.clear();
  window.location.replace('auth.html');
};

// ==================== ZAKAT TRACKER ====================
async function loadZakatTracker(userId) {
  try {
    const data = await fetchAPI(`/api/donations/donor/${userId}?year=2026`);
    const totalGiven = data.totalAmount || 0;
    const target = 50000;
    const remaining = Math.max(0, target - totalGiven);
    const percent = Math.min(100, Math.round((totalGiven / target) * 100));

    document.getElementById('zakatGiven').textContent = '₹' + totalGiven.toLocaleString('en-IN');
    document.getElementById('zakatRemaining').textContent = '₹' + remaining.toLocaleString('en-IN');
    document.getElementById('zakatTarget').textContent = '₹' + target.toLocaleString('en-IN');
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressText').textContent = percent + '% Complete';
  } catch (err) {
    console.warn('Zakat tracker load failed:', err.message);
  }
}

// ==================== RECENT DONATIONS ====================
async function loadRecentDonations(userId) {
  const container = document.getElementById('recentDonations');
  if (!container) return;

  try {
    const data = await fetchAPI(`/api/donations/donor/${userId}`);
    const donations = data.donations || data;

    if (!donations || !donations.length) {
      container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">No donations yet. Start giving! 💝</p>';
      return;
    }

    const recent = donations.slice(0, 5);
    container.innerHTML = recent.map(d => {
      const dateStr = d.date ? new Date(d.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '--';
      return `
        <div class="donation-item">
          <div class="donation-icon">💝</div>
          <div class="donation-info">
            <div class="donation-madrasa">${escapeHTML(d.madrasaName || 'Unknown Madrasa')}</div>
            <div class="donation-date">${dateStr}</div>
          </div>
          <div class="donation-amount">₹${(d.amount || 0).toLocaleString('en-IN')}</div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">Failed to load donations.</p>';
  }
}
