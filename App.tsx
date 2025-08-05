import React, { useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ClerkProvider, useUser } from '@clerk/clerk-expo';
import { tokenCache, clerkConfig, useAuth, authUtils } from './backend';
import { supabase } from './backend/supabase';
import { LikesProvider } from './context/LikesContext';
import { CartProvider } from './context/CartContext';
import { ItemsProvider } from './context/ItemsContext';
import { VoucherProvider } from './context/VoucherContext';
import { StylePreferencesProvider } from './context/StylePreferencesContext';
import SplashScreen from './app/SplashScreen';
import GettingStartedScreen from './app/GettingStartedScreen';
import SignUpScreen from './app/SignUpScreen';
import SignInScreen from './app/SignInScreen';
import ForgotPasswordScreen from './app/ForgotPasswordScreen';
import MainTabsScreen from './app/MainTabsScreen';
import CartScreen from './app/Tabs/CartScreen';
import { StripeProvider } from '@stripe/stripe-react-native';

const Stack = createStackNavigator();

// Authentication Navigator (without splash screen)
const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="GettingStarted"
        component={GettingStartedScreen}
        options={{ animation: 'none' }}
      />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'none' }} />
    </Stack.Navigator>
  );
};

// Main App Navigator (after authentication)
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabsScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
};

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

// Root Navigator that decides between Auth and App based on authentication state
const RootNavigator = () => {
  const { isSignedIn, isLoaded, userId, sessionId, getToken } = useAuth();
  const { user } = useUser();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  const authState = { isSignedIn, isLoaded, userId, sessionId, getToken };
  console.log('Auth State:', { ...authState, initialLoadComplete, splashDone, syncComplete });

  // Add additional debugging and ensure we give Clerk enough time to restore session
  React.useEffect(() => {
    const checkSession = async () => {
      if (isLoaded && !initialLoadComplete) {
        authUtils.logAuthState(authState);
        await authUtils.checkSession(getToken);

        // Give a small delay to ensure session restoration is complete
        setTimeout(() => {
          console.log('Initial load complete, making navigation decision');
          setInitialLoadComplete(true);
        }, 100);
      }
    };
    
    checkSession();
  }, [isLoaded, isSignedIn, userId, sessionId, getToken, initialLoadComplete]);

  // Sync user data when signed in
  React.useEffect(() => {
    const syncUserData = async () => {
      if (isSignedIn && user && initialLoadComplete && !syncComplete) {
        console.log('User signed in, syncing data from Clerk to database...');
        
        try {
          // Import unified sync function
          const { unifiedUserSync } = await import('./backend/unifiedSync');
          
          const result = await unifiedUserSync(user);
          if (result.success) {
            console.log('User sync completed successfully');
          } else {
            console.error('User sync failed:', result.error);
          }
        } catch (error) {
          console.error('Error during user sync:', error);
        } finally {
          setSyncComplete(true);
        }
      } else if (!isSignedIn) {
        // Reset sync state when user signs out
        setSyncComplete(false);
      }
    };

    syncUserData();
  }, [isSignedIn, user, initialLoadComplete, syncComplete]);

  // No automatic sync in App.tsx - sync happens immediately after registration success

  // Show splash screen first on app startup
  if (!splashDone) {
    console.log('Showing splash screen...');
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  // Then show loading while Clerk initializes
  if (!isLoaded || !initialLoadComplete) {
    console.log('Clerk is still loading or initializing...');
    return <LoadingScreen />;
  }

  // Finally show the appropriate navigator based on auth state
  if (isSignedIn) {
    console.log('Navigation decision: AppNavigator (User is signed in)');
    console.log('Session ID:', sessionId);
    console.log('User ID:', userId);
    return <AppNavigator />;
  } else {
    console.log('Navigation decision: AuthNavigator (User not signed in)');
    console.log('No active session found');
    return <AuthNavigator />;
  }
};

const App = () => {
  return (
    <ClerkProvider {...clerkConfig} tokenCache={tokenCache}>
      <StripeProvider publishableKey="pk_live_51RgqHDI8T7yGQqOnzfuTMt5NzvylXbxiVyCrXMyfDAYaI6JzoyDQHQjAC8tsjOqVf0NaaR2mvPgCwhaBHPIstvKh00wcRmW8Fa">
        <LikesProvider>
          <CartProvider>
            <ItemsProvider>
              <VoucherProvider>
                <StylePreferencesProvider>
                  <NavigationContainer>
                    <RootNavigator />
                  </NavigationContainer>
                </StylePreferencesProvider>
              </VoucherProvider>
            </ItemsProvider>
          </CartProvider>
        </LikesProvider>
      </StripeProvider>
    </ClerkProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
