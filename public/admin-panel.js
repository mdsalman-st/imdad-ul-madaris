// ==================== ADMIN PANEL JS ====================
const ADMIN_PASSWORD = "";

function checkPassword() {
    const input = document.getElementById('adminPassword').value;
    if (input === ADMIN_PASSWORD) {
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('mainPanel').style.display = 'block';
        sessionStorage.setItem('admin_logged', 'true');
        loadAllData();
    } else {
        document.getElementById('errorMsg').style.display = 'block';
    }
}

if (sessionStorage.getItem('admin_logged') === 'true') {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('mainPanel').style.display = 'block';
    loadAllData();
}

document.getElementById('adminPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
});

function logout() {
    sessionStorage.removeItem('admin_logged');
    location.reload();
}

function loadAllData() {
    loadPendingMadrasas();
    loadAllMadrasas();
    loadContacts();
}

function loadPendingMadrasas() {
    const madrasas = JSON.parse(localStorage.getItem('registered_madrasas') || '[]');
    const pending = madrasas.filter(m => m.status === 'pending');
    
    document.getElementById('pendingCount').textContent = pending.length;
    document.getElementById('pendingBadge').textContent = pending.length + ' Pending';
    
    const tbody = document.getElementById('pendingList');
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">🎉 No pending approvals!</td></tr>';
        return;
    }
    
    tbody.innerHTML = pending.map(m => `
        <tr>
            <td><strong>${m.madrasaName}</strong></td>
            <td>${m.mohtamim || '--'}</td>
            <td>${m.district || '--'}</td>
            <td>${m.phone}</td>
            <td style="font-size:0.75rem;">${m.upi || '--'}</td>
            <td><span class="badge badge-pending">Pending</span></td>
            <td>
                <button class="btn btn-approve" onclick="approveMadrasa('${m.phone}')">✅ Approve</button>
                <button class="btn btn-reject" onclick="rejectMadrasa('${m.phone}')">❌ Reject</button>
            </td>
        </tr>
    `).join('');
}

function loadAllMadrasas() {
    const madrasas = JSON.parse(localStorage.getItem('registered_madrasas') || '[]');
    document.getElementById('totalMadrasas').textContent = madrasas.length;
    document.getElementById('activeCount').textContent = madrasas.filter(m => m.status === 'active').length;
    
    const tbody = document.getElementById('allMadrasasList');
    if (madrasas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">No madrasas registered yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = madrasas.map(m => `
        <tr>
            <td><strong>${m.madrasaName}</strong></td>
            <td>${m.district || '--'}</td>
            <td>${m.phone}</td>
            <td><span class="badge ${m.status === 'active' ? 'badge-active' : m.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${m.status}</span></td>
        </tr>
    `).join('');
}

function loadContacts() {
    const contacts = JSON.parse(localStorage.getItem('imdad_contacts') || '[]');
    document.getElementById('contactCount').textContent = contacts.length;
    
    const tbody = document.getElementById('contactList');
    if (contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">No messages yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = contacts.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.email}</td>
            <td>${c.subject}</td>
            <td>${new Date(c.date).toLocaleDateString('en-IN')}</td>
        </tr>
    `).join('');
}

window.approveMadrasa = function(phone) {
    if (!confirm('Approve this madrasa?')) return;
    const madrasas = JSON.parse(localStorage.getItem('registered_madrasas') || '[]');
    const index = madrasas.findIndex(m => m.phone === phone);
    if (index !== -1) {
        madrasas[index].status = 'active';
        localStorage.setItem('registered_madrasas', JSON.stringify(madrasas));
        loadAllData();
        alert('✅ Madrasa approved!');
    }
};

window.rejectMadrasa = function(phone) {
    if (!confirm('Reject this madrasa?')) return;
    const madrasas = JSON.parse(localStorage.getItem('registered_madrasas') || '[]');
    const index = madrasas.findIndex(m => m.phone === phone);
    if (index !== -1) {
        madrasas[index].status = 'rejected';
        localStorage.setItem('registered_madrasas', JSON.stringify(madrasas));
        loadAllData();
        alert('❌ Madrasa rejected.');
    }
};