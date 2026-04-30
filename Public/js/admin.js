// public/js/admin.js – Dashboard ONLY (no facility modal, no notification bell)

document.addEventListener('DOMContentLoaded', () => {
  // Stats, top-5, facility table, notifications
  loadStats();
  loadTopReports('vote_count');
  loadFacilities();
  loadNotifications();

  // Top toggle buttons (if present)
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
});

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
      <a href="/report-detail?id=${r.id}" class="block bg-${sortBy==='vote_count'?'blue':'gray'}-50 p-3 rounded top-report-card hover:shadow">
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

// ---------- FACILITIES TABLE (dashboard only) ----------
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

    // Edit & Delete buttons (they will open the separate facility search page)
    tbody.querySelectorAll('.edit-facility-btn').forEach(btn => {
      btn.addEventListener('click', () => window.location.href = `/pages/admin-facility-search.html?edit=${btn.dataset.id}`);
    });
    tbody.querySelectorAll('.delete-facility-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus fasilitas ini?')) return;
        await fetch(`/api/admin/facilities/${btn.dataset.id}`, { method: 'DELETE' });
        loadFacilities();
      });
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-red-500">Gagal memuat</td></tr>';
  }
}

// ---------- NOTIFICATIONS (data only) ----------
async function loadNotifications() {
  const countSpan = document.getElementById('notificationCount');
  const listDiv   = document.getElementById('notificationList');
  if (!countSpan || !listDiv) return;

  try {
    const res = await fetch('/api/admin/unread-notifications');
    const data = await res.json();

    if (data.count > 0) {
      countSpan.textContent = data.count > 9 ? '9+' : data.count;
      countSpan.style.display = 'flex';
    } else {
      countSpan.style.display = 'none';
    }

    if (!data.reports.length) {
      listDiv.innerHTML = '<p class="text-center text-gray-500 p-4">Tidak ada laporan baru</p>';
      return;
    }

    listDiv.innerHTML = data.reports.map(r => `
      <a href="/report-detail?id=${r.id}" class="block px-4 py-3 hover:bg-gray-50 border-b flex justify-between items-center report-notif-item" data-id="${r.id}">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-800 truncate">${r.title}</p>
          <p class="text-xs text-gray-400">${r.date}</p>
        </div>
        <span class="badge badge-${r.status} text-xs ml-2">${r.status}</span>
      </a>
    `).join('');

    // Mark as read on click
    document.querySelectorAll('.report-notif-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = item.getAttribute('data-id');
        const href = item.getAttribute('href');
        try { await fetch(`/api/admin/reports/${id}/mark-read`, { method: 'PUT' }); } catch (_) {}
        window.location.href = href;
      });
    });
  } catch (err) {
    console.error('Gagal memuat notifikasi', err);
  }
}
// Facility modal – redirect to search page with parameter
const addFacilityBtn = document.getElementById('openAddFacilityModal');
if (addFacilityBtn) {
  addFacilityBtn.addEventListener('click', () => {
    window.location.href = '/pages/admin-facility-search.html?add=1';
  });
}

// In loadFacilities(), change edit button to redirect:
tbody.innerHTML = facilities.map(f => `
  <tr>
    <td class="px-6 py-4">${f.image_path ? `<img src="${f.image_path}" class="facility-img">` : '<i class="fas fa-image text-gray-400"></i>'}</td>
    <td class="px-6 py-4 font-medium"><a href="/pages/facility-detail.html?id=${f.id}" class="text-blue-700 hover:underline">${f.name}</a></td>
    <td class="px-6 py-4">${f.type}</td>
    <td class="px-6 py-4 text-sm">${f.address}</td>
    <td class="px-6 py-4 space-x-2">
      <button class="edit-facility-btn text-blue-600 hover:text-blue-800" data-id="${f.id}">
        <i class="fas fa-edit"></i>
      </button>
      <button class="delete-facility-btn text-red-600 hover:text-red-800" data-id="${f.id}">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  </tr>
`).join('');

// Edit button → redirect
document.querySelectorAll('.edit-facility-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    window.location.href = `/pages/admin-facility-search.html?edit=${btn.dataset.id}`;
  });
});

// Delete button → tetap di dashboard
document.querySelectorAll('.delete-facility-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (!confirm('Hapus fasilitas ini?')) return;
    await fetch(`/api/admin/facilities/${btn.dataset.id}`, { method: 'DELETE' });
    loadFacilities();
  });
});
async function logout() {
  await fetch('/logout', { method: 'POST' });
  window.location.href = '/index.html';
}