import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      // Skip refresh if we already have a token
      if (token) {
        try {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          const { data } = await api.get('/auth/verify');
          setUser(data.user);
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common.Authorization;
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (token, userData) => {
    try {
      localStorage.setItem('token', token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common.Authorization;
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/auth/logout', null, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      
      // Force reload to clear any cached state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload anyway to ensure clean state
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);