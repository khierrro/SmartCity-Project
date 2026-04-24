const form = document.getElementById('registerForm');

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const role = document.getElementById('role').value;

  try {
    const res = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        phone,
        address,
        role,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.log(err);
    alert('Gagal koneksi ke server');
  }
});
