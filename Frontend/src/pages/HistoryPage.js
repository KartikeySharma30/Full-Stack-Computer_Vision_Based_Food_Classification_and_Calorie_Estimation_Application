// frontend/src/pages/HistoryPage.js
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { 
  History, 
  Calendar, 
  Trash2, 
  Filter,
  Search,
  Coffee,
  Utensils,
  Moon,
  Cookie,
  TrendingUp,
  Clock
} from 'lucide-react';

function HistoryPage() {
  const [foodHistory, setFoodHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [selectedDays, setSelectedDays] = useState(7);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const mealTypes = [
    { value: 'all', label: 'All Meals', icon: Utensils },
    { value: 'breakfast', label: 'Breakfast', icon: Coffee },
    { value: 'lunch', label: 'Lunch', icon: Utensils },
    { value: 'dinner', label: 'Dinner', icon: Moon },
    { value: 'snack', label: 'Snacks', icon: Cookie }
  ];

  const dayOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 14, label: 'Last 2 weeks' },
    { value: 30, label: 'Last month' },
    { value: 90, label: 'Last 3 months' }
  ];

  useEffect(() => {
    fetchFoodHistory();
  }, [selectedDays]);

  useEffect(() => {
    filterHistory();
  }, [foodHistory, searchTerm, selectedMealType]);

  const fetchFoodHistory = async () => {
    setLoading(true);
    try {
      const result = await apiService.getFoodHistory(selectedDays, 100);
      if (result.success) {
        setFoodHistory(result.data.history || []);
      } else {
        toast.error('Failed to fetch food history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading food history');
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...foodHistory];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.food_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ingredients?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by meal type
    if (selectedMealType !== 'all') {
      filtered = filtered.filter(item => item.meal_type === selectedMealType);
    }

    setFilteredHistory(filtered);
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this food entry?')) {
      return;
    }

    setDeleteLoading(entryId);
    try {
      const result = await apiService.deleteFoodEntry(entryId);
      if (result.success) {
        toast.success('Food entry deleted successfully');
        // Remove from local state
        setFoodHistory(prev => prev.filter(item => item.id !== entryId));
      } else {
        toast.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Error deleting food entry');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: Coffee,
      lunch: Utensils,
      dinner: Moon,
      snack: Cookie
    };
    return icons[mealType] || Utensils;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTotalCalories = () => {
    return filteredHistory.reduce((total, item) => total + (item.calories || 0), 0);
  };

  const getMealTypeDistribution = () => {
    const distribution = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    filteredHistory.forEach(item => {
      if (distribution[item.meal_type] !== undefined) {
        distribution[item.meal_type]++;
      }
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const distribution = getMealTypeDistribution();
  const totalCalories = getTotalCalories();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 rounded-full p-4">
            <History className="h-12 w-12 text-purple-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Food History</h1>
        <p className="text-gray-600">
          Track your eating patterns and nutrition history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{filteredHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <Utensils className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Calories</p>
              <p className="text-2xl font-bold text-gray-900">{totalCalories.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <Coffee className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Most Common</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {Object.entries(distribution).reduce((a, b) => distribution[a[0]] > distribution[b[0]] ? a : b)[0]}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Time Period</p>
              <p className="text-lg font-bold text-gray-900">{selectedDays} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Foods
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by food name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Meal Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal Type
            </label>
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {mealTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Days Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Food Entries ({filteredHistory.length})
          </h2>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No food entries found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedMealType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start by classifying some food images'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredHistory.map((entry) => {
              const MealIcon = getMealIcon(entry.meal_type);
              return (
                <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 rounded-full p-2">
                        <MealIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {entry.food_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${apiService.getMealTypeColor(entry.meal_type)}`}>
                            {entry.meal_type}
                          </span>
                          {entry.confidence && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(entry.confidence)}`}>
                              {entry.confidence}% confidence
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {apiService.formatDate(entry.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {entry.time}
                          </div>
                        </div>
                        
                        {entry.ingredients && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {entry.ingredients}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {entry.calories} kcal
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={deleteLoading === entry.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete entry"
                      >
                        {deleteLoading === entry.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Meal Distribution */}
      {filteredHistory.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Meal Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(distribution).map(([mealType, count]) => {
              const MealIcon = getMealIcon(mealType);
              const percentage = filteredHistory.length > 0 ? (count / filteredHistory.length * 100).toFixed(1) : 0;
              
              return (
                <div key={mealType} className="text-center">
                  <div className="bg-gray-50 rounded-lg p-4 mb-2">
                    <MealIcon className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{mealType}</div>
                    <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;