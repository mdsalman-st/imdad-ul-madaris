// ==================== DONATION FORM JS ====================
const API_BASE = 'https://imdad-backend-1.onrender.com';

function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.cssText = `display:block;background:${err?'#dc2626':'#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;`;
  setTimeout(() => t.style.display = 'none', 3000);
}

async function fetchAPI(url, opts = {}) {
  const res = await fetch(API_BASE + url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// Get URL params
const urlParams = new URLSearchParams(window.location.search);
const madrasaName = urlParams.get('name') || 'Madrasa';
const madrasaUpi = urlParams.get('upi') || '';
const madrasaNeed = urlParams.get('need') || 'General Support';

document.getElementById('madrasaName').textContent = madrasaName;
document.getElementById('madrasaUpi').textContent = 'UPI: ' + (madrasaUpi || 'Not Available');
document.getElementById('madrasaNeed').textContent = 'Need: ' + madrasaNeed;

let selectedAmount = 101;

// Amount buttons
document.querySelectorAll('.amount-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedAmount = +btn.dataset.amount;
    const customInput = document.getElementById('customAmount');
    if(customInput) customInput.value = '';
  };
});

const customAmountInput = document.getElementById('customAmount');
if (customAmountInput) {
    customAmountInput.addEventListener('input', function() {
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      selectedAmount = +this.value || null;
    });
}

// Submit
document.getElementById('donationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('donorName').value.trim();
  const email = document.getElementById('donorEmail').value.trim();
  const phone = document.getElementById('donorPhone').value.trim();
  const type = document.getElementById('donationType').value;
  const intention = document.getElementById('intention').value.trim();
  const amount = selectedAmount || +document.getElementById('customAmount').value;
  
  // 1. Strict Validations
  if (!name) return showToast('Enter your name', true);
  if (phone.length < 10) return showToast('Enter a valid 10-digit phone number', true);
  if (!type) return showToast('Select donation type', true);
  if (!amount || amount <= 0) return showToast('Enter a valid amount', true);
  if (!madrasaUpi || !madrasaUpi.includes('@')) return showToast('Invalid Madrasa UPI ID. Payment cannot proceed.', true);
  
  // 2. Generate UPI link (tn = transaction note added for tracking)
  const upiLink = `upi://pay?pa=${encodeURIComponent(madrasaUpi)}&pn=${encodeURIComponent(madrasaName)}&am=${amount}&tn=Donation_Imdad_${Date.now()}&cu=INR&mode=02`;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if(submitBtn) submitBtn.disabled = true;

  // Transaction Data Object
  const timestamp = new Date().toISOString();
  const donationData = {
    donorName: name,
    donorEmail: email || 'anonymous@imdad.com',
    donorPhone: phone,
    madrasaName,
    madrasaUpi,
    amount,
    donationType: type,
    intention,
    timestamp: timestamp,
    status: 'Pending' // Initial status
  };
  
  try {
    // 3. Try Saving to MongoDB (Render Backend)
    await fetchAPI('/api/donations', {
      method: 'POST',
      body: JSON.stringify(donationData)
    });
    
    document.getElementById('successMsg').style.display = 'block';
    showToast('✅ Redirecting to UPI App...');

  } catch (err) {
    console.error("Backend save failed:", err);
    
    // 4. Offline Fallback (Save to LocalStorage if Backend fails)
    const pendingDonations = JSON.parse(localStorage.getItem('imdad_pending_donations') || '[]');
    pendingDonations.push(donationData);
    localStorage.setItem('imdad_pending_donations', JSON.stringify(pendingDonations));
    
    document.getElementById('successMsg').style.display = 'block';
    showToast('Network issue. Proceeding to payment...', true);
  } finally {
    if(submitBtn) submitBtn.disabled = false;
  }

  // 5. The Magic Redirects (Your Idea)
  // Pehle UPI app open karo
  setTimeout(() => { 
      window.location.href = upiLink; 
  }, 1500);

  // Fir 12 seconds baad Thank You page par bhej do
  setTimeout(() => { 
      window.location.href = `ThankYouPage.html?madrasa=${encodeURIComponent(madrasaName)}&amount=${amount}&type=${type}&receipt=${timestamp}`;
  }, 12000);
});