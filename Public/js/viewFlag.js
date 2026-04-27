async function viewFlags(reportId) {
  const data = await apiFetch(`${API}/reports/${reportId}/flags`);
  if (!data?.data) return;
  const flags = data.data;
  let html = `<h3 class="text-lg font-bold mb-2">Flag Laporan</h3>`;
  if (flags.length === 0) {
    html += '<p class="text-gray-500">Belum ada flag.</p>';
  } else {
    html += `<ul class="space-y-2">`;
    flags.forEach(f => {
      html += `<li class="border p-2 rounded">
        <span class="font-semibold">${esc(f.User?.name || 'Unnamed')}</span>
        <span class="text-xs text-gray-500">${fmtDate(f.created_at)}</span>
        <p class="text-sm">${esc(f.reason || 'Tanpa alasan')}</p>
      </li>`;
    });
    html += '</ul>';
  }
  // Show in a small modal or replace the modalBody
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('detailModal').classList.remove('hidden');
  document.getElementById('modalTitle').textContent = `Flag untuk laporan #${reportId}`;
  document.getElementById('modalStatusSelect').classList.add('hidden');
  document.getElementById('saveStatusBtn').classList.add('hidden');
}