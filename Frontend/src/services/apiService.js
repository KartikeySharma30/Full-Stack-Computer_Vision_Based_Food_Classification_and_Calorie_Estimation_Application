// frontend/src/services/apiService.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token might be expired, redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication APIs
  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await this.api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  // Food Classification APIs
  async getModelStatus() {
    try {
      const response = await this.api.get('/food/model-status');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async classifyFood(file, mealType, saveToDb = true) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('meal_type', mealType);
      formData.append('save_to_db', saveToDb);

      const response = await this.api.post('/food/classify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getDailySummary(date = null) {
    try {
      const params = date ? { target_date: date } : {};
      const response = await this.api.get('/food/daily-calorie-summary', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getFoodHistory(days = 7, limit = 50) {
    try {
      const response = await this.api.get('/food/history', {
        params: { days, limit }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getWeeklySummary(weeksBack = 0) {
    try {
      const response = await this.api.get('/food/weekly-summary', {
        params: { weeks_back: weeksBack }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async deleteFoodEntry(foodLogId) {
    try {
      const response = await this.api.delete(`/food/food-entry/${foodLogId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getUserProfileSummary() {
    try {
      const response = await this.api.get('/food/user-profile-summary');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  // Database Admin APIs (for development)
  async getDatabaseStats() {
    try {
      const response = await this.api.get('/food/admin/database-stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getAllFoodLogs(limit = 20) {
    try {
      const response = await this.api.get('/food/admin/view-all-food-logs', {
        params: { limit }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  // Utility methods
  formatCalories(caloriesString) {
    if (typeof caloriesString === 'number') {
      return `${caloriesString} kcal`;
    }
    return caloriesString || 'Unknown kcal';
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMealTypeColor(mealType) {
    const colors = {
      breakfast: 'bg-yellow-100 text-yellow-800',
      lunch: 'bg-green-100 text-green-800',
      dinner: 'bg-blue-100 text-blue-800',
      snack: 'bg-purple-100 text-purple-800'
    };
    return colors[mealType] || 'bg-gray-100 text-gray-800';
  }

  getConfidenceColor(confidence) {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
}

export default new ApiService();