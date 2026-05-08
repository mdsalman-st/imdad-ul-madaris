// ==================== ADMIN ASK MUFTI JS ====================

function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.cssText = `display:block;background:${err?'#dc2626':'#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;`;
  setTimeout(() => t.style.display = 'none', 3000);
}

// Load all questions from localStorage
function loadQuestions() {
  const questions = JSON.parse(localStorage.getItem('askmufti_questions') || '[]');
  const container = document.getElementById('questionsContainer');
  
  // Update stats
  document.getElementById('totalQuestions').textContent = questions.length;
  document.getElementById('pendingQuestions').textContent = questions.filter(q => !q.answer).length;
  document.getElementById('answeredQuestions').textContent = questions.filter(q => q.answer).length;
  
  const countBadge = document.getElementById('questionCount');
  if (countBadge) countBadge.textContent = questions.length + ' Questions';
  
  if (questions.length === 0) {
    container.innerHTML = '<div class="empty">📭 No questions received yet.</div>';
    return;
  }
  
  container.innerHTML = questions.map((q, i) => `
    <div class="question-card ${q.answer ? 'answered' : ''}">
      <div class="q-header">
        <div>
          <span class="q-name">${q.name}</span>
          <span class="q-meta"> • ${q.email}</span>
          <span class="q-category">${q.category || 'General'}</span>
        </div>
        <span class="q-meta">${new Date(q.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      <div class="q-text">❓ <strong>Q:</strong> ${q.question}</div>
      ${q.answer ? `
        <div style="background:#f0fdf4;padding:10px;border-radius:8px;margin-bottom:8px;">
          ✅ <strong>Answered:</strong> ${q.answer}
        </div>
      ` : ''}
      <textarea id="answer-${i}" placeholder="Type your answer here as Mufti...">${q.answer || ''}</textarea>
      <div class="btn-row">
        <button class="btn-save" onclick="saveAnswer(${i})">💾 ${q.answer ? 'Update Answer' : 'Submit Answer'}</button>
        ${q.answer ? `<button class="btn-clear" onclick="clearAnswer(${i})">🗑️ Clear</button>` : ''}
        <button class="btn-delete" onclick="deleteQuestion(${i})" style="background:#fee2e2;color:#dc2626;margin-left:auto;">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

// Save answer
window.saveAnswer = function(index) {
  const answer = document.getElementById('answer-' + index).value.trim();
  if (!answer) return showToast('Please type an answer', true);
  
  const questions = JSON.parse(localStorage.getItem('askmufti_questions') || '[]');
  questions[index].answer = answer;
  questions[index].answeredDate = new Date().toISOString();
  localStorage.setItem('askmufti_questions', JSON.stringify(questions));
  
  showToast('✅ Answer saved! User will see it now.');
  loadQuestions();
};

// Clear answer
window.clearAnswer = function(index) {
  if (!confirm('Clear this answer?')) return;
  
  const questions = JSON.parse(localStorage.getItem('askmufti_questions') || '[]');
  questions[index].answer = '';
  questions[index].answeredDate = null;
  localStorage.setItem('askmufti_questions', JSON.stringify(questions));
  
  showToast('Answer cleared');
  loadQuestions();
};

// Delete question
window.deleteQuestion = function(index) {
  if (!confirm('Delete this question permanently?')) return;
  
  const questions = JSON.parse(localStorage.getItem('askmufti_questions') || '[]');
  questions.splice(index, 1);
  localStorage.setItem('askmufti_questions', JSON.stringify(questions));
  
  showToast('Question deleted');
  loadQuestions();
};

// Auto-refresh every 10 seconds
setInterval(loadQuestions, 10000);

// Initial load
loadQuestions();