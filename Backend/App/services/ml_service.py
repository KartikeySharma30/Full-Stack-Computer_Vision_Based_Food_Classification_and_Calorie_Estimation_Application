import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import pandas as pd
from PIL import Image
import cv2
import os
from typing import Dict, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLService:
    def __init__(self):
        self.model = None
        self.calorie_data = None
        self.class_names = None
        self.model_loaded = False
        self.load_model()
    
    def load_model(self):
        """Load the trained model and calorie data"""
        try:
            
            model_path = "/Users/kartikeysharma/Desktop/FCCES/Backend/App/ml_models/FCCES_Model.h5"
            calorie_data_path = "/Users/kartikeysharma/Desktop/FCCES/Backend/App/ml_models/Cal_data.csv"
            
            if os.path.exists(model_path):
                logger.info(f"Loading model from {model_path}")
                self.model = load_model(model_path,safe_mode = False)
                logger.info("Model loaded successfully!")
                self.model_loaded = True
                
            else:
                logger.warning(f"Model file not found at {model_path}")
                return
            
            # Load calorie data if available
            if os.path.exists(calorie_data_path):
                logger.info(f"Loading calorie data from {calorie_data_path}")
                self.calorie_data = pd.read_csv(calorie_data_path)
                self.class_names = self.calorie_data['Food Item Name'].tolist()
                logger.info(f"Loaded {len(self.class_names)} food classes")
            else:
                logger.warning(f"Calorie data file not found at {calorie_data_path}")
                # Create dummy class names if no CSV
                self.class_names = [f"Food_Class_{i}" for i in range(34)]
                
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self.model_loaded = False
    
    def preprocess_image(self, image_path: str) -> Optional[np.ndarray]:
        """Preprocess image for model prediction"""
        try:
            # Load image
            if not os.path.exists(image_path):
                logger.error(f"Image file not found: {image_path}")
                return None
                
            image = cv2.imread(image_path)
            if image is None:
                logger.error(f"Could not load image: {image_path}")
                return None
                
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image = cv2.resize(image, (150, 150))
            image = image.astype('float32') / 255.0
            image = np.expand_dims(image, axis=0)
            
            return image
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            return None
    
    def predict_food(self, image_path: str) -> Dict:
        """Predict food class and get calorie information"""
        if not self.model_loaded:
            return {
                "error": "Model not loaded",
                "food_name": "Unknown",
                "calories": 0,
                "confidence": 0.0
            }
        
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_path)
            if processed_image is None:
                return {
                    "error": "Failed to process image",
                    "food_name": "Unknown",
                    "calories": "Unknown",
                    "confidence": 0.0
                }
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            predicted_class_index = np.argmax(predictions[0])
            confidence = round((float(predictions[0][predicted_class_index]))*100,2)
            
            # Get food name
            food_name = self.class_names[predicted_class_index] if predicted_class_index < len(self.class_names) else "Unknown"
            
            # Get calorie information
            calories = self.get_calories_for_food(predicted_class_index)
            
            logger.info(f"Predicted: {food_name} with confidence: {confidence:.2f}")
            
            return {
                "food_name": food_name,
                "predicted_class_index": int(predicted_class_index),
                "confidence": confidence,
                "calories": calories
            }
            
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            return {
                "error": str(e),
                "food_name": "Unknown",
                "calories": "Unknown",
                "confidence": 0.0
            }
    
    def get_calories_for_food(self, class_index: int) -> int:
        """Get calories for a food class"""
        if self.calorie_data is not None and class_index < len(self.calorie_data):
            return self.calorie_data.iloc[class_index].get('Calorie', "Unknown")
        else:
            # Return dummy calories if no data available
            dummy_calories = [
                "~200-250 kcal (per serving)", "~300-350 kcal (per serving)", 
                "~150-200 kcal (per serving)", "~400-450 kcal (per serving)",
                "~250-300 kcal (per serving)", "~180-220 kcal (per serving)",
                "~350-400 kcal (per serving)", "~220-270 kcal (per serving)",
                "~320-370 kcal (per serving)", "~190-240 kcal (per serving)",
                "~280-330 kcal (per serving)", "~160-210 kcal (per serving)",
                "~380-430 kcal (per serving)", "~240-290 kcal (per serving)",
                "~300-350 kcal (per serving)", "~170-220 kcal (per serving)",
                "~330-380 kcal (per serving)", "~210-260 kcal (per serving)",
                "~290-340 kcal (per serving)", "~200-250 kcal (per serving)",
                "~310-360 kcal (per serving)", "~180-230 kcal (per serving)",
                "~340-390 kcal (per serving)", "~230-280 kcal (per serving)",
                "~270-320 kcal (per serving)", "~190-240 kcal (per serving)",
                "~360-410 kcal (per serving)", "~220-270 kcal (per serving)",
                "~280-330 kcal (per serving)", "~200-250 kcal (per serving)",
                "~320-370 kcal (per serving)", "~180-230 kcal (per serving)",
                "~350-400 kcal (per serving)", "~240-290 kcal (per serving)"
            ]
            return dummy_calories[class_index] if class_index < len(dummy_calories) else "~200-250 kcal (per serving)"
    
    def is_model_ready(self) -> bool:
        """Check if model is loaded and ready"""
        return self.model_loaded

# Create a global instance
# if __name__ == '__main__':
ml_service = MLService()