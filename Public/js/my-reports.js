// public/js/my-reports.js

CitizenGuard.protect();

const statusBadge = {
  new: 'bg-primary',
  in_progress: 'bg-warning text-dark',
  resolved: 'bg-success',
  hidden: 'bg-secondary'
};

let currentEditId = null;
let myReportsData = [];
let currentUser = null;

// ---------- Load My Reports ----------
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

    myReportsData = data.data;

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
            ${r.image_path ? `
            <div class="mb-2">
              <img src="${r.image_path}" class="img-fluid rounded" style="max-height:100px; cursor:pointer;"
                   onclick="viewFullImage('${r.image_path}', ${r.id})" alt="Gambar laporan">
            </div>` : ''}
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

// ---------- Full Image Overlay ----------
async function viewFullImage(imagePath, reportId) {
  try {
    if (!currentUser) {
      const meRes = await fetch('/me');
      if (!meRes.ok) { alert('Anda harus login'); return; }
      const meData = await meRes.json();
      if (!meData.loggedIn) { alert('Anda harus login'); return; }
      currentUser = meData;
    }

    const report = myReportsData.find(r => r.id === reportId);
    if (!report) { alert('Data laporan tidak ditemukan'); return; }

    const isOwner = report.user_id === currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      alert('Anda tidak memiliki akses untuk melihat gambar ini.');
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'imageOverlay';
    overlay.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
    overlay.innerHTML = `<img src="${imagePath}" style="max-width:90vw;max-height:90vh;object-fit:contain;">`;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  } catch (err) {
    alert('Terjadi kesalahan');
  }
}

// ---------- Open Edit Modal (prefill all fields) ----------
async function openEditModal(id) {
  currentEditId = id;
  const report = myReportsData.find(r => r.id === id);
  if (!report) return;

  // Prefill text fields
  document.getElementById('editTitle').value = report.title || '';
  document.getElementById('editDescription').value = report.description || '';
  document.getElementById('editLocation').value = report.location_text || '';

  // Load facilities into dropdown (using the proven pattern)
  const sel = document.getElementById('editFacility');
  // Remove all existing options except the first placeholder
  sel.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());

  try {
    const res = await fetch('/api/facilities');
    const data = await res.json();
    // Handle both array and { data: [] }
    const facilities = Array.isArray(data) ? data : (data.data || data.facilities || []);

    facilities.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      sel.appendChild(opt);
    });

    // Now set the facility value from the report
    const facilityVal = report.facility_id ? report.facility_id.toString() : '';
    document.getElementById('editFacility').value = facilityVal;
  } catch (err) {
    console.error('Gagal memuat fasilitas untuk edit modal:', err);
  }

  // Show current image preview (if any)
  const previewContainer = document.getElementById('editImagePreview');
  const previewImg = document.getElementById('editCurrentImage');
  if (report.image_path) {
    previewImg.src = report.image_path;
    previewContainer.style.display = 'block';
  } else {
    previewContainer.style.display = 'none';
  }

  // Reset file input
  document.getElementById('editImage').value = '';

  // Show Bootstrap modal
  const modal = new bootstrap.Modal(document.getElementById('editReportModal'));
  modal.show();
}

// ---------- Save Edit ----------
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

// ---------- Delete Report ----------
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
window.viewFullImage = viewFullImage;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const meRes = await fetch('/me');
    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData.loggedIn) currentUser = meData;
    }
  } catch (_) {}
  loadMyReports();
});