const form = document.getElementById('loginForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  alert(data.message);

  if (res.ok) {
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/pages/menu.html';
  }
});
