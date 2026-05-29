// ==================== DONATION MODAL & UPI LOGIC ====================

let currentUpi = "";
let currentName = "";
let selectedAmount = 101;

// 1. Modal inject karo dynamically
function injectDonationModal() {
    if (document.getElementById('donationModal')) return;

    const modalHTML = `
    <div id="donationModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; font-family: sans-serif;">
        <div style="background:white; border-radius:18px; padding:24px; width:90%; max-width:380px; position:relative;">
            <span id="closeDonationModalBtn" style="position:absolute; top:15px; right:20px; font-size:24px; cursor:pointer; color:#64748b;">&times;</span>
            <h3 id="modalName" style="margin-top:0; color:#1e293b; text-align:center;">Madrasa Name</h3>
            <p id="modalUpi" style="text-align:center; color:#64748b; font-size:0.9rem; margin-bottom:15px;"></p>
            <div id="amountOptions" style="display:flex; justify-content:space-between; margin-bottom:15px;"></div>
            <input type="number" id="customAmount" placeholder="Enter Custom Amount" style="width:100%; padding:12px; border:2px solid #e2e8f0; border-radius:10px; font-size:0.9rem; outline:none; box-sizing:border-box; margin-bottom:15px;">
            <div id="qrContainer" style="text-align:center; margin-bottom:15px;"></div>
            <button id="proceedDonateBtn" style="background:#0a5c2e; color:white; width:100%; padding:12px; border:none; border-radius:10px; font-weight:600; cursor:pointer; font-size:1rem;">
                Proceed to Pay
            </button>
        </div>
    </div>
    <style>
        .amt-btn { padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; cursor:pointer; background:white; font-weight:500; flex:1; margin:0 4px; text-align:center; }
        .amt-btn.active { background:#0a5c2e; color:white; border-color:#0a5c2e; }
    </style>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupDonationEvents();
}

// 2. Modal open
window.openDonationModal = function(upi, name) {
    currentUpi = upi;
    currentName = name;
    selectedAmount = 101;

    document.getElementById('modalName').innerText = name;
    document.getElementById('modalUpi').textContent = `UPI: ${upi}`;
    document.getElementById('customAmount').value = '';
    document.getElementById('qrContainer').innerHTML = '';

    const amounts = [51, 101, 501, 1001];
    const amtContainer = document.getElementById('amountOptions');

    amtContainer.innerHTML = amounts.map(a =>
        `<div class="amt-btn ${a === 101 ? 'active' : ''}" data-amount="${a}">₹${a}</div>`
    ).join('');

    amtContainer.querySelectorAll('.amt-btn').forEach(btn => {
        btn.onclick = () => {
            selectedAmount = Number(btn.dataset.amount);
            document.getElementById('customAmount').value = '';
            amtContainer.querySelectorAll('.amt-btn').forEach(x => x.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    document.getElementById('donationModal').style.display = 'flex';
};

// 3. Events setup
function setupDonationEvents() {
    const modal = document.getElementById('donationModal');
    const closeBtn = document.getElementById('closeDonationModalBtn');
    const proceedBtn = document.getElementById('proceedDonateBtn');

    closeBtn.onclick = () => modal.style.display = 'none';
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    document.getElementById('customAmount').addEventListener('input', (e) => {
        if (e.target.value) {
            document.querySelectorAll('.amt-btn').forEach(x => x.classList.remove('active'));
        }
    });

    proceedBtn.onclick = async () => {
        const inputAmt = document.getElementById('customAmount').value;
        if (inputAmt && parseFloat(inputAmt) > 0) selectedAmount = parseFloat(inputAmt);

        if (!selectedAmount || selectedAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const link = `upi://pay?pa=${encodeURIComponent(currentUpi)}&pn=${encodeURIComponent(currentName)}&am=${selectedAmount}&cu=INR`;

        const qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = `
            <div id="qrcode" style="display:flex; justify-content:center; margin-bottom:10px;"></div>
            <p style="font-weight:600; font-size:1.2rem; margin:10px 0;">₹${selectedAmount}</p>
            <a href="${link}" style="display:inline-block; background:#0a5c2e; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600; width:100%; box-sizing:border-box;">
                🚀 Open UPI App (GPay/PhonePe)
            </a>`;

        setTimeout(() => {
            if (typeof QRCode !== 'undefined') {
                new QRCode(document.getElementById("qrcode"), {
                    text: link, width: 150, height: 150,
                    colorDark: "#000000", colorLight: "#ffffff"
                });
            }
        }, 100);

        // Save donation record — 'user' key use karo
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const donorName = userData.name || 'Anonymous';
            const donorPhone = userData.phone || '';
            const donorEmail = donorPhone ? donorPhone + '@imdad.com' : 'donor@imdad.com';

            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token && { Authorization: 'Bearer ' + token })
            };

            await fetch((window.IMDAD_API_BASE || 'https://imdad-backend-1.onrender.com') + '/api/donations', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    donorName,
                    donorEmail,
                    donorPhone,
                    madrasaName: currentName,
                    madrasaUpi: currentUpi,
                    amount: selectedAmount,
                    donationType: 'General'
                })
            });
        } catch (e) {
            console.error('Failed to save donation record', e);
        }
    };
}

// 4. DOM load hone par inject karo
document.addEventListener('DOMContentLoaded', injectDonationModal);
