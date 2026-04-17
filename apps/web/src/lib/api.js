/**
 * Thin fetch wrapper for Next.js API routes.
 * All requests include JSON Content-Type and parse responses as JSON.
 * Throws on non-ok responses.
 *
 * @param {string} endpoint  e.g. "/api/articles" (leading slash required)
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}) {
  const base = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:3000';
  const url = new URL(endpoint, base);

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse failure
    }
    const err = new Error(message);
    (err).status = res.status;
    throw err;
  }

  return res.json();
}
