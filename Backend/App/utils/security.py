import bcrypt
from typing import str
import secrets
import string

class SecurityUtils:
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    
    @staticmethod
    def generate_random_string(length: int = 32) -> str:
        """Generate a random string for tokens or keys"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def generate_secret_key() -> str:
        """Generate a secure secret key for JWT"""
        return secrets.token_urlsafe(32)

# Password validation utilities
class PasswordValidator:
    
    @staticmethod
    def validate_password_strength(password: str) -> dict:
        """Validate password strength and return feedback"""
        errors = []
        score = 0
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        else:
            score += 1
        
        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        else:
            score += 1
        
        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        else:
            score += 1
        
        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one number")
        else:
            score += 1
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain at least one special character")
        else:
            score += 1
        
        strength_levels = {
            0: "Very Weak",
            1: "Weak", 
            2: "Fair",
            3: "Good",
            4: "Strong",
            5: "Very Strong"
        }
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "strength": strength_levels[score],
            "score": score
        }
    
    @staticmethod
    def is_password_valid(password: str) -> bool:
        """Simple check if password meets minimum requirements"""
        return (len(password) >= 8 and 
                any(c.isupper() for c in password) and
                any(c.islower() for c in password) and
                any(c.isdigit() for c in password))

# Input sanitization utilities  
class InputSanitizer:
    
    @staticmethod
    def sanitize_username(username: str) -> str:
        """Sanitize username input"""
        # Remove leading/trailing whitespace and convert to lowercase
        username = username.strip().lower()
        
        # Remove any non-alphanumeric characters except underscore and hyphen
        allowed_chars = string.ascii_lowercase + string.digits + "_-"
        sanitized = ''.join(c for c in username if c in allowed_chars)
        
        return sanitized
    
    @staticmethod
    def sanitize_email(email: str) -> str:
        """Basic email sanitization"""
        return email.strip().lower()
    
    @staticmethod
    def validate_email_format(email: str) -> bool:
        """Basic email format validation"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None