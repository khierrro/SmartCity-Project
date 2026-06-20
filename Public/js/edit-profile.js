document.addEventListener('DOMContentLoaded', async () => {
  let currentUser = null;

  // ── Fetch current user ──────────────────────────────
  try {
    const res = await fetch('/me');
    if (!res.ok) throw new Error('Belum login');
    const data = await res.json();
    if (!data.loggedIn) throw new Error('Belum login');

    currentUser = data;

    // Pre-fill fields
    document.getElementById('address').value = data.address || '';
    document.getElementById('phone').value = data.phone || '';

    // ── Adapt form based on provider ──────────────────
    if (data.provider === 'google') {
      // Hide password section entirely for Google users
      document.getElementById('passwordSection').style.display = 'none';
      document.getElementById('currentPasswordSection').style.display = 'none';

      // Show Google badge
      document.getElementById('providerBadge').innerHTML = `
        <div class="alert alert-info d-flex align-items-center gap-2 mb-3">
          <i class="fa-brands fa-google"></i>
          <span>Akun Anda terdaftar melalui Google. 
          Anda hanya dapat mengubah nomor telepon dan alamat.</span>
        </div>
      `;
    } else {
      // Local user — show everything, password required
      document.getElementById('providerBadge').innerHTML = '';
    }

  } catch (err) {
    console.error(err);
    alert('Anda harus login untuk mengakses halaman ini.');
    window.location.href = '/login.html';
    return;
  }

  // ── Form submission ─────────────────────────────────
  document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // ── Google user: only phone/address, no password needed ──
    if (currentUser.provider === 'google') {
      try {
        const res = await fetch('/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, phone }),
        });

        const result = await res.json();
        if (res.ok) {
          showMessage(result.message, 'success');
          setTimeout(() => {
            window.location.href = 'profile.html';
          }, 1500);
        } else {
          showMessage(result.message, 'danger');
        }
      } catch (err) {
        showMessage('Gagal terhubung ke server', 'danger');
      }
      return;
    }

    // ── Local user: require current password ──────────
    const currentPassword = document.getElementById('currentPassword').value;
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

    // Password strength check if changing password
    if (newPassword) {
      const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!strong.test(newPassword)) {
        showMessage(
          'Password baru minimal 8 karakter, mengandung huruf besar, kecil, angka, dan karakter khusus',
          'danger'
        );
        return;
      }
    }

    const payload = { address, phone, currentPassword };
    if (newPassword) payload.newPassword = newPassword;

    try {
      const res = await fetch('/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        showMessage(result.message, 'success');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1500);
      } else {
        showMessage(result.message, 'danger');
      }
    } catch (err) {
      showMessage('Gagal terhubung ke server', 'danger');
    }
  });
});

function showMessage(msg, type) {
  const msgDiv = document.getElementById('message');
  msgDiv.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => { msgDiv.innerHTML = ''; }, 3000);
}