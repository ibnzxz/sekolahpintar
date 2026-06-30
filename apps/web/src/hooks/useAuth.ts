import { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('sp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    ApiClient.getCurrentUser()
      .then((userData) => {
        setIsAuthenticated(true);
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('sp_token');
        localStorage.removeItem('sp_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await ApiClient.login(email, password);
      localStorage.setItem('sp_token', data.accessToken);
      localStorage.setItem('sp_user', JSON.stringify(data.teacher));
      setIsAuthenticated(true);
      setUser(data.teacher);
      return data.teacher;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  return { isAuthenticated, user, loading, login, logout };
}
