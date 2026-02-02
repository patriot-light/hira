import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  updateRole: (userId, role) => api.put(`/users/${userId}/role`, null, { params: { role } }),
  delete: (userId) => api.delete(`/users/${userId}`)
};

// Students API
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getOne: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`)
};

// Teachers API
export const teachersAPI = {
  getAll: () => api.get('/teachers'),
  getOne: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`)
};

// Halaqas API
export const halaqasAPI = {
  getAll: () => api.get('/halaqas'),
  getOne: (id) => api.get(`/halaqas/${id}`),
  create: (data) => api.post('/halaqas', data),
  update: (id, data) => api.put(`/halaqas/${id}`, data),
  delete: (id) => api.delete(`/halaqas/${id}`),
  getStudents: (id) => api.get(`/halaqas/${id}/students`),
  assignStudent: (halaqaId, studentId) => api.post(`/halaqas/${halaqaId}/students/${studentId}`),
  removeStudent: (halaqaId, studentId) => api.delete(`/halaqas/${halaqaId}/students/${studentId}`)
};

// Staff API
export const staffAPI = {
  getAll: () => api.get('/staff'),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`)
};

// Page Evaluations API
export const pageEvaluationsAPI = {
  getAll: (studentId) => api.get('/evaluations/pages', { params: { student_id: studentId } }),
  create: (data) => api.post('/evaluations/pages', data),
  delete: (id) => api.delete(`/evaluations/pages/${id}`)
};

// Juz Evaluations API
export const juzEvaluationsAPI = {
  getAll: (studentId) => api.get('/evaluations/juz', { params: { student_id: studentId } }),
  create: (data) => api.post('/evaluations/juz', data),
  delete: (id) => api.delete(`/evaluations/juz/${id}`)
};

// Sessions API
export const sessionsAPI = {
  getAll: (studentId) => api.get('/sessions', { params: { student_id: studentId } }),
  getOne: (id) => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  delete: (id) => api.delete(`/sessions/${id}`)
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getStudentReport: (studentId) => api.get(`/reports/student/${studentId}`),
  getHalaqaReport: (halaqaId) => api.get(`/reports/halaqa/${halaqaId}`),
  getTeacherReport: (teacherId) => api.get(`/reports/teacher/${teacherId}`)
};

// Export API
export const exportAPI = {
  studentsExcel: () => api.get('/export/students/excel', { responseType: 'blob' }),
  studentsPdf: () => api.get('/export/students/pdf', { responseType: 'blob' }),
  studentReportPdf: (studentId) => api.get(`/export/report/${studentId}/pdf`, { responseType: 'blob' })
};

export default api;
