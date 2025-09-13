// frontend/src/pages/ClassifyPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Coffee,
  Utensils,
  Moon,
  Cookie,
  Volume2,
  VolumeX,
  Video,
  FileImage
} from 'lucide-react';

function ClassifyPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'text-yellow-600' },
    { value: 'lunch', label: 'Lunch', icon: Utensils, color: 'text-green-600' },
    { value: 'dinner', label: 'Dinner', icon: Moon, color: 'text-blue-600' },
    { value: 'snack', label: 'Snack', icon: Cookie, color: 'text-purple-600' }
  ];

  // Clean up camera stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Text-to-Speech functionality
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Set voice to English if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast.error('Speech synthesis failed');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Camera functionality - Fixed version
  const startCamera = async () => {
    setCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for video element to be available and set stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera access error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera access denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Camera access failed. Please try again.');
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready. Please try again.');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera not ready. Please wait a moment and try again.');
      return;
    }
    
    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create file from blob
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        
        handleImageSelect(file);
        stopCamera();
        toast.success('Photo captured successfully!');
      } else {
        toast.error('Failed to capture photo. Please try again.');
      }
    }, 'image/jpeg', 0.9);
  };

  const handleImageSelect = (file) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear previous result
      setResult(null);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleImageSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClassify = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    
    try {
      const classifyResult = await apiService.classifyFood(selectedImage, mealType, true);
      
      if (classifyResult.success) {
        setResult(classifyResult.data);
        toast.success('Food classified successfully!');
      } else {
        toast.error(classifyResult.error || 'Classification failed');
      }
    } catch (error) {
      console.error('Classification error:', error);
      toast.error('Failed to classify food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    stopSpeaking();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-4">
            <Camera className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Classify Your Food</h1>
        <p className="text-gray-600">
          Upload an image or capture a photo of your food to get instant calorie estimates and nutritional information
        </p>
      </div>

      {/* Camera Modal - Fixed */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Capture Food Photo</h3>
              <button
                onClick={stopCamera}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="relative">
              {/* Video element for camera feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-96 object-cover rounded-lg bg-gray-900"
                style={{ minHeight: '300px' }}
              />
              
              {/* Loading overlay for camera initialization */}
              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
                  <div className="text-white text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                    <p>Starting camera...</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-4 space-x-4">
                <button
                  onClick={capturePhoto}
                  disabled={cameraLoading || !stream}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Upload Section */}
        <div className="space-y-6">
          {/* Meal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Meal Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {mealTypes.map((meal) => {
                const Icon = meal.icon;
                return (
                  <button
                    key={meal.value}
                    onClick={() => setMealType(meal.value)}
                    className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                      mealType === meal.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-2 ${mealType === meal.value ? 'text-blue-600' : meal.color}`} />
                    <span className="font-medium">{meal.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Upload/Capture Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload or Capture Food Image
            </label>
            
            {/* Camera and File Upload Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={startCamera}
                disabled={cameraLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {cameraLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5 mr-2" />
                    Use Camera
                  </>
                )}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <FileImage className="h-5 w-5 mr-2" />
                Upload File
              </button>
            </div>
            
            {!imagePreview ? (
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200 ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Upload className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your image here, use camera, or browse files
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Selected food"
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Classify Button */}
          <button
            onClick={handleClassify}
            disabled={!selectedImage || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Classifying...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5 mr-2" />
                Classify Food
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Classification Result</h2>
              </div>

              <div className="space-y-4">
                {/* Food Name */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {result.food_name}
                  </h3>
                  
                  {/* Meal Type Badge */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${apiService.getMealTypeColor(result.meal_type)}`}>
                    {result.meal_type}
                  </span>
                </div>

                {/* Calories */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Estimated Calories</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {result.calories}
                    </span>
                  </div>
                </div>

                {/* Confidence Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        result.confidence >= 80 ? 'bg-green-500' :
                        result.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* Ingredients Description with TTS */}
                {result.ingredients && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Nutritional Information</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => speakText(result.ingredients)}
                          disabled={isSpeaking}
                          className="flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Listen to nutritional information"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="h-4 w-4 mr-1" />
                              <span className="text-sm">Speaking...</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 mr-1" />
                              <span className="text-sm">Listen</span>
                            </>
                          )}
                        </button>
                        {isSpeaking && (
                          <button
                            onClick={stopSpeaking}
                            className="flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                            title="Stop speaking"
                          >
                            <X className="h-4 w-4 mr-1" />
                            <span className="text-sm">Stop</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {result.ingredients}
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {result.saved_to_db && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        Successfully saved to your food log!
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      clearImage();
                      setResult(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Classify Another
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
              <p className="text-gray-600">
                Upload an image, capture a photo, or drag and drop to see the results here
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-3">📸 Tips for Better Results</h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>• Take photos in good lighting</li>
              <li>• Ensure the food is clearly visible</li>
              <li>• Avoid blurry or dark images</li>
              <li>• Include the entire dish in the frame</li>
              <li>• Works best with Indian cuisine</li>
              <li>• Use the audio feature for accessibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassifyPage;