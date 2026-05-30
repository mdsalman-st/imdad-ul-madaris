var API_BASE = window.IMDAD_API_BASE;

async function fetchAPI(url) {
  const res = await fetch(API_BASE + url);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  if (!searchBtn || !searchInput) return;

  const urlParams = new URLSearchParams(window.location.search);
  const autoQuery = urlParams.get('q');
  if (autoQuery) {
    searchInput.value = autoQuery;
    setTimeout(() => searchBtn.click(), 100);
  }

  searchBtn.onclick = async () => {
    const query = document.getElementById('searchInput')?.value.trim();
    if (!query) return;
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) errorMsg.style.display = 'none';

    try {
      const donations = await fetchAPI('/api/donations/' + encodeURIComponent(query));
      const list = Array.isArray(donations) ? donations : (donations.donations || []);
      if (list.length > 0) {
        showReceipt(list[0]);
      } else if (errorMsg) {
        errorMsg.style.display = 'block';
      }
    } catch {
      if (errorMsg) errorMsg.style.display = 'block';
    }
  };
});

function showReceipt(d) {
  document.getElementById('searchCard').style.display = 'none';
  document.getElementById('receiptCard').style.display = 'block';
  const receiptNo = escapeHTML(d.receiptNo || 'IMD-' + Date.now());
  const donorName = escapeHTML(d.donorName || 'Anonymous');
  const madrasaName = escapeHTML(d.madrasaName || 'Unknown');
  const date = d.date ? new Date(d.date).toLocaleDateString('en-IN') : '--';
  const donationType = escapeHTML(d.donationType || 'General');
  const amount = Number(d.amount || 0).toLocaleString('en-IN');

  document.getElementById('receiptCard').innerHTML = `
    <h3>Donation Receipt</h3>
    <div class="row"><span>Receipt No</span><span>${receiptNo}</span></div>
    <div class="row"><span>Donor</span><span>${donorName}</span></div>
    <div class="row"><span>Madrasa</span><span>${madrasaName}</span></div>
    <div class="row"><span>Date</span><span>${date}</span></div>
    <div class="row"><span>Type</span><span>${donationType}</span></div>
    <div class="row amount-row"><span>Amount</span><span>Rs ${amount}</span></div>
    <div class="btn-row">
      <button class="btn btn-print" onclick="window.print()">Print</button>
      <button class="btn btn-new" onclick="location.reload()">New Search</button>
    </div>
  `;
}
