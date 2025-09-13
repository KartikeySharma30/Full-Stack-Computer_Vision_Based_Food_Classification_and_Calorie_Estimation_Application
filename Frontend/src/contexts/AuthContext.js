// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('http://localhost:8000/auth/me');
          setUser(response.data);
          console.log('User loaded:', response.data);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          // Token might be expired, clear it
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Helper function to extract error message
  const extractErrorMessage = (error) => {
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Handle validation errors (Pydantic/FastAPI format)
      if (errorData.detail && Array.isArray(errorData.detail)) {
        return errorData.detail.map(err => {
          if (typeof err === 'object' && err.msg) {
            return `${err.loc ? err.loc.join('.') : 'Field'}: ${err.msg}`;
          }
          return err.toString();
        }).join(', ');
      }
      
      // Handle single detail message
      if (typeof errorData.detail === 'string') {
        return errorData.detail;
      }
      
      // Handle other error formats
      if (typeof errorData === 'string') {
        return errorData;
      }
      
      // If it's an object, try to stringify it properly
      if (typeof errorData === 'object') {
        return JSON.stringify(errorData, null, 2);
      }
    }
    
    return error.message || 'An unexpected error occurred';
  };

  const login = async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post('http://localhost:8000/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, user_id, username: returnedUsername } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Get user details
      const userResponse = await axios.get('http://localhost:8000/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      setUser(userResponse.data);
      toast.success(`Welcome back, ${returnedUsername}!`);
      
      return { success: true };
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:8000/auth/register', userData);
      toast.success('Registration successful! Please log in.');
      return { success: true, data: response.data };
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Prepare the update data with required fields
      const updateData = {
        // Required fields - use current user data if not provided
        username: user.username, // Keep current username (cannot be changed)
        password: userData.password || '', // Empty password means no change
        
        // Optional fields - only include if provided and not empty
        full_name: userData.full_name?.trim() || user.full_name || null,
        email: userData.email?.trim() || user.email,
        age: userData.age ? parseInt(userData.age) : user.age || null,
        weight: userData.weight ? parseFloat(userData.weight) : user.weight || null,
        height: userData.height ? parseFloat(userData.height) : user.height || null,
        activity_level: userData.activity_level || user.activity_level || 'moderate',
        daily_calorie_goal: userData.daily_calorie_goal ? parseInt(userData.daily_calorie_goal) : user.daily_calorie_goal || null,
      };
      
      console.log('Current user data:', user);
      console.log('Sending profile update data:', updateData);
      
      const response = await axios.put('http://localhost:8000/auth/me', updateData);
      
      // Update the local user state with the response
      setUser(response.data);
      toast.success('Profile updated successfully');
      return { success: true, data: response.data };
      
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      const message = extractErrorMessage(error);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post('http://localhost:8000/auth/refresh-token');
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      return { success: true };
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false };
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}