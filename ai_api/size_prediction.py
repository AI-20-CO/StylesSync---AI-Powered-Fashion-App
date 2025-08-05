import pandas as pd
import numpy as np
import json
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.preprocessing import OneHotEncoder
import statsmodels.api as sm

class SizePredictionModel:
    """
    Size Prediction Model using Multinomial Logistic Regression
    Predicts clothing sizes (S, M, L) based on various features like measurements and reviews
    """
    
    def __init__(self, json_path="/Users/ayaanizhar/Stats Ass/modcloth_final_data.json"):
        """Initialize the model with data path"""
        self.json_path = json_path
        self.model = None
        self.feature_columns = None
    
    def load_and_preprocess_data(self):
        """Load and preprocess the JSON data"""
        # STEP 1: Load JSON lines file
        df = pd.read_json(self.json_path, lines=True)
        
        # STEP 2: Select required columns only
        columns = ['waist', 'quality', 'category', 'bust', 'height', 'length', 
                  'fit', 'review_text', 'review_summary', 'size']
        df = df[columns]
        
        # STEP 3: Convert necessary fields to numeric
        df[['waist', 'bust', 'height', 'length']] = df[['waist', 'bust', 'height', 'length']].apply(pd.to_numeric, errors='coerce')
        
        # STEP 4: Map numeric `size` to S, M, L
        df['size_cat'] = pd.cut(
            df['size'],
            bins=[-np.inf, 4, 8, np.inf],
            labels=['S', 'M', 'L']
        )
        
        # STEP 5: Basic text feature engineering
        df['review_text_len'] = df['review_text'].astype(str).apply(len)
        df['review_summary_len'] = df['review_summary'].astype(str).apply(len)
        
        # Drop original text and size columns
        df = df.drop(columns=['review_text', 'review_summary', 'size'])
        
        # Drop rows with missing size_cat only
        df = df[df['size_cat'].notna()]
        
        # STEP 6: One-hot encode categorical features
        categorical_cols = ['category', 'fit']
        df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
        
        return df
    
    def train(self, test_size=0.2, random_state=123):
        """Train the model on the preprocessed data"""
        # Load and preprocess data
        df = self.load_and_preprocess_data()
        
        # STEP 7: Train-test split
        X = df.drop(columns=['size_cat'])
        y = df['size_cat']
        
        self.feature_columns = X.columns
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        # STEP 8: Multinomial logistic regression (using statsmodels)
        # Add intercept
        X_train_sm = sm.add_constant(X_train)
        model = sm.MNLogit(y_train, X_train_sm)
        self.model = model.fit()
        
        # STEP 9: Predict and evaluate
        X_test_sm = sm.add_constant(X_test)
        pred_probs = self.model.predict(X_test_sm)
        preds = pred_probs.idxmax(axis=1)
        
        # STEP 10: Evaluation
        print("Model Training Results:")
        print("----------------------")
        print("Accuracy:", accuracy_score(y_test, preds))
        print("\nConfusion Matrix:\n", confusion_matrix(y_test, preds))
        print("\nClassification Report:\n", classification_report(y_test, preds))
        
        return {
            'accuracy': accuracy_score(y_test, preds),
            'confusion_matrix': confusion_matrix(y_test, preds),
            'classification_report': classification_report(y_test, preds)
        }
    
    def predict(self, features):
        """
        Predict size category for new data
        
        Args:
            features (dict): Dictionary containing feature values
                Required keys: waist, quality, category, bust, height, length, fit
                
        Returns:
            str: Predicted size category (S, M, or L)
            dict: Prediction probabilities for each size
        """
        if not self.model or not self.feature_columns:
            raise ValueError("Model not trained. Call train() first.")
        
        # Create DataFrame with the same structure as training data
        df = pd.DataFrame([features])
        
        # Perform the same preprocessing
        df[['waist', 'bust', 'height', 'length']] = df[['waist', 'bust', 'height', 'length']].apply(pd.to_numeric, errors='coerce')
        
        # One-hot encode categorical features
        df = pd.get_dummies(df, columns=['category', 'fit'])
        
        # Ensure all training features are present
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Reorder columns to match training data
        df = df[self.feature_columns]
        
        # Add constant for prediction
        X_pred = sm.add_constant(df)
        
        # Get prediction probabilities
        pred_probs = self.model.predict(X_pred)
        
        # Get predicted size
        predicted_size = pred_probs.idxmax(axis=1)[0]
        
        return predicted_size, pred_probs.iloc[0].to_dict()

# Example usage
if __name__ == "__main__":
    # Initialize and train model
    model = SizePredictionModel()
    results = model.train()
    
    # Example prediction
    sample_features = {
        'waist': 28,
        'quality': 4,
        'category': 'Dresses',
        'bust': 34,
        'height': 65,
        'length': 35,
        'fit': 'Just Right'
    }
    
    predicted_size, probabilities = model.predict(sample_features)
    print("\nSample Prediction:")
    print("Predicted Size:", predicted_size)
    print("Size Probabilities:", probabilities) 