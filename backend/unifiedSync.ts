import { supabase } from './supabase';

/**
 * Unified sync function that works for both manual registration and OAuth
 * This replaces both syncNewUserImmediately and syncUserAfterAuth
 */
export async function unifiedUserSync(clerkUser: any) {
  try {
    // Silent sync - only log in development
    if (__DEV__) {
      console.log('UNIFIED SYNC STARTED for user:', clerkUser?.id || 'NO USER ID');
    }
    
    if (!clerkUser || !clerkUser.id) {
      // Silent error - only log in development
      if (__DEV__) {
        console.error('UNIFIED SYNC FAILED: No user object or ID provided');
      }
      return { success: false, error: 'No user object or ID provided' };
    }

    // Extract data consistently
    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
    const primaryPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber;
    
    if (!primaryEmail) {
      // Silent error - only log in development
      if (__DEV__) {
        console.error('No email found for user');
      }
      return { success: false, error: 'No email address found' };
    }

    // Check if user used social login (OAuth)
    const hasSocialLogin = clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0;
    
    // Silent sync - only log in development
    if (__DEV__) {
      console.log('Unified sync data:', {
        user_id: clerkUser.id,
        email: primaryEmail,
        phone: primaryPhone || 'None',
        firstName: clerkUser.firstName || 'None',
        lastName: clerkUser.lastName || 'None',
        socialLogin: hasSocialLogin
      });
    }

    // Use the unified sync function
    const { error } = await supabase.rpc('sync_clerk_user_custom', {
      p_clerk_user_id: clerkUser.id,
      p_email: primaryEmail,
      p_password: 'clerk_managed',
      p_phone: primaryPhone || null,
      p_first_name: clerkUser.firstName || null,
      p_last_name: clerkUser.lastName || null,
      p_profile_image_url: clerkUser.imageUrl || null,
      p_is_social_login: hasSocialLogin
    });
    
    if (error) {
      // Silent error handling - only log in development
      if (__DEV__) {
        console.error('UNIFIED SYNC FAILED:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      return { success: false, error: error.message };
    } else {
      // Silent success - only log in development
      if (__DEV__) {
        console.log('UNIFIED SYNC SUCCESSFUL!');
        console.log('User data synced:', {
          user_id: clerkUser.id,
          email: primaryEmail,
          social_login: hasSocialLogin
        });
      }
      return { success: true, data: { user_id: clerkUser.id, email: primaryEmail } };
    }

  } catch (error) {
    // Silent error handling - only log in development
    if (__DEV__) {
      console.error('Unified sync error:', error);
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use unifiedUserSync instead
 */
export async function syncNewUserImmediately(clerkUser: any) {
  console.log('Using deprecated syncNewUserImmediately - use unifiedUserSync instead');
  return unifiedUserSync(clerkUser);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use unifiedUserSync instead
 */
export async function syncUserAfterAuth(clerkUser: any) {
  console.log('Using deprecated syncUserAfterAuth - use unifiedUserSync instead');
  return unifiedUserSync(clerkUser);
} 