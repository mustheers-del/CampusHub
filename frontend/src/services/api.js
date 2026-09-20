const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper for standard HTTP fetch request with JSON handling & auth token attachment
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('gvms_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    // Handle binary PDF blob responses
    if (options.isBlob) {
      if (!response.ok) {
        throw new Error(`Failed to download file (HTTP ${response.status})`);
      }
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
}

// ----------------------------------------------------------------------
// Auth Endpoints
// ----------------------------------------------------------------------
export async function loginUser(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerStudentUser(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function getProfile() {
  return request('/auth/me');
}

export async function updateProfile(profileData) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

// ----------------------------------------------------------------------
// Dashboard & Analytics
// ----------------------------------------------------------------------
export async function getDashboardStats() {
  return request('/dashboard/stats');
}

// ----------------------------------------------------------------------
// Admin Student Management
// ----------------------------------------------------------------------
export async function getStudentsAdmin(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.course && filters.course !== 'All') params.append('course', filters.course);
  if (filters.year && filters.year !== 'All') params.append('year', filters.year);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return request(`/admin/students${queryString}`);
}

// ----------------------------------------------------------------------
// Events CRUD & PDF Export
// ----------------------------------------------------------------------
export async function getEvents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.category && filters.category !== 'All') params.append('category', filters.category);
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  if (filters.registration_type && filters.registration_type !== 'All') params.append('registration_type', filters.registration_type);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return request(`/events${queryString}`);
}

export async function getEventById(id) {
  return request(`/events/${id}`);
}

export async function createEvent(eventData) {
  return request('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

export async function updateEvent(id, eventData) {
  return request(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
}

export async function deleteEvent(id) {
  return request(`/events/${id}`, {
    method: 'DELETE',
  });
}

export async function downloadEventPDF(id) {
  const blob = await request(`/events/${id}/pdf`, { isBlob: true });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GVMS_Event_${id}_Report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ----------------------------------------------------------------------
// Registrations
// ----------------------------------------------------------------------
export async function registerStudent(eventId, registrationData) {
  return request(`/events/${eventId}/register`, {
    method: 'POST',
    body: JSON.stringify(registrationData),
  });
}

export async function getAllRegistrations() {
  return request('/registrations');
}

export async function getMyRegistrations() {
  return request('/registrations/my-registrations');
}

export async function deleteRegistration(id) {
  return request(`/registrations/${id}`, {
    method: 'DELETE',
  });
}
