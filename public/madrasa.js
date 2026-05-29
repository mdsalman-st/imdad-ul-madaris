// ==================== MADRASA PUBLIC PROFILE JS (FINAL - 100x CHECKED) ====================
var API_BASE = window.IMDAD_API_BASE;

const urlParams = new URLSearchParams(window.location.search);
const madrasaId = urlParams.get('id');

if (!madrasaId) {
    document.body.innerHTML = `
        <div style="text-align:center;padding:80px 20px;font-family:sans-serif;">
            <h2 style="color:#1e293b;font-size:1.5rem;font-weight:700;">❌ No Madrasa ID provided</h2>
            <p style="color:#64748b;margin-top:8px;">Please select a madrasa from the home page.</p>
            <a href="index.html" style="display:inline-block;margin-top:20px;background:#0a5c2e;color:white;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:600;">🕌 Back to Home</a>
        </div>`;
    // Stop further script; error UI already shown
    throw new Error('No madrasa ID');
}

// ==================== UTILITIES ====================
function showToast(m, e) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = m;
    t.style.cssText = `display:block;background:${e ? '#dc2626' : '#0a5c2e'};color:white;padding:14px 28px;border-radius:40px;font-weight:600;font-size:.9rem;box-shadow:0 8px 24px rgba(0,0,0,.2);position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;white-space:nowrap;`;
    setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// Strong XSS protection: all dynamic text goes through this
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// Core API caller – timeout, auth, error handling, and conditional 401 logout
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
                // Only logout if the user was actually logged in
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                showToast('Session expired. Please login again.', true);
                setTimeout(() => location.href = 'auth.html', 1000);
            }
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error (${res.status})`);
        }
        return await res.json();
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

// Retry wrapper using the robust fetchAPI
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetchAPI(url, options);
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

function getEmoji(c) {
    const e = { Food:'🍲', Clothes:'👕', Books:'📚', Building:'🏗️', Salary:'💼', Medical:'🏥' };
    return e[c] || '📦';
}

// ==================== PAGE LOGIC ====================
window.switchDetailTab = function(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector(`[onclick="switchDetailTab('${tab}')"]`);
    const panel = document.getElementById(`panel-${tab}`);
    if (btn) btn.classList.add('active');
    if (panel) panel.classList.add('active');
};

async function loadMadrasaProfile() {
    // Loader already visible from DOMContentLoaded, so no need to show again
    try {
        const data = await fetchWithRetry(`/api/madrasas/${encodeURIComponent(madrasaId)}`);

        if (!data || !data._id) {
            document.body.innerHTML = `
                <div style="text-align:center;padding:80px 20px;font-family:sans-serif;">
                    <h2 style="color:#1e293b;font-size:1.5rem;font-weight:700;">❌ Madrasa Not Found</h2>
                    <p style="color:#64748b;margin-top:8px;">This madrasa may not exist or has been removed.</p>
                    <a href="index.html" style="display:inline-block;margin-top:20px;background:#0a5c2e;color:white;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:600;">🕌 Back to Home</a>
                </div>`;
            return;
        }

        populateHeader(data);
        populateStats(data);
        populateAbout(data);
        setupActionButtons(data);
        loadNeeds();      // fire & forget
        if (data.upiId) loadDonations(data.upiId);

    } catch (err) {
        console.error('Profile load error:', err);
        showToast('Failed to load profile. Please try again.', true);
    } finally {
        const loader = document.getElementById('profileLoader');
        if (loader) loader.style.display = 'none';
    }
}

function populateHeader(data) {
    const el = (id) => document.getElementById(id);
    if (el('madrasaInitial')) el('madrasaInitial').textContent = (data.madrasaName || 'M').charAt(0).toUpperCase();
    if (el('madrasaName')) el('madrasaName').textContent = escapeHTML(data.madrasaName || 'Madrasa');
    if (el('madrasaDistrict')) el('madrasaDistrict').textContent = '📍 ' + escapeHTML(data.district || 'Unknown');
    if (el('madrasaType')) el('madrasaType').textContent = '🕌 ' + escapeHTML(data.category || 'Madrasa');
    if (el('madrasaEstablished')) el('madrasaEstablished').textContent = '📅 Est. ' + escapeHTML(data.establishedYear || '----');
    if (el('madrasaMohtamim')) el('madrasaMohtamim').textContent = '👤 Mohtamim: ' + escapeHTML(data.mohtamim || 'Not provided');

    const status = el('madrasaStatus');
    if (status) {
        status.textContent = data.status === 'active' ? '✅ Verified Madrasa' : '⏳ Pending Verification';
        status.className = data.status === 'active'
            ? 'bg-green-400/30 text-green-200 px-4 py-1.5 rounded-full text-sm font-semibold'
            : 'bg-yellow-400/30 text-yellow-200 px-4 py-1.5 rounded-full text-sm font-semibold';
    }
}

function populateStats(data) {
    const el = (id) => document.getElementById(id);
    if (el('totalStudents')) el('totalStudents').textContent = data.totalStudents || '--';
    if (el('totalTeachers')) el('totalTeachers').textContent = data.totalTeachers || '--';
}

function populateAbout(data) {
    const aboutSection = document.getElementById('aboutSection');
    if (!aboutSection) return;
    aboutSection.style.display = 'block';

    // Reusable safe info box
    const buildInfoBox = (label, value) => `
        <div style="background:#f8fafc;padding:12px;border-radius:10px;">
            <div style="font-size:0.75rem;color:#64748b;margin-bottom:4px;">${label}</div>
            <div style="font-weight:600;color:#1e293b;">${escapeHTML(value || '--')}</div>
        </div>`;

    aboutSection.innerHTML = `
        <h3>📖 About This Madrasa</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            ${buildInfoBox('🏫 Category', data.category)}
            ${buildInfoBox('🎓 Board', data.board)}
            ${buildInfoBox('✅ Recognition', data.recognition)}
            ${buildInfoBox('📚 Education Level', data.educationLevel)}
            ${buildInfoBox('👨‍🎓 Male Students', data.maleStudents || '0')}
            ${buildInfoBox('👩‍🎓 Female Students', data.femaleStudents || '0')}
            ${buildInfoBox('👨‍🏫 Male Teachers', data.maleTeachers || '0')}
            ${buildInfoBox('👩‍🏫 Female Teachers', data.femaleTeachers || '0')}
        </div>
        <div style="background:#f8fafc;padding:14px;border-radius:10px;margin-bottom:10px;">
            <div style="font-size:0.75rem;color:#64748b;margin-bottom:4px;">📍 Address</div>
            <div style="font-weight:500;color:#1e293b;">${escapeHTML(data.address || data.streetAddress || '--')}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${buildInfoBox('🏙️ City', data.city)}
            ${buildInfoBox('🗺️ State', data.state)}
            ${buildInfoBox('📮 Pincode', data.pincode)}
            ${buildInfoBox('📞 Phone', data.phone)}
        </div>
        ${data.monthlyExpense ? `
        <div style="background:#f0fdf4;padding:12px;border-radius:10px;margin-top:10px;border-left:4px solid #0a5c2e;">
            <div style="font-size:0.75rem;color:#64748b;margin-bottom:4px;">💰 Monthly Expense</div>
            <div style="font-weight:700;color:#0a5c2e;font-size:1.1rem;">₹${(parseInt(data.monthlyExpense) || 0).toLocaleString('en-IN')}</div>
        </div>` : ''}
        ${data.needReason ? `
        <div style="background:#fef3c7;padding:12px;border-radius:10px;margin-top:10px;border-left:4px solid #f59e0b;">
            <div style="font-size:0.75rem;color:#92400e;margin-bottom:4px;">⚠️ Why They Need Help</div>
            <div style="font-weight:500;color:#78350f;">${escapeHTML(data.needReason)}</div>
        </div>` : ''}
    `;
}

function setupActionButtons(data) {
    const donateBtn = document.getElementById('btnDonateNow');
    if (donateBtn && data.upiId) {
        donateBtn.href = `donation-page.html?name=${encodeURIComponent(data.madrasaName || 'Madrasa')}&upi=${encodeURIComponent(data.upiId)}`;
    }

    const callBtn = document.getElementById('btnCallMadrasa');
    if (callBtn) {
        if (data.phone && data.phone.trim()) {
            callBtn.href = `tel:${data.phone.trim()}`;
            callBtn.style.display = 'inline-flex';
        } else {
            callBtn.style.display = 'none';
        }
    }

    const mapBtn = document.getElementById('btnMapLocation');
    if (mapBtn) {
        const address = data.address || data.streetAddress;
        if (address || data.city || data.district) {
            const mapQuery = [address, data.district, data.state].filter(Boolean).join(' ');
            mapBtn.href = `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`;
            mapBtn.target = '_blank';
            mapBtn.style.display = 'inline-flex';
        } else {
            mapBtn.style.display = 'none';
        }
    }
}

async function loadNeeds() {
    const container = document.getElementById('needsList');
    if (!container) return;
    try {
        const needs = await fetchWithRetry(`/api/needs/madrasa/${encodeURIComponent(madrasaId)}`);
        const activeNeeds = needs.filter(n => n.status !== 'Fulfilled');
        const countEl = document.getElementById('activeNeedsCount');
        if (countEl) countEl.textContent = activeNeeds.length;

        if (!needs.length) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:24px;">No needs posted yet.</p>';
            return;
        }

        container.innerHTML = activeNeeds.map(n => {
            const urgency = n.urgencyLevel || 0;
            const cls = urgency >= 80 ? 'critical' : urgency >= 50 ? 'high' : 'normal';
            return `<div class="need-card ${cls}">
                ${urgency >= 80 ? '<span class="urgent-badge">🔥 Urgent</span>' : ''}
                <span class="badge badge-${escapeHTML(n.category || 'Other')}">${getEmoji(n.category)} ${escapeHTML(n.category || 'Other')}</span>
                <h4 class="font-bold text-gray-800 mt-2">${escapeHTML(n.title)}</h4>
                <p class="text-sm text-gray-500 mt-1">${escapeHTML(n.description || '')}</p>
                <div class="urgency-bar"><div class="urgency-fill ${cls}" style="width:${urgency}%"></div></div>
                <div style="display:flex;justify-content:space-between;margin-top:8px;">
                    <span style="font-size:0.75rem;color:#94a3b8;">Urgency: ${urgency}%</span>
                    <span style="font-weight:700;color:#0a5c2e;">₹${(n.cost || 0).toLocaleString('en-IN')}</span>
                </div>
            </div>`;
        }).join('');

        const fulfilled = needs.filter(n => n.status === 'Fulfilled').length;
        if (fulfilled > 0) {
            container.innerHTML += `<p style="text-align:center;color:#16a34a;font-size:0.85rem;margin-top:12px;">✅ ${fulfilled} need(s) fulfilled!</p>`;
        }
    } catch (err) {
        container.innerHTML = '<p style="text-align:center;color:#ef4444;padding:24px;">Failed to load needs.</p>';
    }
}

async function loadDonations(upiId) {
    const container = document.getElementById('donationsList');
    if (!container) return;
    try {
        const donations = await fetchWithRetry(`/api/donations/madrasa/${encodeURIComponent(upiId)}`);
        const total = donations.reduce((s, d) => s + (d.amount || 0), 0);
        const totalEl = document.getElementById('totalDonations');
        if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');

        if (!donations.length) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:24px;">No donations yet. Be the first! 🙏</p>';
            return;
        }

        container.innerHTML = donations.slice(0, 10).map(d => `
            <div class="donor-item">
                <div class="donor-avatar">${escapeHTML((d.donorName || 'A').charAt(0).toUpperCase())}</div>
                <div style="flex:1;">
                    <strong style="font-size:0.9rem;color:#1e293b;">${escapeHTML(d.donorName || 'Anonymous')}</strong>
                    <p style="font-size:0.75rem;color:#94a3b8;">${new Date(d.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
                <strong style="color:#0a5c2e;">₹${(d.amount || 0).toLocaleString('en-IN')}</strong>
            </div>`).join('');

        if (donations.length > 10) {
            container.innerHTML += `<p style="text-align:center;font-size:0.8rem;color:#94a3b8;margin-top:8px;">+ ${donations.length - 10} more donations</p>`;
        }
    } catch (err) {
        container.innerHTML = '<p style="text-align:center;color:#ef4444;padding:24px;">Failed to load donations.</p>';
    }
}

window.shareMadrasa = function() {
    const nameEl = document.getElementById('madrasaName');
    const name = nameEl ? nameEl.textContent : 'Madrasa';
    const url = window.location.href;
    const text = `🕌 Support ${name} - Imdad ul Madaris\n\n👉 ${url}`;
    if (navigator.share) {
        navigator.share({ title: name, text, url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Link copied!');
        }).catch(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        });
    }
};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    // Show loader once
    const loader = document.getElementById('profileLoader');
    if (loader) loader.style.display = 'flex';
    loadMadrasaProfile();
});
