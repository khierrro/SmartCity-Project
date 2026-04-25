// script/profile.js
document.addEventListener('DOMContentLoaded', () => {
  // Fetch and display user profile data
  fetchProfile();

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/logout', { method: 'POST' });
        if (res.ok) {
          localStorage.removeItem('user');
          window.location.href = '/index.html';
        } else {
          const data = await res.json();
          alert(data.message || 'Gagal logout');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal terhubung ke server');
      }
    });
  }

  // Delete account – open modal
  const deleteBtn = document.getElementById('deleteAccountBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
      deleteModal.show();
    });
  }

  // Confirm delete account inside modal
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
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
          localStorage.removeItem('user');
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
});

async function fetchProfile() {
  try {
    const response = await fetch('/me');
    if (!response.ok) {
      window.location.href = '/login.html';
      return;
    }
    const data = await response.json();
    if (!data.loggedIn) {
      window.location.href = '/login.html';
      return;
    }

    document.getElementById('displayName').textContent = data.name;
    document.getElementById('displayEmail').textContent = data.email;
    document.getElementById('displayPhone').textContent = data.phone || 'Tidak ada';
    document.getElementById('displayAddress').textContent = data.address || 'Tidak ada';
    document.getElementById('displayRole').textContent = data.role === 'admin' ? 'Admin' : 'Warga';
    const badge = document.getElementById('displayRole');
    badge.className = data.role === 'admin' ? 'badge bg-danger' : 'badge bg-primary';
  } catch (error) {
    console.error(error);
    window.location.href = '/login.html';
  }
}