// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { 
  Camera, 
  TrendingUp, 
  Target, 
  Clock, 
  Calendar,
  User,
  Activity,
  Coffee,
  Utensils,
  Moon,
  Cookie
} from 'lucide-react';

function DashboardPage() {
  const { user } = useAuth();
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [profileSummary, setProfileSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch daily summary
        const dailyResult = await apiService.getDailySummary();
        if (dailyResult.success) {
          setDailySummary(dailyResult.data);
        }

        // Fetch weekly summary
        const weeklyResult = await apiService.getWeeklySummary();
        if (weeklyResult.success) {
          setWeeklySummary(weeklyResult.data);
        }

        // Fetch profile summary
        const profileResult = await apiService.getUserProfileSummary();
        if (profileResult.success) {
          setProfileSummary(profileResult.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: Coffee,
      lunch: Utensils,
      dinner: Moon,
      snacks: Cookie,
      snack: Cookie // Handle both 'snack' and 'snacks'
    };
    return icons[mealType] || Utensils;
  };

  const getProgressPercentage = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to get member since date from user data
  const getMemberSinceDate = () => {
    // First try to get from user context (most reliable)
    if (user?.created_at) {
      return apiService.formatDate(user.created_at);
    }
    
    // Fallback to profile summary
    if (profileSummary?.user_profile?.created_at) {
      return apiService.formatDate(profileSummary.user_profile.created_at);
    }
    
    // Default fallback
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.full_name || user?.username}!
            </h1>
            <p className="text-blue-100">
              Ready to track your nutrition journey today?
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 rounded-full p-4">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Goal</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.daily_calorie_goal || 2000} kcal
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Intake</p>
              <p className="text-2xl font-bold text-gray-900">
                {dailySummary?.summary?.total_calories || 0} kcal
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Average</p>
              <p className="text-2xl font-bold text-gray-900">
                {weeklySummary?.summary?.average_daily_calories || 0} kcal
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">
                {profileSummary?.activity_stats?.total_food_logs || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Progress */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Progress</h2>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Daily Calorie Goal</span>
                <span className="text-sm text-gray-500">
                  {dailySummary?.summary?.total_calories || 0} / {user?.daily_calorie_goal || 2000} kcal
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(
                    getProgressPercentage(
                      dailySummary?.summary?.total_calories || 0, 
                      user?.daily_calorie_goal || 2000
                    )
                  )}`}
                  style={{
                    width: `${getProgressPercentage(
                      dailySummary?.summary?.total_calories || 0, 
                      user?.daily_calorie_goal || 2000
                    )}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Meals Breakdown */}
            <div className="space-y-4">
              {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                const MealIcon = getMealIcon(mealType);
                const calories = dailySummary?.summary?.[`${mealType === 'snacks' ? 'snack' : mealType}_calories`] || 0;
                const meals = dailySummary?.meals?.[mealType] || [];
                
                return (
                  <div key={mealType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-white rounded-full p-2 mr-3">
                        <MealIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">{mealType}</h3>
                        <p className="text-sm text-gray-600">
                          {meals.length > 0 ? `${meals.length} item${meals.length > 1 ? 's' : ''}` : 'No items logged'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{calories} kcal</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Today's Meal Items - Removed time display */}
            {dailySummary?.meals && Object.values(dailySummary.meals).some(meals => meals.length > 0) && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Meals</h3>
                <div className="space-y-2">
                  {Object.entries(dailySummary.meals).map(([mealType, meals]) => 
                    meals.slice(0, 3).map((meal, index) => (
                      <div key={`${mealType}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full mr-3 ${apiService.getMealTypeColor(mealType === 'snacks' ? 'snack' : mealType)}`}>
                            {mealType === 'snacks' ? 'snack' : mealType}
                          </span>
                          <span className="text-gray-900">{meal.food_name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{meal.calories} kcal</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Classify Food Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <Link
              to="/classify"
              className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 mb-4"
            >
              <Camera className="h-5 w-5 mr-2" />
              Classify Food
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/history"
                className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <Clock className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">History</span>
              </Link>
              
              <Link
                to="/profile"
                className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <User className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Profile</span>
              </Link>
            </div>
          </div>

          {/* Weekly Summary Card */}
          {weeklySummary && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">This Week</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Calories</span>
                  <span className="font-medium">{weeklySummary.summary?.total_week_calories || 0} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Average</span>
                  <span className="font-medium">{weeklySummary.summary?.average_daily_calories || 0} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Goal Achievement</span>
                  <span className={`font-medium ${
                    (weeklySummary.summary?.goal_achievement_rate || 0) >= 90 ? 'text-green-600' : 
                    (weeklySummary.summary?.goal_achievement_rate || 0) >= 70 ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {weeklySummary.summary?.goal_achievement_rate || 0}%
                  </span>
                </div>
              </div>
              
              {/* Mini Daily Breakdown */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Breakdown</h4>
                <div className="grid grid-cols-7 gap-1">
                  {weeklySummary.daily_breakdown?.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        {day.day_name.slice(0, 3)}
                      </div>
                      <div className={`h-8 rounded text-xs flex items-center justify-center text-white ${
                        day.calories > 0 ? 'bg-blue-500' : 'bg-gray-200'
                      }`}>
                        {day.calories > 0 ? Math.round(day.calories / 100) : '0'}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Calories (×100)</p>
              </div>
            </div>
          )}

          {/* Activity Stats Card - Fixed Member Since */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">{getMemberSinceDate()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Food Logs</span>
                <span className="font-medium">{profileSummary?.activity_stats?.total_food_logs || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Week</span>
                <span className="font-medium">{profileSummary?.activity_stats?.logs_this_week || 0} logs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Activity Level</span>
                <span className="font-medium capitalize">{user?.activity_level || profileSummary?.user_profile?.activity_level || 'moderate'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Today's Tip</h2>
        <p className="text-gray-700">
          Take a photo of your meal or use the camera feature to capture images in real-time! 
          Our AI can identify over 30 different Indian food items and provide detailed nutritional information with accessibility features.
        </p>
        <Link
          to="/classify"
          className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Try it now
          <Camera className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}

export default DashboardPage;