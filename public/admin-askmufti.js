var API_BASE = window.IMDAD_API_BASE;

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.cssText = `display:block;background:${err ? '#dc2626' : '#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;`;
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

let isUserEditing = false;
let cachedQuestions = []; // ✅ blur check ke liye original data store

function getAuthHeaders() {
  const token = sessionStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? 'Bearer ' + token : ''
  };
}

async function checkAuth() {
  if (sessionStorage.getItem('admin_logged') !== 'true') {
    document.body.innerHTML =
      '<div style="text-align:center;padding:100px;"><h2>🔐 Admin access required</h2><a href="admin-panel.html">Go to Admin</a></div>';
    return false;
  }
  return true;
}

async function loadQuestions() {
  const container = document.getElementById('questionsContainer');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/askmufti`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed');
    const questions = await res.json();

    // ✅ store original data for blur comparison
    cachedQuestions = questions;

    // stats
    const totalEl = document.getElementById('totalQuestions');
    const pendingEl = document.getElementById('pendingQuestions');
    const answeredEl = document.getElementById('answeredQuestions');
    const badgeEl = document.getElementById('questionCount');
    if (totalEl) totalEl.textContent = questions.length;
    if (pendingEl) pendingEl.textContent = questions.filter(q => q.status === 'pending').length;
    if (answeredEl) answeredEl.textContent = questions.filter(q => q.status === 'answered').length;
    if (badgeEl) badgeEl.textContent = questions.length + ' Questions';

    if (!questions.length) {
      container.innerHTML = '<div class="empty">📭 No questions received yet.</div>';
      return;
    }

    container.innerHTML = questions.map(q => `
      <div class="question-card ${q.status === 'answered' ? 'answered' : ''}" data-id="${q._id}">
        <div class="q-header">
          <div>
            <span class="q-name">${escapeHTML(q.name)}</span>
            <span class="q-meta"> • ${escapeHTML(q.email)}</span>
            <span class="q-category">${escapeHTML(q.category)}</span>
          </div>
          <span class="q-meta">${new Date(q.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
        </div>

        <div class="q-text">❓ <strong>Q:</strong> ${escapeHTML(q.question)}</div>

        ${q.answer ? `
          <div style="background:#f0fdf4;padding:10px;border-radius:8px;margin-bottom:8px;">
            ✅ <strong>Answered:</strong> ${escapeHTML(q.answer)}
          </div>
        ` : ''}

        <textarea id="answer-${q._id}" placeholder="Type your answer here as Mufti..." class="answer-area">${escapeHTML(q.answer || '')}</textarea>

        <div class="btn-row">
          <button class="btn-save" onclick="saveAnswer('${q._id}')">💾 ${q.answer ? 'Update Answer' : 'Submit Answer'}</button>
          ${q.answer ? `<button class="btn-clear" onclick="clearAnswer('${q._id}')">🗑️ Clear</button>` : ''}
        </div>
      </div>
    `).join('');

    // ✅ Editing detection — blur pe check karo ki koi unsaved changes to nahi
    document.querySelectorAll('.answer-area').forEach(ta => {
      ta.addEventListener('input', () => { isUserEditing = true; });
      ta.addEventListener('blur', () => {
        // Check if ALL textareas match original answers
        const allClean = [...document.querySelectorAll('.answer-area')].every(area => {
          const qId = area.id.replace('answer-', '');
          const q = cachedQuestions.find(q => q._id === qId);
          return q && area.value === (q.answer || '');
        });
        isUserEditing = !allClean;
      });
    });

  } catch (err) {
    container.innerHTML = '<div class="empty">❌ Failed to load questions. Please check backend / admin login.</div>';
  }
}

window.saveAnswer = async function(questionId) {
  const textarea = document.getElementById('answer-' + questionId);
  if (!textarea) return;

  const answer = textarea.value.trim();
  if (!answer) return showToast('Please type an answer', true);

  try {
    const res = await fetch(`${API_BASE}/api/admin/askmufti/${questionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answer })
    });

    if (!res.ok) throw new Error('Failed');
    showToast('✅ Answer saved!');
    isUserEditing = false;
    loadQuestions();
  } catch (err) {
    showToast('Network error. Try again.', true);
  }
};

window.clearAnswer = async function(questionId) {
  if (!confirm('Clear this answer?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/askmufti/${questionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answer: '' })
    });

    if (!res.ok) throw new Error('Failed');
    showToast('Answer cleared');
    isUserEditing = false;
    loadQuestions();
  } catch (err) {
    showToast('Network error', true);
  }
};

(async function() {
  if (await checkAuth()) {
    loadQuestions();
    setInterval(() => {
      if (!isUserEditing) loadQuestions();
    }, 30000);
  }
})();