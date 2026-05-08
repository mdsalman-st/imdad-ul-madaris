const user = JSON.parse(localStorage.getItem('imdad_user') || 'null');
const tbody = document.getElementById('historyList');

if (!user) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Please login to view history. <a href="auth.html">Login</a></td></tr>';
} else {
    const donations = JSON.parse(localStorage.getItem('donations_' + user.userId) || '[]');
    if (donations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">No donations yet. <a href="mlist.html">Donate now</a></td></tr>';
    } else {
        tbody.innerHTML = donations.map(d => `
            <tr><td>${new Date(d.date).toLocaleDateString('en-IN')}</td><td>${d.madrasaName}</td><td>₹${d.amount}</td><td>${d.type||'General'}</td></tr>
        `).join('');
    }
}