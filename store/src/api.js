import useAuthStore from '../useAuthStore';

// A wrapper around the native fetch() that automatically adds
// the Authorization header with the stored JWT token.
//
// Usage:  authFetch('/api/cart/user@email.com')
//         authFetch('/api/orders/place', { method: 'POST', body: JSON.stringify({...}) })
//
// For multipart/form-data (file uploads), pass skipContentType: true
// so the browser sets the correct boundary automatically.
export const authFetch = (url, options = {}) => {
  const token = useAuthStore.getState().token;
  const { skipContentType, ...rest } = options;

  const headers = {
    ...(skipContentType ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(url, { ...rest, headers });
};
