// Backend entry point - exports all authentication functionality
export * from './authentication';
export * from './immediateSync';
export * from './simpleSync';

// Configuration
export { clerkConfig, tokenCache } from './authentication';

// Utilities
export { authUtils } from './authentication';

// OAuth configurations
export { oAuthStrategies, handleOAuth } from './authentication';

// Authentication handlers
export { handleSignIn, handleSignUp, handleVerification, handlePasswordReset, handleSendPasswordResetEmail, handleAccountLinking } from './authentication';

// Hooks (re-exported from Clerk)
export { useAuth, useSignIn, useSignUp, useOAuth } from './authentication';

// Types
export type { AuthState, SignInData, SignUpData } from './authentication'; 