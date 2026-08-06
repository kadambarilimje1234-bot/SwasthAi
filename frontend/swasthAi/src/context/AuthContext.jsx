import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI, tokenService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(tokenService.getUser());
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const accessToken = tokenService.getAccessToken();
    
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('👤 Loading user...');
      const response = await authAPI.getMe();
      console.log('✅ User loaded:', response.data.data);
      const userData = response.data.data;
      setUser(userData);
      tokenService.setUser(userData);
    } catch (error) {
      console.error('❌ Load user error:', error);
      if (error.response?.status === 401) {
        tokenService.clear();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt with:', { email });
      const response = await authAPI.login({ email, password });
      console.log('✅ Login response:', response.data);
      
      const { accessToken, refreshToken, user } = response.data.data;
      
      tokenService.setAccessToken(accessToken);
      tokenService.setRefreshToken(refreshToken);
      tokenService.setUser(user);
      setUser(user);
      
      toast.success(`Welcome back, ${user.name}!`);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let message = 'Login failed. Please try again.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 401) {
        message = 'Invalid email or password';
      } else if (error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if backend is running.';
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Register attempt:', userData.email);
      const response = await authAPI.register(userData);
      console.log('✅ Register response:', response.data);
      
      const { accessToken, refreshToken, user } = response.data.data;
      
      tokenService.setAccessToken(accessToken);
      tokenService.setRefreshToken(refreshToken);
      tokenService.setUser(user);
      setUser(user);
      
      toast.success('Account created successfully!');
      return { success: true, user };
    } catch (error) {
      console.error('❌ Register error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    tokenService.clear();
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user && !!tokenService.getAccessToken(),
      login,
      register,
      logout,
      loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};