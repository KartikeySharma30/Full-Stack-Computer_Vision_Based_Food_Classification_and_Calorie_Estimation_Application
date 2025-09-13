from datetime import datetime, timedelta
from typing import Optional
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.user import User
from ..utils.config import settings

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class AuthService:
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and extract payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            username: str = payload.get("sub")
            user_id: int = payload.get("user_id")
            
            if username is None or user_id is None:
                return None
            
            return {"username": username, "user_id": user_id}
            
        except InvalidTokenError:
            return None
    
    async def get_current_user(
        self, 
        token: str = Depends(oauth2_scheme), 
        db: Session = Depends(get_db)
    ) -> User:
        """Get current authenticated user from token"""
        
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        # Verify token
        token_data = self.verify_token(token)
        if token_data is None:
            raise credentials_exception
        
        # Get user from database
        user = db.query(User).filter(User.username == token_data["username"]).first()
        if user is None or not user.is_active:
            raise credentials_exception
        
        return user
    
    async def get_current_active_user(
        self, 
        current_user: User = Depends(lambda: AuthService().get_current_user)
    ) -> User:
        """Get current active user (additional check for active status)"""
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Inactive user"
            )
        return current_user
    
    def authenticate_user(self, db: Session, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        user = db.query(User).filter(User.username == username).first()
        if not user or not user.verify_password(password):
            return None
        return user
    
    def create_user_tokens(self, user: User) -> dict:
        """Create access and refresh tokens for user"""
        access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
        access_token = self.create_access_token(
            data={"sub": user.username, "user_id": user.id}, 
            expires_delta=access_token_expires
        )
        
        # Create longer-lived refresh token (7 days)
        refresh_token_expires = timedelta(days=7)
        refresh_token = self.create_access_token(
            data={"sub": user.username, "user_id": user.id, "type": "refresh"}, 
            expires_delta=refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60  # in seconds
        }