// ==================== ASK MUFTI JS (API-BASED, FINAL) ====================
var API_BASE = window.IMDAD_API_BASE;

// ==================== UTILITIES ====================
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.cssText = `display:block;background:${err ? '#dc2626' : '#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;`;
  setTimeout(() => t.style.display = 'none', 3000);
}

async function fetchAPI(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(API_BASE + url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...opts
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Something went wrong');
    }
    return await res.json();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ==================== SUBMIT QUESTION ====================
function setupAskForm() {
  const form = document.getElementById('askForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('askName').value.trim();
    const email = document.getElementById('askEmail').value.trim();
    const category = document.getElementById('askCategory').value;
    const question = document.getElementById('askQuestion').value.trim();
    const btn = e.target.querySelector('.submit-btn');

    if (!name || !email || !question) return showToast('Please fill all required fields', true);
    if (!email.includes('@')) return showToast('Enter a valid email address', true);

    btn.textContent = 'Submitting...';
    btn.disabled = true;

    try {
      await fetchAPI('/api/askmufti', {
        method: 'POST',
        body: JSON.stringify({ name, email, category, question })
      });

      showToast('✅ Question submitted! Mufti will answer soon.');
      e.target.reset();
      loadMyQuestions(email);
    } catch (err) {
      showToast(err.message || 'Network error. Please try again.', true);
    } finally {
      btn.textContent = 'Submit Question';
      btn.disabled = false;
    }
  });
}

// ==================== LOAD USER'S QUESTIONS ====================
async function loadMyQuestions(email) {
  const container = document.getElementById('questionsList');
  if (!container) return;

  if (!email) {
    container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">Enter your email to see your questions.</p>';
    return;
  }

  try {
    const data = await fetchAPI(`/api/askmufti?email=${encodeURIComponent(email)}`);
    const questions = Array.isArray(data) ? data : (data.questions || []);

    if (!questions.length) {
      container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">No questions yet. Ask your first question above.</p>';
      return;
    }

    container.innerHTML = questions.map(q => `
      <div class="qa-item">
        <div class="q">❓ ${escapeHTML(q.question)}</div>
        <div class="meta">${escapeHTML(q.category)} • ${new Date(q.createdAt || q.date).toLocaleDateString('en-IN')}</div>
        ${q.answer 
          ? `<div class="a">✅ ${escapeHTML(q.answer)}</div>` 
          : '<div class="pending">⏳ Waiting for Mufti\'s answer...</div>'
        }
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">Failed to load questions. Please try again.</p>';
  }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  setupAskForm();

  const emailInput = document.getElementById('askEmail');
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      if (email && email.includes('@')) loadMyQuestions(email);
    });
  }

  const container = document.getElementById('questionsList');
  if (container) {
    container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">Enter your email to see your previous questions.</p>';
  }
});