/**
 * authguard.js
 * Client-side auth guard — works alongside server-side session guards.
 * Rule: never redirect if already on a login/landing page (breaks loops).
 */

// Pages where we should NEVER redirect (to avoid infinite loops)
const NO_REDIRECT_PAGES = [
  '/index.html',
  '/login.html',
  '/register.html',
  '/'
];

function isOnNoRedirectPage() {
  return NO_REDIRECT_PAGES.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '?'));
}

// Cached user so we only call /me once per page load
let _cachedUser = null;

async function getUser() {
  if (_cachedUser !== null) return _cachedUser;
  try {
    const res = await fetch('/me', { credentials: 'include' });
    if (!res.ok) {
      _cachedUser = { loggedIn: false };
      return _cachedUser;
    }
    const data = await res.json();
    _cachedUser = data;
    return _cachedUser;
  } catch {
    _cachedUser = { loggedIn: false };
    return _cachedUser;
  }
}

class AuthGuard {
  /**
   * @param {string[]} allowedRoles  – e.g. ['admin'] / ['citizen'] / ['admin','citizen']
   * @param {string}   redirectUrl   – where to send unauthenticated users
   */
  static async protect(allowedRoles = [], redirectUrl = '/index.html') {
    // Safety: don't run on login/landing pages — this breaks redirect loops
    if (isOnNoRedirectPage()) return;

    try {
      const user = await getUser();

      if (!user || !user.loggedIn) {
        // Avoid redirect loop: only redirect if not already going there
        if (window.location.href !== redirectUrl) {
          window.location.replace(redirectUrl);
        }
        return;
      }

      // Wrong role: redirect to that role's home page
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        const dest = user.role === 'admin' ? '/pages/admin.html' : '/pages/menu.html';
        // Avoid redirecting to the page we're already on
        if (window.location.pathname !== dest) {
          window.location.replace(dest);
        }
        return;
      }

      // ✅ Authorized — do nothing, page stays open

    } catch (err) {
      console.warn('[AuthGuard] Unexpected error:', err);
      if (!isOnNoRedirectPage()) {
        window.location.replace(redirectUrl);
      }
    }
  }
}

class AdminGuard extends AuthGuard {
  static async protect() {
    // Server already blocks unauthorized access to admin pages,
    // so this is a secondary client-side check only.
    return super.protect(['admin'], '/login.html?role=admin');
  }
}

class CitizenGuard extends AuthGuard {
  static async protect() {
    return super.protect(['citizen'], '/login.html?role=citizen');
  }
}