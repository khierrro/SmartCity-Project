// ============================================================
// facilities.js – Halaman Direktori Fasilitas Publik
// ============================================================

// Helper fetch (konsisten dengan pattern di admin-search.js)
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---- State ----
let allFacilities = [];
let activeFilter  = 'all';
let searchQuery   = '';

// ---- Peta label & ikon per tipe ----
const typeConfig = {
  hospital:     { label: 'Rumah Sakit', icon: 'fa-hospital',          badgeClass: 'badge-hospital' },
  clinic:       { label: 'Klinik',      icon: 'fa-stethoscope',       badgeClass: 'badge-clinic' },
  police:       { label: 'Polisi',      icon: 'fa-shield-halved',     badgeClass: 'badge-police' },
  fire_station: { label: 'Pemadam',     icon: 'fa-fire-extinguisher', badgeClass: 'badge-fire_station' },
};

function getTypeConfig(type) {
  return typeConfig[type] || { label: type, icon: 'fa-building', badgeClass: 'badge-default' };
}

// ---- Render satu kartu fasilitas ----
function renderCard(facility) {
  const cfg = getTypeConfig(facility.type);

  const imageHtml = facility.image_path
    ? `<img
         src="${facility.image_path}"
         alt="${facility.name}"
         class="w-full h-44 object-cover"
         onerror="this.replaceWith(document.getElementById('placeholder-${facility.id}'))"
       />`
    : '';

  const placeholderHtml = `
    <div
      id="placeholder-${facility.id}"
      class="w-full h-44 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-300"
    >
      <i class="fa-solid ${cfg.icon} text-5xl"></i>
    </div>`;

  // Potong alamat agar tidak terlalu panjang
  const shortAddress = facility.address && facility.address.length > 80
    ? facility.address.substring(0, 80) + '…'
    : (facility.address || '-');

  return `
    <div class="facility-card bg-white rounded-2xl overflow-hidden shadow" data-type="${facility.type}">
      <!-- Gambar -->
      <div class="overflow-hidden">
        ${facility.image_path ? imageHtml : ''}
        ${placeholderHtml}
      </div>

      <!-- Konten -->
      <div class="p-4">
        <!-- Badge tipe -->
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badgeClass} mb-2">
          <i class="fa-solid ${cfg.icon} text-xs"></i>
          ${cfg.label}
        </span>

        <!-- Nama -->
        <h3 class="font-bold text-gray-800 text-base leading-snug mb-1 line-clamp-2">
          ${facility.name}
        </h3>

        <!-- Alamat -->
        <p class="text-xs text-gray-500 flex items-start gap-1.5 mb-4">
          <i class="fa-solid fa-location-dot mt-0.5 shrink-0 text-gray-400"></i>
          <span>${shortAddress}</span>
        </p>

        <!-- Tombol detail -->
        <a
          href="/pages/facility-detail.html?id=${facility.id}"
          class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition-colors"
        >
          <i class="fa-solid fa-arrow-right mr-1.5"></i>Lihat Detail
        </a>
      </div>
    </div>`;
}

// ---- Filter & render ulang grid ----
function applyFilters() {
  const q = searchQuery.toLowerCase().trim();

  const filtered = allFacilities.filter((f) => {
    const matchType   = activeFilter === 'all' || f.type === activeFilter;
    const matchSearch = !q || f.name.toLowerCase().includes(q) || (f.address || '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const grid      = document.getElementById('facilitiesGrid');
  const empty     = document.getElementById('emptyState');
  const countEl   = document.getElementById('resultsCount');

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

// ---- Cek session & init ----
async function init() {
  // 1. Cek session login
  try {
    const meData = await apiFetch('/me');
    const user = meData.user || meData;

    if (user && user.name) {
      document.getElementById('userName').textContent = user.name;
      document.getElementById('userName').classList.remove('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
    } else {
      document.getElementById('loginBtn').classList.remove('hidden');
    }
  } catch {
    // Belum login – tetap tampilkan halaman (publik)
    document.getElementById('loginBtn').classList.remove('hidden');
  }

  // 2. Setup logout
  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try { await apiFetch('/logout', { method: 'POST' }); } catch (_) {}
    window.location.href = '/login.html';
  });

  // 3. Ambil data fasilitas
  try {
    const res = await apiFetch('/api/facilities');
    allFacilities = res.data || [];

    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('facilitiesGrid').classList.remove('hidden');

    applyFilters();
  } catch (err) {
    console.error('Gagal mengambil fasilitas:', err);
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
  }

  // 4. Filter tombol
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;

      document.querySelectorAll('.filter-btn').forEach((b) => {
        b.classList.remove('active-filter', 'bg-white', 'text-blue-600', 'shadow');
        b.classList.add('bg-blue-500', 'text-white');
      });
      btn.classList.add('active-filter', 'bg-white', 'text-blue-600', 'shadow');
      btn.classList.remove('bg-blue-500', 'text-white');

      applyFilters();
    });
  });

  // 5. Pencarian
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value;
      applyFilters();
    }, 300);
  });
}

document.addEventListener('DOMContentLoaded', init);
