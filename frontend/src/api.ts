const API_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('skillsnap_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('skillsnap_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('skillsnap_token');
    localStorage.removeItem('skillsnap_user');
  }

  getUser() {
    const raw = localStorage.getItem('skillsnap_user');
    return raw ? JSON.parse(raw) : null;
  }

  setUser(user: any) {
    localStorage.setItem('skillsnap_user', JSON.stringify(user));
  }

  isAuthenticated() {
    return !!this.token;
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: any = { ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (res.status === 401) {
      this.clearToken();
      window.location.reload();
      throw new Error('Session expired');
    }
    return res;
  }

  async register(email: string, password: string, name: string) {
    const res = await this.request('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  async login(email: string, password: string) {
    const res = await this.request('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  async demoLogin() {
    const res = await this.request('/api/auth/demo', {
      method: 'POST', body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Demo login failed');
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  async scan(imageBlob: Blob) {
    const formData = new FormData();
    formData.append('image', imageBlob);
    const res = await this.request('/api/scan', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Scan failed');
    return data;
  }

  async getScanHistory() {
    const res = await this.request('/api/history');
    const data = await res.json();
    return data.scans || [];
  }

  async getScanDetail(scanId: string) {
    const res = await this.request(`/api/history/${scanId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load scan');
    return data;
  }

  async uploadSOP(file: File) {
    const formData = new FormData();
    formData.append('document', file);
    const res = await this.request('/api/sop/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }

  async listSOPs() {
    const res = await this.request('/api/sop/list');
    return res.json();
  }

  async getSOPStats() {
    const res = await this.request('/api/sop/stats');
    return res.json();
  }

  logout() {
    this.clearToken();
    window.location.reload();
  }
}

export const api = new ApiClient();
