
class AuthGuard {
  /**
   * @param {string[]} allowedRoles  – ['admin'] / ['citizen'] / ['admin','citizen']
   * @param {string}   redirectUrl  – halaman tujuan jika belum login
   */
  static async protect(allowedRoles = [], redirectUrl = '/index.html') {
    try {
      const res = await fetch('/me');
      if (!res.ok) throw new Error('Not logged in');

      const user = await res.json();

      if (!user.loggedIn) {
        window.location.href = redirectUrl;
        return;
      }

      // Jika peran tidak diizinkan, arahkan ke halaman sesuai perannya
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        if (user.role === 'admin') {
          window.location.href = '/pages/admin.html';
        } else {
          window.location.href = '/pages/menu.html';
        }
        return;
      }

      // User diizinkan → halaman tetap terbuka
    } catch (err) {
      // Tidak login / error → redirect ke login/landing
      window.location.href = redirectUrl;
    }
  }
}

class AdminGuard extends AuthGuard {
  static async protect() {
    return super.protect(['admin'], '/login.html?role=admin');
  }
}

class CitizenGuard extends AuthGuard {
  static async protect() {
    return super.protect(['citizen'], '/login.html?role=citizen');
  }
}