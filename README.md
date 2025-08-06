# StylesSync - AI-Powered Fashion Platform 🎨

[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple.svg)](https://stripe.com/)

StylesSync is a comprehensive fashion platform that revolutionizes how people discover, buy, sell, and rent fashion items. Our AI-powered system provides personalized recommendations based on your style preferences and skin tone, while our integrated marketplace enables seamless peer-to-peer transactions.

## 📑 Table of Contents
- [Features](#-features)
  - [AI-Powered Intelligence](#-ai-powered-intelligence)
  - [Multi-Modal Shopping](#-multi-modal-shopping)
  - [User Experience](#-user-experience)
  - [Secure Payments](#-secure-payments)
- [Tech Stack](#-tech-stack)
  - [Frontend](#frontend)
  - [Backend & Services](#backend--services)
  - [AI & Machine Learning](#ai--machine-learning)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Start the Application](#start-the-application)
- [App Structure](#-app-structure)
- [Key Screens](#-key-screens)
- [AI Features Deep Dive](#-ai-features-deep-dive)
  - [Skin Tone Matching](#skin-tone-matching)
  - [Size Prediction](#size-prediction)
  - [Recommendation Engine](#recommendation-engine)
- [API Integration](#-api-integration)
  - [Supabase Schema](#supabase-schema)
  - [External APIs](#external-apis)
- [Deployment](#-deployment)
  - [Mobile App](#mobile-app)
  - [AI Services](#ai-services)
- [Contributing](#-contributing)


[▶️ Watch Demo on YouTube](https://youtu.be/KfduQByZijQ)

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Smart Recommendations**: AI analyzes your preferences to suggest perfect fashion matches
- **Skin Tone Matching**: Advanced computer vision to match clothing colors with your skin tone
- **Size Prediction**: AI-driven size recommendations based on body measurements and fit data
- **Style Learning**: Algorithm continuously learns from your interactions and preferences

### 🛍️ Multi-Modal Shopping
- **Traditional Shopping**: Browse curated fashion collections
- **P2P Marketplace**: Buy and sell pre-owned fashion items
- **Rental Service**: Rent designer pieces for special occasions
- **Wishlist & Cart**: Save favorites and manage purchases seamlessly

### 📱 User Experience
- **Dual Mode Interface**: Switch between Buyer and Seller modes
- **Real-time Notifications**: Stay updated on orders, offers, and recommendations
- **Advanced Search**: Find exactly what you're looking for with smart filters
- **Order Management**: Track purchases, sales, and rental history

### 💳 Secure Payments
- **Stripe Integration**: Secure payment processing
- **Multiple Payment Methods**: Cards, digital wallets, and more
- **Seller Earnings**: Transparent earnings tracking and payouts
- **Voucher System**: Discount codes and promotional offers

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation management
- **Expo** - Development and build tooling

### Backend & Services
- **Supabase** - Database, authentication, and storage
- **Clerk** - Advanced authentication and user management
- **Stripe** - Payment processing
- **Python FastAPI** - AI services and machine learning

### AI & Machine Learning
- **Computer Vision** - Skin tone analysis and matching
- **Recommendation Engine** - Personalized fashion suggestions
- **Size Prediction** - Body measurement analysis
- **Image Processing** - Product image optimization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- React Native development environment
- iOS Simulator or Android Emulator
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stylesync.git
   cd stylesync
   ```

2. **Install dependencies**
   ```bash
   # Main app dependencies
   npm install
   
   # AI API dependencies
   cd stylesync/ai_api
   pip install -r requirements.txt
   cd ../..
   ```

3. **Environment Setup**
   
   Create `.env` file in the root directory:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Clerk Authentication
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   
   # Stripe Payments
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. **Database Setup**
   
   Run the SQL migrations in your Supabase dashboard:
   ```sql
   -- Create necessary tables and policies
   -- (Include your database schema here)
   ```

5. **Start the application**
   ```bash
   # Start Metro bundler
   npx react-native start
   
   # Run on iOS
   npx react-native run-ios
   
   # Run on Android
   npx react-native run-android
   
   # Start AI API server
   cd stylesync/ai_api
   uvicorn main:app --reload
   ```

## 📱 App Structure

```
stylesync/
├── app/                    # React Native screens
│   ├── Tabs/              # Main tab screens (Home, P2P, AI, etc.)
│   ├── Auth/              # Authentication screens
│   └── Components/        # Reusable UI components
├── backend/               # Backend utilities and API calls
├── context/               # React Context providers
├── ai_api/               # Python AI services
├── assets/               # Images and static assets
└── components/           # Shared components
```

## 🎨 Key Screens

- **Home**: AI-powered fashion recommendations
- **P2P Marketplace**: Buy/sell pre-owned items
- **AI Screen**: Skin tone analysis and personalized styling
- **Rent**: Designer rental marketplace
- **Orders**: Purchase and sales management
- **Profile**: User settings and seller dashboard

## 🤖 AI Features Deep Dive

### Skin Tone Matching
- Real-time camera analysis for skin tone detection
- Color palette generation based on skin undertones
- Smart filtering of fashion items by color compatibility

### Size Prediction
- Body measurement input and analysis
- Historical fit data correlation
- Brand-specific sizing recommendations

### Recommendation Engine
- Collaborative filtering based on similar users
- Content-based filtering using item attributes
- Hybrid approach combining multiple ML techniques

## 🔧 API Integration

### Supabase Schema
- Users and authentication
- Fashion items catalog
- Orders and transactions
- P2P marketplace listings
- AI analysis results

### External APIs
- Stripe for payment processing
- Clerk for user management
- Custom AI APIs for ML features

## 🚀 Deployment

### Mobile App
```bash
# Build for iOS
npx react-native build-ios

# Build for Android
npx react-native build-android
```

### AI Services
```bash
# Deploy to cloud platform of choice
# Configure environment variables
# Set up domain and SSL
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request






