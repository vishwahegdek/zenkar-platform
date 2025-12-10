const getHeaders = (options = {}) => {
  const headers = { ...options.headers };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  get: async (url, options = {}) => {
    let fullUrl = `/api${url}`;
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      if (queryString) fullUrl += `?${queryString}`;
    }
    const res = await fetch(fullUrl, {
      ...options,
      headers: getHeaders(options),
    });
    if (!res.ok) throw new Error('API Request Failed');
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
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  },
  delete: async (url, options = {}) => {
    const res = await fetch(`/api${url}`, { 
      method: 'DELETE',
      headers: getHeaders(options)
    });
    if (!res.ok) throw new Error('API Request Failed');
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
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  }
};
