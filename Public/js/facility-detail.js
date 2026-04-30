// public/js/facility-detail.js

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const typeConfig = {
  hospital:     { label: 'Rumah Sakit', icon: 'fa-hospital',          badgeClass: 'bg-blue-100 text-blue-700' },
  clinic:       { label: 'Klinik',      icon: 'fa-stethoscope',       badgeClass: 'bg-purple-100 text-purple-700' },
  police:       { label: 'Polisi',      icon: 'fa-shield-halved',     badgeClass: 'bg-green-100 text-green-700' },
  fire_station: { label: 'Pemadam',     icon: 'fa-fire-extinguisher', badgeClass: 'bg-red-100 text-red-700' },
};

function getTypeConfig(type) {
  return typeConfig[type] || { label: type, icon: 'fa-building', badgeClass: 'bg-gray-100 text-gray-600' };
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderReportItem(report) {
  const statusClasses = {
    new: 'status-new', in_progress: 'status-in_progress',
    resolved: 'status-resolved', hidden: 'status-hidden'
  };
  const cls = statusClasses[report.status] || 'status-default';
  return `
    <div class="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
      <div class="flex-1 min-w-0">
        <a href="/report-detail?id=${report.id}" class="font-medium text-gray-800 hover:text-blue-600 transition-colors text-sm line-clamp-2 block">
          ${report.title || 'Laporan #' + report.id}
        </a>
        <span class="text-xs text-gray-400 mt-0.5 block"><i class="fa-regular fa-calendar mr-1"></i>${formatDate(report.created_at)}</span>
      </div>
      <span class="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cls}">${report.status}</span>
    </div>`;
}

function renderFacility(facility) {
  const cfg = getTypeConfig(facility.type);
  document.getElementById('breadcrumbName').textContent = facility.name;
  document.title = `${facility.name} – Smart City`;

  if (facility.image_path) {
    const img = document.getElementById('facilityImage');
    img.src = facility.image_path;
    img.alt = facility.name;
    img.classList.remove('hidden');
    img.onerror = () => {
      img.classList.add('hidden');
      document.getElementById('facilityImagePlaceholder').classList.remove('hidden');
      document.getElementById('facilityIconPlaceholder').className = `fa-solid ${cfg.icon} text-8xl`;
    };
  } else {
    document.getElementById('facilityImagePlaceholder').classList.remove('hidden');
    document.getElementById('facilityIconPlaceholder').className = `fa-solid ${cfg.icon} text-8xl`;
  }

  const badge = document.getElementById('facilityTypeBadge');
  badge.className = `inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badgeClass} mb-3`;
  badge.innerHTML = `<i class="fa-solid ${cfg.icon} text-xs"></i> ${cfg.label}`;

  document.getElementById('facilityName').textContent    = facility.name;
  document.getElementById('facilityAddress').textContent = facility.address || '-';
  document.getElementById('facilityPhone').innerHTML     = facility.phone ? `<a href="tel:${facility.phone}" class="text-blue-600 hover:underline">${facility.phone}</a>` : '-';
  document.getElementById('facilityHours').textContent   = facility.operating_hours || '-';
  document.getElementById('reportCount').textContent     = facility.report_count ?? 0;
}

function renderReports(reports) {
  const loading = document.getElementById('reportsLoading');
  const empty   = document.getElementById('reportsEmpty');
  const list    = document.getElementById('reportsList');

  if (!loading || !empty || !list) return;

  loading.classList.add('hidden');
  if (!reports || reports.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  list.innerHTML = reports.map(renderReportItem).join('');
  list.classList.remove('hidden');
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const facilityId = params.get('id');
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const mainContent = document.getElementById('mainContent');

  if (!facilityId || isNaN(Number(facilityId))) {
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    return;
  }

  try {
    const res = await apiFetch(`/api/facilities/${facilityId}`);
    const facility = res.data || res;
    if (loadingState) loadingState.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    renderFacility(facility);
  } catch (err) {
    console.error('Gagal memuat fasilitas:', err);
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    const errorText = document.querySelector('#errorState p.text-lg');
    if (errorText) errorText.textContent = 'Fasilitas tidak ditemukan: ' + err.message;
    return;
  }

  try {
    const reportsRes = await apiFetch(`/api/reports/search?facility_id=${facilityId}&limit=10`);
    const reports = Array.isArray(reportsRes) ? reportsRes : (reportsRes.data || []);
    renderReports(reports);
    if (reports.length >= 10) {
      const moreLink = document.getElementById('reportsMoreLink');
      const moreAnchor = document.getElementById('reportsMoreAnchor');
      if (moreLink) moreLink.classList.remove('hidden');
      if (moreAnchor) moreAnchor.href = `/pages/reports.html?facility_id=${facilityId}`;
    }
  } catch (err) {
    console.error('Gagal memuat laporan:', err);
    const reportsLoading = document.getElementById('reportsLoading');
    const reportsEmpty = document.getElementById('reportsEmpty');
    if (reportsLoading) reportsLoading.classList.add('hidden');
    if (reportsEmpty) reportsEmpty.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init);