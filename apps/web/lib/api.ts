import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get('refreshToken');

  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      window.location.href = '/login';
      return null;
    }

    const { accessToken, refreshToken: newRefreshToken } = await res.json();

    Cookies.set('accessToken', accessToken, { expires: 1 });
    Cookies.set('refreshToken', newRefreshToken, { expires: 30 });

    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken = Cookies.get('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401, try to refresh token and retry once
  if (response.status === 401) {
    accessToken = await refreshAccessToken();

    if (accessToken) {
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  }

  return response;
}
