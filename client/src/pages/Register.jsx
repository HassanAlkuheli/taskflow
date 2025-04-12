import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await api.post('/auth/register', { email, password });

      if (data.success && data.token) {
        // Login right after registration
        await login(data.token, data.user);
        navigate('/todos');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  // ...rest of component
};
