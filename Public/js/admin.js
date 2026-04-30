// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
  // Admin name
  const adminName = document.getElementById('adminName');
  if (adminName) adminName.textContent = 'Admin';

  // Notification bell – pakai style.display, bukan classList

  // Mark all read
  const markAllRead = document.getElementById('markAllReadBtn');
  if (markAllRead) {
    markAllRead.addEventListener('click', async () => {
      await fetch('/api/admin/mark-all-read', { method: 'PUT' });
      loadNotifications();
      const dropdown = document.getElementById('notificationDropdown');
      if (dropdown) dropdown.style.display = 'none';
    });
  }

  // Top toggle buttons – only if they exist
  const topVotesBtn = document.getElementById('topVotesBtn');
  const topRecentBtn = document.getElementById('topRecentBtn');
  if (topVotesBtn && topRecentBtn) {
    topVotesBtn.addEventListener('click', () => {
      loadTopReports('vote_count');
      topVotesBtn.classList.replace('bg-gray-300', 'bg-blue-600');
      topVotesBtn.classList.add('text-white');
      topRecentBtn.classList.replace('bg-blue-600', 'bg-gray-300');
      topRecentBtn.classList.remove('text-white');
    });
    topRecentBtn.addEventListener('click', () => {
      loadTopReports('created_at');
      topRecentBtn.classList.replace('bg-gray-300', 'bg-blue-600');
      topRecentBtn.classList.add('text-white');
      topVotesBtn.classList.replace('bg-blue-600', 'bg-gray-300');
      topVotesBtn.classList.remove('text-white');
    });
  }

  // Facility modal – only if the button exists
  const addFacilityBtn = document.getElementById('openAddFacilityModal');
  if (addFacilityBtn) {
    addFacilityBtn.addEventListener('click', () => {
      document.getElementById('modalTitle').textContent = 'Tambah Fasilitas';
      document.getElementById('facilityForm').reset();
      document.getElementById('facilityId').value = '';
      toggleModal(true);
    });
  }

  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => toggleModal(false));
  }

  const facilityForm = document.getElementById('facilityForm');
  if (facilityForm) {
    facilityForm.addEventListener('submit', saveFacility);
  }

  // Close dropdown when clicking outside (pakai style.display)
  window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    const bellBtn = document.getElementById('notificationBell');
    if (dropdown && bellBtn && !e.target.closest('#notificationBell') && !e.target.closest('#notificationDropdown')) {
      dropdown.style.display = 'none';
    }
  });

  // Load initial data
  loadStats();
  loadTopReports('vote_count');
  loadFacilities();
  loadNotifications();
});

function toggleModal(show) {
  const modal = document.getElementById('facilityModal');
  if (modal) {
    modal.classList.toggle('hidden', !show);
    modal.classList.toggle('flex', show);
  }
}

// ---------- STATISTICS ----------
async function loadStats() {
  try {
    const res = await fetch('/api/admin/statistics');
    const stats = await res.json();
    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statResolved').textContent = stats.resolved || 0;
    document.getElementById('statInProgress').textContent = stats.in_progress || 0;
    document.getElementById('statHidden').textContent = stats.hidden || 0;
  } catch (err) { console.error(err); }
}

// ---------- TOP 5 REPORTS ----------
async function loadTopReports(sortBy) {
  const container = document.getElementById('topReportsContainer');
  if (!container) return;
  container.innerHTML = '<p class="text-gray-500">Memuat...</p>';
  try {
    const res = await fetch(`/api/admin/reports?sort_by=${sortBy}&order=DESC&limit=5`);
    const reports = await res.json();
    if (!reports.length) {
      container.innerHTML = '<p class="text-gray-500">Belum ada laporan</p>';
      return;
    }
    container.innerHTML = reports.map(r => `
      <a href="/pages/report-detail.html?id=${r.id}" class="block bg-${sortBy==='vote_count'?'blue':'gray'}-50 p-3 rounded top-report-card hover:shadow">
        <h3 class="font-semibold text-blue-800 truncate">${r.title}</h3>
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>${r.reporter}</span>
          <span><i class="fas fa-${sortBy==='vote_count'?'thumbs-up':'clock'}"></i> ${sortBy==='vote_count'?r.vote_count:r.date}</span>
        </div>
        <span class="badge badge-${r.status} text-xs">${r.status}</span>
      </a>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-red-500">Gagal memuat</p>';
  }
}

// ---------- FACILITIES TABLE ----------
async function loadFacilities() {
  const tbody = document.getElementById('facilityTableBody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/admin/facilities');
    const facilities = await res.json();
    if (!facilities.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Belum ada fasilitas</td></tr>';
      return;
    }
    tbody.innerHTML = facilities.map(f => `
      <tr>
        <td class="px-6 py-4">${f.image_path ? `<img src="${f.image_path}" class="facility-img">` : '<i class="fas fa-image text-gray-400"></i>'}</td>
        <td class="px-6 py-4 font-medium"><a href="/pages/facility-detail.html?id=${f.id}" class="text-blue-700 hover:underline">${f.name}</a></td>
        <td class="px-6 py-4">${f.type}</td>
        <td class="px-6 py-4 text-sm">${f.address}</td>
        <td class="px-6 py-4 space-x-2">
          <button class="edit-facility-btn text-blue-600 hover:text-blue-800" data-id="${f.id}"><i class="fas fa-edit"></i></button>
          <button class="delete-facility-btn text-red-600 hover:text-red-800" data-id="${f.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.edit-facility-btn').forEach(btn => btn.addEventListener('click', () => editFacility(btn.dataset.id)));
    document.querySelectorAll('.delete-facility-btn').forEach(btn => btn.addEventListener('click', () => deleteFacility(btn.dataset.id)));
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-red-500">Gagal memuat</td></tr>';
  }
}

async function editFacility(id) {
  try {
    const res = await fetch(`/api/admin/facilities/${id}`);
    const f = await res.json();
    document.getElementById('facilityId').value = f.id;
    document.getElementById('facName').value = f.name;
    document.getElementById('facType').value = f.type;
    document.getElementById('facAddress').value = f.address;
    document.getElementById('facPhone').value = f.phone || '';
    document.getElementById('facHours').value = f.operating_hours || '';
    document.getElementById('modalTitle').textContent = 'Edit Fasilitas';
    toggleModal(true);
  } catch (err) { alert('Gagal memuat data fasilitas'); }
}

async function deleteFacility(id) {
  if (!confirm('Hapus fasilitas ini?')) return;
  try {
    await fetch(`/api/admin/facilities/${id}`, { method: 'DELETE' });
    loadFacilities();
  } catch (err) { alert('Gagal menghapus'); }
}

async function saveFacility(e) {
  e.preventDefault();
  const id = document.getElementById('facilityId').value;
  const formData = new FormData(e.target);
  const url = id ? `/api/admin/facilities/${id}` : '/api/admin/facilities';
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, body: formData });
    if (!res.ok) throw new Error('Gagal menyimpan');
    toggleModal(false);
    loadFacilities();
  } catch (err) { alert(err.message); }
}

// ---------- NOTIFICATIONS ----------

async function logout() {
  try {
    await fetch('/logout', { method: 'POST' });
  } catch (e) { }
  window.location.href = '/index.html';
}