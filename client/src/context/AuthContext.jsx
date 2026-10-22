import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('breakbite_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('breakbite_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify token on initial mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('breakbite_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('breakbite_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out.');
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('breakbite_token', newToken);
      localStorage.setItem('breakbite_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('breakbite_token', newToken);
      localStorage.setItem('breakbite_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('breakbite_token');
    localStorage.removeItem('breakbite_user');
  };

  // 1-Click Demo Login for Hackathon Judges & Testing
  const quickDemoLogin = async (role = 'student') => {
    const email = role === 'canteen' ? 'canteen@demo.com' : 'student@demo.com';
    return await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        quickDemoLogin,
        isAuthenticated: !!user,
        isCanteen: user?.role === 'canteen',
        isStudent: user?.role === 'student' || !user?.role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
