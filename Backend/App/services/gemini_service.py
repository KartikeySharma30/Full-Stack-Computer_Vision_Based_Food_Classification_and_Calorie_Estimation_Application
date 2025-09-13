import google.generativeai as genai
from ..utils.config import settings
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.client = None
        self.is_configured = False
        self.configure_gemini()
    
    def configure_gemini(self):
        """Configure Gemini AI with API key"""
        try:
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.client = genai.GenerativeModel('gemini-2.0-flash')
                self.is_configured = True
                logger.info("Gemini AI configured successfully")
            else:
                logger.warning("Gemini API key not provided - ingredient descriptions will be unavailable")
        except Exception as e:
            logger.error(f"Error configuring Gemini AI: {str(e)}")
            self.is_configured = False
    
    async def get_food_description(self, food_name: str) -> str:
        """Get ingredient and nutritional description for a food item"""
        if not self.is_configured:
            return f"Nutritional information for {food_name} is currently unavailable."
        
        try:
            prompt = f"""
            Provide a brief description (2-3 sentences) of the Indian dish "{food_name}" including:
            1. Main ingredients
            2. Key nutritional components (proteins, carbs, fats)
            3. Health benefits
            
            Keep it concise and informative.
            """
            
            response = self.client.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Error getting food description from Gemini: {str(e)}")
            return f"This appears to be {food_name}. Detailed nutritional information is currently unavailable."
        
    async def calculate_total_calories(self, daily_meals: Dict[str, List[str]]) -> str:
        """
        Calculate total daily calories from meal data
        daily_meals format: {
            "breakfast": ["~300-400 kcal (aloo paratha)", "~120-150 kcal (tea with milk)"],
            "lunch": ["~400-500 kcal (dal rice)", "~200-250 kcal (sabzi)"],
            "dinner": ["~350-400 kcal (roti with curry)"],
            "snacks": ["~150-200 kcal (samosa)"]
        }
        """
        if not self.is_configured:
            return "~1500-2000 kcal (estimated total for the day)"
        
        try:
            # Format the meal data for the prompt
            meal_summary = []
            for meal_type, foods in daily_meals.items():
                if foods:  # Only include meals that have food items
                    meal_summary.append(f"{meal_type.capitalize()}: {', '.join(foods)}")
            
            if not meal_summary:
                return "~0 kcal (no meals logged today)"
            
            prompt = f"""
            Based on the following Indian meals consumed in a day, provide a total calorie estimate:
            
            {chr(10).join(meal_summary)}
            
            Please:
            1. Add up the calorie ranges for each meal
            2. Provide a total daily calorie estimate in the format: "~X-Y kcal (total for the day)"
            3. Consider overlaps and be realistic about portion sizes
            4. Keep the response to just the calorie estimate format
            
            Example response format: "~1800-2200 kcal (total for the day)"
            """
            
            response = self.client.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error calculating total calories with Gemini: {str(e)}")
            # Fallback: simple estimation
            total_items = sum(len(foods) for foods in daily_meals.values())
            estimated_total = total_items * 250  # Rough estimate of 250 kcal per food item
            return f"~{estimated_total-100}-{estimated_total+100} kcal (estimated total for the day)"


# Create global instance
gemini_service = GeminiService()