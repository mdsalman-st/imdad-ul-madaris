// ==================== CONFIGURATION ====================
var API_BASE = window.IMDAD_API_BASE;

// ==================== UTILITIES ====================
function showToast(m, e) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = m;
  t.className = e ? 'toast error' : 'toast';
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function showLoader(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Loading...</div>';
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Timeout + error handling + auto logout on 401
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
    if (res.status === 401) {
      // Auto logout on unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('imdad_user');
      showToast('Session expired. Please login again.', true);
      setTimeout(() => location.href = 'auth.html', 1000);
      throw new Error('Unauthorized');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    // #region agent log
    if (window.__imdadDebugLog) window.__imdadDebugLog('index.js:fetchAPI', 'API OK', { url: url, status: res.status }, 'B');
    // #endregion
    return data;
  } catch (e) {
    clearTimeout(timeout);
    // #region agent log
    if (window.__imdadDebugLog) window.__imdadDebugLog('index.js:fetchAPI', 'API failed', { url: url, error: String(e.message || e), apiBase: API_BASE }, 'B');
    // #endregion
    throw e;
  }
}

// Auth helpers – with JWT expiry check
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || localStorage.getItem('imdad_user') || 'null');
  } catch (e) {
    return null;
  }
}

function isLoggedIn() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user') || localStorage.getItem('imdad_user');
  if (!token || !user) return false;
  // JWT expiry check
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

// ==================== DATA ====================
let allMadrasas = [], userLat = null, userLng = null, useNearby = false;

const booksData = [
  { title: "The Holy Quran", author: "English Translation", emoji: "📖" },
  { title: "40 Hadith Nawawi", author: "Imam An-Nawawi", emoji: "📕" },
  { title: "Stories of the Prophets", author: "Ibn Kathir", emoji: "📘" },
  { title: "Islamic Manners", author: "Shaykh Abdul Fattah", emoji: "📗" }
];

// ==================== LOCATION ====================
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function autoDetectLocation() {
  const sd = document.getElementById('locationStatus');
  if (!sd) return;
  if (!("geolocation" in navigator)) {
    sd.innerHTML = "📍 Highest priority";
    renderMadrasas();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    p => {
      userLat = p.coords.latitude;
      userLng = p.coords.longitude;
      useNearby = true;
      sd.innerHTML = "📍 Showing near you";
      renderMadrasas();
    },
    () => {
      sd.innerHTML = "📍 Highest priority";
      renderMadrasas();
    },
    { timeout: 8000 }
  );
}

// ==================== STATS ====================
async function loadStats() {
  try {
    const d = await fetchAPI('/api/stats');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('statMadrasas', d.madrasas || 0);
    set('statDonations', d.donations || 0);
    set('statAmount', '₹' + ((d.totalAmount || 0) / 1000).toFixed(0) + 'K');
    const mt = document.getElementById('marqueeText');
    if (mt) mt.innerHTML = `🕌 ${d.madrasas||0} Madrasas • ${d.donations||0} Donations • ₹${(d.totalAmount||0).toLocaleString('en-IN')} Raised`;
  } catch (e) {
    console.warn('Stats load failed:', e.message);
  }
}

// ==================== MADRASAS ====================
async function loadMadrasas() {
  try {
    showLoader('madrasaGrid');
    const madrasas = await fetchAPI('/api/madrasas');
    allMadrasas = madrasas.map(m => ({
      id: m._id,
      name: m.madrasaName,
      district: m.district,
      state: m.state || 'India',
      upiId: m.upiId,
      needReason: m.needReason || 'Needs support',
      urgencyLevel: m.urgencyLevel || 80,
      lat: m.lat || 25.5,
      lng: m.lng || 85.0
    }));
    renderMadrasas();
  } catch (e) {
    const grid = document.getElementById('madrasaGrid');
    if (grid) grid.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><h3>No madrasas available yet</h3><p style="font-size:0.85rem;margin-top:8px;">Check back soon</p></div>';
  }
}

function getTopMadrasas() {
  let list = [...allMadrasas];
  if (!list.length) return [];
  if (useNearby && userLat) {
    list = list.filter(m => !(m.lat === 25.5 && m.lng === 85.0));
    if (list.length === 0) list = [...allMadrasas];
    list = list.map(m => ({ ...m, dist: getDistance(userLat, userLng, m.lat, m.lng) }))
               .sort((a, b) => a.dist - b.dist);
  } else {
    list = list.sort((a, b) => b.urgencyLevel - a.urgencyLevel);
  }
  return list.slice(0, 4);
}

function renderCard(m) {
  const id = escapeAttr(m.id);
  const name = escapeHTML(m.name);
  const district = escapeHTML(m.district);
  const state = escapeHTML(m.state);
  const needReason = escapeHTML(m.needReason);
  const upiId = escapeAttr(m.upiId || '');
  const nameAttr = escapeAttr(m.name);

  return `
    <div class="madrasa-card" data-id="${id}" style="cursor:pointer;">
      <div class="card-img" style="background-image:url('https://source.unsplash.com/featured/400x140?mosque,islam'); background-color:#0a5c2e;"></div>
      <div class="card-content">
        <div class="madrasa-name">${name}</div>
        <div class="district">📍 ${district}, ${state}</div>
        <div class="need-reason">⚠️ ${needReason}</div>
        <button class="donate-btn" data-upi="${upiId}" data-name="${nameAttr}">💝 Donate Now</button>
      </div>
    </div>`;
}

function renderMadrasas() {
  const top = getTopMadrasas();
  const grid = document.getElementById('madrasaGrid');
  if (!grid) return;
  if (!top.length) {
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">No madrasas found</div>';
    return;
  }
  grid.innerHTML = top.map(renderCard).join('');
  document.querySelectorAll('.madrasa-card[data-id]').forEach(card => {
    card.onclick = () => {
      location.href = `madrasa.html?id=${encodeURIComponent(card.dataset.id)}`;
    };
  });
  document.querySelectorAll('.donate-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const upi = btn.dataset.upi;
      const name = btn.dataset.name;
      // Prefer donation modal; fallback to secure donation form page
      if (typeof window.openDonationModal === 'function') {
        window.openDonationModal(upi, name);
      } else {
        // ✅ Fixed security: redirect to donation form instead of raw UPI intent
        location.href = `donation-page.html?name=${encodeURIComponent(name)}&upi=${encodeURIComponent(upi)}`;
      }
    };
  });
}

// ==================== BOOKS ====================
function renderBooks() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;
  grid.innerHTML = booksData.map(b => `
    <div class="book-card" onclick="location.href='book.html'" style="cursor:pointer;">
      <div class="book-emoji">${b.emoji}</div>
      <div class="book-title">${b.title}</div>
      <div class="book-author">${b.author}</div>
    </div>`).join('');
}

// ==================== MENU ====================
const menuBtn = document.getElementById('menuBtn');
let menuOpen = false;
if (menuBtn) menuBtn.addEventListener('click', (e) => { e.stopPropagation(); menuOpen ? closeMenu() : openMenu(); });

function openMenu() {
  const loggedIn = isLoggedIn();
  const ud = getUser() || {};
  const un = ud.name || 'Guest';
  const ur = ud.role || '';
  const safeName = escapeHTML(un);
  const safeInitial = escapeHTML(un.charAt(0).toUpperCase());

  // ✅ Fixed: correct madrasa dashboard file name
  const dashboardLink = ur === 'madrasa' ? 'madrasa-dashboard.html' : 'donor-dashboard.html';

  const h = `
    <div id="sideMenu" style="position:fixed;top:0;left:0;width:280px;height:100vh;background:#fff;z-index:2000;box-shadow:8px 0 40px rgba(0,0,0,0.12);overflow-y:auto;font-family:sans-serif;">
      <div style="padding:28px 20px 20px;background:linear-gradient(135deg,#0a5c2e,#0d7a3e);color:white;position:relative;">
        <button onclick="closeMenu()" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;">&times;</button>
        ${loggedIn
          ? `<a href="profile.html" style="color:white;text-decoration:none;">
               <div style="display:flex;align-items:center;gap:12px;">
                 <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:600;">${safeInitial}</div>
                 <div>
                   <div style="font-weight:600;">${safeName}</div>
                   <div style="font-size:0.7rem;opacity:0.85;">${ur === 'madrasa' ? 'Madrasa' : 'Donor'}</div>
                 </div>
               </div>
             </a>`
          : `<a href="auth.html" style="color:white;text-decoration:none;">
               <div style="display:flex;align-items:center;gap:12px;">
                 <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">👤</div>
                 <div>
                   <div style="font-weight:600;">Sign In</div>
                   <div style="font-size:0.7rem;opacity:0.85;">Access account</div>
                 </div>
               </div>
             </a>`}
      </div>
      <nav style="padding:12px;">
        <a href="index.html" class="nv">🏠 Home</a>
        <a href="blog.html" class="nv">📝 Blog</a>
        <a href="book.html" class="nv">📚 Books</a>
        <a href="askmufti.html" class="nv">❓ Ask Mufti</a>
        <a href="leaderboard.html" class="nv">🏆 Leaderboard</a>
        <a href="receipt.html" class="nv">🧾 Get Receipt</a>
        ${loggedIn ? `
          <hr style="margin:8px 0;border:none;border-top:1px solid #e2e8f0;">
          <a href="profile.html" class="nv">👤 Profile</a>
          <a href="${dashboardLink}" class="nv">📊 My Dashboard</a>
          <a href="donation-history.html" class="nv">💰 History</a>` : ''}
      </nav>
      ${loggedIn ? `
        <div style="padding:0 12px 20px;">
          <button onclick="logoutUser()" style="width:100%;padding:12px;border-radius:10px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;cursor:pointer;font-weight:600;">🚪 Sign Out</button>
        </div>` : ''}
    </div>
    <style>
      .nv { display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:10px; text-decoration:none; color:#334155; font-size:0.9rem; margin-bottom:2px; }
      .nv:hover { background:#f8fafc; color:#0a5c2e; }
    </style>`;

  const existing = document.getElementById('sideMenu');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', h);
  menuOpen = true;
  setTimeout(() => document.addEventListener('click', closeMenuOnOutside), 50);
}

function closeMenu() {
  const m = document.getElementById('sideMenu');
  if (m) m.remove();
  menuOpen = false;
  document.removeEventListener('click', closeMenuOnOutside);
}

function closeMenuOnOutside(e) {
  const m = document.getElementById('sideMenu');
  const b = document.getElementById('menuBtn');
  if (m && !m.contains(e.target) && e.target !== b) closeMenu();
}

window.closeMenu = closeMenu;

window.logoutUser = function() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('imdad_user');
  showToast('Signed out');
  closeMenu();
  setTimeout(() => location.reload(), 500);
};

// ==================== EVENT LISTENERS ====================

// Subscribe
const sbtn = document.getElementById('subscribeBtn');
if (sbtn) sbtn.addEventListener('click', async () => {
  const em = document.getElementById('subscribeEmail');
  if (!em) return;
  const email = em.value.trim();
  if (!email || !email.includes('@')) return showToast('Enter valid email', true);
  try {
    await fetchAPI('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
    showToast('✅ Subscribed!');
    em.value = '';
  } catch (e) {
    showToast('Failed to subscribe', true);
  }
});

// Hero Slider
const slides = document.querySelectorAll('.slide');
let si = 0;
if (slides.length > 1) {
  setInterval(() => {
    slides[si].classList.remove('active');
    si = (si + 1) % slides.length;
    slides[si].classList.add('active');
  }, 5000);
}

// View All Buttons
const vab = document.getElementById('viewAllBtn');
const vabb = document.getElementById('viewAllBooksBtn');
if (vab) vab.addEventListener('click', () => location.href = 'madrasa-list.html');
if (vabb) vabb.addEventListener('click', () => location.href = 'book.html');

// Close Modals (if they exist on page)
const camb = document.getElementById('closeAllModalBtn');
const cbb = document.getElementById('closeBooksModalBtn');
if (camb) camb.addEventListener('click', () => { const el = document.getElementById('allMadrasasModal'); if (el) el.style.display = 'none'; });
if (cbb) cbb.addEventListener('click', () => { const el = document.getElementById('allBooksModal'); if (el) el.style.display = 'none'; });

window.addEventListener('click', (e) => {
  const am = document.getElementById('allMadrasasModal');
  const bm = document.getElementById('allBooksModal');
  if (am && e.target === am) am.style.display = 'none';
  if (bm && e.target === bm) bm.style.display = 'none';
});

// ==================== INIT ====================
async function init() {
  renderBooks();
  await loadStats();
  await loadMadrasas();
  autoDetectLocation();
}

if (document.getElementById('madrasaGrid')) {
  // #region agent log
  if (window.__imdadDebugLog) window.__imdadDebugLog('index.js:init', 'Homepage init starting', {}, 'B');
  // #endregion
  init().then(function () {
    // #region agent log
    if (window.__imdadDebugLog) window.__imdadDebugLog('index.js:init', 'Homepage init done', { madrasaCount: allMadrasas.length }, 'B');
    // #endregion
  }).catch(function (err) {
    // #region agent log
    if (window.__imdadDebugLog) window.__imdadDebugLog('index.js:init', 'Homepage init failed', { error: String(err) }, 'B');
    // #endregion
  });
}
