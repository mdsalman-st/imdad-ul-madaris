// ==================== CONTACT JS (FIXED & SECURE) ====================
(function() {
  var API_BASE = window.IMDAD_API_BASE;

  function showToast(msg, err = false) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.cssText = `display:block;background:${err ? '#dc2626' : '#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.15);`;
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
        if (res.status === 401 && token) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          showToast('Session expired. Please login again.', true);
          setTimeout(() => location.href = 'auth.html', 1000);
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
      }
      return await res.json();
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();
    const btn = e.target.querySelector('.submit-btn');

    if (!name || !email || !subject || !message) {
      return showToast('Please fill all required fields', true);
    }
    if (phone && !/^\d{10,15}$/.test(phone)) {
      return showToast('Enter valid phone number (10-15 digits)', true);
    }

    btn.textContent = 'Sending...';
    btn.disabled = true;

    const contactData = { name, email, phone: phone || 'Not provided', subject, message };

    try {
      await fetchAPI('/api/contact', {
        method: 'POST',
        body: JSON.stringify(contactData)
      });
      showToast('✅ Message sent successfully!');
      e.target.reset();
      const successEl = document.getElementById('successMsg');
      if (successEl) {
        successEl.style.display = 'block';
        setTimeout(() => { successEl.style.display = 'none'; }, 4000);
      }
    } catch (err) {
      const contacts = JSON.parse(localStorage.getItem('imdad_contacts') || '[]');
      contacts.push({ ...contactData, date: new Date().toISOString() });
      localStorage.setItem('imdad_contacts', JSON.stringify(contacts));
      showToast('Network issue. Message saved locally.', true);
      e.target.reset();
      const successEl = document.getElementById('successMsg');
      if (successEl) {
        successEl.style.display = 'block';
        setTimeout(() => { successEl.style.display = 'none'; }, 4000);
      }
    } finally {
      btn.textContent = 'Send Message';
      btn.disabled = false;
    }
  });
})();