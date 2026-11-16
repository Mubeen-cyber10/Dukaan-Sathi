const TOKEN_KEY = 'ds-token';

async function apiFetch(path, { method = 'GET', body } = {}) {
  const url = new URL(path, location.origin);
  if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) {
    throw new Error('Invalid API address');
  }
  const login = url.pathname === '/api/auth/login';
  const headers = { Accept: 'application/json' };
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token && !login) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(url, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store'
    });
  } catch {
    throw new Error('Could not reach Dukaan Saathi. Please try again.');
  }
  if (response.status === 401 && !login && url.pathname !== '/api/shops/public') {
    DS_AUTH.endSession('signin');
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data !== null) return data;

  const error = new Error(data?.error?.message || 'The request could not be completed. Please try again.');
  error.status = response.status;
  error.fields = data?.error?.fields;
  error.retryAfter = Number(response.headers.get('Retry-After')) || 0;
  throw error;
}
