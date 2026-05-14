import axios from 'axios';

// Create one axios instance with the backend URL
const api = axios.create({
  baseURL: 'http://localhost:8000',    // your FastAPI server
  headers: { 'Content-Type': 'application/json' }
});

// Before every request — automatically add the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If server returns 401 Unauthorized — clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Clean API functions — import these in your React components
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
};

export const tasksApi = {
  getAll:  ()         => api.get('/api/tasks/'),
  create:  (data)     => api.post('/api/tasks/', data),
  update:  (id, data) => api.patch(`/api/tasks/${id}`, data),
  remove:  (id)       => api.delete(`/api/tasks/${id}`),
};

export const aiApi = {
  suggest: (task_id) => api.post('/api/ai/suggest', { task_id }),
};

export default api;

