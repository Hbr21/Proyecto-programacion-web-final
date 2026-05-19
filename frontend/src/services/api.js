import axios from 'axios';

// Forzamos la URL de producción de tu backend en Render con el /api incluido
const api = axios.create({
  baseURL: 'https://artesanos-backend-p5a2.onrender.com/api',
  timeout: 15000,
});

// Adjuntar token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar expiración de sesión
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;