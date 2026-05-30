const API_BASE = 'https://imdad-backend-1.onrender.com';
let allPendingData = [];

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createModal(innerHTML) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = innerHTML;

    function closeModal() {
        modal.remove();
        if (modal._escHandler) document.removeEventListener('keydown', modal._escHandler);
    }

    modal._escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', modal._escHandler);

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModal));

    document.body.appendChild(modal);
}

function getAuthHeaders() {
    const token = sessionStorage.getItem('admin_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
    };
}

async function checkPassword() {
    const username = document.getElementById('adminUsername')?.value || 'admin';
    const password = document.getElementById('adminPassword').value;
    try {
        const res = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success && data.token) {
            sessionStorage.setItem('admin_token', data.token);
            sessionStorage.setItem('admin_logged', 'true');
            document.getElementById('passwordModal').style.display = 'none';
            document.getElementById('mainPanel').style.display = 'block';
            document.getElementById('errorMsg').style.display = 'none';
            loadAllData();
        } else {
            document.getElementById('errorMsg').textContent = '❌ ' + (data.error || 'Wrong credentials');
            document.getElementById('errorMsg').style.display = 'block';
        }
    } catch (err) {
        document.getElementById('errorMsg').textContent = '❌ Server Error';
        document.getElementById('errorMsg').style.display = 'block';
    }
}

if (sessionStorage.getItem('admin_logged') === 'true') {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('mainPanel').style.display = 'block';
    loadAllData();
}

document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
});

function logout() { sessionStorage.removeItem('admin_logged'); sessionStorage.removeItem('admin_token'); location.reload(); }

async function loadAllData() {
    await loadStats();
    await loadPendingMadrasas();
    await loadAllMadrasas();
    await loadDonations();
    await loadMuftiQuestions();
    await loadContacts();
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/api/stats`);
        const data = await res.json();
        document.getElementById('totalMadrasas').textContent = data.madrasas || 0;
        document.getElementById('totalDonations').textContent = data.donations || 0;
        document.getElementById('totalAmount').textContent = '₹' + (data.totalAmount || 0).toLocaleString('en-IN');
    } catch (err) { console.error(err); }
}

window.viewDocument = function(url, label, isPDF) {
    if (!url || typeof url !== 'string') { alert('❌ Document URL missing'); return; }
    const safeLabel = escapeHTML(label || 'Document');
    const safeUrl = escapeAttr(url);
    const modalHTML = `
        <div class="modal-content" style="text-align:center;max-width:800px;width:100%;">
            <div class="modal-header">
                <div><h3 style="font-size:1.1rem;font-weight:700;">${safeLabel}</h3><p style="font-size:0.75rem;color:#9ca3af;">🔒 Signed URL</p></div>
                <button class="modal-close">✕ Close</button>
            </div>
            <div style="margin-bottom:16px;">
                <a href="${url}" target="_blank" style="display:inline-block;background:#0a5c2e;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">🔗 Open in New Tab</a>
            </div>
            ${isPDF
                ? `<embed src="${safeUrl}#toolbar=0" type="application/pdf" style="width:100%;height:70vh;border-radius:8px;" onerror="this.parentElement.innerHTML='<p style=\\"color:#ef4444;\\">❌ Failed to load PDF</p>'">`
                : `<img src="${safeUrl}" style="max-width:100%;max-height:70vh;border-radius:8px;" onerror="this.parentElement.innerHTML='<p style=\\"color:#ef4444;\\">❌ Failed to load image</p>'">`}
        </div>`;
    createModal(modalHTML);
};

window.viewAllDocuments = function(madrasaId) {
    const madrasa = allPendingData.find(m => m._id === madrasaId);
    if (!madrasa || !madrasa.documents) return alert('No documents found');
    const safeName = escapeHTML(madrasa.madrasaName || 'Madrasa');
    const docTypes = [
        { key: 'aadhaarDoc', label: '🆔 Aadhaar Card', isPDF: false },
        { key: 'panDoc', label: '📋 PAN Card', isPDF: false },
        { key: 'madrasaProof', label: '📜 Registration', isPDF: true },
        { key: 'trustDeed', label: '📄 Trust Deed', isPDF: true },
        { key: 'passbook', label: '🏦 Bank Passbook', isPDF: false },
        { key: 'frontPhoto', label: '🏫 Front View', isPDF: false },
        { key: 'classroomPhoto', label: '🏫 Classroom', isPDF: false }
    ];
    const modalHTML = `
        <div class="modal-content" style="max-width:650px;width:100%;max-height:85vh;overflow-y:auto;">
            <div class="modal-header"><div><h3>📁 Documents</h3><p style="font-size:0.85rem;color:#666;">${safeName} | 🔒 Private</p></div><button class="modal-close">✕ Close</button></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                ${docTypes.map(doc => {
                    const file = madrasa.documents[doc.key];
                    const url = file ? (file.signed_url || file.secure_url || file.url) : null;
                    if (!url) return `<div style="background:#fef2f2;border:2px solid #fee2e2;border-radius:12px;padding:16px;text-align:center;opacity:0.6;"><span style="font-size:1.5rem;display:block;">${doc.label.split(' ')[0]}</span><span style="font-size:0.8rem;font-weight:600;color:#991b1b;">❌ Not uploaded</span></div>`;
                    const safeUrl = escapeAttr(url);
                    const safeLabel = escapeAttr(doc.label);
                    return `<button onclick="viewDocument('${safeUrl}', '${safeLabel}', ${doc.isPDF})" style="background:#f0fdf4;border:2px solid #d1fae5;border-radius:12px;padding:16px;cursor:pointer;text-align:center;"><span style="font-size:1.8rem;display:block;">${doc.label.split(' ')[0]}</span><span style="font-size:0.8rem;font-weight:600;">${doc.label.split(' ').slice(1).join(' ')}</span></button>`;
                }).join('')}
            </div>
        </div>`;
    createModal(modalHTML);
};

async function loadPendingMadrasas() {
    const tbody = document.getElementById('pendingList');
    tbody.innerHTML = '<tr><td colspan="8" class="empty">Loading...</td></tr>';
    try {
        const res = await fetch(`${API_BASE}/api/admin/pending`, { headers: getAuthHeaders() });
        const pending = await res.json();
        allPendingData = pending;
        document.getElementById('pendingBadge').textContent = pending.length + ' Pending';
        const totalEl = document.getElementById('totalMadrasas'), activeEl = document.getElementById('activeCount');
        if (totalEl && activeEl) { const total = parseInt(totalEl.textContent) || 0; activeEl.textContent = Math.max(0, total - pending.length); }
        if (pending.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty">🎉 No pending!</td></tr>'; return; }
        tbody.innerHTML = pending.map(m => `<tr><td><strong>${escapeHTML(m.madrasaName||'N/A')}</strong></td><td>${escapeHTML(m.mohtamim||'--')}</td><td>${escapeHTML(m.district||'--')}</td><td>${escapeHTML(m.phone||'--')}</td><td style="font-size:0.75rem;">${escapeHTML(m.upiId||'--')}</td><td><span class="badge badge-pending">⏳ Pending</span></td><td><button class="btn btn-view" onclick="viewAllDocuments('${m._id}')">📁 View Docs</button></td><td><button class="btn btn-approve" onclick="approveMadrasa('${m._id}')">✅</button><button class="btn btn-reject" onclick="rejectMadrasa('${m._id}')">❌</button></td></tr>`).join('');
    } catch (err) { tbody.innerHTML = '<tr><td colspan="8" class="empty">❌ Failed</td></tr>'; }
}

async function loadAllMadrasas() {
    const tbody = document.getElementById('allMadrasasList');
    try {
        const active = await fetch(`${API_BASE}/api/madrasas`).then(r => r.json());
        const all = [...allPendingData, ...active];
        const unique = [...new Map(all.map(m => [m._id, m])).values()];
        allPendingData = unique;
        if (unique.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="empty">No madrasas yet.</td></tr>'; return; }
        tbody.innerHTML = unique.map(m => `<tr><td><strong>${escapeHTML(m.madrasaName||'N/A')}</strong></td><td>${escapeHTML(m.district||'--')}</td><td>${escapeHTML(m.phone||'--')}</td><td><span class="badge ${m.status==='active'?'badge-active':m.status==='rejected'?'badge-rejected':'badge-pending'}">${escapeHTML(m.status||'pending')}</span></td><td><button class="btn btn-view" onclick="viewAllDocuments('${m._id}')">📁</button></td></tr>`).join('');
    } catch (err) { tbody.innerHTML = '<tr><td colspan="5" class="empty">❌ Failed</td></tr>'; }
}

async function loadDonations() {
    const tbody = document.getElementById('donationsList');
    try {
        const res = await fetch(`${API_BASE}/api/donations/admin`, { headers: getAuthHeaders() });
        const donations = await res.json();
        if (!donations.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No donations yet.</td></tr>'; return; }
        tbody.innerHTML = donations.map(d => `<tr>
            <td style="font-size:0.75rem;">${escapeHTML(d.receiptNo||'--')}</td>
            <td>${escapeHTML(d.donorName||'--')}</td>
            <td>${escapeHTML(d.madrasaName||'--')}</td>
            <td style="font-weight:700;color:#0a5c2e;">₹${(d.amount||0).toLocaleString('en-IN')}</td>
            <td>${new Date(d.date).toLocaleDateString('en-IN')}</td>
            <td><span class="badge ${d.status==='Received'?'badge-active':d.status==='Rejected'?'badge-rejected':'badge-pending'}">${escapeHTML(d.status)}</span></td>
            <td>
                ${d.status !== 'Received' ? `<button class="btn btn-approve" style="font-size:0.7rem;padding:5px 10px;" onclick="verifyDonation('${d._id}','Received')">✅ Verify</button>` : ''}
                ${d.status !== 'Rejected' ? `<button class="btn btn-reject" style="font-size:0.7rem;padding:5px 10px;" onclick="verifyDonation('${d._id}','Rejected')">❌ Reject</button>` : ''}
            </td>
        </tr>`).join('');
    } catch (err) { tbody.innerHTML = '<tr><td colspan="7" class="empty">❌ Failed</td></tr>'; }
}

async function verifyDonation(id, status) {
    if (!confirm(`Are you sure you want to mark this donation as "${status}"?`)) return;
    try {
        const res = await fetch(`${API_BASE}/api/donations/${id}/status`, {
            method: 'PUT',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Failed');
        showToast(`✅ Donation marked as ${status}`);
        await loadDonations();
    } catch (err) {
        showToast('❌ Failed to update status', true);
    }
}
async function loadMuftiQuestions() {
    const tbody = document.getElementById('muftiQuestionsList');
    if (!tbody) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/askmufti`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed');
        const questions = await res.json();
        document.getElementById('muftiBadge').textContent = questions.length + ' Questions';
        if (!questions.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">📭 No questions yet.</td></tr>'; return; }
        tbody.innerHTML = questions.map(q => `<tr><td style="font-size:0.75rem;">${new Date(q.createdAt).toLocaleDateString('en-IN')}</td><td>${escapeHTML(q.name||'--')}</td><td>${escapeHTML(q.email||'--')}</td><td>${escapeHTML(q.category||'--')}</td><td>${escapeHTML(q.question)}</td><td><textarea id="answer-${q._id}">${escapeHTML(q.answer||'')}</textarea></td><td><button class="btn btn-view" onclick="saveMuftiAnswer('${q._id}')">💾 Save</button></td></tr>`).join('');
    } catch (err) { tbody.innerHTML = '<tr><td colspan="7" class="empty">❌ Failed to load questions</td></tr>'; }
}

window.saveMuftiAnswer = async function(questionId) {
    const answer = document.getElementById('answer-' + questionId).value.trim();
    if (!answer) return alert('Please type an answer');
    try {
        const res = await fetch(`${API_BASE}/api/admin/askmufti/${questionId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ answer })
        });
        if (!res.ok) throw new Error('Save failed');
        alert('✅ Answer saved!');
        loadMuftiQuestions();
    } catch (err) { alert('❌ Failed to save answer'); }
};

// ✅ CONTACTS SECTION
async function loadContacts() {
    const tbody = document.getElementById('contactsList');
    if (!tbody) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/contacts`, { headers: getAuthHeaders() });
        const contacts = await res.json();
        document.getElementById('messagesBadge').textContent = contacts.length + ' Messages';
        if (!contacts.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">📭 No messages yet.</td></tr>'; return; }
        tbody.innerHTML = contacts.map(c => `<tr><td style="font-size:0.75rem;">${new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td><td>${escapeHTML(c.name||'--')}</td><td>${escapeHTML(c.email||'--')}</td><td>${escapeHTML(c.phone||'--')}</td><td>${escapeHTML(c.subject||'--')}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(c.message||'--')}</td><td><button class="btn btn-view" onclick="viewMessage('${escapeAttr(c.message||'')}','${escapeAttr(c.name||'')}','${escapeAttr(c.subject||'')}')">👁 View</button></td></tr>`).join('');
    } catch (err) { tbody.innerHTML = '<tr><td colspan="7" class="empty">❌ Failed</td></tr>'; }
}

window.viewMessage = function(message, name, subject) {
    const safeName = escapeHTML(name), safeSubject = escapeHTML(subject), safeMessage = escapeHTML(message);
    createModal(`<div class="modal-content" style="max-width:500px;"><div class="modal-header"><h3>📧 ${safeSubject||'Message'}</h3><button class="modal-close">✕ Close</button></div><p style="font-weight:600;color:#0a5c2e;">From: ${safeName||'Unknown'}</p><hr style="margin:12px 0;"><p style="color:#334155;line-height:1.6;">${safeMessage||'No content.'}</p></div>`);
};

async function approveMadrasa(id) {
    if (!confirm('✅ APPROVE this madrasa?')) return;
    try { await fetch(`${API_BASE}/api/admin/approve/${id}`,{method:'PUT', headers: getAuthHeaders()}); alert('✅ Approved!'); loadAllData(); } catch (err) { alert('❌ Error'); }
}
async function rejectMadrasa(id) {
    const reason = prompt('❌ Reason:');
    if (!reason) return;
    try { await fetch(`${API_BASE}/api/admin/reject/${id}`,{method:'PUT', headers: getAuthHeaders()}); alert('❌ Rejected.'); loadAllData(); } catch (err) { alert('❌ Error'); }
}