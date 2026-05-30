// ==================== DONATION FORM JS (FINAL – FULLY TESTED, SECURE DEEP LINK) ====================
var API_BASE = window.IMDAD_API_BASE;

// ==================== UTILITIES ====================
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.cssText = `display:block;background:${err ? '#dc2626' : '#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,0.15);`;
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

// GET ke liye safe retry wrapper (POST me kabhi use mat karna)
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

// ==================== INITIALISE FROM URL ====================
const urlParams = new URLSearchParams(window.location.search);
let madrasaName = urlParams.get('name') || 'Madrasa';
let madrasaUpi = urlParams.get('upi') || '';
let madrasaNeed = urlParams.get('need') || 'General Support';
let selectedAmount = 101;

document.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.getElementById('madrasaName');
  const upiEl = document.getElementById('madrasaUpi');
  const needEl = document.getElementById('madrasaNeed');
  if (nameEl) nameEl.textContent = madrasaName;
  if (upiEl) upiEl.textContent = 'UPI: ' + (madrasaUpi || 'Not Available');
  if (needEl) needEl.textContent = 'Need: ' + madrasaNeed;

  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = +btn.dataset.amount;
      const customInput = document.getElementById('customAmount');
      if (customInput) customInput.value = '';
    };
  });

  const customAmountInput = document.getElementById('customAmount');
  if (customAmountInput) {
    customAmountInput.addEventListener('input', function() {
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      selectedAmount = +this.value || null;
    });
  }

  const donationForm = document.getElementById('donationForm');
  if (!donationForm) return;

  donationForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('donorName').value.trim();
  const email = document.getElementById('donorEmail').value.trim();
  const phone = document.getElementById('donorPhone').value.trim();
  const type = document.getElementById('donationType').value;
  const intention = document.getElementById('intention').value.trim();
  const amount = selectedAmount || +document.getElementById('customAmount').value;

  // Validation
  if (!name) return showToast('Enter your name', true);
  if (phone && !/^\+?[\d\s\-]{10,15}$/.test(phone.replace(/\s+/g, ''))) return showToast('Enter valid phone number', true);
  if (!type) return showToast('Select donation type', true);
  if (!amount || amount <= 0) return showToast('Enter valid amount', true);
  if (!madrasaUpi || !/^[\w.\-]{2,}@[\w]{2,}$/.test(madrasaUpi)) return showToast('Invalid UPI ID format', true);

  // Secure UPI deep link (sab parameters encoded)
  const upiLink = `upi://pay?pa=${encodeURIComponent(madrasaUpi)}&pn=${encodeURIComponent(madrasaName)}&am=${amount}&tn=Imdad_Donation&cu=INR`;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

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
    status: 'Pending Verification'
  };

  // We do NOT save to database here. We wait for user to click "I have completed payment"
  showToast('Opening UPI for payment...');

  // UI update: hide submit button, show post-submit actions
  const postSubmitDiv = document.getElementById('postSubmitActions');
  if (postSubmitDiv) postSubmitDiv.style.display = 'block';
  if (submitBtn) submitBtn.style.display = 'none';

  // Generate QR Code
  const qrContainer = document.getElementById('qrcode');
  if (qrContainer && typeof QRCode !== 'undefined') {
    qrContainer.innerHTML = '';
    setTimeout(() => {
      new QRCode(qrContainer, {
        text: upiLink,
        width: 180,
        height: 180,
        colorDark : "#0a5c2e",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });
    }, 100);
  }

  const doneBtn = document.getElementById('paymentDoneBtn');
  const cancelBtn = document.getElementById('paymentCancelBtn');

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      showToast('Payment cancelled.');
      setTimeout(() => location.reload(), 1000);
    };
  }

  if (doneBtn) {
    doneBtn.style.display = 'inline-block';
    doneBtn.onclick = async () => {
      doneBtn.disabled = true;
      doneBtn.textContent = 'Verifying...';
      if (cancelBtn) cancelBtn.style.display = 'none';
      
      let realReceiptNo = timestamp;
      try {
        const res = await fetchAPI('/api/donations', {
          method: 'POST',
          body: JSON.stringify(donationData)
        });
        if (res && res.receiptNo) realReceiptNo = res.receiptNo;
      } catch (err) {
        // Offline fallback
        const pending = JSON.parse(localStorage.getItem('imdad_pending_donations') || '[]');
        pending.push(donationData);
        localStorage.setItem('imdad_pending_donations', JSON.stringify(pending));
      }

      window.location.href = `ThankYouPage.html?madrasa=${encodeURIComponent(madrasaName)}&amount=${amount}&type=${type}&receipt=${realReceiptNo}&status=pending`;
    };
  }

  const fallbackLink = document.getElementById('upiFallbackLink');
  if (fallbackLink) {
    fallbackLink.href = upiLink;
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    if (fallbackLink) fallbackLink.style.display = 'inline-block';
  }
  });
});