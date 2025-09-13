from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date
from .database import Base

class FoodLog(Base):
    __tablename__ = "food_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, default=date.today)
    meal_type = Column(String(20), nullable=False)  # breakfast, lunch, dinner, snack
    food_name = Column(String(100), nullable=False)
    predicted_class = Column(String(100))
    calories = Column(Integer, nullable=False)
    confidence_score = Column(Float)
    ingredients_description = Column(Text)
    image_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="food_logs")

class DailyCalorieSummary(Base):
    __tablename__ = "daily_calorie_summary"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    breakfast_calories = Column(Integer, default=0)
    lunch_calories = Column(Integer, default=0)
    dinner_calories = Column(Integer, default=0)
    snack_calories = Column(Integer, default=0)
    total_calories = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="daily_summaries")