// ==================== MADRASA DETAIL JS ====================
const API_BASE = 'https://imdad-backend-1.onrender.com';
const urlParams = new URLSearchParams(window.location.search);
const madrasaId = urlParams.get('id');

// Toast
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.cssText = `display:block;background:${err?'#dc2626':'#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;`;
  setTimeout(() => t.style.display = 'none', 3000);
}

// API
async function fetchAPI(url, opts = {}) {
  const res = await fetch(API_BASE + url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// Load Madrasa
async function loadMadrasa() {
  const container = document.getElementById('madrasaContent');
  
  if (!madrasaId) {
    container.innerHTML = '<div style="text-align:center;padding:60px;"><h3 style="color:#dc2626;">No madrasa specified</h3><a href="mlist.html">Browse Madrasas</a></div>';
    return;
  }
  
  try {
    const m = await fetchAPI('/api/madrasas/' + madrasaId);
    renderMadrasa(m);
  } catch (err) {
    // Fallback demo data
    const demo = {
      madrasaName: 'Madrasa',
      district: 'Unknown',
      state: '',
      upiId: 'unknown@upi',
      needReason: 'Needs support',
      urgencyLevel: 80,
      description: 'Details coming soon.',
      mohtamim: '--',
      phone: '--',
      totalStudents: '--',
      totalTeachers: '--'
    };
    renderMadrasa(demo);
    showToast('Showing sample data', true);
  }
}

function renderMadrasa(m) {
  const container = document.getElementById('madrasaContent');
  const isUrgent = (m.urgencyLevel || 80) > 90;
  
  container.innerHTML = `
    <div class="hero-section">
      <div class="hero-cover" style="background-image: url('https://images.unsplash.com/photo-1584551246679-258d75b4e8e3?w=1200')"></div>
      <div class="hero-content">
        ${isUrgent ? '<div class="madrasa-badge"><i class="fas fa-exclamation-triangle"></i> URGENT</div>' : ''}
        <h1 class="madrasa-name">${m.madrasaName}</h1>
        <div class="madrasa-meta">
          <span class="meta-chip"><i class="fas fa-map-marker-alt"></i> ${m.district}, ${m.state || 'India'}</span>
          ${m.mohtamim ? `<span class="meta-chip"><i class="fas fa-user"></i> ${m.mohtamim}</span>` : ''}
          ${m.phone ? `<span class="meta-chip"><i class="fas fa-phone"></i> ${m.phone}</span>` : ''}
        </div>
        <div class="need-alert">
          <p><i class="fas fa-hand-holding-heart"></i> <strong>Need:</strong> ${m.needReason || 'General support'}</p>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div>
        <div class="card">
          <div class="card-title"><i class="fas fa-info-circle"></i> About Madrasa</div>
          <p style="color:#475569;line-height:1.7;margin-bottom:20px;">${m.description || 'No description available.'}</p>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">UPI ID</div><div class="info-value">${m.upiId}</div></div>
            <div class="info-item"><div class="info-label">Phone</div><div class="info-value">${m.phone || '--'}</div></div>
            <div class="info-item"><div class="info-label">Mohtamim</div><div class="info-value">${m.mohtamim || '--'}</div></div>
            <div class="info-item"><div class="info-label">District</div><div class="info-value">${m.district}, ${m.state || ''}</div></div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title"><i class="fas fa-images"></i> Gallery</div>
          <div class="gallery-grid">
            ${[1,2,3,4,5,6].map(i => `
              <div class="gallery-item" style="background-image: url('https://images.unsplash.com/photo-${1584551246679 + i}?w=300')"></div>
            `).join('')}
          </div>
        </div>
      </div>

      <div>
        <div class="stats-card">
          <div class="card-title"><i class="fas fa-chart-simple"></i> At a Glance</div>
          <div class="stat-item"><div class="stat-number">${m.totalStudents || '--'}</div><div class="stat-label">Students</div></div>
          <div class="stat-item"><div class="stat-number">${m.totalTeachers || '--'}</div><div class="stat-label">Teachers</div></div>
          <div class="stat-item"><div class="stat-number">${m.urgencyLevel || '--'}%</div><div class="stat-label">Urgency Level</div></div>
        </div>

        <div class="donation-card">
          <div class="card-title"><i class="fas fa-hand-holding-heart"></i> Donate Now</div>
          <div class="amount-buttons">
            <button class="amount-btn active" data-amount="101">₹101</button>
            <button class="amount-btn" data-amount="501">₹501</button>
            <button class="amount-btn" data-amount="1001">₹1,001</button>
          </div>
          <input type="number" class="custom-input" id="customAmount" placeholder="Custom amount (₹)">
          <button class="donate-btn" id="donateBtn"><i class="fas fa-rupee-sign"></i> Donate Now</button>
          <div class="share-section">
            <div class="share-icons">
              <a href="#" id="shareWa"><i class="fab fa-whatsapp"></i></a>
              <a href="#" id="shareTw"><i class="fab fa-twitter"></i></a>
              <a href="#" id="shareFb"><i class="fab fa-facebook-f"></i></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Amount buttons
  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('customAmount').value = '';
    };
  });

  // Donate button
  document.getElementById('donateBtn').onclick = () => {
    let amount = document.querySelector('.amount-btn.active')?.dataset.amount;
    const custom = document.getElementById('customAmount').value;
    if (custom && parseFloat(custom) > 0) amount = custom;
    if (!amount || parseFloat(amount) <= 0) return showToast('Enter valid amount', true);
    
    const upiLink = `upi://pay?pa=${encodeURIComponent(m.upiId)}&pn=${encodeURIComponent(m.madrasaName)}&am=${amount}&cu=INR`;
    document.getElementById('modalMadrasaName').textContent = m.madrasaName;
    document.getElementById('modalAmount').textContent = '₹' + amount;
    document.getElementById('upiLink').href = upiLink;
    document.getElementById('qrContainer').innerHTML = '<div id="qrCode"></div>';
    
    setTimeout(() => {
      if (typeof QRCode !== 'undefined') {
        new QRCode(document.getElementById('qrCode'), { text: upiLink, width: 180, height: 180 });
      }
    }, 200);
    
    document.getElementById('donationModal').classList.add('active');
    
    // Log donation
    fetchAPI('/api/donations', {
      method: 'POST',
      body: JSON.stringify({
        donorName: 'Anonymous',
        donorEmail: 'donor@imdad.com',
        madrasaName: m.madrasaName,
        madrasaUpi: m.upiId,
        amount: parseFloat(amount),
        donationType: 'General'
      })
    }).catch(() => {});
  };

  // Share
  const shareText = `Support ${m.madrasaName} - ${m.needReason}. Donate at Imdad ul Madaris`;
  document.getElementById('shareWa').onclick = (e) => { e.preventDefault(); window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`); };
  document.getElementById('shareTw').onclick = (e) => { e.preventDefault(); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`); };
  document.getElementById('shareFb').onclick = (e) => { e.preventDefault(); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`); };
}

// Close modal
window.closeDonationModal = () => document.getElementById('donationModal').classList.remove('active');
document.getElementById('donationModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeDonationModal(); });

// Start
loadMadrasa();