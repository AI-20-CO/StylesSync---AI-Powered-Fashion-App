import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import numpy as np

# skintone_match.py

class CNNModel(nn.Module):
    def __init__(self, num_skin_tones=6):
        super(CNNModel, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        # Calculate the size of the flattened layer dynamically
        # For input_shape (128, 128, 3), after 3 pooling layers (each 2x2), it becomes (128/2/2/2 = 16, 16)
        self.fc1 = nn.Linear(128 * 16 * 16, 128)
        self.fc2 = nn.Linear(128, num_skin_tones)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = x.view(-1, 128 * 16 * 16) # Flatten the tensor
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

def preprocess_image_for_inference(image_path_or_bytes, input_size=(128, 128)):
    """
    Preprocesses an image for PyTorch model inference.
    Handles both file paths and raw bytes (e.g., from an API request).
    """
    if isinstance(image_path_or_bytes, str):
        # Assume it's a file path
        img = Image.open(image_path_or_bytes).convert('RGB')
    elif isinstance(image_path_or_bytes, bytes):
        # Assume it's image bytes (e.g., from a FastAPI UploadFile)
        from io import BytesIO
        img = Image.open(BytesIO(image_path_or_bytes)).convert('RGB')
    else:
        raise ValueError("Input must be an image path (str) or image bytes (bytes).")

    preprocess = transforms.Compose([
        transforms.Resize(input_size),
        transforms.ToTensor(), # Converts to [C, H, W] and scales to [0.0, 1.0]
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]), # ImageNet means/stds
    ])
    return preprocess(img).unsqueeze(0) # Add batch dimension

def predict_skin_tone(model, image_path_or_bytes, device='cpu'):
    """
    Makes a prediction using the trained PyTorch model.
    """
    model.eval() # Set model to evaluation mode
    with torch.no_grad(): # Disable gradient calculation for inference
        preprocessed_image = preprocess_image_for_inference(image_path_or_bytes)
        preprocessed_image = preprocessed_image.to(device)
        
        outputs = model(preprocessed_image)
        _, predicted = torch.max(outputs.data, 1)
        
        predicted_class = predicted.item()
        print(f"Predicted skin tone class: {predicted_class}")
        return predicted_class

if __name__ == '__main__':
    # This block is for local testing and demonstration.
    # In a real app, the model would be loaded and used via an API.
    
    # 1. Create the model
    model = CNNModel(num_skin_tones=6) # Example with 6 skin tone categories
    
    # Check if GPU is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    print(f"Using device: {device}")

    # (Simulated) Load a trained model weights if available
    # try:
    #     model.load_state_dict(torch.load('path/to/your/trained_model.pth', map_location=device))
    #     print("Model weights loaded successfully.")
    # except FileNotFoundError:
    #     print("No trained model weights found. Model will use random initial weights.")
    # except Exception as e:
    #     print(f"Error loading model weights: {e}")
    
    # (Simulated) Make a prediction
    # You'll need a dummy image file or bytes for this test
    # Example:
    # dummy_image_path = 'path/to/your/test_image.jpg' 
    # predicted_tone = predict_skin_tone(model, dummy_image_path, device)
    # print(f"Overall Predicted Skin Tone: {predicted_tone}")
    
    print("PyTorch AI model script initialized. Awaiting dataset, trained weights, and FastAPI integration.")
