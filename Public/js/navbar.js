// public/script/navbar.js
async function renderNavbar() {
  const right = document.getElementById('navbarRight');
  if (!right) return;

  try {
    const res = await fetch('/me');
    if (!res.ok) throw new Error('Not logged in');
    const user = await res.json();
    if (!user.loggedIn) throw new Error('Not logged in');

    // === ADMIN ===
    if (user.role === 'admin') {
      document.getElementById('navbarSupportedContent').innerHTML = `
        <ul class="navbar-nav mx-auto mb-2 gap-4">
          <li class="nav-item"><a class="nav-link" href="/pages/admin.html">DASHBOARD</a></li>
          <li class="nav-item"><a class="nav-link active" href="/pages/admin-search.html">LAPORAN</a></li>
          <li class="nav-item"><a class="nav-link" href="/pages/admin-facility-search.html">FASILITAS</a></li>
        </ul>
      `;
      right.innerHTML = `
        <span class="me-3">Admin: ${user.name}</span>
        <button class="btn btn-outline-danger btn-sm" onclick="logout()">
          <i class="fas fa-sign-out-alt"></i> Keluar
        </button>
      `;
      return;
    }

    // === CITIZEN ===
    document.getElementById('navbarSupportedContent').innerHTML = `
      <ul class="navbar-nav mx-auto mb-2 gap-4">
        <li class="nav-item"><a class="nav-link" href="menu.html">HOME</a></li>
        <li class="nav-item"><a class="nav-link active" href="reports.html">LAPORAN</a></li>
        <li class="nav-item"><a class="nav-link" href="facilities.html">FASILITAS</a></li>
      </ul>
    `;
    right.innerHTML = `
      <span class="me-3">Halo, ${user.name}</span>
      <a class="btn btn-outline-primary btn-sm" href="profile.html">
        <i class="fa-regular fa-circle-user"></i> Profil
      </a>
      <button class="btn btn-outline-danger btn-sm ms-2" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Keluar
      </button>
    `;
  } catch (_) {
    // Belum login – tampilkan navbar warga dengan tombol login
    document.getElementById('navbarSupportedContent').innerHTML = `
      <ul class="navbar-nav mx-auto mb-2 gap-4">
        <li class="nav-item"><a class="nav-link" href="menu.html">HOME</a></li>
        <li class="nav-item"><a class="nav-link active" href="reports.html">LAPORAN</a></li>
        <li class="nav-item"><a class="nav-link" href="facilities.html">FASILITAS</a></li>
      </ul>
    `;
    right.innerHTML = `
      <a class="btn btn-outline-primary btn-sm" href="../login.html?role=citizen">Login</a>
    `;
  }
}

async function logout() {
  await fetch('/logout', { method: 'POST' });
  window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', renderNavbar);