// frontend/src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Mail, 
  Calendar, 
  Scale, 
  Ruler, 
  Activity, 
  Target,
  TrendingUp,
  Award,
  BarChart3,
  Clock,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [profileSummary, setProfileSummary] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    age: '',
    weight: '',
    height: '',
    activity_level: 'moderate',
    daily_calorie_goal: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { value: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
    { value: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week' }
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        age: user.age ? user.age.toString() : '',
        weight: user.weight ? user.weight.toString() : '',
        height: user.height ? user.height.toString() : '',
        activity_level: user.activity_level || 'moderate',
        daily_calorie_goal: user.daily_calorie_goal ? user.daily_calorie_goal.toString() : ''
      });
    }
  }, [user]);

  useEffect(() => {
    fetchProfileSummary();
  }, []);

  const fetchProfileSummary = async () => {
    try {
      const result = await apiService.getUserProfileSummary();
      if (result.success) {
        setProfileSummary(result.data);
      }
    } catch (error) {
      console.error('Error fetching profile summary:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate age
    if (formData.age && (parseInt(formData.age) < 13 || parseInt(formData.age) > 120)) {
      newErrors.age = 'Age must be between 13 and 120';
    }

    // Validate weight
    if (formData.weight && (parseFloat(formData.weight) < 20 || parseFloat(formData.weight) > 500)) {
      newErrors.weight = 'Weight must be between 20 and 500 kg';
    }

    // Validate height
    if (formData.height && (parseFloat(formData.height) < 100 || parseFloat(formData.height) > 250)) {
      newErrors.height = 'Height must be between 100 and 250 cm';
    }

    // Validate calorie goal
    if (formData.daily_calorie_goal && (parseInt(formData.daily_calorie_goal) < 800 || parseInt(formData.daily_calorie_goal) > 5000)) {
      newErrors.daily_calorie_goal = 'Daily calorie goal must be between 800 and 5000';
    }

    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'New password must be at least 8 characters long';
    }

    if (!passwordData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (passwordData.current_password === passwordData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare data for submission - only send changed fields
      const submitData = {};
      
      // Compare with current user data and only include changed fields
      if (formData.full_name.trim() !== (user?.full_name || '')) {
        submitData.full_name = formData.full_name.trim() || null;
      }
      
      if (formData.email.trim() !== (user?.email || '')) {
        submitData.email = formData.email.trim();
      }
      
      if (formData.age && parseInt(formData.age) !== (user?.age || 0)) {
        submitData.age = parseInt(formData.age);
      }
      
      if (formData.weight && parseFloat(formData.weight) !== (user?.weight || 0)) {
        submitData.weight = parseFloat(formData.weight);
      }
      
      if (formData.height && parseFloat(formData.height) !== (user?.height || 0)) {
        submitData.height = parseFloat(formData.height);
      }
      
      if (formData.activity_level !== (user?.activity_level || 'moderate')) {
        submitData.activity_level = formData.activity_level;
      }
      
      if (formData.daily_calorie_goal && parseInt(formData.daily_calorie_goal) !== (user?.daily_calorie_goal || 0)) {
        submitData.daily_calorie_goal = parseInt(formData.daily_calorie_goal);
      }

      console.log('Submitting profile data (changed fields only):', submitData);

      const result = await updateProfile(submitData);
      
      if (result.success) {
        setEditing(false);
        fetchProfileSummary();
      } else {
        console.error('Update failed:', result.error);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate password form
    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the password validation errors');
      return;
    }

    setPasswordLoading(true);
    setErrors({});

    try {
      // Call the password update API endpoint
      const result = await apiService.updatePassword(
        passwordData.current_password,
        passwordData.new_password
      );

      if (result.success) {
        setEditingPassword(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        toast.success('Password updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast.error('Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        age: user.age ? user.age.toString() : '',
        weight: user.weight ? user.weight.toString() : '',
        height: user.height ? user.height.toString() : '',
        activity_level: user.activity_level || 'moderate',
        daily_calorie_goal: user.daily_calorie_goal ? user.daily_calorie_goal.toString() : ''
      });
    }
    setErrors({});
    setEditing(false);
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setErrors({});
    setEditingPassword(false);
  };

  const calculateBMI = () => {
    if (user?.weight && user?.height) {
      const heightInMeters = user.height / 100;
      const bmi = user.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { category: 'Obese', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const getProgressToGoal = () => {
    if (!profileSummary?.activity_stats?.average_daily_calories || !user?.daily_calorie_goal) return 0;
    return Math.min((profileSummary.activity_stats.average_daily_calories / user.daily_calorie_goal * 100), 100);
  };

  const bmi = calculateBMI();
  const bmiData = bmi ? getBMICategory(parseFloat(bmi)) : null;
  const progressToGoal = getProgressToGoal();

  // Helper function to render form field with error
  const renderFormField = (name, label, type = 'text', props = {}) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
          errors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        } ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        {...props}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <X className="h-3 w-3 mr-1" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  // Helper function to render password field with error
  const renderPasswordField = (name, label, showPassword, setShowPassword) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={passwordData[name]}
          onChange={handlePasswordChange}
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
            errors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <X className="h-3 w-3 mr-1" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  const renderInfoItem = (icon, label, value, className = '') => (
    <div className={`flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200 ${className}`}>
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>
      <div className="flex-grow min-w-0">
        <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
        <div className="text-gray-900 font-medium truncate">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 shadow-lg">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your personal information and track your nutrition journey
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  </div>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200 font-medium"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderFormField('full_name', 'Full Name', 'text', { 
                        placeholder: 'Enter your full name',
                        maxLength: 100
                      })}
                      {renderFormField('email', 'Email Address', 'email', { 
                        disabled: true, 
                        placeholder: 'Email cannot be changed',
                        title: 'Email cannot be modified after registration'
                      })}
                      {renderFormField('age', 'Age', 'number', { 
                        min: 13, 
                        max: 120, 
                        placeholder: 'Enter your age' 
                      })}
                      {renderFormField('weight', 'Weight (kg)', 'number', { 
                        step: '0.1', 
                        min: 20, 
                        max: 500, 
                        placeholder: 'Enter weight in kg' 
                      })}
                      {renderFormField('height', 'Height (cm)', 'number', { 
                        min: 100, 
                        max: 250, 
                        placeholder: 'Enter height in cm' 
                      })}
                      {renderFormField('daily_calorie_goal', 'Daily Calorie Goal', 'number', { 
                        min: 800, 
                        max: 5000, 
                        placeholder: 'Enter daily calorie target' 
                      })}
                    </div>

                    {/* Activity Level */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Activity Level
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activityLevels.map((level) => (
                          <label
                            key={level.value}
                            className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              formData.activity_level === level.value
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="activity_level"
                              value={level.value}
                              checked={formData.activity_level === level.value}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="flex-grow">
                              <div className="font-semibold text-gray-900">{level.label}</div>
                              <div className="text-sm text-gray-600">{level.description}</div>
                            </div>
                            {formData.activity_level === level.value && (
                              <CheckCircle className="h-5 w-5 text-blue-500" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-3" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderInfoItem(
                        <User className="h-5 w-5 text-gray-400" />,
                        'Full Name',
                        user?.full_name || 'Not provided'
                      )}
                      {renderInfoItem(
                        <Mail className="h-5 w-5 text-gray-400" />,
                        'Email Address',
                        user?.email || 'Not provided'
                      )}
                      {renderInfoItem(
                        <Calendar className="h-5 w-5 text-gray-400" />,
                        'Age',
                        user?.age ? `${user.age} years` : 'Not provided'
                      )}
                      {renderInfoItem(
                        <Scale className="h-5 w-5 text-gray-400" />,
                        'Weight',
                        user?.weight ? `${user.weight} kg` : 'Not provided'
                      )}
                      {renderInfoItem(
                        <Ruler className="h-5 w-5 text-gray-400" />,
                        'Height',
                        user?.height ? `${user.height} cm` : 'Not provided'
                      )}
                      {renderInfoItem(
                        <Activity className="h-5 w-5 text-gray-400" />,
                        'Activity Level',
                        user?.activity_level ? user.activity_level.charAt(0).toUpperCase() + user.activity_level.slice(1) : 'Moderate'
                      )}
                      {renderInfoItem(
                        <Target className="h-5 w-5 text-gray-400" />,
                        'Daily Calorie Goal',
                        `${user?.daily_calorie_goal || 2000} kcal`
                      )}
                      {bmi && bmiData && renderInfoItem(
                        <BarChart3 className="h-5 w-5 text-gray-400" />,
                        'Body Mass Index (BMI)',
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{bmi}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${bmiData.bgColor} ${bmiData.color}`}>
                            {bmiData.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        Member since: {user?.created_at ? apiService.formatDate(user.created_at) : 'Unknown'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Update Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-red-600" />
                    <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                  </div>
                  {!editingPassword ? (
                    <button
                      onClick={() => setEditingPassword(true)}
                      className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 font-medium"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </button>
                  ) : (
                    <button
                      onClick={handlePasswordCancel}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {editingPassword ? (
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {renderPasswordField('current_password', 'Current Password', showCurrentPassword, setShowCurrentPassword)}
                      {renderPasswordField('new_password', 'New Password', showNewPassword, setShowNewPassword)}
                      {renderPasswordField('confirm_password', 'Confirm New Password', showConfirmPassword, setShowConfirmPassword)}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">Password Requirements:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• Different from your current password</li>
                        <li>• Use a combination of letters, numbers, and symbols for better security</li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        {passwordLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <Lock className="h-5 w-5 mr-3" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {renderInfoItem(
                      <Lock className="h-5 w-5 text-gray-400" />,
                      'Password',
                      '••••••••••••'
                    )}
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                      <p>Keep your account secure by using a strong password and changing it regularly.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Activity Stats Card */}
            {profileSummary && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900">Activity Overview</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Total Food Logs</span>
                    <span className="font-bold text-2xl text-gray-900">
                      {profileSummary.activity_stats?.total_food_logs || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">This Week</span>
                    <span className="font-bold text-lg text-green-600">
                      {profileSummary.activity_stats?.logs_this_week || 0} logs
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Daily Average</span>
                    <span className="font-bold text-lg text-blue-600">
                      {profileSummary.activity_stats?.average_daily_calories || 0} kcal
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Goal Progress Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Target className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Goal Progress</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700">Daily Calorie Goal</span>
                    <span className="text-sm font-semibold text-purple-600">{progressToGoal.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        progressToGoal >= 90 ? 'bg-green-500' :
                        progressToGoal >= 70 ? 'bg-blue-500' :
                        progressToGoal >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(progressToGoal, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {profileSummary && (
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <div className={`text-3xl font-bold mb-1 ${
                      (profileSummary.activity_stats?.goal_achievement_rate || 0) >= 90 ? 'text-green-600' :
                      (profileSummary.activity_stats?.goal_achievement_rate || 0) >= 70 ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {profileSummary.activity_stats?.goal_achievement_rate || 0}%
                    </div>
                    <div className="text-sm font-medium text-gray-600">Achievement Rate</div>
                  </div>
                )}
              </div>
            </div>

            {/* Health Metrics Card */}
            {(user?.weight && user?.height) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Scale className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Health Metrics</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {bmi && bmiData && (
                    <div className={`text-center p-6 rounded-xl border-2 ${bmiData.bgColor} ${bmiData.color.replace('text-', 'border-')}`}>
                      <div className="text-4xl font-bold mb-2">{bmi}</div>
                      <div className={`font-bold text-lg ${bmiData.color} mb-1`}>{bmiData.category}</div>
                      <div className="text-sm text-gray-600">Body Mass Index</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">{user.weight}</div>
                      <div className="text-sm font-medium text-gray-600">Weight (kg)</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">{user.height}</div>
                      <div className="text-sm font-medium text-gray-600">Height (cm)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Award className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {profileSummary?.activity_stats?.total_food_logs >= 10 ? (
                    <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="bg-yellow-100 rounded-full p-2 mr-4 flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-semibold text-gray-900">Consistent Logger</div>
                        <div className="text-sm text-gray-600">Logged 10+ food items</div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    </div>
                  ) : null}
                  
                  {profileSummary?.activity_stats?.logs_this_week >= 5 ? (
                    <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="bg-green-100 rounded-full p-2 mr-4 flex-shrink-0">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-semibold text-gray-900">Weekly Warrior</div>
                        <div className="text-sm text-gray-600">5+ logs this week</div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    </div>
                  ) : null}

                  {(profileSummary?.activity_stats?.goal_achievement_rate || 0) >= 80 ? (
                    <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="bg-blue-100 rounded-full p-2 mr-4 flex-shrink-0">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-semibold text-gray-900">Goal Achiever</div>
                        <div className="text-sm text-gray-600">80%+ goal achievement</div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    </div>
                  ) : null}

                  {/* Show encouraging message if no achievements yet */}
                  {(!profileSummary?.activity_stats?.total_food_logs || profileSummary?.activity_stats?.total_food_logs < 10) &&
                   (!profileSummary?.activity_stats?.logs_this_week || profileSummary?.activity_stats?.logs_this_week < 5) &&
                   (profileSummary?.activity_stats?.goal_achievement_rate || 0) < 80 && (
                    <div className="text-center py-8">
                      <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Award className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="text-gray-600 font-medium mb-2">No achievements yet</div>
                      <div className="text-sm text-gray-500 max-w-xs mx-auto">
                        Keep logging your meals and reaching your goals to unlock achievements!
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;