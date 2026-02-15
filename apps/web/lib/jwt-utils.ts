/**
 * JWT Token Utilities
 *
 * Client-side utilities for parsing and inspecting JWT tokens.
 * Note: This does NOT verify token signatures - it only decodes the payload.
 * Token verification happens on the backend.
 */

interface JWTPayload {
  userId: string;
  email: string;
  iat: number; // Issued at (seconds since epoch)
  exp: number; // Expiration (seconds since epoch)
}

/**
 * Parse a JWT token and extract its payload
 * @param token - The JWT token string
 * @returns Parsed payload or null if parsing fails
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');

    if (parts.length !== 3) {
      console.error('Invalid JWT format: expected 3 parts');
      return null;
    }

    const base64Url = parts[1]; // Get payload part
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Decode base64 to JSON string
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Get the expiration timestamp of a token
 * @param token - The JWT token string
 * @returns Expiration time in milliseconds, or null if token is invalid
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = parseJWT(token);

  if (!payload || !payload.exp) {
    return null;
  }

  // Convert from seconds to milliseconds
  return payload.exp * 1000;
}

/**
 * Check if a token is expired
 * @param token - The JWT token string
 * @returns True if expired or invalid, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  const expirationTime = getTokenExpirationTime(token);

  if (!expirationTime) {
    return true; // Treat invalid tokens as expired
  }

  return Date.now() >= expirationTime;
}

/**
 * Calculate time remaining until token expiration
 * @param token - The JWT token string
 * @returns Time until expiration in milliseconds, or 0 if expired/invalid
 */
export function getTimeUntilExpiration(token: string): number {
  const expirationTime = getTokenExpirationTime(token);

  if (!expirationTime) {
    return 0;
  }

  return Math.max(0, expirationTime - Date.now());
}

/**
 * Format milliseconds into a human-readable duration
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "5m 30s", "2h 15m")
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
