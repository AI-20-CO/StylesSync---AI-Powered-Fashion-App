import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.transforms as transforms
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
import numpy as np
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.utils.class_weight import compute_class_weight
import os
from PIL import Image
from pathlib import Path
from collections import Counter

# Import the model
from skintone_match import CNNModel

class SkinToneDataset(Dataset):
    def __init__(self, data_dir, transform=None):
        self.data_dir = Path(data_dir)
        self.transform = transform
        self.classes = ['dark', 'light', 'mid-dark', 'mid-light']
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
        
        self.images = []
        self.labels = []
        
        # Load all images and labels
        for class_name in self.classes:
            class_dir = self.data_dir / class_name
            if class_dir.exists():
                for img_file in class_dir.glob('*.jpg'):
                    self.images.append(str(img_file))
                    self.labels.append(self.class_to_idx[class_name])
        
        print(f"Found {len(self.images)} images across {len(self.classes)} classes")
        
        # Calculate and print class distribution
        counter = Counter(self.labels)
        for i, class_name in enumerate(self.classes):
            count = counter[i]
            percentage = (count / len(self.images)) * 100
            print(f"  {class_name}: {count} images ({percentage:.1f}%)")
            
        # Calculate imbalance factor
        counts = list(counter.values())
        max_count, min_count = max(counts), min(counts)
        imbalance_factor = max_count / min_count
        print(f"  Imbalance factor: {imbalance_factor:.2f}")
        
        if imbalance_factor > 2.0:
            print("  SEVERE imbalance - using aggressive rebalancing")
        elif imbalance_factor > 1.5:
            print("  MODERATE imbalance - using weighted sampling")
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        image_path = self.images[idx]
        label = self.labels[idx]
        
        try:
            image = Image.open(image_path).convert('RGB')
            if self.transform:
                image = self.transform(image)
            return image, label
        except Exception as e:
            print(f"Error loading image {image_path}: {e}")
            dummy_image = Image.new('RGB', (128, 128), color='black')
            if self.transform:
                dummy_image = self.transform(dummy_image)
            return dummy_image, label

class ImbalanceFocusedLoss(nn.Module):
    """
    Custom loss that heavily penalizes misclassifications on minority classes
    """
    def __init__(self, class_weights, focal_gamma=2.0, label_smoothing=0.1):
        super(ImbalanceFocusedLoss, self).__init__()
        self.class_weights = class_weights
        self.focal_gamma = focal_gamma
        self.label_smoothing = label_smoothing
        
    def forward(self, inputs, targets):
        # Label smoothing to prevent overconfidence
        num_classes = inputs.size(1)
        targets_smooth = torch.zeros_like(inputs).scatter_(1, targets.unsqueeze(1), 1)
        targets_smooth = targets_smooth * (1 - self.label_smoothing) + self.label_smoothing / num_classes
        
        # Weighted cross entropy
        log_probs = torch.log_softmax(inputs, dim=1)
        weighted_loss = -targets_smooth * log_probs
        
        # Apply class weights
        if self.class_weights is not None:
            weight_mask = self.class_weights[targets]
            weighted_loss = weighted_loss.sum(dim=1) * weight_mask
        else:
            weighted_loss = weighted_loss.sum(dim=1)
        
        # Focal loss component
        probs = torch.softmax(inputs, dim=1)
        pt = (targets_smooth * probs).sum(dim=1)
        focal_weight = (1 - pt) ** self.focal_gamma
        
        return (focal_weight * weighted_loss).mean()

def create_balanced_sampler(dataset, labels):
    """Create a weighted sampler to balance classes during training"""
    
    # Count samples per class
    class_counts = Counter(labels)
    total_samples = len(labels)
    
    # Calculate weights - inverse frequency
    class_weights = {}
    for class_idx, count in class_counts.items():
        class_weights[class_idx] = total_samples / (len(class_counts) * count)
    
    # Create sample weights
    sample_weights = [class_weights[label] for label in labels]
    
    print(f"Balanced Sampler Weights:")
    for i, class_name in enumerate(dataset.classes):
        weight = class_weights.get(i, 0)
        print(f"  {class_name}: {weight:.3f}")
    
    return WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True
    )

def calculate_focused_metrics(y_true, y_pred, class_names):
    """Calculate metrics that matter for imbalanced datasets"""
    
    # Overall metrics (NOT accuracy!)
    weighted_f1 = f1_score(y_true, y_pred, average='weighted')
    macro_f1 = f1_score(y_true, y_pred, average='macro')
    
    # Per-class metrics
    per_class_f1 = f1_score(y_true, y_pred, average=None)
    per_class_precision = precision_score(y_true, y_pred, average=None, zero_division=0)
    per_class_recall = recall_score(y_true, y_pred, average=None, zero_division=0)
    
    print(f"FOCUSED METRICS (ignoring accuracy):")
    print(f"  Weighted F1: {weighted_f1:.4f}")
    print(f"  Macro F1:    {macro_f1:.4f}")
    
    print(f"\nPer-Class Performance:")
    for i, name in enumerate(class_names):
        f1 = per_class_f1[i]
        prec = per_class_precision[i]
        rec = per_class_recall[i]
        print(f"  {name}:")
        print(f"    Precision: {prec:.3f} | Recall: {rec:.3f} | F1: {f1:.3f}")
        
        # Flag problematic classes
        if f1 < 0.7:
            print(f"    LOW F1 - needs attention!")
        if prec < 0.7:
            print(f"    LOW PRECISION - too many false positives")
        if rec < 0.7:
            print(f"    LOW RECALL - missing true cases")
    
    return {
        'weighted_f1': weighted_f1,
        'macro_f1': macro_f1,
        'per_class_f1': per_class_f1,
        'per_class_precision': per_class_precision,
        'per_class_recall': per_class_recall
    }

def train_imbalance_focused_model():
    print("🧠 IMBALANCE-FOCUSED CNN Training")
    print("Goal: Fix TN inflation + class imbalance issues")
    print("=" * 60)
    
    # Use MPS (Apple Silicon) > CUDA > CPU
    if torch.backends.mps.is_available():
        device = torch.device('mps')
        print(f"Using device: {device} (Apple Silicon GPU)")
        print(f"MPS acceleration enabled")
    elif torch.cuda.is_available():
        device = torch.device('cuda')
        print(f"Using device: {device} (NVIDIA GPU)")
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    else:
        device = torch.device('cpu')
        print(f"Using device: {device} (CPU)")
        print("Consider using GPU for faster training")
    
    # Enhanced data augmentation for minority classes
    train_transform = transforms.Compose([
        transforms.Resize((128, 128)),
        # More aggressive augmentation to help with imbalance
        transforms.RandomRotation(20),
        transforms.RandomHorizontalFlip(0.5),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.15),
        transforms.RandomAffine(degrees=10, translate=(0.1, 0.1), scale=(0.9, 1.1)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load dataset
    data_dir = 'data_skintone'
    full_dataset = SkinToneDataset(data_dir, transform=None)
    
    if len(full_dataset) == 0:
                    print("No images found")
        return
    
    # Stratified train/val split
    print(f"\nCreating stratified split...")
    splitter = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    
    for train_idx, val_idx in splitter.split(range(len(full_dataset)), full_dataset.labels):
        train_dataset = torch.utils.data.Subset(full_dataset, train_idx)
        val_dataset = torch.utils.data.Subset(full_dataset, val_idx)
        
        # Apply transforms
        train_dataset.dataset.transform = train_transform
        val_dataset.dataset.transform = val_transform
        break
    
    # Get training labels for balancing
    train_labels = [full_dataset.labels[i] for i in train_idx]
    val_labels = [full_dataset.labels[i] for i in val_idx]
    
    print(f"Training samples: {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")
    
    # Calculate class weights based on your actual data distribution
    # From your evaluation: dark(24.1%), light(27.3%), mid-dark(29.5%), mid-light(19.1%)
    class_weights = compute_class_weight('balanced', classes=np.unique(train_labels), y=train_labels)
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32).to(device)
    
    print(f"\n📐 Class Weights (addressing imbalance):")
    class_names = ['Dark', 'Light', 'Mid-Dark', 'Mid-Light']
    for i, (name, weight) in enumerate(zip(class_names, class_weights)):
        print(f"  {name}: {weight:.3f}")
    
    # Create balanced sampler
    balanced_sampler = create_balanced_sampler(full_dataset, train_labels)
    
    # Data loaders with balanced sampling - optimized for GPU/MPS
    use_accelerator = torch.backends.mps.is_available() or torch.cuda.is_available()
    batch_size = 64 if use_accelerator else 32
    num_workers = 8 if use_accelerator else 2
    
    train_loader = DataLoader(
        train_dataset, 
        batch_size=batch_size, 
        sampler=balanced_sampler,  # This ensures balanced batches
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()  # Only for CUDA, not MPS
    )
    val_loader = DataLoader(
        val_dataset, 
        batch_size=batch_size, 
        shuffle=False, 
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()  # Only for CUDA, not MPS
    )
    
    device_name = "MPS" if torch.backends.mps.is_available() else ("CUDA" if torch.cuda.is_available() else "CPU")
    print(f"Optimized for {device_name}:")
    print(f"  Batch size: {batch_size}")
    print(f"  Num workers: {num_workers}")
    print(f"  Pin memory: {torch.cuda.is_available()}")
    
    # Model
    model = CNNModel(num_skin_tones=4)
    model.to(device)
    
    # Imbalance-focused loss
    criterion = ImbalanceFocusedLoss(
        class_weights=class_weights_tensor,
        focal_gamma=2.0,  # Focus on hard examples
        label_smoothing=0.1  # Prevent overconfidence
    )
    
    print(f"Using ImbalanceFocusedLoss with:")
    print(f"  - Class weights: YES")
    print(f"  - Focal loss (γ=2.0): YES") 
    print(f"  - Label smoothing: YES")
    
    # Optimizer
    optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)
    
    # Scheduler focused on F1, not accuracy
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', factor=0.7, patience=3
    )
    
    # Training loop with F1 focus
    num_epochs = 30
    best_weighted_f1 = 0.0
    patience = 8
    patience_counter = 0
    
    print(f"\nTraining for {num_epochs} epochs...")
    print(f"📈 SUCCESS METRIC: Weighted F1 Score (NOT accuracy!)")
    
    for epoch in range(num_epochs):
        print(f"\n📅 Epoch {epoch + 1}/{num_epochs}")
        print("-" * 40)
        
        # Training
        model.train()
        train_predictions = []
        train_labels_epoch = []
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            _, predicted = torch.max(outputs.data, 1)
            train_predictions.extend(predicted.cpu().numpy())
            train_labels_epoch.extend(labels.cpu().numpy())
            
            if batch_idx % 50 == 0:
                print(f"  Batch {batch_idx}: loss = {loss.item():.4f}")
        
        # Training metrics
        train_metrics = calculate_focused_metrics(train_labels_epoch, train_predictions, class_names)
        
        # Validation
        model.eval()
        val_predictions = []
        val_labels_epoch = []
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, predicted = torch.max(outputs.data, 1)
                
                val_predictions.extend(predicted.cpu().numpy())
                val_labels_epoch.extend(labels.cpu().numpy())
        
        # Validation metrics
        print(f"\nVALIDATION RESULTS:")
        val_metrics = calculate_focused_metrics(val_labels_epoch, val_predictions, class_names)
        
        # Learning rate scheduling on weighted F1
        scheduler.step(val_metrics['weighted_f1'])
        
        # Early stopping on weighted F1 (NOT accuracy!)
        current_f1 = val_metrics['weighted_f1']
        if current_f1 > best_weighted_f1:
            best_weighted_f1 = current_f1
            patience_counter = 0
            
            # Save best model
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'best_weighted_f1': best_weighted_f1,
                'class_weights': class_weights_tensor,
                'val_metrics': val_metrics
            }, 'best_imbalance_focused_model.pth')
                            print(f"NEW BEST MODEL! Weighted F1: {best_weighted_f1:.4f}")
        else:
            patience_counter += 1
            print(f"Patience: {patience_counter}/{patience}")
            
        if patience_counter >= patience:
                            print(f"Early stopping - no F1 improvement for {patience} epochs")
            break
    
    print(f"\nTRAINING COMPLETED!")
    print(f"🏆 Best Weighted F1: {best_weighted_f1:.4f}")
    
    # Final evaluation with best model
    print(f"\nFINAL EVALUATION:")
    checkpoint = torch.load('best_imbalance_focused_model.pth')
    model.load_state_dict(checkpoint['model_state_dict'])
    
    model.eval()
    final_predictions = []
    final_labels = []
    
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs.data, 1)
            
            final_predictions.extend(predicted.cpu().numpy())
            final_labels.extend(labels.cpu().numpy())
    
    print(f"=" * 50)
    final_metrics = calculate_focused_metrics(final_labels, final_predictions, class_names)
    
    print(f"\nKEY IMPROVEMENTS IMPLEMENTED:")
    print(f"Balanced sampling - equal batches for all classes")
    print(f"Class-weighted loss - penalty for minority class errors")
    print(f"Focal loss - focus on hard-to-classify examples")
    print(f"F1-based early stopping - ignore inflated accuracy")
    print(f"Enhanced augmentation - more diverse training data")
    print(f"Label smoothing - prevent overconfidence")
    
    print(f"\nBest model saved to: 'best_imbalance_focused_model.pth'")
    print(f"This model optimizes for F1, not accuracy!")

if __name__ == "__main__":
    try:
        train_imbalance_focused_model()
    except KeyboardInterrupt:
        print("\nTraining interrupted")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc() 