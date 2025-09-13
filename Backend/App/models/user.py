from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    full_name = Column(String(100))
    age = Column(Integer)
    weight = Column(Float)  # in kg
    height = Column(Float)  # in cm
    activity_level = Column(String(20))  # sedentary, light, moderate, active
    daily_calorie_goal = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationship with food logs
    food_logs = relationship("FoodLog", back_populates="user")
    daily_summaries = relationship("DailyCalorieSummary", back_populates="user")
    
    def verify_password(self, password: str) -> bool:
        """Verify password against stored hash"""
        return bcrypt.checkpw(
            password.encode('utf-8'), 
            self.hashed_password.encode('utf-8')
        )
    
    def set_password(self, password: str):
        """Hash and set password"""
        salt = bcrypt.gensalt()
        self.hashed_password = bcrypt.hashpw(
            password.encode('utf-8'), salt
        ).decode('utf-8')