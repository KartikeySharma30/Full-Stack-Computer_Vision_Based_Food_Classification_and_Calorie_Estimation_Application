import os
import tensorflow as tf
from tensorflow.keras.models import load_model
import pandas as pd

print("=== Model Loading Debug ===")
print(f"Current working directory: {os.getcwd()}")

# Check if model file exists
model_path = "/Users/kartikeysharma/Desktop/FCCES/Backend/App/ml_models/FCCES_Model.h5"
print(f"Looking for model at: {model_path}")
print(f"Model file exists: {os.path.exists(model_path)}")

if os.path.exists(model_path):
    print(f"Model file size: {os.path.getsize(model_path)} bytes")
    try:
        print("Attempting to load model...")
        model = load_model(model_path)
        print("✅ Model loaded successfully!")
        print(f"Model input shape: {model.input_shape}")
        print(f"Model output shape: {model.output_shape}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
else:
    print("❌ Model file not found!")
    print("Contents of app/ml_models/:")
    if os.path.exists("app/ml_models/"):
        for file in os.listdir("app/ml_models/"):
            print(f"  - {file}")
    else:
        print("  ml_models directory doesn't exist!")

# Check CSV file
csv_path = "/Users/kartikeysharma/Desktop/FCCES/Backend/App/ml_models/Cal_data.csv"
print(f"\nLooking for CSV at: {csv_path}")
print(f"CSV file exists: {os.path.exists(csv_path)}")

if os.path.exists(csv_path):
    try:
        df = pd.read_csv(csv_path)
        print(f"✅ CSV loaded successfully! Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        if 'food_name' in df.columns:
            print(f"First few food names: {df['food_name'].head().tolist()}")
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")

print("\n=== End Debug ===")