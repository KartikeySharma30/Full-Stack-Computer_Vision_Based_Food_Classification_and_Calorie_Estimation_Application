from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional, Dict
import os
import uuid
import shutil
import re

from ..models.database import get_db
from ..models.food_log import FoodLog, DailyCalorieSummary
from ..models.user import User
from ..services.ml_service import ml_service
from ..services.gemini_service import gemini_service
from ..services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

def extract_calories_from_string(calorie_string: str) -> int:
    """Extract numeric calories from string format like '~300-350 kcal'"""
    try:
        # Find numbers in the string
        numbers = re.findall(r'\d+', str(calorie_string))
        if numbers:
            # Take the average of range if two numbers, or just the number if one
            if len(numbers) >= 2:
                return int((int(numbers[0]) + int(numbers[1])) / 2)
            else:
                return int(numbers[0])
        return 250  # Default fallback
    except:
        return 250  # Default fallback

@router.get("/model-status")
async def get_model_status():
    """Check if ML model is loaded and ready"""
    return {
        "model_loaded": ml_service.is_model_ready(),
        "gemini_configured": gemini_service.is_configured,
        "status": "ready" if ml_service.is_model_ready() else "model_not_loaded"
    }

@router.post("/classify")
async def classify_food(
    file: UploadFile = File(...),
    meal_type: str = Form(...),
    save_to_db: bool = Form(default=True),
    current_user: User = Depends(auth_service.get_current_user),  # Now using authenticated user
    db: Session = Depends(get_db)
):
    """Classify food from uploaded image - requires authentication"""
    
    # Convert meal_type to lowercase
    meal_type = meal_type.lower().strip()
    
    # Validate meal type
    valid_meal_types = ["breakfast", "lunch", "dinner", "snack"]
    if meal_type not in valid_meal_types:
        raise HTTPException(status_code=400, detail=f"Invalid meal_type. Must be one of: {valid_meal_types}")
    
    # Check if model is ready
    if not ml_service.is_model_ready():
        raise HTTPException(status_code=503, detail="ML model not available")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save uploaded image
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_dir = "app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Classify image
        prediction_result = ml_service.predict_food(file_path)
        
        if "error" in prediction_result:
            raise HTTPException(status_code=500, detail=f"Classification failed: {prediction_result['error']}")
        
        
        
        # Get ingredient description from Gemini AI
        ingredients_description = await gemini_service.get_food_description(prediction_result["food_name"])
        
        # Extract numeric calories for database storage
        calories_numeric = extract_calories_from_string(prediction_result["calories"])
        
        # Save to database using authenticated user ID
        food_log_id = None
        if save_to_db:
            try:
                food_log = FoodLog(
                    user_id=current_user.id,  # Using authenticated user's ID
                    date=date.today(),
                    meal_type=meal_type,
                    food_name=prediction_result["food_name"],
                    predicted_class=prediction_result["food_name"],
                    calories=calories_numeric,
                    confidence_score=prediction_result["confidence"],  # Using rounded confidence
                    ingredients_description=ingredients_description,
                    image_path=file_path
                )
                db.add(food_log)
                db.commit()
                db.refresh(food_log)
                food_log_id = food_log.id
                
                # Update daily calorie summary
                await update_daily_summary(current_user.id, date.today(), db)
                
            except Exception as e:
                db.rollback()
                print(f"Error saving to database: {str(e)}")
                # Continue without database save
        
        return {
            "id": unique_filename,
            "food_log_id": food_log_id,
            "food_name": prediction_result["food_name"],
            "calories": prediction_result["calories"],  # String format
            "calories_numeric": calories_numeric,  # Numeric format
            "confidence": prediction_result["confidence"],  # Rounded to 2 decimal places
            "meal_type": meal_type,
            "ingredients": ingredients_description,
            "timestamp": datetime.utcnow().isoformat(),
            "saved_to_db": save_to_db and food_log_id is not None,
            "user_id": current_user.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

async def update_daily_summary(user_id: int, target_date: date, db: Session):
    """Update daily calorie summary for a user"""
    try:
        # Get existing summary or create new one
        summary = db.query(DailyCalorieSummary).filter(
            DailyCalorieSummary.user_id == user_id,
            DailyCalorieSummary.date == target_date
        ).first()
        
        if not summary:
            summary = DailyCalorieSummary(
                user_id=user_id,
                date=target_date
            )
            db.add(summary)
        
        # Calculate calories for each meal type
        meal_calories = db.query(FoodLog).filter(
            FoodLog.user_id == user_id,
            FoodLog.date == target_date
        ).all()
        
        breakfast_cals = sum(log.calories for log in meal_calories if log.meal_type == "breakfast")
        lunch_cals = sum(log.calories for log in meal_calories if log.meal_type == "lunch")
        dinner_cals = sum(log.calories for log in meal_calories if log.meal_type == "dinner")
        snack_cals = sum(log.calories for log in meal_calories if log.meal_type == "snack")
        
        # Update summary
        summary.breakfast_calories = breakfast_cals
        summary.lunch_calories = lunch_cals
        summary.dinner_calories = dinner_cals
        summary.snack_calories = snack_cals
        summary.total_calories = breakfast_cals + lunch_cals + dinner_cals + snack_cals
        
        db.commit()
        
    except Exception as e:
        print(f"Error updating daily summary: {str(e)}")
        db.rollback()

@router.get("/daily-calorie-summary")
async def get_daily_calorie_summary(
    target_date: str = None,  # Format: YYYY-MM-DD
    current_user: User = Depends(auth_service.get_current_user),  # Using authenticated user
    db: Session = Depends(get_db)
):
    """Get daily calorie summary for authenticated user"""
    if target_date:
        try:
            date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        date_obj = date.today()
    
    # Get daily summary from database for authenticated user
    summary = db.query(DailyCalorieSummary).filter(
        DailyCalorieSummary.user_id == current_user.id,
        DailyCalorieSummary.date == date_obj
    ).first()
    
    # Get detailed food logs for the day
    food_logs = db.query(FoodLog).filter(
        FoodLog.user_id == current_user.id,
        FoodLog.date == date_obj
    ).all()
    
    # Group foods by meal type
    meals = {
        "breakfast": [],
        "lunch": [],
        "dinner": [],
        "snacks": []
    }
    
    for log in food_logs:
        meal_key = "snacks" if log.meal_type == "snack" else log.meal_type
        meals[meal_key].append({
            "food_name": log.food_name,
            "calories": log.calories,
            "confidence": log.confidence_score,
            "time": log.created_at.strftime("%H:%M")
        })
    
    # Use Gemini to calculate total calories if requested
    if summary and summary.total_calories > 0:
        # Prepare meal data for Gemini calculation
        daily_meals = {}
        for meal_type, foods in meals.items():
            if foods:
                daily_meals[meal_type] = [f"~{food['calories']} kcal ({food['food_name']})" for food in foods]
        
        # Get LLM-powered total calorie estimation
        total_calories_llm = await gemini_service.calculate_total_calories(daily_meals)
    else:
        total_calories_llm = "~0 kcal (no meals logged today)"
    
    return {
        "date": date_obj.isoformat(),
        "user_id": current_user.id,
        "username": current_user.username,
        "meals": meals,
        "summary": {
            "breakfast_calories": summary.breakfast_calories if summary else 0,
            "lunch_calories": summary.lunch_calories if summary else 0,
            "dinner_calories": summary.dinner_calories if summary else 0,
            "snack_calories": summary.snack_calories if summary else 0,
            "total_calories": summary.total_calories if summary else 0,
            "total_calories_llm": total_calories_llm  # LLM-calculated total
        },
        "user_info": {
            "daily_calorie_goal": current_user.daily_calorie_goal,
            "activity_level": current_user.activity_level
        }
    }

@router.get("/history")
async def get_food_history(
    days: int = 7,  # Number of days to look back
    limit: int = 50,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get food history for authenticated user"""
    try:
        # Get food logs for the user within the specified days
        from datetime import timedelta
        start_date = date.today() - timedelta(days=days)
        
        logs = db.query(FoodLog).filter(
            FoodLog.user_id == current_user.id,
            FoodLog.date >= start_date
        ).order_by(FoodLog.created_at.desc()).limit(limit).all()
        
        return {
            "user_id": current_user.id,
            "username": current_user.username,
            "period_days": days,
            "total_entries": len(logs),
            "history": [
                {
                    "id": log.id,
                    "food_name": log.food_name,
                    "calories": log.calories,
                    "meal_type": log.meal_type,
                    "confidence": round(log.confidence_score, 2) if log.confidence_score else 0,
                    "date": log.date.isoformat() if log.date else None,
                    "time": log.created_at.strftime("%H:%M"),
                    "ingredients": log.ingredients_description
                }
                for log in logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@router.delete("/food-entry/{food_log_id}")
async def delete_food_entry(
    food_log_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a food entry (only owner can delete)"""
    try:
        # Find the food log entry
        food_log = db.query(FoodLog).filter(
            FoodLog.id == food_log_id,
            FoodLog.user_id == current_user.id  # Ensure user owns the entry
        ).first()
        
        if not food_log:
            raise HTTPException(status_code=404, detail="Food entry not found or you don't have permission to delete it")
        
        # Store date for summary update
        entry_date = food_log.date
        
        # Delete the entry
        db.delete(food_log)
        db.commit()
        
        # Update daily summary after deletion
        await update_daily_summary(current_user.id, entry_date, db)
        
        return {"message": "Food entry deleted successfully", "deleted_id": food_log_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting entry: {str(e)}")

@router.get("/weekly-summary")
async def get_weekly_summary(
    weeks_back: int = 0,  # 0 = current week, 1 = last week, etc.
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly calorie summary for authenticated user"""
    try:
        from datetime import timedelta
        
        # Calculate week start and end dates
        today = date.today()
        days_since_monday = today.weekday()
        week_start = today - timedelta(days=days_since_monday) - timedelta(weeks=weeks_back)
        week_end = week_start + timedelta(days=6)
        
        # Get daily summaries for the week
        weekly_summaries = db.query(DailyCalorieSummary).filter(
            DailyCalorieSummary.user_id == current_user.id,
            DailyCalorieSummary.date >= week_start,
            DailyCalorieSummary.date <= week_end
        ).order_by(DailyCalorieSummary.date).all()
        
        # Calculate weekly totals
        total_week_calories = sum(summary.total_calories for summary in weekly_summaries)
        avg_daily_calories = total_week_calories / 7 if weekly_summaries else 0
        
        # Format daily breakdown
        daily_breakdown = []
        for i in range(7):
            current_date = week_start + timedelta(days=i)
            day_summary = next((s for s in weekly_summaries if s.date == current_date), None)
            
            daily_breakdown.append({
                "date": current_date.isoformat(),
                "day_name": current_date.strftime("%A"),
                "calories": day_summary.total_calories if day_summary else 0,
                "meals_logged": (
                    (1 if day_summary.breakfast_calories > 0 else 0) +
                    (1 if day_summary.lunch_calories > 0 else 0) +
                    (1 if day_summary.dinner_calories > 0 else 0) +
                    (1 if day_summary.snack_calories > 0 else 0)
                ) if day_summary else 0
            })
        
        return {
            "user_id": current_user.id,
            "username": current_user.username,
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "summary": {
                "total_week_calories": total_week_calories,
                "average_daily_calories": round(avg_daily_calories, 2),
                "daily_goal": current_user.daily_calorie_goal,
                "goal_achievement_rate": round((avg_daily_calories / current_user.daily_calorie_goal * 100), 2) if current_user.daily_calorie_goal else 0
            },
            "daily_breakdown": daily_breakdown
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weekly summary: {str(e)}")

@router.get("/test-prediction")
async def test_prediction():
    """Test endpoint to check if prediction works"""
    return {
        "model_ready": ml_service.is_model_ready(),
        "gemini_ready": gemini_service.is_configured,
        "message": "Model is ready for predictions" if ml_service.is_model_ready() else "Model not loaded"
    }

# Admin/Development endpoints for viewing database data
@router.get("/admin/view-all-food-logs")
async def view_all_food_logs(
    limit: int = 20,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """View recent food logs in database (for admin/development purposes)"""
    try:
        # For now, any authenticated user can view (in production, add admin check)
        logs = db.query(FoodLog).order_by(FoodLog.created_at.desc()).limit(limit).all()
        
        return {
            "total_logs": len(logs),
            "requested_by": current_user.username,
            "logs": [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "food_name": log.food_name,
                    "calories": log.calories,
                    "meal_type": log.meal_type,
                    "confidence": round(log.confidence_score, 2) if log.confidence_score else 0,
                    "created_at": log.created_at.isoformat(),
                    "date": log.date.isoformat() if log.date else None
                }
                for log in logs
            ]
        }
    except Exception as e:
        return {"error": f"Error fetching logs: {str(e)}", "logs": []}

@router.get("/admin/database-stats")
async def get_database_stats(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get database statistics (admin endpoint)"""
    try:
        from ..models.user import User as UserModel
        
        user_count = db.query(UserModel).count()
        food_log_count = db.query(FoodLog).count()
        summary_count = db.query(DailyCalorieSummary).count()
        
        # Get user-specific stats
        user_food_logs = db.query(FoodLog).filter(FoodLog.user_id == current_user.id).count()
        user_summaries = db.query(DailyCalorieSummary).filter(DailyCalorieSummary.user_id == current_user.id).count()
        
        return {
            "database_stats": {
                "total_users": user_count,
                "total_food_logs": food_log_count,
                "total_daily_summaries": summary_count,
                "database_status": "connected"
            },
            "current_user_stats": {
                "user_id": current_user.id,
                "username": current_user.username,
                "food_logs": user_food_logs,
                "daily_summaries": user_summaries,
                "member_since": current_user.created_at.strftime("%Y-%m-%d")
            }
        }
    except Exception as e:
        return {"error": f"Error getting stats: {str(e)}"}

@router.get("/user-profile-summary")
async def get_user_profile_summary(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive user profile with statistics"""
    try:
        # Get user's food log count and recent activity
        total_logs = db.query(FoodLog).filter(FoodLog.user_id == current_user.id).count()
        
        # Get recent logs (last 7 days)
        from datetime import timedelta
        week_ago = date.today() - timedelta(days=7)
        recent_logs = db.query(FoodLog).filter(
            FoodLog.user_id == current_user.id,
            FoodLog.date >= week_ago
        ).count()
        
        # Get average daily calories (last 7 days)
        recent_summaries = db.query(DailyCalorieSummary).filter(
            DailyCalorieSummary.user_id == current_user.id,
            DailyCalorieSummary.date >= week_ago
        ).all()
        
        avg_calories = sum(s.total_calories for s in recent_summaries) / len(recent_summaries) if recent_summaries else 0
        
        return {
            "user_profile": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "age": current_user.age,
                "weight": current_user.weight,
                "height": current_user.height,
                "activity_level": current_user.activity_level,
                "daily_calorie_goal": current_user.daily_calorie_goal,
                "member_since": current_user.created_at.strftime("%Y-%m-%d"),
                "is_active": current_user.is_active
            },
            "activity_stats": {
                "total_food_logs": total_logs,
                "logs_this_week": recent_logs,
                "average_daily_calories": round(avg_calories, 2),
                "goal_achievement_rate": round((avg_calories / current_user.daily_calorie_goal * 100), 2) if current_user.daily_calorie_goal else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile summary: {str(e)}")