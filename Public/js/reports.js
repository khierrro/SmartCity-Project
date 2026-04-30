CitizenGuard.protect();
document.addEventListener('DOMContentLoaded', () => {
  let page = 1;
  let allReports = [];

  const statusBadge = {
    new: 'bg-primary',
    in_progress: 'bg-warning text-dark',
    resolved: 'bg-success',
    hidden: 'bg-secondary'
  };

  async function loadReports(reset = true) {
    if (reset) {
      page = 1;
      allReports = [];
      document.getElementById('loadMoreBtn').style.display = 'none';
    }

    const params = new URLSearchParams({
      sort_by: document.getElementById('sortBy').value,
      order: document.getElementById('sortOrder').value,
      page: page,
      limit: 12
    });
    const q = document.getElementById('searchInput').value.trim();
    if (q) params.set('q', q);

    document.getElementById('reportList').innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    try {
      const res = await fetch(`/api/reports/search?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      if (reset) {
        allReports = data.data;
      } else {
        allReports = allReports.concat(data.data);
      }

      renderReports(allReports);

      if (allReports.length < data.total) {
        document.getElementById('loadMoreBtn').style.display = 'inline-block';
      } else {
        document.getElementById('loadMoreBtn').style.display = 'none';
      }
    } catch (err) {
      document.getElementById('reportList').innerHTML = '<p class="text-danger text-center">Gagal memuat laporan.</p>';
    }
  }

  function renderReports(reports) {
    const container = document.getElementById('reportList');
    if (!reports.length) {
      container.innerHTML = '<div class="col-12 text-center py-5 text-muted">Belum ada laporan.</div>';
      return;
    }
    container.innerHTML = reports.map(r => `
  <div class="col-md-6 col-lg-4">
    <div class="card h-100 shadow-sm">
      <div class="card-body">
        <h5 class="card-title"><a href="/report-detail?id=${r.id}" class="text-decoration-none">${esc(r.title)}</a></h5>
        <p class="card-text small text-muted">${esc(r.description).substring(0, 100)}...</p>
        <p class="mb-1"><i class="fas fa-map-marker-alt text-danger me-1"></i>${esc(r.location_text || '-')}</p>
        <p class="mb-1"><i class="fas fa-building text-secondary me-1"></i>${esc(r.facility || '-')}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge ${statusBadge[r.status] || 'bg-secondary'}">${r.status}</span>
          <small><i class="fas fa-thumbs-up text-primary"></i> ${r.vote_count}</small>
        </div>
        <div class="mt-2 small text-muted">
          <i class="fas fa-user me-1"></i>${esc(r.reporter)} · ${new Date(r.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  </div>
`).join('');
  }

  function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  document.getElementById('searchBtn').addEventListener('click', () => loadReports(true));
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('sortBy').value = 'created_at';
    document.getElementById('sortOrder').value = 'DESC';
    loadReports(true);
  });
  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    page++;
    loadReports(false);
  });

  // Initial load
  loadReports(true);

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadReports(true);
  });
});