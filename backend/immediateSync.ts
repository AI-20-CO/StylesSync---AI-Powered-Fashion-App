import { supabase } from './supabase';
import { useAuth } from '@clerk/clerk-expo';

/**
 * Immediately sync a newly registered user to Supabase
 * This is called right after successful registration/verification
 */
export async function syncNewUserImmediately(clerkUser: any) {
  try {
    console.log('IMMEDIATE SYNC STARTED for new user:', clerkUser?.id || 'NO USER ID');
    console.log('User object received:', {
      hasUser: !!clerkUser,
      id: clerkUser?.id,
      emailAddresses: clerkUser?.emailAddresses?.length || 0,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
      externalAccounts: clerkUser?.externalAccounts?.length || 0,
      fullUserObject: !!clerkUser ? 'Present' : 'Missing'
    });

    if (!clerkUser) {
      console.error('IMMEDIATE SYNC FAILED: No user object provided');
      return { success: false, error: 'No user object provided' };
    }

    if (!clerkUser.id) {
      console.error('IMMEDIATE SYNC FAILED: User has no ID');
      return { success: false, error: 'User has no ID' };
    }

    // Extract data according to specifications
    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
    const primaryPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber;
    
    if (!primaryEmail) {
      console.error('No email found for user');
      return { success: false, error: 'No email address found' };
    }

    // Check if user used social login (OAuth)
    const hasSocialLogin = clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0;
    
    // Extract username from email (part before @)
    const username = primaryEmail.split('@')[0];
    
    // Prepare user data
    const userData = {
      user_id: clerkUser.id,
      username: username,
      email: primaryEmail,
      password_hash: 'clerk_managed',
      phone: primaryPhone || null,
      first_name: clerkUser.firstName || null,
      last_name: clerkUser.lastName || null,
      clerk_user_id: clerkUser.id,
      profile_image_url: clerkUser.imageUrl || null,
      is_social_login: hasSocialLogin,
    };

    console.log('Immediate sync data:', {
      user_id: userData.user_id,
      username: userData.username,
      email: userData.email,
      is_social_login: userData.is_social_login,
      has_phone: !!userData.phone
    });

    // Use the custom sync function
    const { error } = await supabase.rpc('sync_clerk_user_custom', {
      p_clerk_user_id: userData.user_id,
      p_email: userData.email,
      p_password: userData.password_hash,
      p_phone: userData.phone,
      p_first_name: userData.first_name,
      p_last_name: userData.last_name,
      p_profile_image_url: userData.profile_image_url,
      p_is_social_login: userData.is_social_login
    });
    
    if (error) {
      console.error('IMMEDIATE SYNC FAILED:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    } else {
      console.log('IMMEDIATE SYNC SUCCESSFUL!');
      console.log('User data synced:', {
        username: userData.username,
        email: userData.email,
        social_login: userData.is_social_login,
        user_id: userData.user_id
      });
      return { success: true, data: userData };
    }

  } catch (error) {
    console.error('Immediate sync error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Alternative sync function that tries to get user data from Clerk session
 * Use this when the useUser hook doesn't provide user data immediately
 */
export async function syncNewUserFromSession() {
  try {
    console.log('Attempting to sync user from active session...');
    
    // This would need to be called from a component that has access to useAuth
    // For now, return a placeholder
    return { success: false, error: 'Not implemented - use syncNewUserImmediately with user object' };
    
  } catch (error) {
    console.error('Session sync error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 