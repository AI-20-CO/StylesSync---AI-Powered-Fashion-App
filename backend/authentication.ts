import * as SecureStore from 'expo-secure-store';
import { TokenCache } from '@clerk/clerk-expo';
import { useAuth, useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';

// Token cache configuration for Expo SecureStore
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      console.log('Getting token from cache:', key);
      const token = await SecureStore.getItemAsync(key);
      console.log('Token retrieved:', token ? 'Found' : 'Not found');
      return token;
    } catch (error) {
      console.log('Error getting token:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      console.log('Saving token to cache:', key);
      await SecureStore.setItemAsync(key, value);
      console.log('Token saved successfully');
    } catch (error) {
      console.log('Error saving token:', error);
    }
  },
};

// Clerk configuration
export const clerkConfig = {
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  
  validateKey() {
    if (!this.publishableKey) {
      console.log(
        'Missing Clerk Publishable Key!\n' +
        'Add your key to .env file:\n' +
        'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here'
      );
    }
    
    console.log('Clerk Configuration:');
    console.log('  - Publishable Key:', this.publishableKey ? `${this.publishableKey.substring(0, 20)}...` : 'MISSING');
    console.log('  - Token Cache: Custom SecureStore implementation');
    
    return this.publishableKey;
  }
};

// Authentication utilities
export const authUtils = {
  // Check if input is a phone number
  isPhoneNumber: (input: string): boolean => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(input);
  },

  // Log detailed authentication state
  logAuthState: (authState: any) => {
    console.log('Auth State:', authState);
    console.log('Detailed Auth Status:');
    console.log('  - isSignedIn:', authState.isSignedIn);
    console.log('  - userId:', authState.userId);
    console.log('  - sessionId:', authState.sessionId);
  },

  // Check session validity
  checkSession: async (getToken?: () => Promise<string | null>) => {
    if (getToken) {
      try {
        const token = await getToken();
        console.log('  - Has valid token:', !!token);
        return !!token;
      } catch (error) {
        console.log('  - Token error:', error);
        return false;
      }
    }
    return false;
  }
};

// OAuth configurations
export const oAuthStrategies = {
  google: 'oauth_google' as const,
  apple: 'oauth_apple' as const,
  facebook: 'oauth_facebook' as const,
};

// Authentication hooks (re-exports for centralized access)
export { useAuth, useSignIn, useSignUp, useOAuth };

// Type definitions
export interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId?: string;
  sessionId?: string;
  getToken?: () => Promise<string | null>;
}

export interface SignInData {
  identifier: string;
  password: string;
  code?: string;
}

export interface SignUpData {
  emailAddress: string;
  password: string;
  code?: string;
}

// OAuth handler functions with account linking support
export const handleOAuth = {
  async google(startOAuthFlow: any) {
    try {
      console.log('Starting Google OAuth flow...');
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();
      
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        console.log('Google OAuth successful - account linked or signed in');
        return { success: true };
      } else {
        // Handle account linking scenario
        if (signIn?.status === 'needs_identifier') {
          console.log('🔗 Account linking required');
          return { success: false, requiresLinking: true, signIn };
        } else {
          console.log('📧 Additional verification required');
          return { success: false, requiresVerification: true };
        }
      }
    } catch (err: any) {
      console.log('Google OAuth error:', err.errors ? err.errors[0]?.message : err.message);
      
      // Check if this is an account linking error
      if (err.errors?.[0]?.code === 'identifier_already_signed_up') {
        console.log('🔗 Account with this email already exists - linking required');
        return { 
          success: false, 
          requiresLinking: true, 
          error: 'Account with this email already exists. Please link your accounts.',
          email: err.errors[0]?.meta?.paramName 
        };
      }
      
      return { success: false, error: err.errors ? err.errors[0]?.message : err.message };
    }
  },

  async apple(startOAuthFlow: any) {
    try {
      console.log('Starting Apple OAuth flow...');
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();
      
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        console.log('Apple OAuth successful - account linked or signed in');
        return { success: true };
      } else {
        // Handle account linking scenario
        if (signIn?.status === 'needs_identifier') {
          console.log('🔗 Account linking required');
          return { success: false, requiresLinking: true, signIn };
        } else {
          console.log('📧 Additional verification required');
          return { success: false, requiresVerification: true };
        }
      }
    } catch (err: any) {
      console.log('Apple OAuth error:', err.errors ? err.errors[0]?.message : err.message);
      
      // Check if this is an account linking error
      if (err.errors?.[0]?.code === 'identifier_already_signed_up') {
        console.log('🔗 Account with this email already exists - linking required');
        return { 
          success: false, 
          requiresLinking: true, 
          error: 'Account with this email already exists. Please link your accounts.',
          email: err.errors[0]?.meta?.paramName 
        };
      }
      
      return { success: false, error: err.errors ? err.errors[0]?.message : err.message };
    }
  },

  async facebook(startOAuthFlow: any) {
    try {
      console.log('Starting Facebook OAuth flow...');
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();
      
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        console.log('Facebook OAuth successful - account linked or signed in');
        return { success: true };
      } else {
        // Handle account linking scenario
        if (signIn?.status === 'needs_identifier') {
          console.log('🔗 Account linking required');
          return { success: false, requiresLinking: true, signIn };
        } else {
          console.log('📧 Additional verification required');
          return { success: false, requiresVerification: true };
        }
      }
    } catch (err: any) {
      console.log('Facebook OAuth error:', err.errors ? err.errors[0]?.message : err.message);
      
      // Check if this is an account linking error
      if (err.errors?.[0]?.code === 'identifier_already_signed_up') {
        console.log('🔗 Account with this email already exists - linking required');
        return { 
          success: false, 
          requiresLinking: true, 
          error: 'Account with this email already exists. Please link your accounts.',
          email: err.errors[0]?.meta?.paramName 
        };
      }
      
      return { success: false, error: err.errors ? err.errors[0]?.message : err.message };
    }
  }
};

// Manual account linking handler
export const handleAccountLinking = async (
  signIn: any,
  setActive: any,
  email: string,
  password: string
) => {
  try {
    console.log('🔗 Attempting to link accounts...');
    
    // First, sign in with existing email/password account
    const signInAttempt = await signIn.create({
      identifier: email,
      password: password,
    });

    if (signInAttempt.status === 'complete') {
      await setActive({ session: signInAttempt.createdSessionId });
              console.log('Account linking successful');
      return { success: true };
    } else {
              console.log('Account linking failed - sign in incomplete');
      return { success: false, error: 'Account linking failed' };
    }
  } catch (err: any) {
          console.log('Account linking error:', err.errors ? err.errors[0]?.message : err.message);
    return { success: false, error: err.errors ? err.errors[0]?.message : err.message };
  }
};

// Sign in handler
export const handleSignIn = async (
  signIn: any,
  setActive: any,
  data: SignInData,
  setPendingVerification?: (value: boolean) => void
) => {
  try {
    const { identifier, password } = data;
    
    const completeSignIn = await signIn.create({
      identifier,
      password,
    });

    if (completeSignIn.status === 'complete') {
      await setActive({ session: completeSignIn.createdSessionId });
              console.log('Sign in successful');
      return { success: true };
    } else if (completeSignIn.status === 'needs_factor_one') {
      console.log('📧 Email verification required');
      if (setPendingVerification) setPendingVerification(true);
      return { success: false, requiresVerification: true };
    } else {
              console.log('Sign in incomplete:', completeSignIn.status);
      return { success: false, error: 'Sign in incomplete' };
    }
  } catch (err: any) {
          console.log('Sign in error:', err.errors ? err.errors[0]?.message : err.message);
    return { success: false, error: err.errors ? err.errors[0]?.message : err.message };
  }
};

// Sign up handler
export const handleSignUp = async (
  signUp: any,
  setActive: any,
  data: SignUpData,
  setPendingVerification?: (value: boolean) => void
) => {
  try {
    const { emailAddress, password } = data;
    
    await signUp.create({
      emailAddress,
      password,
    });

    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    console.log('📧 Verification email sent');
    if (setPendingVerification) setPendingVerification(true);
    return { success: true, requiresVerification: true };
  } catch (err: any) {
          console.log('Sign up error:', err.errors ? err.errors[0]?.message : err.message);
    return { success: false, error: err.errors ? err.errors[0]?.message : err.message };
  }
};

// Verification handler
export const handleVerification = async (
  signIn: any,
  signUp: any,
  setActive: any,
  code: string,
  isSignUp: boolean = false
) => {
  try {
    if (isSignUp) {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        console.log('Sign up verification successful');
        return { success: true };
      } else {
        console.log('Sign up verification incomplete');
        return { success: false, error: 'Verification incomplete' };
      }
    } else {
      const completeSignIn = await signIn.attemptFactorOne({
        strategy: 'email_code',
        code,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        console.log('Sign in verification successful');
        return { success: true };
      } else {
        console.log('Sign in verification incomplete');
        return { success: false, error: 'Verification incomplete' };
      }
    }
  } catch (err: any) {
          console.log('Verification error:', err.errors ? err.errors[0]?.message : err.message);
    return { success: false, error: err.errors ? err.errors[0]?.message : err.message };
  }
};

// Password reset handler
export const handlePasswordReset = async (
  signIn: any,
  setActive: any,
  data: { code: string; password: string }
) => {
  try {
    const { code, password } = data;
    
    const result = await signIn.attemptFirstFactor({
      strategy: 'reset_password_email_code',
      code,
      password,
    });

    console.log('📄 Password reset result:', {
      status: result.status,
      createdSessionId: result.createdSessionId
    });

    if (result.status === 'complete') {
      if (setActive && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        console.log('Password reset successful and session activated');
        return { success: true, sessionActivated: true };
      } else {
        console.log('Password reset successful but no session created');
        return { success: true, sessionActivated: false };
      }
    } else {
              console.log('Password reset incomplete:', result.status);
      return { success: false, error: 'Password reset incomplete' };
    }
  } catch (err: any) {
          console.log('Password reset error:', err.errors ? err.errors[0]?.message : err.message);
    
    let errorMessage = 'Password reset failed. Please try again.';
    
    if (err.errors && err.errors.length > 0) {
      const error = err.errors[0];
      
      if (error.code === 'form_code_incorrect') {
        errorMessage = 'Invalid reset code. Please check and try again.';
      } else if (error.code === 'form_password_pwned') {
        errorMessage = 'This password has been found in a data breach. Please choose a more secure password.';
      } else if (error.code === 'form_password_length_too_short') {
        errorMessage = 'Password is too short. Please choose a longer password.';
      } else {
        errorMessage = error.message || errorMessage;
      }
    }
    
    return { success: false, error: errorMessage };
  }
};

// Send password reset email handler
export const handleSendPasswordResetEmail = async (
  signIn: any,
  emailAddress: string
) => {
  try {
    await signIn.create({
      identifier: emailAddress,
    });

    const firstFactor = signIn.supportedFirstFactors.find((factor: any) =>
      factor.strategy === 'reset_password_email_code'
    );

    if (firstFactor) {
      await signIn.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: firstFactor.emailAddressId,
      });

      console.log('📧 Password reset email sent successfully');
      return { success: true };
    } else {
              console.log('Password reset not available for this account');
      return { success: false, error: 'Password reset not available for this account' };
    }
  } catch (err: any) {
          console.log('Send reset email error:', err.errors ? err.errors[0]?.message : err.message);
    
    let errorMessage = 'Failed to send reset email. Please try again.';
    
    if (err.errors && err.errors.length > 0) {
      const error = err.errors[0];
      
      if (error.code === 'form_identifier_not_found') {
        errorMessage = 'No account found with this email address.';
      } else {
        errorMessage = error.message || errorMessage;
      }
    }
    
    return { success: false, error: errorMessage };
  }
}; 