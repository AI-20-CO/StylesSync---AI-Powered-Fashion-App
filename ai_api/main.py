from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import uvicorn
import os
from typing import List, Dict, Optional
import torch

# Device setup (global)
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device for FastAPI: {device}")

# Import both AI models
from skintone_match import CNNModel, preprocess_image_for_inference, predict_skin_tone
from size_prediction import SizePredictionModel

app = FastAPI(
    title="StylesSync AI API",
    description="AI-powered fashion recommendations with skin tone and size prediction",
    version="1.0.0"
)

# Response models
class SkinTonePredictionResponse(BaseModel):
    predicted_skin_tone_class: int
    message: str

class SizePredictionRequest(BaseModel):
    waist: float
    quality: int  # 1-5 rating
    category: str  # e.g., "Dresses", "Tops", "Bottoms"
    bust: float
    height: float
    length: float
    fit: str  # e.g., "Just Right", "Small", "Large"

class SizePredictionResponse(BaseModel):
    predicted_size: str
    size_probabilities: Dict[str, float]
    confidence: float
    message: str

@app.on_event("startup")
async def startup_event():
    global skintone_model, size_model
    try:
        # Initialize the skin tone model
        skintone_model = CNNModel(num_skin_tones=6)
        
        # Load trained weights if available
        model_weights_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'AI', 'trained_model.pth')
        if os.path.exists(model_weights_path):
            skintone_model.load_state_dict(torch.load(model_weights_path, map_location=device))
            print(f"Loaded skin tone model weights from {model_weights_path}")
        else:
            print("No skin tone model weights found. Using randomly initialized model.")
            
        skintone_model.eval()
        skintone_model.to(device)
        print(f"Skin tone model loaded successfully on {device}")
        
        # Initialize the size prediction model
        size_model = SizePredictionModel()
        print("Size prediction model initialized successfully")
        
    except Exception as e:
        print(f"Error loading AI models at startup: {e}")
        # Depending on criticality, you might want to raise the exception or exit

@app.post("/predict_skin_tone/", response_model=SkinTonePredictionResponse)
async def predict_skin_tone_api(file: UploadFile = File(...)):
    try:
        # Read the image bytes
        image_bytes = await file.read()
        
        # Predict skin tone using the model
        predicted_class = predict_skin_tone(skintone_model, image_bytes, device=str(device))
        
        if predicted_class is not None:
            return SkinTonePredictionResponse(
                predicted_skin_tone_class=predicted_class,
                message=f"Successfully predicted skin tone: class {predicted_class}"
            )
        else:
            raise HTTPException(status_code=500, detail="Skin tone prediction failed.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/predict_size/", response_model=SizePredictionResponse)
async def predict_size_api(request: SizePredictionRequest):
    try:
        # Convert request to dictionary format expected by the model
        features = {
            'waist': request.waist,
            'quality': request.quality,
            'category': request.category,
            'bust': request.bust,
            'height': request.height,
            'length': request.length,
            'fit': request.fit
        }
        
        # Predict size using the model
        predicted_size, probabilities = size_model.predict(features)
        
        # Calculate confidence (highest probability)
        confidence = max(probabilities.values()) if probabilities else 0.0
        
        return SizePredictionResponse(
            predicted_size=predicted_size,
            size_probabilities=probabilities,
            confidence=confidence,
            message=f"Successfully predicted size: {predicted_size} (confidence: {confidence:.2%})"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Size prediction error: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "message": "StylesSync AI API is running",
        "models": {
            "skin_tone": "loaded",
            "size_prediction": "loaded"
        }
    }

# To run this, save it as main.py and run:
# uvicorn main:app --reload --host 0.0.0.0 --port 8000 