import { API_BASE } from "./constants";
import { useAuthStore } from "./useAuthStore";

/**
 * API Fetch Wrapper with Automatic Token Refresh
 * 
 * This module provides a fetch wrapper that automatically handles JWT token refresh
 * when API requests receive a 401 Unauthorized response.
 * 
 * HOW IT WORKS:
 * 1. Makes API request with current access token
 * 2. If response is 401, calls POST /auth/refresh?refresh_token={token}
 * 3. Updates tokens in auth store
 * 4. Retries original request with new token
 * 5. If refresh fails, logs user outone
 * 
 * USAGE IN STORES:
 * Replace manual fetch calls with apiFetch:
 * 
 * BEFORE:
 * ```typescript
 * const token = useAuthStore.getState().accessToken;
 * const response = await fetch(`${API_BASE}/user`, {
 *   method: "GET",
 *   headers: {
 *     "Authorization": `Bearer ${token}`,
 *     "Content-Type": "application/json"
 *   }
 * });
 * ```
 * 
 * AFTER:
 * ```typescript
 * import { apiFetch } from "./api-fetch";
 * 
 * const response = await apiFetch(`${API_BASE}/user`, {
 *   method: "GET",
 *   headers: {
 *     "Content-Type": "application/json"
 *   }
 * });
 * // Authorization header is added automatically
 * // Token refresh happens automatically on 401
 * ```
 * 
 * OR use the simpler apiRequest helper:
 * ```typescript
 * import { apiRequest } from "./api-fetch";
 * 
 * const data = await apiRequest<User[]>('/user', { method: 'GET' });
 * // Automatically adds API_BASE, Authorization header, handles errors
 * ```
 */

/**
 * Refreshes the access token using the refresh token.
 * Returns the new access token or null if refresh fails.
 */
async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    console.error("No refresh token available");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh?refresh_token=${refreshToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Failed to refresh token:", response.status);
      // If refresh fails, logout the user
      logout();
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token || refreshToken;

    // Update tokens in the store
    setTokens(newAccessToken, newRefreshToken);

    return newAccessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    logout();
    return null;
  }
}

/**
 * A fetch wrapper that automatically handles token refresh on 401 errors.
 * 
 * Usage:
 * ```typescript
 * const response = await apiFetch('/user/me', {
 *   method: 'GET',
 * });
 * ```
 * 
 * The wrapper will:
 * 1. Add Authorization header if access token exists
 * 2. Make the request
 * 3. If 401 error, refresh the token and retry once
 * 4. Return the response
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { accessToken } = useAuthStore.getState();

  // Prepare headers with Authorization if token exists
  const headers = new Headers(options.headers);
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Make the first request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token and retry once
  if (response.status === 401) {
    console.log("Received 401, attempting to refresh token...");

    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      console.log("Token refreshed successfully, retrying request...");

      // Update the Authorization header with new token
      headers.set("Authorization", `Bearer ${newAccessToken}`);

      // Retry the request with new token
      response = await fetch(url, {
        ...options,
        headers,
      });
    } else {
      console.log("Token refresh failed, returning 401 response");
    }
  }

  return response;
}

/**
 * Helper function to make API calls with automatic token refresh.
 * Automatically prepends API_BASE to relative URLs.
 * 
 * Usage:
 * ```typescript
 * const data = await apiRequest('/user/me', { method: 'GET' });
 * ```
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const response = await apiFetch(url, options);

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // If response body is not JSON, use status text
    }
    throw new Error(errorMessage);
  }

  // Return JSON response
  return response.json();
}
