export const api = {
  get: async (url) => {
    const res = await fetch(`/api${url}`);
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  },
  post: async (url, data) => {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  },
  delete: async (url) => {
    const res = await fetch(`/api${url}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  }
};
