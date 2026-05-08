// ==================== CONTACT JS ====================
const API_BASE = 'https://imdad-backend-1.onrender.com';

function showToast(msg, err = false) {
  const t = document.getElementById('toast');
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

document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();
  const btn = e.target.querySelector('.submit-btn');
  
  if (!name || !email || !subject || !message) return showToast('Fill all required fields', true);
  
  btn.textContent = 'Sending...';
  btn.disabled = true;
  
  try {
    // Save via API
    await fetchAPI('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, subject, message })
    });
    
    document.getElementById('successMsg').style.display = 'block';
    e.target.reset();
    showToast('✅ Message sent!');
    
    setTimeout(() => {
      document.getElementById('successMsg').style.display = 'none';
    }, 4000);
  } catch (err) {
    // Fallback: save locally
    const contacts = JSON.parse(localStorage.getItem('imdad_contacts') || '[]');
    contacts.push({ name, email, phone, subject, message, date: new Date().toISOString() });
    localStorage.setItem('imdad_contacts', JSON.stringify(contacts));
    
    document.getElementById('successMsg').style.display = 'block';
    e.target.reset();
    showToast('✅ Message saved locally!');
  }
  
  btn.textContent = 'Send Message';
  btn.disabled = false;
});