async function checkLogin() {
        try {
          const res = await fetch('/me');
          if (!res.ok) throw new Error('Not logged in');
          const user = await res.json();
          if (user.loggedIn) {
            const right = document.getElementById('navbarRight');
            right.innerHTML = `
              <span class="me-3">Halo, ${user.name}</span>
              <a class="btn btn-outline-primary btn-sm" href="profile.html">
                <i class="fa-regular fa-circle-user"></i> Profil
              </a>
              <button class="btn btn-outline-danger btn-sm ms-2" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Keluar
              </button>
            `;
            loadPersonalStats();
          }
        } catch (_) {
          document.getElementById('navbarRight').innerHTML = `
            <a class="btn btn-outline-primary btn-sm" href="../login.html?role=citizen">
              <i class="fa-solid fa-right-to-bracket"></i> Login
            </a>
          `;
        }
      }

      async function logout() {
        await fetch('/logout', { method: 'POST' });
        window.location.reload();
      }

      async function loadPersonalStats() {
        try {
          const res = await fetch('/api/reports/my/stats');
          if (!res.ok) return;
          const stats = await res.json();
          document.getElementById('statMyTotal').textContent = stats.total || 0;
          document.getElementById('statMyResolved').textContent = stats.resolved || 0;
          document.getElementById('statMyInProgress').textContent = stats.in_progress || 0;
          document.getElementById('personalStatsContainer').style.display = 'block';
        } catch (_) {}
      }

document.addEventListener('DOMContentLoaded', checkLogin);