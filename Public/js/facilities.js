// public/js/facilities.js

const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

let allFacilities = [];
let activeFilter  = 'all';

const typeConfig = {
  hospital:     { label: 'Rumah Sakit', icon: 'fa-hospital',          badgeClass: 'badge-hospital' },
  clinic:       { label: 'Klinik',      icon: 'fa-stethoscope',       badgeClass: 'badge-clinic' },
  police:       { label: 'Polisi',      icon: 'fa-shield-halved',     badgeClass: 'badge-police' },
  fire_station: { label: 'Pemadam',     icon: 'fa-fire-extinguisher', badgeClass: 'badge-fire_station' },
};

function getTypeConfig(type) {
  return typeConfig[type] || { label: type, icon: 'fa-building', badgeClass: 'badge-default' };
}

function renderCard(facility) {
  const cfg = getTypeConfig(facility.type);
  const shortAddress = facility.address && facility.address.length > 80
    ? facility.address.substring(0, 80) + '…' : (facility.address || '-');

  return `
    <div class="facility-card bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200">
      <div class="h-44 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        ${facility.image_path
          ? `<img src="${facility.image_path}" alt="${facility.name}" class="w-full h-full object-cover" />`
          : `<i class="fa-solid ${cfg.icon} text-5xl text-blue-300"></i>`
        }
      </div>
      <div class="p-4">
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badgeClass} mb-2">
          <i class="fa-solid ${cfg.icon} text-xs"></i>${cfg.label}
        </span>
        <h3 class="font-bold text-gray-800 text-base leading-snug mb-1">${facility.name}</h3>
        <p class="text-xs text-gray-500 flex items-start gap-1.5 mb-4">
          <i class="fa-solid fa-location-dot mt-0.5 shrink-0 text-gray-400"></i>
          <span>${shortAddress}</span>
        </p>
        <a
          href="/pages/facility-detail.html?id=${facility.id}"
          class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <i class="fa-solid fa-arrow-right mr-1.5"></i>Lihat Detail
        </a>
      </div>
    </div>`;
}

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const filtered = allFacilities.filter(f => {
    const matchType = activeFilter === 'all' || f.type === activeFilter;
    const matchSearch = !q || f.name.toLowerCase().includes(q) || (f.address || '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const grid    = document.getElementById('facilitiesGrid');
  const empty   = document.getElementById('emptyState');
  const countEl = document.getElementById('resultsCount');

  if (filtered.length === 0) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    countEl.classList.add('hidden');
  } else {
    grid.innerHTML = filtered.map(renderCard).join('');
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    countEl.textContent = `Menampilkan ${filtered.length} dari ${allFacilities.length} fasilitas`;
    countEl.classList.remove('hidden');
  }
}

async function init() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
      applyFilters();
    });
  });

  // Search with debounce
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 300);
  });

  // Load facilities
  const loading = document.getElementById('loadingState');
  const error   = document.getElementById('errorState');
  const grid    = document.getElementById('facilitiesGrid');

  loading.classList.remove('hidden');
  error.classList.add('hidden');
  grid.classList.add('hidden');

  try {
    const data = await apiFetch('/api/facilities');
    allFacilities = Array.isArray(data) ? data : (data.data || []);
    loading.classList.add('hidden');
    grid.classList.remove('hidden');
    applyFilters();
  } catch (err) {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init);