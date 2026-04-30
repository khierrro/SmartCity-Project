// public/js/menu.js
async function checkLogin() {
  try {
    const res = await fetch('/me');
    if (!res.ok) throw new Error('Not logged in');
    const user = await res.json();
    if (user.loggedIn) {
      // User is logged in – load personal stats
      loadPersonalStats();
    }
    // No navbar update – server handles that completely
  } catch (_) {
    // Not logged in – do nothing (server already shows guest navbar)
  }
}

async function logout() {
  await fetch('/logout', { method: 'POST' });
  window.location.href = '/index.html';
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