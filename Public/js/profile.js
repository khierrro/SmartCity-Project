// public/js/profile.js
CitizenGuard.protect();
// ---------- Navbar & Auth ----------
async function checkLogin() {
  try {
    const res = await fetch('/me');
    if (!res.ok) throw new Error();
    const user = await res.json();
    if (user.loggedIn) {
      const right = document.getElementById('navbarRight');
      if (right) {
        right.innerHTML = `
          <span class="me-3">Halo, ${user.name}</span>
          <a class="btn btn-outline-primary btn-sm" href="profile.html">
            <i class="fa-regular fa-circle-user"></i> Profil
          </a>
          <button class="btn btn-outline-danger btn-sm ms-2" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i> Keluar
          </button>
        `;
      }
    }
  } catch (_) {
    const right = document.getElementById('navbarRight');
    if (right) {
      right.innerHTML = `
        <a class="btn btn-outline-primary btn-sm" href="../login.html?role=citizen">Login</a>
      `;
    }
  }
}

async function logout() {
  try {
    await fetch('/logout', { method: 'POST' });
  } catch (_) {}
  window.location.href = '/index.html';
}

// ---------- Profile Data ----------
async function fetchProfile() {
  try {
    const response = await fetch('/me');
    if (!response.ok) throw new Error('Belum login');
    const data = await response.json();
    if (!data.loggedIn) throw new Error('Belum login');

    document.getElementById('displayName').textContent = data.name;
    document.getElementById('displayEmail').textContent = data.email;
    document.getElementById('displayPhone').textContent = data.phone || 'Tidak ada';
    document.getElementById('displayAddress').textContent = data.address || 'Tidak ada';
    document.getElementById('displayRole').textContent = data.role === 'admin' ? 'Admin' : 'Warga';

    const badge = document.getElementById('displayRole');
    if (data.role === 'admin') {
      badge.classList.remove('bg-primary');
      badge.classList.add('bg-danger');
    } else {
      badge.classList.remove('bg-danger');
      badge.classList.add('bg-primary');
    }

    const icon = document.getElementById('profileIcon');
    if (icon) {
      icon.classList.add(data.role === 'admin' ? 'text-danger' : 'text-primary');
    }
  } catch (error) {
    console.error(error);
    window.location.href = '/login.html';
  }
}

// ---------- Delete Account ----------
function setupDeleteButton() {
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', async () => {
    const password = document.getElementById('deletePassword').value;
    if (!password) {
      alert('Password harus diisi');
      return;
    }

    try {
      const res = await fetch('/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await res.json();

      if (res.ok) {
        alert(result.message);
        window.location.href = '/index.html';
      } else {
        alert(result.message || 'Gagal menghapus akun');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal terhubung ke server');
    }
  });
}

// ---------- Bootstrap Modal Fix (black screen) ----------
// Hapus event listener yang bentrok, biarkan Bootstrap menangani modal secara native.
// Kita hanya perlu memasang event pada tombol konfirmasi di dalam modal.

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  fetchProfile();
  setupDeleteButton();

  // Logout button (jika ada di luar navbar cadangan)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});