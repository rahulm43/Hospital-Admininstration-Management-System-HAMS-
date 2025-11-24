// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken') || 'mock-auth-token';

class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API Error');
    }

    return data;
  }

  // Auth endpoints
  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.data && response.data.accessToken) {
      authToken = response.data.accessToken;
      localStorage.setItem('authToken', authToken);
    }
    return response;
  }

  async logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    return { status: 'success' };
  }

  // Patient endpoints
  getPatients(page = 1, limit = 10, search = '') {
    return this.request(`/patients?page=${page}&limit=${limit}&search=${search}`, {
      method: 'GET',
    });
  }

  getPatientById(id) {
    return this.request(`/patients/${id}`, { method: 'GET' });
  }

  createPatient(data) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updatePatient(id, data) {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deletePatient(id) {
    return this.request(`/patients/${id}`, { method: 'DELETE' });
  }

  // Appointment endpoints
  getAppointments(page = 1, limit = 10, search = '', from = '') {
    let endpoint = `/appointments?page=${page}&limit=${limit}`;
    if (search) endpoint += `&search=${search}`;
    if (from) endpoint += `&from=${from}`;
    return this.request(endpoint, { method: 'GET' });
  }

  getAppointmentById(id) {
    return this.request(`/appointments/${id}`, { method: 'GET' });
  }

  createAppointment(data) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateAppointment(id, data) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteAppointment(id) {
    return this.request(`/appointments/${id}`, { method: 'DELETE' });
  }

  cancelAppointment(id) {
    return this.request(`/appointments/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  // Ward endpoints
  getWards(page = 1, limit = 10, search = '') {
    let endpoint = `/wards?page=${page}&limit=${limit}`;
    if (search) endpoint += `&search=${search}`;
    return this.request(endpoint, { method: 'GET' });
  }

  getWardById(id) {
    return this.request(`/wards/${id}`, { method: 'GET' });
  }

  createWard(data) {
    return this.request('/wards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateWard(id, data) {
    return this.request(`/wards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  getBedStatus(wardId = null) {
    let url = '/wards/beds/status';
    if (wardId) {
      url += `?wardId=${wardId}`;
    }
    return this.request(url, { method: 'GET' });
  }

  getPatientBedStatus(patientId) {
    return this.request(`/wards/beds/status?patientId=${patientId}`, { method: 'GET' });
  }

  updateBedStatus(bedId, status, occupantPatientId = null) {
    const data = { status };
    if (occupantPatientId) {
      data.occupantPatientId = occupantPatientId;
    }
    return this.request(`/wards/beds/${bedId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // New bed assignment endpoints
  assignBed(bedId, patientId) {
    return this.request(`/wards/beds/${bedId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ patientId }),
    });
  }

  unassignBed(bedId) {
    return this.request(`/wards/beds/${bedId}/unassign`, {
      method: 'POST',
    });
  }

  // Inventory endpoints
  getInventory(page = 1, limit = 10, search = '') {
    let endpoint = `/inventory?page=${page}&limit=${limit}`;
    if (search) endpoint += `&search=${search}`;
    return this.request(endpoint, { method: 'GET' });
  }

  getInventoryById(id) {
    return this.request(`/inventory/${id}`, { method: 'GET' });
  }

  createInventory(data) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateInventory(id, data) {
    return this.request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteInventory(id) {
    return this.request(`/inventory/${id}`, { method: 'DELETE' });
  }

  adjustInventory(id, quantityChange) {
    return this.request(`/inventory/${id}/adjust`, {
      method: 'PATCH',
      body: JSON.stringify({ quantityChange }),
    });
  }

  // Invoice endpoints
  getInvoices(page = 1, limit = 10, search = '') {
    let endpoint = `/invoices?page=${page}&limit=${limit}`;
    if (search) endpoint += `&search=${search}`;
    return this.request(endpoint, { method: 'GET' });
  }

  getInvoiceById(id) {
    return this.request(`/invoices/${id}`, { method: 'GET' });
  }

  createInvoice(data) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateInvoice(id, data) {
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  updateInvoiceStatus(id, status) {
    return this.request(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Staff endpoints
  getStaff(page = 1, limit = 10, search = '') {
    let endpoint = `/users?page=${page}&limit=${limit}`;
    if (search) endpoint += `&search=${search}`;
    return this.request(endpoint, { method: 'GET' });
  }

  getStaffById(id) {
    return this.request(`/users/${id}`, { method: 'GET' });
  }

  createStaff(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateStaff(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteStaff(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }
}

const api = new APIClient();