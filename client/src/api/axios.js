import axios from 'axios';

// Create base API instance
const api = axios.create({
  baseURL: '/api', // This will be proxied by Vite
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create separate instance for auth requests to avoid interceptor loops
const authApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const silentRefresh = async () => {
  try {
    const { data } = await authApi.post('/auth/refresh');
    if (!data?.token) {
      throw new Error('No token received from refresh');
    }
    return data.token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

// Response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Don't retry if not 401, already retried, or is refresh request
    if (
      error.response?.status !== 401 || 
      originalRequest._retry ||
      originalRequest.url === '/auth/refresh'
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const { data } = await axios.post('/api/auth/refresh', null, {
        withCredentials: true
      });

      const token = data.token;
      if (token) {
        localStorage.setItem('token', token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        processQueue(null, token);
        return api(originalRequest);
      }

      throw new Error('No token received');
    } catch (refreshError) {
      processQueue(refreshError, null);
      
      // Only redirect to login for invalid refresh token
      if (refreshError.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
