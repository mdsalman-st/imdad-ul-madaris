// ==================== BOOK PAGE JS ====================

// Books data organized by category
const booksData = {
  arabic: {
    title: "Arabic Learning",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a5c2e" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    books: [
      { title: "Asan Arabic Grammar Book 1", file: "ISLAMIC BOOKS/BO-07-Asan-Arbi-Grammar-p1.pdf" },
      { title: "Asan Arabic Grammar Book 2", file: "ISLAMIC BOOKS/BO-08-Asan-Arbi-Grammar-p2.pdf" },
      { title: "Arabic Vocabulary Builder", file: "#" },
      { title: "Learn Quranic Arabic", file: "#" }
    ]
  },
  quran: {
    title: "Quran & Tafseer",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a5c2e" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    books: [
      { title: "Tafseer Ibn Kathir (English)", file: "#" },
      { title: "Tafseer As-Sa'di (Arabic)", file: "#" },
      { title: "Ma'ariful Quran (Urdu)", file: "#" },
      { title: "The Meaning of the Holy Quran", file: "#" }
    ]
  },
  hadith: {
    title: "Hadith Collections",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a5c2e" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    books: [
      { title: "Sahih Al-Bukhari (English)", file: "#" },
      { title: "Sahih Muslim", file: "#" },
      { title: "Riyad us-Saliheen", file: "#" },
      { title: "40 Hadith Nawawi", file: "#" },
      { title: "Mishkat Al-Masabih", file: "#" }
    ]
  },
  fiqh: {
    title: "Fiqh & Jurisprudence",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a5c2e" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    books: [
      { title: "Fiqh us-Sunnah", file: "#" },
      { title: "The Book of Prayer", file: "#" },
      { title: "Zakat Guide", file: "#" },
      { title: "Hajj & Umrah Guide", file: "#" }
    ]
  },
  seerah: {
    title: "Seerah & History",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a5c2e" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    books: [
      { title: "The Sealed Nectar (Ar-Raheeq Al-Makhtum)", file: "#" },
      { title: "Stories of the Prophets", file: "#" },
      { title: "History of Islam", file: "#" },
      { title: "The Companions of the Prophet", file: "#" }
    ]
  },
  dua: {
    title: "Dua & Supplications",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a5c2e" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    books: [
      { title: "Fortress of the Muslim (Hisnul Muslim)", file: "#" },
      { title: "Daily Duas for Ramadan", file: "#" },
      { title: "Morning & Evening Adhkar", file: "#" },
      { title: "Duas from Quran & Sunnah", file: "#" }
    ]
  }
};

// Render all categories and books
function renderBooks() {
  const mainContent = document.querySelector('.container');
  
  // Clear existing content
  const existingSections = mainContent.querySelectorAll('.category');
  existingSections.forEach(s => s.remove());
  
  // Header
  const headerHTML = `
    <header style="text-align:center;margin:20px 0 40px;animation:fadeIn 0.5s ease;">
      <h1 style="color:#0a5c2e;margin-bottom:10px;font-size:2rem;font-weight:700;">Islamic Books Library</h1>
      <p style="color:#64748b;font-size:1rem;">Download authentic Islamic books in PDF format</p>
      <div style="margin-top:16px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
        ${Object.keys(booksData).map(key => 
          `<a href="#${key}" style="padding:6px 14px;background:#f0fdf4;color:#0a5c2e;border-radius:20px;text-decoration:none;font-size:0.8rem;font-weight:500;">${booksData[key].title}</a>`
        ).join('')}
      </div>
    </header>
  `;
  
  // Generate category sections
  const sectionsHTML = Object.entries(booksData).map(([key, category]) => `
    <section class="category" id="${key}" style="margin-bottom:32px;background:white;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);animation:fadeIn 0.5s ease;">
      <h2 style="color:#0a5c2e;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #f1f5f9;display:flex;align-items:center;gap:10px;font-size:1.2rem;">
        ${category.icon}
        ${category.title}
        <span style="font-size:0.75rem;color:#64748b;font-weight:400;margin-left:8px;">(${category.books.length} books)</span>
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
        ${category.books.map(book => `
          <div style="background:#f8fafc;padding:14px 16px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;border-left:4px solid #0a5c2e;transition:all 0.2s;cursor:pointer;" 
               onmouseover="this.style.background='#f1f5f9';this.style.transform='translateY(-2px)';" 
               onmouseout="this.style.background='#f8fafc';this.style.transform='';">
            <span style="font-weight:500;font-size:0.9rem;color:#334155;flex:1;">${book.title}</span>
            ${book.file !== '#' ? `
              <a href="${book.file}" download style="background:#0a5c2e;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;text-decoration:none;font-size:0.8rem;font-weight:500;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background='#0d7a3e'" onmouseout="this.style.background='#0a5c2e'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </a>
            ` : `
              <span style="background:#e2e8f0;color:#64748b;padding:8px 16px;border-radius:6px;font-size:0.8rem;white-space:nowrap;">Coming Soon</span>
            `}
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
  
  // Insert into container
  const header = mainContent.querySelector('header');
  if (header) header.outerHTML = headerHTML;
  else mainContent.insertAdjacentHTML('afterbegin', headerHTML);
  
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

// Search functionality
function addSearch() {
  const searchHTML = `
    <div style="max-width:500px;margin:0 auto 24px;">
      <input type="text" id="bookSearch" placeholder="Search books..." 
        style="width:100%;padding:12px 20px;border:2px solid #e2e8f0;border-radius:30px;font-size:0.9rem;outline:none;transition:border 0.2s;"
        onfocus="this.style.borderColor='#0a5c2e'" onblur="this.style.borderColor='#e2e8f0'">
    </div>
  `;
  document.querySelector('.container header').insertAdjacentHTML('afterend', searchHTML);
  
  document.getElementById('bookSearch').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.category').forEach(section => {
      let hasMatch = false;
      section.querySelectorAll('.book-item, [style*="border-left"]').forEach(item => {
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

// Add fadeIn animation style
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderBooks();
  addSearch();
});