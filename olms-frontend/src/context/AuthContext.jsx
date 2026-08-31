import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('olms_jwt_token');
    const savedUser = localStorage.getItem('olms_user');
    
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('olms_user');
        }
      }
      
      // Fetch fresh user profile details (ensuring we have the database user ID)
      getMe()
        .then(res => {
          localStorage.setItem('olms_user', JSON.stringify(res.data));
          setUser(res.data);
        })
        .catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = (jwtToken, userData) => {
    localStorage.setItem('olms_jwt_token', jwtToken);
    localStorage.setItem('olms_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('olms_jwt_token');
    localStorage.removeItem('olms_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  const role = user?.role || 'GUEST';

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
