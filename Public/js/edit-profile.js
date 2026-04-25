// script/edit-profile.js
document.addEventListener('DOMContentLoaded', async () => {
  // Autofill address & phone from session
  try {
    const res = await fetch('/me');
    if (!res.ok) throw new Error('Belum login');
    const data = await res.json();
    if (!data.loggedIn) throw new Error('Belum login');

    document.getElementById('address').value = data.address || '';
    document.getElementById('phone').value = data.phone || '';
  } catch (err) {
    console.error(err);
    alert('Anda harus login untuk mengakses halaman ini.');
    window.location.href = '/login.html';
  }

  // Handle form submission (update profile)
  document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword) {
      showMessage('Password saat ini wajib diisi', 'danger');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showMessage('Password baru dan konfirmasi tidak cocok', 'danger');
      return;
    }

    const payload = { address, phone, currentPassword };
    if (newPassword) {
      payload.newPassword = newPassword;
    }

    try {
      const res = await fetch('/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok) {
        showMessage(result.message, 'success');
        // Redirect ke halaman profil setelah 1.5 detik
        setTimeout(() => {
          window.location.href = 'profile.html'; // atau '/pages/profile.html'
        }, 1500);
      } else {
        showMessage(result.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showMessage('Gagal terhubung ke server', 'danger');
    }
  });
});

function showMessage(msg, type) {
  const msgDiv = document.getElementById('message');
  msgDiv.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => { msgDiv.innerHTML = ''; }, 3000);
}