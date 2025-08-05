import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomePage from './Tabs/HomePage';
import Orders from './Tabs/Orders';
import Accounts from './Tabs/Accounts';
import RentScreen from './Tabs/RentScreen';
import P2PScreen from './Tabs/P2PScreen';
import AIScreen from './Tabs/AIScreen';
import CartScreen from './Tabs/CartScreen';
import SearchScreen from './SearchScreen';
import ProductDetailScreen from './ProductDetailScreen';
import PaymentScreen from './PaymentScreen';
import UnifiedOrdersScreen from './UnifiedOrdersScreen';
import UnifiedSalesScreen from './UnifiedSalesScreen';
import ShippedOrdersScreen from './ShippedOrdersScreen';
import ReceivedOrdersScreen from './ReceivedOrdersScreen';
import VouchersScreen from './VouchersScreen';
import HelpCenterScreen from './HelpCenterScreen';

import { FashionItemForDisplay, CartItem } from '../backend/supabaseItems';
import AnimatedGradientTabBar from './AnimatedGradientTabBar';
import { AIAnalysisProvider } from '../context/AIAnalysisContext';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;

export type RootStackParamList = {
  MainTabs: undefined;
  Cart: undefined;
  Search: undefined;
  AllOrders: undefined;
  PlacedOrders: undefined;
  ShippedOrders: undefined;
  ReceivedOrders: undefined;
  ToMarketplace: undefined;
  Vouchers: undefined;
  HelpCenter: undefined;
  ProductDetail: {
    product: FashionItemForDisplay;
    sourceScreen: 'home' | 'p2p' | 'ai' | 'rent' | 'search';
  };
  Payment: {
    product?: FashionItemForDisplay;
    cartItems?: CartItem[];
    total?: number;
  };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [showAccountScreen, setShowAccountScreen] = useState(false);

  const handleAccountPress = () => {
    setShowAccountScreen(true);
  };

  const handleCloseAccount = () => {
    setShowAccountScreen(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => (
          <AnimatedGradientTabBar 
            {...props} 
            onAccountPress={handleAccountPress}
          />
        )}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomePage} 
          options={{ tabBarLabel: () => null }}
        />
        <Tab.Screen 
          name="Rent" 
          component={RentScreen} 
          options={{ tabBarLabel: () => null }}
        />
        <Tab.Screen 
          name="P2P" 
          component={P2PScreen} 
          options={{ tabBarLabel: () => null }}
        />
        <Tab.Screen 
          name="AI" 
          component={AIScreen} 
          options={{ tabBarLabel: () => null }}
        />
      </Tab.Navigator>
      
      {showAccountScreen && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f5f5f5',
          zIndex: 1000,
        }}>
          <Accounts onClose={handleCloseAccount} />
        </View>
      )}
    </View>
  );
};

const MainTabsScreen = () => {
  return (
    <AIAnalysisProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="AllOrders">
          {({ navigation, route }) => {
            const mode = (route.params as any)?.mode || 'buyer';
            return mode === 'seller' ? (
              <UnifiedSalesScreen 
                filterType="all"
                onBack={() => navigation.goBack()} 
              />
            ) : (
              <UnifiedOrdersScreen 
                filterType="all"
                onBack={() => navigation.goBack()} 
                mode={mode}
              />
            );
          }}
        </Stack.Screen>
        <Stack.Screen name="PlacedOrders">
          {({ navigation, route }) => {
            const mode = (route.params as any)?.mode || 'buyer';
            return mode === 'seller' ? (
              <UnifiedSalesScreen 
                filterType="incoming"
                onBack={() => navigation.goBack()} 
              />
            ) : (
              <UnifiedOrdersScreen 
                filterType="placed"
                onBack={() => navigation.goBack()} 
                mode={mode}
              />
            );
          }}
        </Stack.Screen>
        <Stack.Screen name="ShippedOrders">
          {({ navigation, route }) => {
            const mode = (route.params as any)?.mode || 'buyer';
            return mode === 'seller' ? (
              <UnifiedSalesScreen 
                filterType="shipped"
                onBack={() => navigation.goBack()} 
              />
            ) : (
              <ShippedOrdersScreen 
                onBack={() => navigation.goBack()} 
                mode={mode}
              />
            );
          }}
        </Stack.Screen>
        <Stack.Screen name="ReceivedOrders">
          {({ navigation }) => (
            <ReceivedOrdersScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="ToMarketplace">
          {({ navigation }) => (
            <UnifiedOrdersScreen 
              filterType="rental"
              onBack={() => navigation.goBack()} 
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Vouchers">
          {({ navigation }) => (
            <VouchersScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="HelpCenter">
          {({ navigation }) => (
            <HelpCenterScreen onClose={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
      </Stack.Navigator>
    </AIAnalysisProvider>
  );
};

export default MainTabsScreen; 