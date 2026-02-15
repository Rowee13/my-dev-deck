import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Refresh access token using httpOnly refresh token cookie
 * Returns true if refresh was successful, false otherwise
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Send httpOnly cookies
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      // Redirect to login on refresh failure
      window.location.href = '/login';
      return false;
    }

    return true;
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    window.location.href = '/login';
    return false;
  }
}

/**
 * API request wrapper with automatic cookie-based authentication
 * - Sends httpOnly cookies automatically via credentials: 'include'
 * - Adds CSRF token for state-changing requests
 * - Handles 401 errors with automatic token refresh
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token from cookie (NOT httpOnly, so JavaScript can read it)
  const csrfToken = Cookies.get('_csrf');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase() || 'GET';
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Send httpOnly cookies with request
  });

  // If 401, try to refresh token and retry once
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry original request with new cookies
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  return response;
}
