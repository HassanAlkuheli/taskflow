import axios from 'axios';
import api from './axios';

// Track refresh token requests to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers = [];

const apiInstance = axios.create({
  withCredentials: true,
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // Add timeout
});

// Handle token refresh
const handleTokenRefresh = async () => {
  try {
    const { data } = await axios.post('/api/auth/refresh', null, {
      withCredentials: true
    });
    
    localStorage.setItem('token', data.token);
    apiInstance.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    
    return data.token;
  } catch (error) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw error;
  }
};

// Update request interceptor
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(resolve => {
          refreshSubscribers.push(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = await handleTokenRefresh();
        refreshSubscribers.forEach(callback => callback(token));
        refreshSubscribers = [];
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiInstance(originalRequest);
      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const getTodos = async () => {
  const { data } = await api.get('/todos');
  return data;
};

export const createTodo = async (todo) => {
  const { data } = await api.post('/todos', todo);
  return data;
};

export const updateTodo = async (id, todo) => {
  const { data } = await api.put(`/todos/${id}`, todo);
  return data;
};

export const deleteTodo = async (id) => {
  const { data } = await api.delete(`/todos/${id}`);
  return data;
};

export const reorderTodos = async (todos) => {
  const { data } = await api.put('/todos/reorder', { todos });
  return data;
};
