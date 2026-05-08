// ==================== MLIST PAGE JS ====================
const API_BASE = 'https://imdad-backend-1.onrender.com';

// Global state
let allMadrasas = [];
let currentSearch = "";
let currentState = "";

// Toast
function showToast(message, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:30px;font-weight:600;z-index:2000;display:none;color:white;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = isError ? '#dc2626' : '#0a5c2e';
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// API Fetch
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Fetch madrasas from backend
async function loadMadrasas() {
  const grid = document.getElementById('madrasaGrid');
  grid.innerHTML = `
    <div style="text-align:center;padding:60px;grid-column:1/-1;">
      <div style="font-size:2rem;margin-bottom:12px;animation:pulse 1.5s infinite;">🕌</div>
      <p style="color:#64748b;">Loading madrasas...</p>
    </div>
  `;
  
  try {
    const madrasas = await fetchAPI('/api/madrasas');
    allMadrasas = madrasas.map(m => ({
      id: m._id,
      name: m.madrasaName,
      district: m.district,
      state: m.state || 'Bihar',
      upiId: m.upiId,
      needReason: m.needReason || 'Needs your support',
      urgencyLevel: m.urgencyLevel || 80,
      lat: m.lat || 25.5 + Math.random() * 2,
      lng: m.lng || 85.0 + Math.random() * 3
    }));
    renderMadrasas();
    showToast(`${allMadrasas.length} madrasas loaded`);
  } catch (error) {
    grid.innerHTML = `
      <div style="text-align:center;padding:60px;grid-column:1/-1;">
        <div style="font-size:3rem;margin-bottom:16px;">🕌</div>
        <h3 style="color:#0a5c2e;margin-bottom:8px;">Madrasas Coming Soon</h3>
        <p style="color:#64748b;margin-bottom:20px;">No verified madrasas yet. Please check back later.</p>
        <a href="auth.html" style="display:inline-block;background:#0a5c2e;color:white;padding:12px 28px;border-radius:30px;text-decoration:none;font-weight:600;">Register Your Madrasa</a>
      </div>
    `;
    document.getElementById('resultsCount').textContent = '0 madrasas found';
  }
}

// Filter madrasas
function filterMadrasas() {
  let filtered = [...allMadrasas];

  if (currentSearch) {
    const search = currentSearch.toLowerCase();
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(search) || 
      m.district.toLowerCase().includes(search) ||
      m.state.toLowerCase().includes(search)
    );
  }

  if (currentState) {
    filtered = filtered.filter(m => m.state === currentState);
  }

  filtered.sort((a, b) => b.urgencyLevel - a.urgencyLevel);
  return filtered;
}

// Render card
function renderCard(m) {
  return `
    <div class="madrasa-card" onclick="window.location.href='madrasa-detail.html?id=${m.id}'" style="cursor:pointer;animation:fadeIn 0.4s ease;">
      <div class="card-img" style="background-image: url('https://source.unsplash.com/featured/400x140?mosque,islam,${encodeURIComponent(m.district)}')"></div>
      <div class="card-content">
        <div class="madrasa-name">${m.name}</div>
        <div class="district">📍 ${m.district}, ${m.state}</div>
        <div class="need-reason">⚠️ ${m.needReason}</div>
        <button class="donate-btn" onclick="event.stopPropagation();" data-upi="${m.upiId}" data-name="${m.name}" data-id="${m.id}">
          Donate Now
        </button>
      </div>
    </div>
  `;
}

// Render grid
function renderMadrasas() {
  const filtered = filterMadrasas();
  const grid = document.getElementById('madrasaGrid');
  const resultsCount = document.getElementById('resultsCount');

  resultsCount.innerHTML = `<strong>${filtered.length}</strong> madrasas found ${currentState ? 'in ' + currentState : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center;padding:60px;grid-column:1/-1;">
        <div style="font-size:3rem;margin-bottom:12px;">🔍</div>
        <p style="color:#64748b;font-size:1rem;">No madrasas found matching your search.</p>
        <p style="color:#94a3b8;font-size:0.85rem;margin-top:4px;">Try different keywords or clear filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(renderCard).join('');
  attachDonateEvents();
}

// Donate button events
function attachDonateEvents() {
  document.querySelectorAll('.donate-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openDonationModal(btn.dataset.upi, btn.dataset.name, btn.dataset.id);
    };
  });
}

// ==================== DONATION MODAL ====================
let currentUpi = "", currentName = "", currentId = "", selectedAmount = 101;
const modal = document.getElementById('donationModal');

function openDonationModal(upi, name, id) {
  currentUpi = upi;
  currentName = name;
  currentId = id;
  selectedAmount = 101;
  document.getElementById('modalName').innerText = name;
  document.getElementById('modalUpi').innerHTML = `💳 UPI: ${upi}`;
  document.getElementById('customAmount').value = '';
  document.getElementById('qrContainer').innerHTML = '';
  renderAmountOptions();
  modal.style.display = 'flex';
}

function renderAmountOptions() {
  const amounts = [51, 101, 501, 1001, 2001, 5001];
  const container = document.getElementById('amountOptions');
  container.innerHTML = amounts.map(am => `
    <div class="amount-opt ${am === selectedAmount ? 'active' : ''}" data-amount="${am}">₹${am}</div>
  `).join('');
  
  document.querySelectorAll('.amount-opt').forEach(opt => {
    opt.onclick = () => {
      selectedAmount = parseInt(opt.dataset.amount);
      document.getElementById('customAmount').value = '';
      document.querySelectorAll('.amount-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    };
  });
}

document.getElementById('proceedDonateBtn').addEventListener('click', async () => {
  let amount = document.getElementById('customAmount').value;
  if (amount && parseFloat(amount) > 0) selectedAmount = parseFloat(amount);
  if (!selectedAmount || selectedAmount <= 0) {
    showToast('Please select or enter amount', true);
    return;
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(currentUpi)}&pn=${encodeURIComponent(currentName)}&am=${selectedAmount}&cu=INR&mode=02`;
  const qrDiv = document.getElementById('qrContainer');
  qrDiv.innerHTML = `
    <div id="qrcode" style="display:inline-block;"></div>
    <p style="margin-top:10px;font-weight:600;">₹${selectedAmount}</p>
    <a href="${upiLink}" style="display:inline-block;margin-top:8px;background:#0a5c2e;color:white;padding:12px 28px;border-radius:30px;text-decoration:none;font-weight:600;">Open UPI App</a>
  `;
  
  setTimeout(() => {
    if (typeof QRCode !== 'undefined') {
      new QRCode(document.getElementById("qrcode"), { text: upiLink, width: 160, height: 160 });
    }
  }, 200);

  // Log donation
  try {
    await fetchAPI('/api/donations', {
      method: 'POST',
      body: JSON.stringify({
        donorName: 'Anonymous Donor',
        donorEmail: 'donor@imdad.com',
        donorPhone: '',
        madrasaName: currentName,
        madrasaUpi: currentUpi,
        amount: selectedAmount,
        donationType: 'General',
        intention: 'Education Support'
      })
    });
  } catch (error) {
    console.log('Donation log:', error);
  }
});

// Close modal
document.getElementById('closeModalBtn').addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

// ==================== EVENT LISTENERS ====================
document.getElementById('searchInput').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderMadrasas();
});

document.getElementById('stateFilter').addEventListener('change', (e) => {
  currentState = e.target.value;
  renderMadrasas();
});

// ==================== ANIMATIONS ====================
const animStyle = document.createElement('style');
animStyle.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(animStyle);

// ==================== INIT ====================
loadMadrasas();