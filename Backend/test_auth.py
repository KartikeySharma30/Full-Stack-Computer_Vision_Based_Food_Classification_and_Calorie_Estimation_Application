"""
Authentication System Test Script
Run this to test the authentication endpoints
"""

import requests
import json
from datetime import datetime

# API Base URL
BASE_URL = "http://localhost:8000"

class AuthTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_id = None

    def test_register(self):
        """Test user registration"""
        print("\n🔵 Testing User Registration...")
        
        # Create test user data
        user_data = {
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPassword123!",
            "full_name": "Test User",
            "age": 25,
            "weight": 70.0,
            "height": 175.0,
            "activity_level": "moderate",
            "daily_calorie_goal": 2000
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=user_data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Registration successful!")
                print(f"   User ID: {result['id']}")
                print(f"   Username: {result['username']}")
                print(f"   Email: {result['email']}")
                return user_data
            else:
                print(f"❌ Registration failed: {response.status_code}")
                print(f"   Error: {response.json()}")
                return None
                
        except Exception as e:
            print(f"❌ Registration error: {e}")
            return None

    def test_login(self, username, password):
        """Test user login"""
        print(f"\n🔵 Testing User Login for {username}...")
        
        try:
            # FastAPI OAuth2PasswordRequestForm expects form data
            login_data = {
                "username": username,
                "password": password
            }
            
            response = requests.post(
                f"{self.base_url}/auth/login", 
                data=login_data,  # Using data instead of json for form data
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                result = response.json()
                self.token = result["access_token"]
                self.user_id = result["user_id"]
                print(f"✅ Login successful!")
                print(f"   Token received: {self.token[:20]}...")
                print(f"   User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                print(f"   Error: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False

    def test_protected_endpoint(self):
        """Test accessing protected endpoint"""
        print(f"\n🔵 Testing Protected Endpoint Access...")
        
        if not self.token:
            print("❌ No token available. Please login first.")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Protected endpoint access successful!")
                print(f"   Current user: {result['username']}")
                print(f"   Email: {result['email']}")
                print(f"   Daily goal: {result['daily_calorie_goal']} kcal")
                return True
            else:
                print(f"❌ Protected endpoint access failed: {response.status_code}")
                print(f"   Error: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Protected endpoint error: {e}")
            return False

    def test_food_classification_auth(self):
        """Test food classification with authentication"""
        print(f"\n🔵 Testing Authenticated Food Classification...")
        
        if not self.token:
            print("❌ No token available. Please login first.")
            return False
        
        try:
            # Test the model status endpoint first
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/food/model-status", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Food service accessible!")
                print(f"   Model loaded: {result['model_loaded']}")
                print(f"   Gemini configured: {result['gemini_configured']}")
                return True
            else:
                print(f"❌ Food service access failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Food service error: {e}")
            return False

    def test_daily_summary(self):
        """Test getting daily summary"""
        print(f"\n🔵 Testing Daily Summary Endpoint...")
        
        if not self.token:
            print("❌ No token available. Please login first.")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/food/daily-calorie-summary", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Daily summary retrieved!")
                print(f"   Date: {result['date']}")
                print(f"   Total calories: {result['summary']['total_calories']}")
                print(f"   User goal: {result['user_info']['daily_calorie_goal']}")
                return True
            else:
                print(f"❌ Daily summary failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Daily summary error: {e}")
            return False

    def run_all_tests(self):
        """Run complete authentication test suite"""
        print("🚀 Starting Authentication System Tests...")
        print("="*50)
        
        # Test registration
        user_data = self.test_register()
        if not user_data:
            print("\n❌ Cannot continue tests without successful registration")
            return False
        
        # Test login
        login_success = self.test_login(user_data["username"], user_data["password"])
        if not login_success:
            print("\n❌ Cannot continue tests without successful login")
            return False
        
        # Test protected endpoints
        self.test_protected_endpoint()
        self.test_food_classification_auth()
        self.test_daily_summary()
        
        print("\n" + "="*50)
        print("🎉 Authentication tests completed!")
        print(f"Your test credentials:")
        print(f"  Username: {user_data['username']}")
        print(f"  Password: {user_data['password']}")
        print(f"  Token: {self.token[:20]}..." if self.token else "No token")

def main():
    print("Food Classification API - Authentication Test")
    print("Make sure your FastAPI server is running on http://localhost:8000")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is running!")
        else:
            print("❌ Server health check failed")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on http://localhost:8000")
        return
    
    # Run tests
    tester = AuthTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()