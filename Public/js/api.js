'use strict';

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const MUTATING = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

// ── Override native fetch globally ──────────────────────────────
const _nativeFetch = window.fetch.bind(window);

window.fetch = (url, options = {}) => {
  const method = (options.method ?? 'GET').toUpperCase();

  // Only inject for same-origin API calls, skip CDN/external URLs
  const isSameOrigin = typeof url === 'string' && !url.startsWith('http');

  if (MUTATING.has(method) && isSameOrigin) {
    options = {
      ...options,
      headers: {
        'X-CSRF-Token': csrfToken,
        ...options.headers,   // caller headers win if they set it manually
      },
    };
  }

  return _nativeFetch(url, options);
};

// ── apiFetch helper (optional convenience wrapper) ───────────────
window.apiFetch = async (url, options = {}) => {
  if (!options.headers?.['Content-Type']) {
    options = {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    };
  }

  const res = await fetch(url, options); // uses the patched fetch above
  const data = await res.json();

  if (!data?.success && res.status === 401) {
    window.location.href = '/login.html?role=citizen';
    return null;
  }
  return data;
};
// ── Flash alert from URL query ──────────────────────────────────
(function() {
  const params = new URLSearchParams(window.location.search);
  const msg = params.get('alert');
  if (!msg) return;

  // Remove the parameter from the URL without reloading
  const url = new URL(window.location);
  url.searchParams.delete('alert');
  window.history.replaceState({}, document.title, url);

  // Create a Bootstrap-styled alert (works if Bootstrap CSS is loaded)
  const div = document.createElement('div');
  div.className = 'alert alert-warning alert-dismissible fade show';
  div.setAttribute('role', 'alert');
  div.innerHTML = `
    ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  document.body.insertAdjacentElement('afterbegin', div);
})();