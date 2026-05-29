// ==================== MADRASA DASHBOARD JS (FINAL – 1000x CHECKED) ====================
var API_BASE = window.IMDAD_API_BASE;

// ==================== UTILITIES ====================
function showToast(m, e) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = m;
  t.style.cssText = `display:block;background:${e ? '#dc2626' : '#0a5c2e'};color:white;padding:14px 28px;border-radius:40px;font-weight:600;font-size:.9rem;position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;`;
  setTimeout(() => t.style.display = 'none', 3000);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ==================== AUTHORIZED FETCH ====================
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: 'Bearer ' + token })
  };
}

// GET ke liye retry safe hai
async function fetchGET(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = 'auth.html';
          return;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      return await res.json();
    } catch (err) {
      if (i === 2) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// POST/PUT/DELETE – NO retry
async function fetchMutation(url, method, body = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const token = localStorage.getItem('token');
    // For FormData, don't set Content-Type; only add Authorization if token exists
    const headers = body instanceof FormData
      ? (token ? { Authorization: `Bearer ${token}` } : {})
      : getAuthHeaders();

    const opts = {
      method,
      signal: controller.signal,
      headers
    };
    if (body) opts.body = body;

    const res = await fetch(url, opts);
    clearTimeout(timeout);
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'auth.html';
        return;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ==================== AUTH ====================
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || localStorage.getItem('imdad_user') || 'null');
  } catch (e) {
    return null;
  }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  const userData = getUser();
  const userId = window.getImdadUserId(userData);
  if (!userData || !userId) { window.location.href = 'auth.html'; return; }
  const role = (userData.role || '').toLowerCase().trim();
  if (role !== 'madrasa') {
    window.location.href = role === 'donor' ? 'donor-dashboard.html' : 'auth.html';
    return;
  }

  document.getElementById('sidebarName').textContent = userData.name || 'Madrasa';
  document.getElementById('sidebarAvatar').textContent = (userData.name || 'M').charAt(0).toUpperCase();
  document.getElementById('greeting').textContent = 'Welcome, ' + (userData.name || 'Madrasa') + '!';
  document.getElementById('sidebarRole').textContent = 'Madrasa Account';
  document.getElementById('userInfo').textContent = '📱 ' + (userData.phone || '');

  document.getElementById('sidebarNav').innerHTML = `
    <a href="#" onclick="switchTab('overviewTab')" class="nav-item active">📊 Overview</a>
    <a href="#" onclick="switchTab('needsTab')" class="nav-item">📝 My Needs</a>
    <a href="#" onclick="switchTab('donationsTab')" class="nav-item">💰 Donations</a>
    <a href="#" onclick="switchTab('profileTab')" class="nav-item">⚙️ Profile</a>`;

  switchTab('overviewTab');
  loadDashboard(userId);
  setupProfileForm();
  setupAddNeedModal();
});

window.switchTab = function(id) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const tab = document.getElementById(id);
  if (tab) tab.classList.add('active');
  const idx = { overviewTab:0, needsTab:1, donationsTab:2, profileTab:3 };
  const navs = document.querySelectorAll('.nav-item');
  if (navs[idx[id]]) navs[idx[id]].classList.add('active');
};

// Mobile sidebar
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('mobileOverlay').style.display = 'block';
});
window.closeMobileSidebar = () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobileOverlay').style.display = 'none';
};

window.logoutUser = function() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.replace('auth.html');
};

// ==================== LOAD DASHBOARD ====================
async function loadDashboard(userId) {
  try {
    const data = await fetchGET(`${API_BASE}/api/madrasas/${userId}`);
    if (!data?._id) return;

    document.getElementById('totalStudents').textContent = data.totalStudents || '--';
    document.getElementById('totalTeachers').textContent = data.totalTeachers || '--';

    // ✅ Update status badge
    const badge = document.getElementById('statusBadge');
    if (badge) {
      const isActive = data.status === 'active';
      badge.textContent = isActive ? '✅ Active' : '⏳ Pending';
      badge.className = isActive
        ? 'px-3 py-1 rounded-full text-xs font-bold bg-green-400/20 text-green-300'
        : 'px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-300';
    }

    if (data.upiId) loadDonations(data.upiId);
    loadNeeds(userId);
    fillProfile(data);
  } catch (e) {
    console.error('Dashboard load failed:', e);
  }
}

// ==================== DONATIONS ====================
async function loadDonations(upiId) {
  const list = document.getElementById('donationsList');
  if (!list) return;
  list.innerHTML = '<p style="text-align:center;padding:20px;">Loading...</p>';
  try {
    const donations = await fetchGET(`${API_BASE}/api/donations/madrasa/${encodeURIComponent(upiId)}`);
    const total = donations.reduce((s, d) => s + (d.amount || 0), 0);
    const el = document.getElementById('totalDonations');
    if (el) el.textContent = '₹' + total.toLocaleString('en-IN');

    if (!donations.length) {
      list.innerHTML = '<p style="text-align:center;padding:20px;">No donations yet</p>';
      return;
    }

    list.innerHTML = donations.map(d => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #f1f5f9;">
        <div>
          <strong>${escapeHTML(d.donorName || 'Anonymous')}</strong>
          <p style="font-size:0.75rem;">${new Date(d.date).toLocaleDateString('en-IN')}</p>
        </div>
        <div style="text-align:right;">
          <strong style="color:#0a5c2e;">₹${d.amount}</strong><br>
          <span style="font-size:0.75rem;color:${d.status==='Received'?'#16a34a':'#ea580c'};">${d.status}</span>
        </div>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = '<p style="text-align:center;padding:20px;color:#ef4444;">Failed to load donations</p>';
  }
}

// ==================== NEEDS ====================
async function loadNeeds(userId) {
  const grid = document.getElementById('needsGrid');
  const countEl = document.getElementById('activeNeedsCount');
  const needsCountSpan = document.getElementById('needsCount');
  if (!grid) return;
  grid.innerHTML = '<p style="text-align:center;padding:20px;">Loading...</p>';
  try {
    const needs = await fetchGET(`${API_BASE}/api/needs/madrasa/${userId}`);
    if (countEl) countEl.textContent = needs.length;
    if (needsCountSpan) needsCountSpan.textContent = needs.length + ' needs listed';
    if (!needs.length) {
      grid.innerHTML = '<p style="text-align:center;padding:40px;">📝 No needs yet.</p>';
      return;
    }

    grid.innerHTML = needs.map(n => {
      const cls = n.urgencyLevel >= 80 ? 'critical' : n.urgencyLevel >= 50 ? 'high' : 'normal';
      const statusColor = n.status === 'Fulfilled' ? '#16a34a' : '#ea580c';
      return `<div class="need-card ${cls}" style="position:relative;">
        <div style="position:absolute;top:8px;right:8px;display:flex;gap:8px;">
          <button onclick="editNeed('${n._id}')" style="color:#3b82f6;background:none;border:none;cursor:pointer;"><i class="fas fa-edit"></i></button>
          <button onclick="deleteNeed('${n._id}')" style="color:#ef4444;background:none;border:none;cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>
        <span class="badge">${getEmoji(n.category)} ${escapeHTML(n.category)}</span>
        <span style="font-size:0.75rem;margin-left:8px;color:${statusColor};">• ${n.status}</span>
        <h4 style="font-weight:700;">${escapeHTML(n.title)}</h4>
        <p style="font-size:0.85rem;">${escapeHTML(n.description || '')}</p>
        <div class="urgency-bar"><div class="urgency-fill ${cls}" style="width:${n.urgencyLevel}%"></div></div>
        <div style="display:flex;justify-content:space-between;">
          <span>Urgency: ${n.urgencyLevel}%</span>
          <span style="font-weight:700;color:#0a5c2e;">₹${n.cost || 0}</span>
        </div>
        <button onclick="toggleNeedStatus('${n._id}', '${n.status}')" style="margin-top:8px;font-size:0.75rem;">
          ${n.status === 'Fulfilled' ? 'Mark Active' : 'Mark Fulfilled'}
        </button>
      </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = '<p style="text-align:center;color:#ef4444;">Failed to load needs</p>';
  }
}

function getEmoji(c) {
  const e = { Food:'🍲', Clothes:'👕', Books:'📚', Building:'🏗️', Salary:'💼', Medical:'🏥' };
  return e[c] || '📦';
}

window.editNeed = async (needId) => {
  const newTitle = prompt("New title:"); if (!newTitle) return;
  const newDesc = prompt("New description:");
  const newCost = prompt("New cost ₹:");
  try {
    await fetchMutation(`${API_BASE}/api/needs/${needId}`, 'PUT', JSON.stringify({
      title: newTitle, description: newDesc || '', cost: parseInt(newCost) || 0
    }));
    showToast('✅ Need updated!');
    loadNeeds(window.getImdadUserId(getUser()));
  } catch (err) { showToast(err.message, true); }
};

window.deleteNeed = async (needId) => {
  if (!confirm('Delete this need?')) return;
  try {
    await fetchMutation(`${API_BASE}/api/needs/${needId}`, 'DELETE');
    showToast('🗑️ Need deleted!');
    loadNeeds(window.getImdadUserId(getUser()));
  } catch (err) { showToast(err.message, true); }
};

window.toggleNeedStatus = async (needId, currentStatus) => {
  const newStatus = currentStatus === 'Fulfilled' ? 'Active' : 'Fulfilled';
  try {
    await fetchMutation(`${API_BASE}/api/needs/${needId}`, 'PUT', JSON.stringify({ status: newStatus }));
    showToast(`✅ Marked as ${newStatus}!`);
    loadNeeds(window.getImdadUserId(getUser()));
  } catch (err) { showToast(err.message, true); }
};

// ==================== PROFILE ====================
function fillProfile(d) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('pName', d.madrasaName); set('pMohtamim', d.mohtamim); set('pPhone', d.phone);
  set('pDistrict', d.district); set('pUpi', d.upiId); set('pAddress', d.address);
  set('pState', d.state); set('pStudents', d.totalStudents); set('pTeachers', d.totalTeachers);
  set('pMonthlyExpense', d.monthlyExpense);
}

function setupProfileForm() {
  document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      madrasaName: document.getElementById('pName')?.value,
      mohtamim: document.getElementById('pMohtamim')?.value,
      phone: document.getElementById('pPhone')?.value,
      district: document.getElementById('pDistrict')?.value,
      upiId: document.getElementById('pUpi')?.value,
      address: document.getElementById('pAddress')?.value || '',
      state: document.getElementById('pState')?.value || '',
      totalStudents: document.getElementById('pStudents')?.value || '',
      totalTeachers: document.getElementById('pTeachers')?.value || '',
      monthlyExpense: document.getElementById('pMonthlyExpense')?.value || ''
    };
    try {
      await fetchMutation(`${API_BASE}/api/madrasas/${window.getImdadUserId(getUser())}`, 'PUT', JSON.stringify(data));
      showToast('✅ Profile saved!');
    } catch (err) { showToast(err.message, true); }
  });
}

// ==================== NEED MODAL ====================
window.openAddNeedModal = () => document.getElementById('addNeedModal')?.classList.add('active');
window.closeAddNeedModal = () => document.getElementById('addNeedModal')?.classList.remove('active');

function setupAddNeedModal() {
  document.getElementById('needUrgency')?.addEventListener('input', function() {
    document.getElementById('urgencyValue').textContent = this.value + '%';
  });
  document.getElementById('addNeedForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const needData = {
      madrasaId: window.getImdadUserId(getUser()),
      title: document.getElementById('needTitle').value,
      category: document.getElementById('needCategory').value,
      cost: parseInt(document.getElementById('needCost').value) || 0,
      urgencyLevel: parseInt(document.getElementById('needUrgency').value),
      description: document.getElementById('needDescription')?.value || ''
    };
    const btn = document.getElementById('saveNeedBtn');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
      await fetchMutation(`${API_BASE}/api/needs`, 'POST', JSON.stringify(needData));
      showToast('✅ Need added!');
      closeAddNeedModal();
      e.target.reset();
      loadNeeds(window.getImdadUserId(getUser()));
    } catch (err) { showToast(err.message, true); }
    finally { btn.disabled = false; btn.textContent = '✅ Save Need'; }
  });
}