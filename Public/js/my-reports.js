// public/js/my-reports.js

CitizenGuard.protect();

const statusBadge = {
  new: 'bg-primary',
  in_progress: 'bg-warning text-dark',
  resolved: 'bg-success',
  hidden: 'bg-secondary'
};

let currentEditId = null;
let myReportsData = [];  // store fetched reports for easy access

async function loadMyReports() {
  const container = document.getElementById('myReportsContainer');
  try {
    const res = await fetch('/api/reports/my');
    const data = await res.json();
    if (!data.success || !data.data.length) {
      container.innerHTML = `<div class="col-12 text-center py-5 text-muted">
        <i class="fas fa-inbox fa-3x mb-3"></i>
        <p>Belum ada laporan. <a href="report-form.html" class="btn btn-primary btn-sm mt-2">Buat laporan pertama!</a></p>
      </div>`;
      return;
    }

    myReportsData = data.data;  // cache

    container.innerHTML = myReportsData.map(r => `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">
              <a href="/report-detail?id=${r.id}" class="text-decoration-none">${esc(r.title)}</a>
            </h5>
            <p class="card-text small text-muted mb-2">
              <i class="fas fa-building me-1"></i>${esc(r.facility || 'Tanpa fasilitas')}
            </p>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge ${statusBadge[r.status] || 'bg-secondary'}">${r.status}</span>
              <small class="text-muted">
                <i class="fas fa-thumbs-up text-primary me-1"></i>${r.vote_count}
              </small>
            </div>
            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${r.id})">
                <i class="fas fa-pen"></i> Edit
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteMyReport(${r.id})">
                <i class="fas fa-trash"></i> Hapus
              </button>
            </div>
            <div class="mt-2 small text-muted">
              <i class="far fa-clock me-1"></i>${new Date(r.created_at).toLocaleDateString('id-ID')}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-danger text-center">Gagal memuat laporan.</p>';
  }
}

function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ------------- Edit function (from cached data) -------------
async function openEditModal(id) {
  currentEditId = id;
  const report = myReportsData.find(r => r.id === id);
  if (!report) return;

  document.getElementById('editTitle').value = report.title || '';
  document.getElementById('editDescription').value = report.description || '';
  document.getElementById('editLocation').value = report.location_text || '';
  // facility_id might be null or a number; if null set to empty string
  const facilityVal = report.facility_id ? report.facility_id.toString() : '';
  document.getElementById('editFacility').value = facilityVal;

  document.getElementById('editImage').value = ''; // reset file input

  // Ensure facilities dropdown is filled
  const sel = document.getElementById('editFacility');
  if (sel.options.length <= 1) {
    try {
      const res = await fetch('/api/facilities');
      const facilities = await res.json();
      facilities.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        sel.appendChild(opt);
      });
      // Set again after loading options
      document.getElementById('editFacility').value = report.facility_id ? report.facility_id.toString() : '';
    } catch (_) {}
  }

  const modal = new bootstrap.Modal(document.getElementById('editReportModal'));
  modal.show();
}

// ------------- Save Edit -------------
document.getElementById('saveEditBtn').addEventListener('click', async () => {
  const formData = new FormData(document.getElementById('editReportForm'));

  try {
    const res = await fetch(`/api/reports/${currentEditId}`, {
      method: 'PUT',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('editReportModal')).hide();
      loadMyReports(); // refresh list
    } else {
      alert(data.message || 'Gagal menyimpan perubahan');
    }
  } catch (err) {
    alert('Gagal terhubung ke server');
  }
});

// ------------- Delete function -------------
async function deleteMyReport(id) {
  if (!confirm('Hapus laporan ini?')) return;
  try {
    const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadMyReports(); // refresh list
    } else {
      alert(data.message || 'Gagal menghapus');
    }
  } catch (err) {
    alert('Gagal terhubung ke server');
  }
}

// Expose to inline onclick
window.openEditModal = openEditModal;
window.deleteMyReport = deleteMyReport;

document.addEventListener('DOMContentLoaded', loadMyReports);