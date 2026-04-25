
document.addEventListener('DOMContentLoaded', async () => {

  try {
    const res = await fetch('/me');
    if (!res.ok) throw new Error('Not logged in');
    const user = await res.json();
    if (!user.loggedIn || user.role !== 'admin') {
      window.location.href = '/login.html?role=admin';
      return;
    }
    document.getElementById('adminName').textContent = user.name;
  } catch {
    window.location.href = '/login.html?role=admin';
    return;
  }

  // Load data
  loadStats();
  loadTopReports('vote_count'); // default by votes
  loadFacilities();
  loadNotifications();

// Toggle notification dropdown
document.getElementById('notificationBell').addEventListener('click', () => {
  document.getElementById('notificationDropdown').classList.toggle('hidden');
});

// Mark all read
document.getElementById('markAllReadBtn').addEventListener('click', async () => {
  await fetch('/api/admin/mark-all-read', { method: 'PUT' });
  loadNotifications();
  document.getElementById('notificationDropdown').classList.add('hidden');
});

// Close dropdown if clicking outside (optional)
window.addEventListener('click', (e) => {
  if (!e.target.closest('#notificationBell') && !e.target.closest('#notificationDropdown')) {
    document.getElementById('notificationDropdown').classList.add('hidden');
  }
});

  // Top toggle buttons
  document.getElementById('topVotesBtn').addEventListener('click', () => {
    loadTopReports('vote_count');
    document.getElementById('topVotesBtn').classList.replace('bg-gray-300','bg-blue-600');
    document.getElementById('topVotesBtn').classList.add('text-white');
    document.getElementById('topRecentBtn').classList.replace('bg-blue-600','bg-gray-300');
    document.getElementById('topRecentBtn').classList.remove('text-white');
  });
  document.getElementById('topRecentBtn').addEventListener('click', () => {
    loadTopReports('created_at');
    document.getElementById('topRecentBtn').classList.replace('bg-gray-300','bg-blue-600');
    document.getElementById('topRecentBtn').classList.add('text-white');
    document.getElementById('topVotesBtn').classList.replace('bg-blue-600','bg-gray-300');
    document.getElementById('topVotesBtn').classList.remove('text-white');
  });

  // Facility modal
  document.getElementById('openAddFacilityModal').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Tambah Fasilitas';
    document.getElementById('facilityForm').reset();
    document.getElementById('facilityId').value = '';
    toggleModal(true);
  });
  document.getElementById('closeModalBtn').addEventListener('click', () => toggleModal(false));
  document.getElementById('facilityForm').addEventListener('submit', saveFacility);
});

function toggleModal(show) {
  const modal = document.getElementById('facilityModal');
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
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
        <td class="px-6 py-4 font-medium"><a href="/pages/admin-facility.html?id=${f.id}" class="text-blue-700 hover:underline">${f.name}</a></td>
        <td class="px-6 py-4">${f.type}</td>
        <td class="px-6 py-4 text-sm">${f.address}</td>
        <td class="px-6 py-4 space-x-2">
          <button class="edit-facility-btn text-blue-600 hover:text-blue-800" data-id="${f.id}"><i class="fas fa-edit"></i></button>
          <button class="delete-facility-btn text-red-600 hover:text-red-800" data-id="${f.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.edit-facility-btn').forEach(btn => {
      btn.addEventListener('click', () => editFacility(btn.dataset.id));
    });
    document.querySelectorAll('.delete-facility-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteFacility(btn.dataset.id));
    });
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
  const formData = new FormData(document.getElementById('facilityForm'));
  const url = id ? `/api/admin/facilities/${id}` : '/api/admin/facilities';
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, body: formData });
    if (!res.ok) throw new Error('Gagal menyimpan');
    toggleModal(false);
    loadFacilities();
  } catch (err) { alert(err.message); }
}
async function loadNotifications() {
  try {
    const res = await fetch('/api/admin/unread-notifications');
    const data = await res.json();
    const countSpan = document.getElementById('notificationCount');
    const listDiv = document.getElementById('notificationList');

    if (data.count > 0) {
      countSpan.textContent = data.count > 9 ? '9+' : data.count;
      countSpan.classList.remove('hidden');
    } else {
      countSpan.classList.add('hidden');
    }

    if (!data.reports.length) {
      listDiv.innerHTML = '<p class="text-center text-gray-500 p-4">Tidak ada laporan baru</p>';
      return;
    }

    listDiv.innerHTML = data.reports.map(r => `
      <a href="/pages/report-detail.html?id=${r.id}" class="block px-4 py-3 hover:bg-gray-50 border-b flex justify-between items-center report-notif-item" data-id="${r.id}">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-800 truncate">${r.title}</p>
          <p class="text-xs text-gray-400">${r.date}</p>
        </div>
        <span class="badge badge-${r.status} text-xs ml-2">${r.status}</span>
      </a>
    `).join('');

    // Mark as read when clicking a notification
   document.querySelectorAll('.report-notif-item').forEach(item => {
  item.addEventListener('click', async (e) => {
    e.preventDefault(); // Stop immediate navigation

    const id = item.getAttribute('data-id');
    const href = item.getAttribute('href'); // We'll add href to the <a>

    try {
      await fetch(`/api/admin/reports/${id}/mark-read`, { method: 'PUT' });
      // After successful mark‑read, navigate to the detail page
      window.location.href = href;
    } catch (err) {
      console.error('Gagal menandai sebagai dibaca', err);
      // Still navigate even if mark‑read fails? Or show error?
      window.location.href = href;
    }
  });
});
  } catch (err) {
    console.error('Gagal memuat notifikasi', err);
  }
}