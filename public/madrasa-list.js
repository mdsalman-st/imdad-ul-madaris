// ==================== MLIST PAGE JS (FINAL - SECURE & ROBUST) ====================
var API_BASE = window.IMDAD_API_BASE;
// #region agent log
if (window.__imdadDebugLog) window.__imdadDebugLog('madrasa-list.js:load', 'madrasa-list.js parsed OK', { apiBase: API_BASE }, 'D');
// #endregion

// ==================== UTILITIES ====================
function showToast(m, e) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:30px;font-weight:600;z-index:2000;display:none;color:white;box-shadow:0 8px 24px rgba(0,0,0,0.15);white-space:nowrap;';
    document.body.appendChild(toast);
  }
  toast.textContent = m;
  toast.style.background = e ? '#dc2626' : '#0a5c2e';
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Core API caller with auth, timeout, and conditional 401 handling
async function fetchAPI(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: 'Bearer ' + token })
    };
    const res = await fetch(API_BASE + url, {
      headers,
      signal: controller.signal,
      ...opts
    });
    clearTimeout(timeout);
    if (!res.ok) {
      if (res.status === 401 && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

// Retry wrapper (3 attempts)
async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchAPI(url, opts);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// ==================== GLOBAL STATE ====================
let allMadrasas = [];
let currentSearch = '';
let currentState = '';

// ==================== LOAD MADRASAS ====================
async function loadMadrasas() {
  const grid = document.getElementById('madrasaGrid');
  grid.innerHTML = `<div style="text-align:center;padding:60px;grid-column:1/-1;">
    <div style="font-size:2rem;margin-bottom:12px;animation:pulse 1.5s infinite;">🕌</div>
    <p style="color:#64748b;">Loading madrasas...</p>
  </div>`;

  try {
    const madrasas = await fetchWithRetry('/api/madrasas');
    allMadrasas = madrasas.map(m => ({
      id: m._id,
      name: m.madrasaName,
      district: m.district,
      state: m.state || 'India',
      upiId: m.upiId,
      needReason: m.needReason || 'Needs your support',
      urgencyLevel: m.urgencyLevel || 80,
      lat: m.lat,
      lng: m.lng
    }));
    renderMadrasas();
    showToast(`${allMadrasas.length} madrasas loaded`);
  } catch (error) {
    grid.innerHTML = `<div style="text-align:center;padding:60px;grid-column:1/-1;">
      <div style="font-size:3rem;margin-bottom:16px;">🕌</div>
      <h3 style="color:#0a5c2e;margin-bottom:8px;">Madrasas Coming Soon</h3>
      <p style="color:#64748b;margin-bottom:20px;">No verified madrasas yet. Please check back later.</p>
      <a href="auth.html" style="display:inline-block;background:#0a5c2e;color:white;padding:12px 28px;border-radius:30px;text-decoration:none;font-weight:600;">Register Your Madrasa</a>
    </div>`;
    document.getElementById('resultsCount').textContent = '0 madrasas found';
  }
}

// ==================== FILTER & RENDER ====================
function filterMadrasas() {
  let filtered = [...allMadrasas];

  if (currentSearch) {
    const s = currentSearch.toLowerCase();
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(s) ||
      m.district.toLowerCase().includes(s) ||
      m.state.toLowerCase().includes(s)
    );
  }

  if (currentState) {
    filtered = filtered.filter(m => m.state === currentState);
  }

  return filtered.sort((a, b) => b.urgencyLevel - a.urgencyLevel);
}

function renderCard(m) {
  // Safe: all dynamic text escaped
  return `
    <div class="madrasa-card" onclick="location.href='madrasa.html?id=${m.id}'" style="cursor:pointer;animation:fadeIn 0.4s ease;">
      <div class="card-img" style="background-image:url('https://source.unsplash.com/featured/400x140?mosque,islam'); background-color:#0a5c2e;"></div>
      <div class="card-content">
        <div class="madrasa-name">${escapeHTML(m.name)}</div>
        <div class="district">📍 ${escapeHTML(m.district)}, ${escapeHTML(m.state)}</div>
        <div class="need-reason">⚠️ ${escapeHTML(m.needReason)}</div>
        <button class="donate-btn" data-upi="${escapeHTML(m.upiId || '')}" data-name="${escapeHTML(m.name)}" data-id="${m.id}">
          💝 Donate Now
        </button>
      </div>
    </div>`;
}

function renderMadrasas() {
  const filtered = filterMadrasas();
  const grid = document.getElementById('madrasaGrid');
  const resultsCount = document.getElementById('resultsCount');

  resultsCount.innerHTML = `<strong>${filtered.length}</strong> madrasas found ${currentState ? 'in ' + escapeHTML(currentState) : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="text-align:center;padding:60px;grid-column:1/-1;">
      <div style="font-size:3rem;margin-bottom:12px;">🔍</div>
      <p style="color:#64748b;font-size:1rem;">No madrasas found matching your search.</p>
      <p style="color:#94a3b8;font-size:0.85rem;margin-top:4px;">Try different keywords or clear filters.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(renderCard).join('');
  attachDonateEvents();
}

// ==================== DONATE BUTTON (SECURE REDIRECT) ====================
function attachDonateEvents() {
  document.querySelectorAll('.donate-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const upi = btn.dataset.upi;
      const name = btn.dataset.name;
      // Use donation modal if available (e.g., from donation.js)
      if (typeof window.openDonationModal === 'function') {
        window.openDonationModal(upi, name);
      } else {
        // Secure fallback: redirect to donation form page
        location.href = `donation-page.html?name=${encodeURIComponent(name)}&upi=${encodeURIComponent(upi)}`;
      }
    };
  });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderMadrasas();
    });
  }
  if (stateFilter) {
    stateFilter.addEventListener('change', (e) => {
      currentState = e.target.value;
      renderMadrasas();
    });
  }

  if (!document.getElementById('mlist-animations')) {
    const style = document.createElement('style');
    style.id = 'mlist-animations';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }

  loadMadrasas().then(function () {
    // #region agent log
    if (window.__imdadDebugLog) window.__imdadDebugLog('madrasa-list.js:loadMadrasas', 'Madrasa list loaded', { count: allMadrasas.length }, 'B');
    // #endregion
  }).catch(function (err) {
    // #region agent log
    if (window.__imdadDebugLog) window.__imdadDebugLog('madrasa-list.js:loadMadrasas', 'Madrasa list failed', { error: String(err) }, 'B');
    // #endregion
  });
});
