// ==================== PROFILE PAGE JS ====================
var API_BASE = window.IMDAD_API_BASE;

function showToast(m, e) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = m;
    t.className = e ? 'toast error' : 'toast';
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}

async function fetchAPI(url, opts = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(API_BASE + url, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            ...opts
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        return data;
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

// Auth helper — 'user' key matches auth.js
function getUser() {
    try {
        const raw = localStorage.getItem('user') || localStorage.getItem('imdad_user');
        return JSON.parse(raw || 'null');
    } catch (e) {
        return null;
    }
}

function saveUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
}

document.addEventListener('DOMContentLoaded', () => {
    const userData = getUser();
    const userId = window.getImdadUserId(userData);
    if (!userData || !userId) {
        window.location.href = 'auth.html';
        return;
    }
    if (!userData.userId) userData.userId = userId;
    loadProfile(userData);
});

async function loadProfile(userData) {
    document.getElementById('profileAvatar').textContent = (userData.name || 'U').charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = userData.name || 'User';
    document.getElementById('profileRole').textContent = userData.role === 'madrasa' ? 'Madrasa Account' : 'Donor Account';
    document.getElementById('profilePhone').textContent = userData.phone || '';

    document.getElementById('displayName').textContent = userData.name || '--';
    document.getElementById('displayPhone').textContent = userData.phone || '--';
    document.getElementById('displayRole').textContent = userData.role === 'madrasa' ? 'Madrasa' : 'Donor';
    document.getElementById('displayDate').textContent = 'N/A';

    // Fetch full profile from backend
    try {
        // Donor ka alag API nahi hai — madrasa ka hai
        if (userData.role === 'madrasa') {
            const profile = await fetchAPI(`/api/madrasas/${userData.userId}`);
            if (profile && profile.createdAt) {
                document.getElementById('displayDate').textContent = new Date(profile.createdAt).toLocaleDateString('en-IN');
            }
        }
    } catch (e) {
        console.log('Could not fetch full profile');
    }
}

// ==================== EDIT PROFILE ====================
window.openEditModal = function() {
    const userData = getUser() || {};
    document.getElementById('editName').value = userData.name || '';
    document.getElementById('editPhone').value = userData.phone || '';
    document.getElementById('editModal').style.display = 'flex';
};

window.closeEditModal = function() {
    document.getElementById('editModal').style.display = 'none';
};

window.saveProfile = async function() {
    const userData = getUser() || {};
    const newName = document.getElementById('editName').value.trim();
    const newPhone = document.getElementById('editPhone').value.trim();

    if (!newName || !newPhone) return showToast('Fill all fields', true);
    if (newPhone.length < 10) return showToast('Valid phone required', true);

    try {
        if (userData.role === 'madrasa') {
            await fetchAPI(`/api/madrasas/${userData.userId}`, {
                method: 'PUT',
                body: JSON.stringify({ madrasaName: newName, phone: newPhone })
            });
        }
        // Donor ke liye backend update nahi hai abhi — sirf localStorage update

        userData.name = newName;
        userData.phone = newPhone;
        saveUser(userData);

        document.getElementById('profileName').textContent = newName;
        document.getElementById('profilePhone').textContent = newPhone;
        document.getElementById('profileAvatar').textContent = newName.charAt(0).toUpperCase();
        document.getElementById('displayName').textContent = newName;
        document.getElementById('displayPhone').textContent = newPhone;

        closeEditModal();
        showToast('✅ Profile updated!');
    } catch (e) {
        showToast('Failed: ' + e.message, true);
    }
};

// ==================== CHANGE PASSWORD ====================
window.openPasswordModal = function() {
    document.getElementById('passwordModal').style.display = 'flex';
};

window.closePasswordModal = function() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
};

window.changePassword = async function() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPass || !confirm) return showToast('Fill all fields', true);
    if (newPass.length < 6) return showToast('Password min 6 characters', true);
    if (newPass !== confirm) return showToast('Passwords do not match', true);

    const userData = getUser() || {};

    try {
        // Step 1: Verify current password via login
        const loginRes = await fetch(API_BASE + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userData.phone, password: current })
        });

        const loginData = await loginRes.json();
        if (!loginData.success) throw new Error(loginData.error || 'Wrong current password');

        // Step 2: Update password via dedicated route
        await fetchAPI('/api/change-password', {
            method: 'PUT',
            body: JSON.stringify({ phone: userData.phone, newPassword: newPass })
        });

        closePasswordModal();
        showToast('✅ Password updated! Please login again.');
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'auth.html';
        }, 2000);
    } catch (e) {
        showToast(e.message || 'Failed to update password', true);
    }
};

// ==================== LOGOUT ====================
window.logoutUser = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('auth.html');
};

// Modal close on outside click
window.addEventListener('click', (e) => {
    const editModal = document.getElementById('editModal');
    const passModal = document.getElementById('passwordModal');
    if (editModal && e.target === editModal) editModal.style.display = 'none';
    if (passModal && e.target === passModal) {
        passModal.style.display = 'none';
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }
});