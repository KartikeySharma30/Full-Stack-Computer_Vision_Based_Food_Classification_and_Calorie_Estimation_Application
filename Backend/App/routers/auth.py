from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
from jwt.exceptions import InvalidTokenError

from ..models.database import get_db
from ..models.user import User
from ..services.auth_service import AuthService
from ..utils.config import settings

router = APIRouter()
auth_service = AuthService()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Pydantic models for request/response
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    activity_level: Optional[str] = "moderate"
    daily_calorie_goal: Optional[int] = 2000

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    age: Optional[int]
    weight: Optional[float]
    height: Optional[float]
    activity_level: Optional[str]
    daily_calorie_goal: Optional[int]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create new user
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            age=user_data.age,
            weight=user_data.weight,
            height=user_data.height,
            activity_level=user_data.activity_level,
            daily_calorie_goal=user_data.daily_calorie_goal
        )
        
        # Hash and set password
        db_user.set_password(user_data.password)
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    
    # Find user by username
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = auth_service.create_access_token(data={"sub": user.username, "user_id": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(auth_service.get_current_user)):
    """Get current user profile"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserCreate,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    
    try:
        # Update user fields
        if user_update.full_name is not None:
            current_user.full_name = user_update.full_name
        if user_update.age is not None:
            current_user.age = user_update.age
        if user_update.weight is not None:
            current_user.weight = user_update.weight
        if user_update.height is not None:
            current_user.height = user_update.height
        if user_update.activity_level is not None:
            current_user.activity_level = user_update.activity_level
        if user_update.daily_calorie_goal is not None:
            current_user.daily_calorie_goal = user_update.daily_calorie_goal
        
        # Update password if provided
        if user_update.password:
            current_user.set_password(user_update.password)
        
        db.commit()
        db.refresh(current_user)
        
        return current_user
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.put("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    
    # Verify current password
    if not current_user.verify_password(password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Check if new password is different from current
    if current_user.verify_password(password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Validate new password strength
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    try:
        # Set new password
        current_user.set_password(password_data.new_password)
        db.commit()
        
        return {"message": "Password updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update password: {str(e)}"
        )

@router.post("/refresh-token", response_model=Token)
async def refresh_access_token(current_user: User = Depends(auth_service.get_current_user)):
    """Refresh access token"""
    
    access_token = auth_service.create_access_token(
        data={"sub": current_user.username, "user_id": current_user.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": current_user.id,
        "username": current_user.username
    }

@router.delete("/delete-account")
async def delete_user_account(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account (deactivate)"""
    
    try:
        # Instead of deleting, deactivate the user
        current_user.is_active = False
        db.commit()
        
        return {"message": "Account deactivated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate account: {str(e)}"
        )

# Admin endpoints for development/testing
@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get all users (admin only - for development)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users