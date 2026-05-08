// ==================== DASHBOARD JS (FINAL VERSION WITH API) ====================
const API_BASE = 'https://imdad-backend-1.onrender.com';

// Helper to show toast messages
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.cssText = `display:block;background:${err?'#dc2626':'#0a5c2e'};color:white;padding:12px 24px;border-radius:30px;font-weight:600;`;
  setTimeout(() => t.style.display = 'none', 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('imdad_user') || 'null');
    
    // 1. Redirect if not logged in
    if (!userData || !userData.userId) {
        window.location.href = 'auth.html';
        return;
    }

    const role = (userData.role || '').toLowerCase();
    
    document.getElementById('sidebarName').textContent = userData.name || 'User';
    document.getElementById('greeting').textContent = 'Welcome, ' + (userData.name || 'User') + '!';

    if (role === 'madrasa') {
        // ========== MADRASA UI SETUP ==========
        document.getElementById('madrasaTabs').style.display = 'block';
        document.getElementById('donorTabs').style.display = 'none';
        document.getElementById('sidebarRole').textContent = 'Madrasa Account';
        
        const badge = document.getElementById('statusBadge');
        if (badge) badge.style.display = 'inline-block';
        
        document.getElementById('sidebarNav').innerHTML = `
            <a href="#" onclick="switchTab('overviewTab')" class="block py-2.5 px-4 bg-green-700 rounded-lg text-sm font-medium mb-1">📊 Overview</a>
            <a href="#" onclick="switchTab('needsTab')" class="block py-2.5 px-4 hover:bg-green-700 rounded-lg text-sm font-medium mb-1">📝 My Needs</a>
            <a href="#" onclick="switchTab('donationsTab')" class="block py-2.5 px-4 hover:bg-green-700 rounded-lg text-sm font-medium mb-1">💰 Donations</a>
            <a href="#" onclick="switchTab('profileTab')" class="block py-2.5 px-4 hover:bg-green-700 rounded-lg text-sm font-medium mb-1">⚙️ Profile</a>`;
            
        // 🚀 API CALL: Fetch madrasa profile to get UPI ID, then fetch donations
        fetchMadrasaProfileAndDonations(userData.userId);
            
    } else {
        // ========== DONOR UI SETUP ==========
        document.getElementById('madrasaTabs').style.display = 'none';
        document.getElementById('donorTabs').style.display = 'block';
        document.getElementById('sidebarRole').textContent = 'Donor Account';
        
        const badge = document.getElementById('statusBadge');
        if (badge) badge.style.display = 'none';
        
        document.getElementById('sidebarNav').innerHTML = `
            <a href="#" onclick="switchTab('donorOverviewTab')" class="block py-2.5 px-4 bg-green-700 rounded-lg text-sm font-medium mb-1">📊 Overview</a>
            <a href="#" onclick="switchTab('donorDonationsTab')" class="block py-2.5 px-4 hover:bg-green-700 rounded-lg text-sm font-medium mb-1">💰 My Donations</a>
            <a href="#" onclick="switchTab('donorProfileTab')" class="block py-2.5 px-4 hover:bg-green-700 rounded-lg text-sm font-medium mb-1">⚙️ Profile</a>`;
    }
});

// ==================== TAB SWITCHING & MENU ====================
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
};

const mobileBtn = document.getElementById('mobileMenuBtn');
if (mobileBtn) mobileBtn.addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('mobileOverlay').style.display = 'block';
});

window.closeMobileSidebar = function() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobileOverlay').style.display = 'none';
};

window.logoutUser = function() {
  localStorage.removeItem('imdad_user');
  localStorage.removeItem('imdad_donor');
  window.location.href = 'auth.html';
};

// ==================== MADRASA API LOGIC ====================

// 1. Pehle Madrasa ki UPI ID nikalenge, fir uski donations layenge
async function fetchMadrasaProfileAndDonations(userId) {
    try {
        const res = await fetch(`${API_BASE}/api/madrasas/${userId}`);
        const madrasaData = await res.json();
        
        if (madrasaData && madrasaData.upiId) {
            loadMadrasaDonations(madrasaData.upiId);
        }
    } catch (err) {
        console.error("Profile fetch error:", err);
    }
}

// 2. Pending & Received Donations Table mein render karna
async function loadMadrasaDonations(upiId) {
    const tableBody = document.getElementById('donationsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading donations...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/api/donations/madrasa/${upiId}`);
        const donations = await res.json();

        if (donations.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No donations found yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        
        donations.forEach(donation => {
            const date = new Date(donation.date).toLocaleDateString('en-IN');
            
            let actionHtml = '';
            let statusStyle = '';
            
            if (donation.status === 'Pending') {
                statusStyle = 'color: #d97706; font-weight: bold;';
                actionHtml = `<button onclick="updatePaymentStatus('${donation._id}', 'Received')" style="background:#0a5c2e; color:white; padding:5px 10px; border-radius:5px; border:none; cursor:pointer; font-size:12px;">✅ Mark Received</button>`;
            } else {
                statusStyle = 'color: #059669; font-weight: bold;';
                actionHtml = `<span style="color:#059669; font-size:12px;">Verified ✓</span>`;
            }

            const row = `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${donation.donorName}</td>
                    <td style="padding: 10px;">₹${donation.amount}</td>
                    <td style="padding: 10px;">${date}</td>
                    <td style="padding: 10px; ${statusStyle}">${donation.status}</td>
                    <td style="padding: 10px;">${actionHtml}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (err) {
        console.error("Donations fetch error:", err);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load data.</td></tr>';
    }
}

// 3. Mark as Received Button ka function
window.updatePaymentStatus = async function(donationId, newStatus) {
    if (!confirm(`Are you sure you received this payment in your bank account?`)) return;

    try {
        const res = await fetch(`${API_BASE}/api/donations/${donationId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (data.success) {
            alert('✅ Payment status updated successfully!');
            window.location.reload();
        } else {
            alert('❌ Failed to update status.');
        }
    } catch (err) {
        console.error("Status update error:", err);
        alert('❌ Network error. Try again.');
    }
};