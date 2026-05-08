// ==================== AUTH PAGE JS ====================
const AUTH_API = 'https://imdad-backend-1.onrender.com';

function showToast(message, isError = false) {
  const toast = document.getElementById('authToast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.cssText = `display:block;background:${isError?'#dc2626':'#0a5c2e'};color:white;padding:14px 28px;border-radius:12px;font-weight:600;font-size:0.9rem;text-align:center;`;
  setTimeout(() => toast.style.display = 'none', 4000);
}

async function jsonFetch(endpoint, options = {}) {
  const res = await fetch(`${AUTH_API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

async function formFetch(endpoint, formData) {
  const res = await fetch(`${AUTH_API}${endpoint}`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<span style="display:inline-block;width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;"></span> Processing...';
    button.style.opacity = '0.7';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText;
    button.style.opacity = '1';
  }
}

const s = document.createElement('style');
s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(s);

// ==================== LOGIN FORM ====================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = e.target.phone.value.trim(), password = e.target.password.value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    if (!phone||!password) return showToast('Fill all fields', true);
    setButtonLoading(btn, true);
    try {
      const data = await jsonFetch('/api/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
      localStorage.setItem('imdad_user', JSON.stringify({ userId: data.userId, name: data.name, phone: data.phone, role: data.role }));
      showToast('✅ Login successful!');
      setTimeout(() => {
        // DONO madarsa-dashboard.html par jayenge, dashboard.js role check karega
        location.href = 'madarsa-dashboard.html';
      }, 1000);
    } catch (err) { showToast(err.message || 'Login failed', true); }
    finally { setButtonLoading(btn, false); }
  });
}

// ==================== DONOR REGISTRATION ====================
const donorForm = document.getElementById('donorForm');
if (donorForm) {
  donorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = e.target.fullName.value.trim(), phone = e.target.phone.value.trim(), password = e.target.password.value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    if (!fullName||!phone||!password) return showToast('Fill all fields', true);
    if (phone.length < 10) return showToast('Valid phone required', true);
    if (password.length < 4) return showToast('Password min 4 chars', true);
    setButtonLoading(btn, true);
    try {
      await jsonFetch('/api/register/donor', { method: 'POST', body: JSON.stringify({ fullName, phone, password }) });
      showToast('✅ Registered! Please login.');
      e.target.reset();
      setTimeout(() => showSection('login-section', 'Welcome back'), 1500);
    } catch (err) { showToast(err.message || 'Registration failed', true); }
    finally { setButtonLoading(btn, false); }
  });
}

// ==================== MADRASA REGISTRATION ====================
const madrasaForm = document.getElementById('madrasaForm');
if (madrasaForm) {
  madrasaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const madrasaName = e.target.madrasaName.value.trim();
    const mohtamim = e.target.mohtamim.value.trim();
    const phone = e.target.phone.value.trim();
    const district = e.target.district.value.trim();
    const upi = e.target.upi.value.trim();
    const password = e.target.password.value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    const aadhaarDoc = e.target.aadhaarDoc.files[0];
    const panDoc = e.target.panDoc.files[0];
    const madrasaProof = e.target.madrasaProof.files[0];
    
    if (!madrasaName||!mohtamim||!phone||!district||!upi||!password) return showToast('Fill all fields', true);
    if (phone.length < 10) return showToast('Valid phone required', true);
    if (!upi.includes('@')) return showToast('Valid UPI ID required', true);
    if (password.length < 4) return showToast('Password min 4 chars', true);
    if (!aadhaarDoc || !panDoc || !madrasaProof) return showToast('Upload all KYC documents', true);
    
    setButtonLoading(btn, true);
    try {
      const formData = new FormData();
      formData.append('madrasaName', madrasaName);
      formData.append('mohtamim', mohtamim);
      formData.append('phone', phone);
      formData.append('district', district);
      formData.append('upi', upi);
      formData.append('password', password);
      formData.append('aadhaarDoc', aadhaarDoc);
      formData.append('panDoc', panDoc);
      formData.append('madrasaProof', madrasaProof);
      
      await formFetch('/api/register/madrasa', formData);
      showToast('✅ Application submitted! Verification pending.');
      e.target.reset();
      setTimeout(() => showSection('login-section', 'Welcome back'), 2000);
    } catch (err) {
      showToast(err.message || 'Registration failed', true);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

// ==================== AUTO CHECK LOGIN (SIRF AUTH PAGE PE) ====================
function checkExistingLogin() {
  if (window.location.pathname.includes('auth.html')) {
    const userData = JSON.parse(localStorage.getItem('imdad_user') || 'null');
    if (userData && userData.userId) {
      location.href = 'madarsa-dashboard.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', checkExistingLogin);