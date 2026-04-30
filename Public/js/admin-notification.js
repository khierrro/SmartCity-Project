// public/js/admin-notifications.js
// Shared notification logic for all admin pages

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
      <a href="/pages/report-detail.html?id=${r.id}"
         class="block px-4 py-3 hover:bg-gray-50 border-b flex justify-between items-center report-notif-item"
         data-id="${r.id}">
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
        try {
          await fetch(`/api/admin/reports/${id}/mark-read`, { method: 'PUT' });
        } catch (_) {}
        window.location.href = href;
      });
    });
  } catch (err) {
    console.error('Gagal memuat notifikasi', err);
  }
}

function initNotifications() {
  const bell = document.getElementById('notificationBell');
  const dropdown = document.getElementById('notificationDropdown');
  const markAllRead = document.getElementById('markAllReadBtn');

  // Toggle dropdown (inline style)
  if (bell && dropdown) {
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Mark all read
  if (markAllRead) {
    markAllRead.addEventListener('click', async () => {
      await fetch('/api/admin/mark-all-read', { method: 'PUT' });
      loadNotifications();
      if (dropdown) dropdown.style.display = 'none';
    });
  }

  // Close when clicking outside
  window.addEventListener('click', (e) => {
    if (bell && dropdown &&
        !e.target.closest('#notificationBell') &&
        !e.target.closest('#notificationDropdown')) {
      dropdown.style.display = 'none';
    }
  });

  // Initial load
  loadNotifications();
}

document.addEventListener('DOMContentLoaded', initNotifications);