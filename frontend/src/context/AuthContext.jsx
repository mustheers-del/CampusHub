import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted token and user on initialization
    const storedToken = localStorage.getItem('gvms_token');
    const storedUser = localStorage.getItem('gvms_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('gvms_token');
        localStorage.removeItem('gvms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('gvms_token', authToken);
    localStorage.setItem('gvms_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('gvms_token');
    localStorage.removeItem('gvms_user');
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem('gvms_user', JSON.stringify(newUser));
      return newUser;
    });
  };

  const value = {
    user,
    token,
    role: user ? user.role : null,
    isAdmin: user ? user.role === 'admin' : false,
    isStudent: user ? user.role === 'student' : false,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
