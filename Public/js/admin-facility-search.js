  // public/js/admin-facility-search.js
  const BASE = '/api/admin';

  // ── Helpers ─────────────────────────────────────────────
  function typeLabel(type) {
    const map = {
      hospital: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><i class="fa-solid fa-hospital text-[10px]"></i>Hospital</span>',
      police: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><i class="fa-solid fa-shield-halved text-[10px]"></i>Police</span>',
      fire_station: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><i class="fa-solid fa-fire text-[10px]"></i>Fire Station</span>',
      clinic: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><i class="fa-solid fa-kit-medical text-[10px]"></i>Clinic</span>',
    };
    return map[type] || `<span class="text-gray-500">${type}</span>`;
  }

  function truncate(str, n = 40) {
    if (!str) return '-';
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  // ── Modal ──────────────────────────────────────────────
  function showModal() { document.getElementById('facilityModal').classList.remove('hidden'); }
  function hideModal() { document.getElementById('facilityModal').classList.add('hidden'); }

  // ── Load & Render ──────────────────────────────────────
  let allFacilities = []; // simpan semua data untuk filter client‑side

  async function loadFacilities() {
    const tbody = document.getElementById('facilityTableBody');
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat data...</td></tr>`;

    try {
      const res = await fetch(`${BASE}/facilities`, { credentials: 'same-origin' });
      if (res.status === 401) { window.location.href = '/login.html?role=admin'; return; }
      if (!res.ok) throw new Error('Gagal memuat data fasilitas');
      allFacilities = await res.json();
      applyFiltersAndRender();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-red-400"><i class="fa-solid fa-circle-exclamation mr-2"></i>${err.message}</td></tr>`;
    }
  }

  // ── Client‑side filtering ──────────────────────────────
  function applyFiltersAndRender() {
    const nameFilter = document.getElementById('searchName').value.trim().toLowerCase();
    const typeFilter = document.getElementById('searchType').value;

    const filtered = allFacilities.filter(f => {
      const matchName = !nameFilter || f.name.toLowerCase().includes(nameFilter);
      const matchType = !typeFilter || f.type === typeFilter;
      return matchName && matchType;
    });

    renderTable(filtered);
  }

  function renderTable(facilities) {
    const tbody = document.getElementById('facilityTableBody');
    const count = document.getElementById('facilityCount');
    count.textContent = `${facilities.length} fasilitas ditemukan`;

    if (!facilities.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-400">
        <i class="fa-solid fa-building-circle-xmark text-3xl mb-2 block"></i>Tidak ada fasilitas yang ditemukan</td></tr>`;
      return;
    }

    tbody.innerHTML = facilities.map(f => {
      // Simple image (no onerror)
      const imgHtml = f.image_path
        ? `<img src="${f.image_path}" alt="${f.name}" class="facility-img" />`
        : `<div class="facility-img bg-gray-100 flex items-center justify-center text-gray-400"><i class="fa-solid fa-image"></i></div>`;

      return `
        <tr class="border-t border-gray-50 hover:bg-gray-50 transition">
          <td class="px-5 py-3">${imgHtml}</td>
          <td class="px-5 py-3 font-semibold text-gray-800">${f.name}</td>
          <td class="px-5 py-3">${typeLabel(f.type)}</td>
          <td class="px-5 py-3 text-gray-500 max-w-[200px]" title="${f.address || ''}">${truncate(f.address)}</td>
          <td class="px-5 py-3 text-gray-600">${f.phone || '-'}</td>
          <td class="px-5 py-3 text-center">
            <div class="flex items-center justify-center gap-2">
              <button onclick="editFacility(${f.id})" class="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              <button onclick="deleteFacility(${f.id}, '${f.name.replace(/'/g, "\\'")}')" class="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1">
                <i class="fa-solid fa-trash"></i> Hapus
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  // ── CRUD Operations (tidak berubah) ─────────────────────
  async function editFacility(id) {
    try {
      const res = await fetch(`${BASE}/facilities/${id}`, { credentials: 'same-origin' });
      if (res.status === 401) { window.location.href = '/login.html?role=admin'; return; }
      if (!res.ok) throw new Error('Gagal mengambil data fasilitas');
      const f = await res.json();

      resetForm();
      document.getElementById('modalTitle').textContent = 'Edit Fasilitas';
      document.getElementById('facilityId').value = f.id;
      document.getElementById('facName').value = f.name || '';
      document.getElementById('facType').value = f.type || 'hospital';
      document.getElementById('facAddress').value = f.address || '';
      document.getElementById('facPhone').value = f.phone || '';
      document.getElementById('facHours').value = f.operating_hours || '';

      const preview = document.getElementById('currentImagePreview');
      const imgEl = document.getElementById('currentImageEl');
      if (f.image_path) {
        imgEl.src = f.image_path;
        preview.classList.remove('hidden');
      } else {
        preview.classList.add('hidden');
      }

      showModal();
    } catch (err) { alert(err.message); }
  }

  async function deleteFacility(id, name) {
    if (!confirm(`Hapus fasilitas "${name}"?`)) return;
    try {
      const res = await fetch(`${BASE}/facilities/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (res.status === 401) { window.location.href = '/login.html?role=admin'; return; }
      if (!res.ok) throw new Error('Gagal menghapus');
      // After delete, refresh the entire list
      await loadFacilities();
    } catch (err) { alert(err.message); }
  }

  async function saveFacility(e) {
    e.preventDefault();
    const id = document.getElementById('facilityId').value;
    const isEdit = !!id;

    const formData = new FormData();
    formData.append('name', document.getElementById('facName').value);
    formData.append('type', document.getElementById('facType').value);
    formData.append('address', document.getElementById('facAddress').value);
    formData.append('phone', document.getElementById('facPhone').value);
    formData.append('operating_hours', document.getElementById('facHours').value);

    const imageFile = document.getElementById('facImage').files[0];
    if (imageFile) formData.append('image', imageFile);

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
      const url = isEdit ? `${BASE}/facilities/${id}` : `${BASE}/facilities`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, credentials: 'same-origin', body: formData });
      if (res.status === 401) { window.location.href = '/login.html?role=admin'; return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Gagal menyimpan');
      }
      hideModal();
      // Refresh data
      await loadFacilities();
    } catch (err) { alert(err.message); } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan';
    }
  }

  // ── Helper untuk form ──────────────────────────────────
  function resetForm() {
    document.getElementById('facilityForm').reset();
    document.getElementById('facilityId').value = '';
    document.getElementById('modalTitle').textContent = 'Tambah Fasilitas';
    document.getElementById('currentImagePreview').classList.add('hidden');
    document.getElementById('currentImageEl').src = '';
  }

  // ── Init (semua listener aman dari null) ───────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Load awal
    loadFacilities();
    // Check for ?edit=ID or ?add=1 in the URL and act accordingly
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const addFlag = urlParams.get('add');

  // We need the facilities loaded before we can open edit modal
  if (editId) {
    // Wait for facilities to load, then find and edit
    const checkExist = setInterval(() => {
      if (allFacilities.length > 0) {
        clearInterval(checkExist);
        const facility = allFacilities.find(f => f.id == editId);
        if (facility) {
          editFacility(editId);   // this function already populates the modal and shows it
        } else {
          alert('Fasilitas tidak ditemukan');
        }
        // Remove the parameter from URL (optional)
        window.history.replaceState({}, document.title, location.pathname);
      }
    }, 200);
  } else if (addFlag) {
    // Just open the add modal
    resetForm();
    showModal();
    window.history.replaceState({}, document.title, location.pathname);
  }

    // Search button → client‑side filter
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', applyFiltersAndRender);
    }

    // Enter di input search
    const searchName = document.getElementById('searchName');
    if (searchName) {
      searchName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyFiltersAndRender();
      });
    }

    // Reset filter
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        document.getElementById('searchName').value = '';
        document.getElementById('searchType').value = '';
        applyFiltersAndRender();
      });
    }

    // Modal controls
    const addBtn = document.getElementById('openAddFacilityModal');
    if (addBtn) addBtn.addEventListener('click', () => { resetForm(); showModal(); });

    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

    const facilityModal = document.getElementById('facilityModal');
    if (facilityModal) facilityModal.addEventListener('click', (e) => {
      if (e.target === facilityModal) hideModal();
    });

    const facilityForm = document.getElementById('facilityForm');
    if (facilityForm) facilityForm.addEventListener('submit', saveFacility);
  });