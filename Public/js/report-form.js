 
 // Protect page – only citizens
  CitizenGuard.protect();

  // Load facilities
  async function loadFacilities() {
    try {
      const res = await fetch('/api/facilities');
      const facilities = await res.json();
      const sel = document.getElementById('facility_id');
      facilities.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        opt.dataset.address = f.address;
        sel.appendChild(opt);
      });
    } catch (_) {}
  }

  // Autofill location when facility selected
// Submit
// Submit
document.getElementById('reportForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(document.getElementById('reportForm'));
  if (!formData.get('facility_id')) formData.delete('facility_id');

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      body: formData   // ← crucial: no headers, let the browser set multipart
    });
    const data = await res.json();
    if (data.success) {
      showMessage('Laporan berhasil dikirim!', 'success');
      document.getElementById('reportForm').reset();
      setTimeout(() => window.location.href = 'reports.html', 1500);
    } else {
      showMessage(data.message || 'Gagal mengirim', 'danger');
    }
  } catch (err) {
    showMessage('Gagal terhubung ke server', 'danger');
  }
});
  function showMessage(msg, type) {
    const div = document.getElementById('message');
    div.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => div.innerHTML = '', 3000);
  }

  loadFacilities();