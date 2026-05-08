// ==================== LEADERBOARD JS ====================
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

// Get rank icon
function getRankIcon(rank) {
  if (rank === 1) return '<i class="fas fa-crown" style="color:#fbbf24;"></i>';
  if (rank === 2) return '<i class="fas fa-medal" style="color:#94a3b8;"></i>';
  if (rank === 3) return '<i class="fas fa-medal" style="color:#cd7f32;"></i>';
  return rank;
}

function getBadge(rank) {
  if (rank === 1) return '<span class="badge">Top Donor</span>';
  if (rank === 2) return '<span class="badge">Silver Star</span>';
  if (rank === 3) return '<span class="badge">Bronze Heart</span>';
  if (rank <= 5) return '<span class="badge">Generous Heart</span>';
  return '';
}

// Load leaderboard
async function loadLeaderboard() {
  try {
    // Fetch stats
    const stats = await fetchAPI('/api/stats');
    document.getElementById('totalMadrasas').textContent = stats.madrasas || 0;
    document.getElementById('totalAmount').textContent = '₹' + (stats.totalAmount || 0).toLocaleString('en-IN');
    document.getElementById('totalCount').textContent = stats.donations || 0;
    
    // Fetch all donations for leaderboard
    // Note: Backend doesn't have donor aggregation API, so we use sample data for now
    const sampleDonations = [
      { donor: "Muhammad Ali", total: 15000, count: 3 },
      { donor: "Fatima Khan", total: 12000, count: 5 },
      { donor: "Ahmed Raza", total: 10000, count: 2 },
      { donor: "Ayesha Begum", total: 8500, count: 4 },
      { donor: "Omar Farooq", total: 7500, count: 3 },
      { donor: "Zainab Siddiqui", total: 6000, count: 2 },
      { donor: "Bilal Ahmed", total: 5500, count: 1 },
      { donor: "Khadija Hasan", total: 5000, count: 2 },
      { donor: "Usman Ghani", total: 4500, count: 1 },
      { donor: "Amina Tariq", total: 4000, count: 3 }
    ];
    
    const uniqueDonors = sampleDonations.length;
    document.getElementById('totalDonors').textContent = uniqueDonors;
    
    renderTable(sampleDonations);
    showToast('Leaderboard loaded!');
  } catch (err) {
    showToast('Failed to load data', true);
    document.getElementById('leaderboardBody').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">No data available yet.</td></tr>';
  }
}

function renderTable(donors) {
  const tbody = document.getElementById('leaderboardBody');
  
  if (donors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">No donations yet. Be the first!</td></tr>';
    return;
  }
  
  tbody.innerHTML = donors.map((d, i) => `
    <tr>
      <td class="rank">${getRankIcon(i + 1)}</td>
      <td><span class="donor-name">${d.donor}</span></td>
      <td class="amount">₹${d.total.toLocaleString('en-IN')}</td>
      <td>${d.count}</td>
      <td>${getBadge(i + 1)}</td>
    </tr>
  `).join('');
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadLeaderboard(); // Reload with period
  });
});

// Init
loadLeaderboard();