// ==================== DONATION HISTORY JS (FINAL STANDALONE) ====================
var API_BASE = window.IMDAD_API_BASE;

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function getStoredUser() {
  let userStr = localStorage.getItem('user');
  if (!userStr) userStr = localStorage.getItem('imdad_user');

  try {
    return JSON.parse(userStr || 'null');
  } catch (err) {
    return null;
  }
}

function getLocalDonations(userId) {
  try {
    return JSON.parse(localStorage.getItem('donations_' + userId) || '[]');
  } catch (err) {
    return [];
  }
}

function renderHistory(donations) {
  const tbody = document.getElementById('historyList');
  if (!tbody) return;

  if (!donations || donations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No donations yet. <a href="madrasa-list.html">Donate now</a></td></tr>';
    return;
  }

  tbody.innerHTML = donations.map(d => {
    const dateStr = d.date ? new Date(d.date).toLocaleDateString('en-IN') : '--';
    const madrasaName = escapeHTML(d.madrasaName || 'Unknown');
    const type = escapeHTML(d.donationType || d.type || 'General');
    const amount = Number(d.amount || 0).toLocaleString('en-IN');
    const receiptNo = escapeHTML(d.receiptNo || '');

    return `<tr>
      <td>${dateStr}</td>
      <td>${madrasaName}</td>
      <td>Rs ${amount}</td>
      <td>${type}</td>
      <td><a href="receipt.html?q=${receiptNo}" style="color:#0a5c2e;text-decoration:none;font-weight:600;">Receipt</a></td>
    </tr>`;
  }).join('');
}

(async function() {
  const tbody = document.getElementById('historyList');
  if (!tbody) return;

  const user = getStoredUser();
  const userId = user ? (user.userId || user._id) : null;

  if (!user || !userId) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Please login to view history. <a href="auth.html">Login</a></td></tr>';
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    const res = await fetch(`${API_BASE}/api/donations/donor/${encodeURIComponent(userId)}`, { headers });

    if (!res.ok) throw new Error(`Server error (${res.status})`);

    const data = await res.json();
    renderHistory(data.donations || data || []);
  } catch (err) {
    renderHistory(getLocalDonations(userId));
  }
})();
