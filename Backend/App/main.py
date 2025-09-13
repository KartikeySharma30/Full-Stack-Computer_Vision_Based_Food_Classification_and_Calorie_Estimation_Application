from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import models to register them
from .models import user, food_log
from .models.database import create_tables

# Import routers
from .routers import food, auth

app = FastAPI(
    title="Food Classification API",
    description="AI-powered food classification with calorie tracking",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(food.router, prefix="/food", tags=["food"])

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    print("Database tables created successfully!")

@app.get("/")
async def root():
    return {"message": "Food Classification API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Test database endpoint
@app.get("/test-db")
async def test_database():
    from .models.database import engine
    try:
        # Test database connection
        connection = engine.connect()
        connection.close()
        return {"database": "connected", "status": "success"}
    except Exception as e:
        return {"database": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)