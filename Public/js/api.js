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