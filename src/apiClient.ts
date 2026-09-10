export const API_URL = '/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    }
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
        // Return a promise that never resolves to halt the chain during navigation
        return new Promise(() => {});
      }
    }
    const err = await res.json().catch(() => ({}));
    const errorObj: any = new Error(err.error || err.message || 'Erreur réseau');
    errorObj.code = err.code;
    throw errorObj;
  }
  
  return res.json();
}
