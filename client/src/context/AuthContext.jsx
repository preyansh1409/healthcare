import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hms_token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const savedToken = localStorage.getItem('hms_token');
    if (!savedToken) { setLoading(false); return; }
    try {
      const { data } = await getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const loginUser = (userData, authToken) => {
    localStorage.setItem('hms_token', authToken);
    localStorage.setItem('hms_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setToken(null);
    setUser(null);
  };

  const role = user?.role?.toLowerCase();
  const isAdmin = () => role === 'admin';
  const isDoctor = () => role === 'doctor';
  const isReceptionist = () => role === 'receptionist';

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logout, loadUser, isAdmin, isDoctor, isReceptionist }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
