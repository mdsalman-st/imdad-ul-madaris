// ==================== ASK MUFTI JS ====================
const API_BASE = 'https://imdad-backend-1.onrender.com';

function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.cssText = `display:block;background:${err?'#dc2626':'#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;`;
  setTimeout(() => t.style.display = 'none', 3000);
}

// Submit question
document.getElementById('askForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('askName').value.trim();
  const email = document.getElementById('askEmail').value.trim();
  const category = document.getElementById('askCategory').value;
  const question = document.getElementById('askQuestion').value.trim();
  const btn = e.target.querySelector('.submit-btn');
  
  if (!name || !email || !question) return showToast('Please fill all fields', true);
  if (!email.includes('@')) return showToast('Enter valid email', true);
  
  btn.textContent = 'Submitting...';
  btn.disabled = true;
  
  try {
    // Save to localStorage (backend API not available yet for askmufti)
    const questions = JSON.parse(localStorage.getItem('askmufti_questions') || '[]');
    questions.unshift({
      name, email, category, question,
      answer: '',
      date: new Date().toISOString(),
      id: Date.now()
    });
    localStorage.setItem('askmufti_questions', JSON.stringify(questions));
    
    showToast('✅ Question submitted! Mufti will answer soon.');
    e.target.reset();
    loadMyQuestions(email);
  } catch (err) {
    showToast('Failed. Try again.', true);
  }
  
  btn.textContent = 'Submit Question';
  btn.disabled = false;
});

// Load questions by email
function loadMyQuestions(email) {
  const container = document.getElementById('questionsList');
  const questions = JSON.parse(localStorage.getItem('askmufti_questions') || '[]');
  const mine = questions.filter(q => q.email === email);
  
  if (mine.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">No questions yet. Ask your first question above.</p>';
    return;
  }
  
  container.innerHTML = mine.map(q => `
    <div class="qa-item">
      <div class="q">❓ ${q.question}</div>
      <div class="meta">${q.category} • ${new Date(q.date).toLocaleDateString('en-IN')}</div>
      ${q.answer ? `<div class="a">✅ ${q.answer}</div>` : '<div class="pending">⏳ Waiting for Mufti\'s answer...</div>'}
    </div>
  `).join('');
}

// Auto-load when email is entered
document.getElementById('askEmail').addEventListener('blur', () => {
  const email = document.getElementById('askEmail').value.trim();
  if (email && email.includes('@')) loadMyQuestions(email);
});

// Initialize
loadMyQuestions('');