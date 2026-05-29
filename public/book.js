// ==================== BOOK PAGE JS (API-DRIVEN – CLOUDINARY PDFs) ====================
var API_BASE = window.IMDAD_API_BASE;

// ==================== UTILITIES ====================
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
        alert('Session expired. Please login again.');
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

// ==================== LOAD BOOKS FROM BACKEND ====================
async function loadBooksData() {
  try {
    const data = await fetchWithRetry('/api/books');
    return data; // { arabic: { title, icon, books: [...] }, ... }
  } catch (err) {
    console.warn('Failed to load books, using static fallback');
    // Static fallback (same structure as API)
    return {
      arabic: {
        title: "Arabic Learning",
        icon: "📖",
        books: [
          { _id: "1", title: "Asan Arabic Grammar Book 1", file: "ISLAMIC BOOKS/BO-07-Asan-Arbi-Grammar-p1.pdf" },
          { _id: "2", title: "Arabic Vocabulary Builder", file: "#" }
        ]
      },
      quran: {
        title: "Quran & Tafseer",
        icon: "📕",
        books: [
          { _id: "3", title: "Tafseer Ibn Kathir", file: "#" },
          { _id: "4", title: "The Meaning of the Holy Quran", file: "#" }
        ]
      }
      // ... aur categories same as before
    };
  }
}

// ==================== RENDER CATEGORIES & BOOK CARDS ====================
async function renderBooks() {
  const mainContent = document.querySelector('.container');
  if (!mainContent) return;

  const booksData = await loadBooksData();

  // Clear existing category sections
  mainContent.querySelectorAll('.category').forEach(s => s.remove());

  // Header (same as before but using dynamic titles)
  const headerHTML = `
    <header style="text-align:center;margin:20px 0 40px;">
      <h1 style="color:#0a5c2e;">Islamic Books Library</h1>
      <p style="color:#64748b;">Download authentic Islamic books in PDF format</p>
      <div style="margin-top:16px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
        ${Object.keys(booksData).map(key =>
          `<a href="#${key}" style="padding:6px 14px;background:#f0fdf4;color:#0a5c2e;border-radius:20px;text-decoration:none;font-size:0.8rem;">${escapeHTML(booksData[key].title)}</a>`
        ).join('')}
      </div>
    </header>
  `;

  const existingHeader = mainContent.querySelector('header');
  if (existingHeader) existingHeader.outerHTML = headerHTML;
  else mainContent.insertAdjacentHTML('afterbegin', headerHTML);

  // Category sections
  const sectionsHTML = Object.entries(booksData).map(([key, category]) => `
    <section class="category" id="${key}" style="margin-bottom:32px;background:white;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <h2 style="color:#0a5c2e;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #f1f5f9;">
        ${escapeHTML(category.icon || '📚')} ${escapeHTML(category.title)}
        <span style="font-size:0.75rem;color:#64748b;margin-left:8px;">(${category.books.length} books)</span>
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
        ${category.books.map(book => `
          <div class="book-item" style="background:#f8fafc;padding:14px 16px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;border-left:4px solid #0a5c2e;">
            <span style="font-weight:500;flex:1;">${escapeHTML(book.title)}</span>
            ${book.file && book.file !== '#' ? `
              <a href="${book.file}" download onclick="incrementDownload('${book._id}')" style="background:#0a5c2e;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:0.8rem;white-space:nowrap;">
                📥 Download
              </a>
            ` : `
              <span style="background:#e2e8f0;color:#64748b;padding:8px 16px;border-radius:6px;font-size:0.8rem;white-space:nowrap;">Coming Soon</span>
            `}
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');

  mainContent.insertAdjacentHTML('beforeend', sectionsHTML);

  // Smooth scroll for category links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(e.target.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ==================== DOWNLOAD COUNT (FIRE & FORGET) ====================
async function incrementDownload(bookId) {
  try {
    await fetch(`${API_BASE}/api/books/${bookId}/download`, { method: 'PATCH' });
  } catch (err) {
    // silently ignore
  }
}

// ==================== SEARCH (OPTIONAL) ====================
function addSearch() {
  const searchHTML = `
    <div style="max-width:500px;margin:0 auto 24px;">
      <input type="text" id="bookSearch" placeholder="Search books..." 
        style="width:100%;padding:12px 20px;border:2px solid #e2e8f0;border-radius:30px;font-size:0.9rem;outline:none;">
    </div>
  `;
  const container = document.querySelector('.container');
  const header = container.querySelector('header');
  if (header) header.insertAdjacentHTML('afterend', searchHTML);

  document.getElementById('bookSearch')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.category').forEach(section => {
      let hasMatch = false;
      section.querySelectorAll('.book-item').forEach(item => {
        const title = item.textContent.toLowerCase();
        if (title.includes(query)) {
          item.style.display = 'flex';
          hasMatch = true;
        } else {
          item.style.display = 'none';
        }
      });
      section.style.display = hasMatch ? 'block' : 'none';
    });
  });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  renderBooks().then(() => addSearch());
});