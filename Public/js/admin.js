document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadReportsTable();

  // Muat data dashboard
  async function loadDashboard() {
    try {
      const res = await fetch('/api/admin/statistics');
      if (!res.ok) throw new Error('Gagal memuat statistik');
      const stats = await res.json();
      document.getElementById('totalReports').textContent = stats.total;
      document.getElementById('totalResolved').textContent = stats.resolved;
      document.getElementById('totalInProgress').textContent = stats.in_progress;
      document.getElementById('totalHidden').textContent = stats.hidden;

      const facilityBody = document.getElementById('facilityStats');
      facilityBody.innerHTML = '';
      if (stats.facilityStats.length === 0) {
        facilityBody.innerHTML = '<tr><td colspan="2" class="p-2 text-center text-gray-500">Belum ada data</td></tr>';
      } else {
        stats.facilityStats.forEach(f => {
          facilityBody.innerHTML += `<tr><td class="p-2">${f.name}</td><td>${f.count}</td></tr>`;
        });
      }

      const latestList = document.getElementById('latestReports');
      latestList.innerHTML = '';
      if (stats.latestReports.length === 0) {
        latestList.innerHTML = '<li class="p-2 text-gray-500">Belum ada laporan</li>';
      } else {
        stats.latestReports.forEach(r => {
          latestList.innerHTML += `<li class="p-2">💡 ${r.title} - <span class="text-xs text-gray-500">${r.date}</span></li>`;
        });
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memuat statistik: ' + err.message);
    }
  }

  // Muat tabel laporan
  async function loadReportsTable() {
    try {
      const res = await fetch('/api/admin/reports');
      if (!res.ok) throw new Error('Gagal memuat laporan');
      const reports = await res.json();
      const tbody = document.getElementById('reportTableBody');
      tbody.innerHTML = '';
      if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Belum ada laporan</td></tr>';
        return;
      }
      reports.forEach(r => {
        const row = document.createElement('tr');
        row.setAttribute('data-report-id', r.id);
        row.innerHTML = `
          <td class="px-6 py-4">${r.title}</td>
          <td class="px-6 py-4">${r.reporter}</td>
          <td class="px-6 py-4">${r.facility}</td>
          <td class="px-6 py-4"><span class="badge badge-${r.status}">${r.status}</span></td>
          <td class="px-6 py-4">${r.date}</td>
          <td class="px-6 py-4 space-x-2">
            <select class="status-select border rounded p-1 text-sm" data-id="${r.id}">
              <option value="new" ${r.status === 'new' ? 'selected' : ''}>new</option>
              <option value="in_progress" ${r.status === 'in_progress' ? 'selected' : ''}>in_progress</option>
              <option value="resolved" ${r.status === 'resolved' ? 'selected' : ''}>resolved</option>
              <option value="hidden" ${r.status === 'hidden' ? 'selected' : ''}>hidden</option>
            </select>
            <button class="hide-btn bg-yellow-500 text-white px-2 py-1 rounded text-sm" data-id="${r.id}"><i class="fas fa-eye-slash"></i></button>
            <button class="delete-btn bg-red-600 text-white px-2 py-1 rounded text-sm" data-id="${r.id}"><i class="fas fa-trash"></i></button>
          </td>`;
        tbody.appendChild(row);
      });

      // Pasang event listener untuk setiap action
      document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', updateStatus);
      });
      document.querySelectorAll('.hide-btn').forEach(btn => {
        btn.addEventListener('click', hideReport);
      });
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteReport);
      });
    } catch (err) {
      console.error(err);
      alert('Gagal memuat laporan: ' + err.message);
    }
  }

  // Update status (Fitur 12)
  async function updateStatus(e) {
    const id = this.dataset.id;
    const newStatus = this.value;
    try {
      const res = await fetch(`/api/admin/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Gagal update status');
      const row = this.closest('tr');
      const badge = row.querySelector('.badge');
      badge.textContent = newStatus;
      badge.className = `badge badge-${newStatus}`;
      loadDashboard(); // refresh statistik
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  // Sembunyikan laporan (Fitur 13)
  async function hideReport() {
    const id = this.dataset.id;
    if (!confirm('Sembunyikan laporan ini?')) return;
    try {
      const res = await fetch(`/api/admin/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hidden' })
      });
      if (!res.ok) throw new Error('Gagal menyembunyikan');
      this.closest('tr').remove();
      loadDashboard();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  // Hapus permanen (Fitur 14)
  async function deleteReport() {
    const id = this.dataset.id;
    if (!confirm('Hapus permanen laporan ini?')) return;
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      this.closest('tr').remove();
      loadDashboard();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }
});