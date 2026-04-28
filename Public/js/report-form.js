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
  document.getElementById('facility_id').addEventListener('change', function() {
    const selected = this.options[this.selectedIndex];
    if (selected.value) {
      document.getElementById('location_text').value = selected.dataset.address || '';
    } else {
      document.getElementById('location_text').value = '';
    }
  });

  // Submit
  document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const location_text = document.getElementById('location_text').value.trim();
    const facility_id = document.getElementById('facility_id').value || null;

    if (!title || !description) {
      showMessage('Judul dan deskripsi wajib diisi', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location_text, facility_id })
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