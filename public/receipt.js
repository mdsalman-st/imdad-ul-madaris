const API_BASE = 'https://imdad-backend-1.onrender.com';

async function fetchAPI(url) {
  const res = await fetch(API_BASE + url);
  return res.json();
}

document.getElementById('searchBtn').onclick = async () => {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  
  try {
    const donations = await fetchAPI('/api/donations/' + query);
    if (donations.length > 0) {
      showReceipt(donations[0]);
    } else {
      document.getElementById('errorMsg').style.display = 'block';
    }
  } catch {
    document.getElementById('errorMsg').style.display = 'block';
  }
};

function showReceipt(d) {
  document.getElementById('searchCard').style.display = 'none';
  document.getElementById('receiptCard').style.display = 'block';
  document.getElementById('receiptCard').innerHTML = `
    <h3>Donation Receipt</h3>
    <div class="row"><span>Receipt No</span><span>${d.receiptNo || 'IMD-'+Date.now()}</span></div>
    <div class="row"><span>Donor</span><span>${d.donorName}</span></div>
    <div class="row"><span>Madrasa</span><span>${d.madrasaName}</span></div>
    <div class="row"><span>Date</span><span>${new Date(d.date).toLocaleDateString('en-IN')}</span></div>
    <div class="row"><span>Type</span><span>${d.donationType||'General'}</span></div>
    <div class="row amount-row"><span>Amount</span><span>₹${d.amount}</span></div>
    <div class="btn-row">
      <button class="btn btn-print" onclick="window.print()">Print</button>
      <button class="btn btn-new" onclick="location.reload()">New Search</button>
    </div>
  `;
}