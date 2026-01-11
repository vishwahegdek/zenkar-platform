const getHeaders = (options = {}) => {
  const headers = { ...options.headers };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponseError = async (res) => {
    const errorText = await res.text();
    let message = errorText || 'API Request Failed';
    try {
        const errorJson = JSON.parse(errorText);
        message = errorJson.message || message;
    } catch (e) {}
    const error = new Error(message);
    error.status = res.status;
    error.response = { status: res.status, data: errorText }; 
    throw error;
};

export const api = {
  get: async (url, options = {}) => {
    let fullUrl = `/api${url}`;
    if (options.params) {
      const cleanParams = Object.fromEntries(
        Object.entries(options.params).filter(([_, v]) => v != null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      if (queryString) fullUrl += `?${queryString}`;
    }
    const res = await fetch(fullUrl, {
      ...options,
      headers: getHeaders(options),
    });
    if (!res.ok) await handleResponseError(res);
    return res.json();
  },
  post: async (url, data, options = {}) => {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getHeaders(options)
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) await handleResponseError(res);
    return res.json();
  },
  put: async (url, data, options = {}) => {
    const res = await fetch(`/api${url}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getHeaders(options)
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) await handleResponseError(res);
    return res.json();
  },
  delete: async (url, options = {}) => {
    const res = await fetch(`/api${url}`, { 
      method: 'DELETE',
      headers: getHeaders(options)
    });
    if (!res.ok) await handleResponseError(res);
    return res.json();
  },
  patch: async (url, data, options = {}) => {
    const res = await fetch(`/api${url}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...getHeaders(options)
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) await handleResponseError(res);
    return res.json();
  }
};
