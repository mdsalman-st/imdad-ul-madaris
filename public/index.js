// ==================== CONFIGURATION ====================
const API_BASE = 'https://imdad-backend-1.onrender.com';

function showToast(m, e) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = m;
  t.className = e ? 'toast error' : 'toast';
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

function showLoader(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Loading...</div>';
}

async function fetchAPI(url, opts = {}) {
  const res = await fetch(API_BASE + url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

let allMadrasas = [], userLat = null, userLng = null, useNearby = false;

const booksData = [
  { title: "The Holy Quran", author: "English Translation", emoji: "📖" },
  { title: "40 Hadith Nawawi", author: "Imam An-Nawawi", emoji: "📕" },
  { title: "Stories of the Prophets", author: "Ibn Kathir", emoji: "📘" },
  { title: "Islamic Manners", author: "Shaykh Abdul Fattah", emoji: "📗" }
];

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  return R * 2 * Math.atan2(Math.sqrt(Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2), Math.sqrt(1 - (Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2)));
}

async function loadStats() {
  try {
    const d = await fetchAPI('/api/stats');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('statMadrasas', d.madrasas || 0);
    set('statDonations', d.donations || 0);
    set('statAmount', '₹' + ((d.totalAmount || 0) / 1000).toFixed(0) + 'K');
    const mt = document.getElementById('marqueeText');
    if (mt) mt.innerHTML = `🕌 ${d.madrasas||0} Madrasas • ${d.donations||0} Donations • ₹${(d.totalAmount||0).toLocaleString('en-IN')} Raised`;
  } catch (e) {}
}

async function loadMadrasas() {
  try {
    showLoader('madrasaGrid');
    const madrasas = await fetchAPI('/api/madrasas');
    allMadrasas = madrasas.map(m => ({
      id: m._id, name: m.madrasaName, district: m.district, state: m.state || 'Bihar',
      upiId: m.upiId, needReason: m.needReason || 'Needs support', urgencyLevel: m.urgencyLevel || 80,
      lat: m.lat || 25.5, lng: m.lng || 85.0
    }));
    renderMadrasas();
  } catch (e) {
    const grid = document.getElementById('madrasaGrid');
    if (grid) grid.innerHTML = '<div style="text-align:center;padding:40px;"><h3>Madrasas Will Appear Here</h3></div>';
  }
}

function getTopMadrasas() {
  let list = [...allMadrasas];
  if (!list.length) return [];
  list = useNearby && userLat ? list.map(m => ({...m, dist: getDistance(userLat, userLng, m.lat, m.lng)})).sort((a,b) => a.dist - b.dist) : list.sort((a,b) => b.urgencyLevel - a.urgencyLevel);
  return list.slice(0, 4);
}

function renderCard(m) {
  return `<div class="madrasa-card" onclick="location.href='madrasa-detail.html?id=${m.id}'" style="cursor:pointer;"><div class="card-img" style="background-image:url('https://source.unsplash.com/featured/400x140?mosque,islam')"></div><div class="card-content"><div class="madrasa-name">${m.name}</div><div class="district">📍 ${m.district}, ${m.state}</div><div class="need-reason">⚠️ ${m.needReason}</div><button class="donate-btn" data-upi="${m.upiId}" data-name="${m.name}">💝 Donate Now</button></div></div>`;
}

function renderMadrasas() {
  const top = getTopMadrasas(), grid = document.getElementById('madrasaGrid');
  if (!top.length || !grid) return;
  grid.innerHTML = top.map(renderCard).join('');
  document.querySelectorAll('.donate-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); openDonationModal(b.dataset.upi, b.dataset.name); });
}

function renderBooks() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;
  grid.innerHTML = booksData.map(b => `<div class="book-card" onclick="location.href='book.html'" style="cursor:pointer;"><div class="book-emoji">${b.emoji}</div><div class="book-title">${b.title}</div><div class="book-author">${b.author}</div></div>`).join('');
}

function autoDetectLocation() {
  const sd = document.getElementById('locationStatus');
  if (!sd) return;
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(p => { userLat = p.coords.latitude; userLng = p.coords.longitude; useNearby = true; sd.innerHTML = "📍 Showing near you"; renderMadrasas(); }, () => { sd.innerHTML = "📍 Highest priority"; renderMadrasas(); });
  } else { sd.innerHTML = "📍 Highest priority"; renderMadrasas(); }
}

let currentUpi = "", currentName = "", selectedAmount = 101;
const donationModal = document.getElementById('donationModal');

function openDonationModal(upi, name) {
  currentUpi = upi; currentName = name; selectedAmount = 101;
  document.getElementById('modalName').innerText = name;
  document.getElementById('modalUpi').innerHTML = `💳 UPI: ${upi}`;
  document.getElementById('customAmount').value = '';
  document.getElementById('qrContainer').innerHTML = '';
  const amounts = [51, 101, 501, 1001];
  const amt = document.getElementById('amountOptions');
  amt.innerHTML = amounts.map(a => `<div class="amount-opt ${a===101?'active':''}" data-amount="${a}">₹${a}</div>`).join('');
  amt.querySelectorAll('.amount-opt').forEach(o => o.onclick = () => { selectedAmount = +o.dataset.amount; amt.querySelectorAll('.amount-opt').forEach(x => x.classList.remove('active')); o.classList.add('active'); });
  donationModal.style.display = 'flex';
}

const pdb = document.getElementById('proceedDonateBtn');
if (pdb) pdb.addEventListener('click', async () => {
  let amt = document.getElementById('customAmount').value;
  if (amt && parseFloat(amt) > 0) selectedAmount = parseFloat(amt);
  if (!selectedAmount || selectedAmount <= 0) return showToast('Enter amount', true);
  const link = `upi://pay?pa=${encodeURIComponent(currentUpi)}&pn=${encodeURIComponent(currentName)}&am=${selectedAmount}&cu=INR`;
  const qr = document.getElementById('qrContainer');
  qr.innerHTML = `<div id="qrcode"></div><p>₹${selectedAmount}</p><a href="${link}" style="color:#0a5c2e;">Open UPI App</a>`;
  setTimeout(() => { if (typeof QRCode !== 'undefined') new QRCode(document.getElementById("qrcode"), { text: link, width: 160, height: 160 }); }, 200);
  try { await fetchAPI('/api/donations', { method: 'POST', body: JSON.stringify({ donorName: 'Donor', donorEmail: 'donor@imdad.com', madrasaName: currentName, madrasaUpi: currentUpi, amount: selectedAmount, donationType: 'General' }) }); } catch (e) {}
});

const sbtn = document.getElementById('subscribeBtn');
if (sbtn) sbtn.addEventListener('click', async () => {
  const em = document.getElementById('subscribeEmail');
  if (!em) return;
  const email = em.value.trim();
  if (!email || !email.includes('@')) return showToast('Enter valid email', true);
  try { await fetchAPI('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) }); showToast('✅ Subscribed!'); em.value = ''; } catch (e) { showToast('Failed', true); }
});

const slides = document.querySelectorAll('.slide');
let si = 0;
if (slides.length > 1) setInterval(() => { slides[si].classList.remove('active'); si = (si+1) % slides.length; slides[si].classList.add('active'); }, 5000);

const vab = document.getElementById('viewAllBtn');
const vabb = document.getElementById('viewAllBooksBtn');
const cmb = document.getElementById('closeModalBtn');
if (vab) vab.addEventListener('click', () => location.href = 'mlist.html');
if (vabb) vabb.addEventListener('click', () => location.href = 'book.html');
if (cmb) cmb.addEventListener('click', () => donationModal.style.display = 'none');

const camb = document.getElementById('closeAllModalBtn');
const cbb = document.getElementById('closeBooksModalBtn');
if (camb) camb.addEventListener('click', () => { const el = document.getElementById('allMadrasasModal'); if (el) el.style.display = 'none'; });
if (cbb) cbb.addEventListener('click', () => { const el = document.getElementById('allBooksModal'); if (el) el.style.display = 'none'; });

window.addEventListener('click', (e) => {
  if (e.target === donationModal) donationModal.style.display = 'none';
  const am = document.getElementById('allMadrasasModal'), bm = document.getElementById('allBooksModal');
  if (am && e.target === am) am.style.display = 'none';
  if (bm && e.target === bm) bm.style.display = 'none';
});

// MENU
const menuBtn = document.getElementById('menuBtn');
let menuOpen = false;
if (menuBtn) menuBtn.addEventListener('click', (e) => { e.stopPropagation(); menuOpen ? closeMenu() : openMenu(); });

function openMenu() {
  const isLoggedIn = !!localStorage.getItem('imdad_user');
  const ud = JSON.parse(localStorage.getItem('imdad_user') || '{}');
  const un = ud.name || 'Guest', ur = ud.role || '';
  const h = `
    <div id="sideMenu" style="position:fixed;top:0;left:0;width:280px;height:100vh;background:#fff;z-index:2000;box-shadow:8px 0 40px rgba(0,0,0,0.12);overflow-y:auto;font-family:sans-serif;">
      <div style="padding:28px 20px 20px;background:linear-gradient(135deg,#0a5c2e,#0d7a3e);color:white;">
        <button onclick="closeMenu()" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;">&times;</button>
        ${isLoggedIn ? `<a href="madarsa-dashboard.html" style="color:white;text-decoration:none;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:600;">${un.charAt(0).toUpperCase()}</div><div><div style="font-weight:600;">${un}</div><div style="font-size:0.7rem;opacity:0.85;">${ur==='madrasa'?'Madrasa':'Donor'}</div></div></div></a>` : `<a href="auth.html" style="color:white;text-decoration:none;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">👤</div><div><div style="font-weight:600;">Sign In</div><div style="font-size:0.7rem;opacity:0.85;">Access account</div></div></div></a>`}
      </div>
      <nav style="padding:12px;">
        <a href="index.html" class="nv">🏠 Home</a><a href="blog.html" class="nv">📝 Blog</a><a href="book.html" class="nv">📚 Books</a><a href="askmufti.html" class="nv">❓ Ask Mufti</a><a href="leaderboard.html" class="nv">🏆 Leaderboard</a>
        ${isLoggedIn ? `<hr style="margin:8px 0;"><a href="madarsa-dashboard.html" class="nv">📊 Dashboard</a><a href="donation-history.html" class="nv">💰 History</a>` : ''}
      </nav>
      ${isLoggedIn ? `<div style="padding:0 12px 20px;"><button onclick="logoutUser()" style="width:100%;padding:12px;border-radius:10px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;cursor:pointer;font-weight:600;">🚪 Sign Out</button></div>` : ''}
    </div>
    <style>.nv{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;text-decoration:none;color:#334155;font-size:0.9rem;margin-bottom:2px;}.nv:hover{background:#f8fafc;color:#0a5c2e;}</style>`;
  const em = document.getElementById('sideMenu'); if (em) em.remove();
  document.body.insertAdjacentHTML('beforeend', h);
  menuOpen = true;
  setTimeout(() => document.addEventListener('click', closeMenuOnOutside), 50);
}
function closeMenu() { const m = document.getElementById('sideMenu'); if (m) m.remove(); menuOpen = false; document.removeEventListener('click', closeMenuOnOutside); }
function closeMenuOnOutside(e) { const m = document.getElementById('sideMenu'), b = document.getElementById('menuBtn'); if (m && !m.contains(e.target) && e.target !== b) closeMenu(); }
window.closeMenu = closeMenu;
window.logoutUser = function() { localStorage.removeItem('imdad_user'); showToast('Signed out'); closeMenu(); setTimeout(() => location.reload(), 500); };

async function init() { renderBooks(); await loadStats(); await loadMadrasas(); autoDetectLocation(); }
init();