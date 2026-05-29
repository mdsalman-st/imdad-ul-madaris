// ==================== BLOG JS (FIXED & SAFE) ====================
var API_BASE = window.IMDAD_API_BASE;

function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return; // guard
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

// Blog data (static)
const blogPosts = [
  { id: 1, title: "Ramadan 2026: Double Your Rewards", excerpt: "This Ramadan, your donations can make twice the impact.", category: "islamic", date: "2026-03-15", readTime: "5 min read", image: "ramadan", author: "Imdad Team" },
  { id: 2, title: "New Madrasa Added in Patna", excerpt: "Jamia Islamia Darul Uloom has joined our platform.", category: "news", date: "2026-03-10", readTime: "3 min read", image: "madrasa", author: "Admin" },
  { id: 3, title: "Student Success Story: Fatima's Journey", excerpt: "From a small madrasa to becoming a Hafiz-e-Quran.", category: "stories", date: "2026-03-05", readTime: "7 min read", image: "student", author: "Stories Team" },
  { id: 4, title: "Platform Update: New Features", excerpt: "New leaderboard feature and improved tracking.", category: "updates", date: "2026-02-28", readTime: "4 min read", image: "update", author: "Tech Team" },
  { id: 5, title: "The Importance of Sadaqah Jariyah", excerpt: "Learn about ongoing charity and its benefits.", category: "islamic", date: "2026-02-20", readTime: "6 min read", image: "sadaqah", author: "Scholars Team" },
  { id: 6, title: "50 Madrasas Registered This Month", excerpt: "50 new madrasas joined our platform!", category: "news", date: "2026-02-15", readTime: "3 min read", image: "milestone", author: "Admin" },
  { id: 7, title: "How Your Zakat Makes a Difference", excerpt: "See real impact reports from madrasas.", category: "stories", date: "2026-02-10", readTime: "5 min read", image: "zakat", author: "Impact Team" },
  { id: 8, title: "New: Download Donation Receipts", excerpt: "Download receipts directly from your profile.", category: "updates", date: "2026-02-05", readTime: "2 min read", image: "receipt", author: "Tech Team" },
  { id: 9, title: "Virtues of Giving in Secret", excerpt: "Discover the rewards of secret charity.", category: "islamic", date: "2026-01-28", readTime: "4 min read", image: "charity", author: "Scholars Team" }
];

let currentCategory = "all", currentSearch = "", currentPage = 1;
const postsPerPage = 6;

function getImageUrl(cat) {
  const map = { ramadan: "1584447108951", madrasa: "1584551246679", student: "1523050854058", update: "1551288049", sadaqah: "1584361853934", milestone: "1532629345422", zakat: "1593113630400", receipt: "1554224155", charity: "1532629345422" };
  return `https://images.unsplash.com/photo-${map[cat] || '1584551246679'}?w=400`;
}

function renderBlog() {
  const grid = document.getElementById('blogGrid');
  const pagination = document.getElementById('pagination');
  if (!grid || !pagination) return; // guards

  let filtered = [...blogPosts];
  if (currentCategory !== "all") filtered = filtered.filter(p => p.category === currentCategory);
  if (currentSearch) {
    const s = currentSearch.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(s) || p.excerpt.toLowerCase().includes(s));
  }

  const totalPages = Math.ceil(filtered.length / postsPerPage);
  const start = (currentPage - 1) * postsPerPage;
  const posts = filtered.slice(start, start + postsPerPage);

  if (posts.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:60px;color:#64748b;">No articles found.</div>';
    pagination.innerHTML = '';
    return;
  }

  grid.innerHTML = posts.map(p => `
    <div class="blog-card" onclick="alert('Full article coming soon!')">
      <div class="blog-image" style="background-image:url('${getImageUrl(p.image)}')">
        <span class="blog-category">${p.category}</span>
      </div>
      <div class="blog-content">
        <div class="blog-meta"><span>${new Date(p.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span><span>${p.readTime}</span></div>
        <h3 class="blog-title">${p.title}</h3>
        <p class="blog-excerpt">${p.excerpt}</p>
        <span class="read-more">Read More →</span>
      </div>
    </div>
  `).join('');

  let pagesHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    pagesHTML += `<button class="page-btn ${i===currentPage?'active':''}" data-page="${i}">${i}</button>`;
  }
  pagination.innerHTML = pagesHTML;

  // Attach events to new pagination buttons
  pagination.querySelectorAll('.page-btn').forEach(b => {
    b.addEventListener('click', () => {
      currentPage = +b.dataset.page;
      renderBlog();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    });
  });
}

// Category filters
document.querySelectorAll('.category-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.category-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    currentCategory = b.dataset.cat;
    currentPage = 1;
    renderBlog();
  });
});

// Search
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    renderBlog();
  });
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      renderBlog();
    }
  });
}

// Newsletter
const subscribeBtn = document.getElementById('subscribeBtn');
const newsletterEmail = document.getElementById('newsletterEmail');
if (subscribeBtn && newsletterEmail) {
  subscribeBtn.addEventListener('click', async () => {
    const email = newsletterEmail.value.trim();
    if (!email || !email.includes('@')) return showToast('Enter valid email', true);
    try {
      await fetchAPI('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
      showToast('✅ Subscribed!');
      newsletterEmail.value = '';
    } catch { showToast('Failed. Try again.', true); }
  });
}

renderBlog();