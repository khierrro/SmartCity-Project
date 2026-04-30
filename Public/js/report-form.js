// public/js/report-form.js
CitizenGuard.protect();

// Store facilities globally for easy lookup
let facilitiesData = [];

// Load facilities
async function loadFacilities() {
  try {
    const res = await fetch('/api/facilities');
    const data = await res.json();
    console.log('Facilities API raw response:', data);

    // Handle both array and { data: [] }
    const facilities = Array.isArray(data) ? data : (data.data || data.facilities || []);

    facilitiesData = facilities;
    const sel = document.getElementById('facility_id');
    facilities.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      opt.dataset.address = f.address;   // for autofill
      sel.appendChild(opt);
    });
  } catch (err) {
  }
}

// Autofill location when facility selected
document.getElementById('facility_id').addEventListener('change', function () {
  const selectedId = this.value;
  if (!selectedId) {
    document.getElementById('location_text').value = '';
    return;
  }
  const facility = facilitiesData.find(f => f.id == selectedId);
  if (facility && facility.address) {
    document.getElementById('location_text').value = facility.address;
  } else {
    document.getElementById('location_text').value = '';
  }
});

// Submit (using FormData)
document.getElementById('reportForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(document.getElementById('reportForm'));
  if (!formData.get('facility_id')) formData.delete('facility_id');

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      body: formData
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

// Start loading facilities
loadFacilities();