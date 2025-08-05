import { supabase } from './supabase';

/**
 * Simple sync: Check if email exists in database, if not add the user
 * Called immediately after Clerk authmentication succeeds
 */
export async function syncUserAfterAuth(clerkUser: any) {
  try {
    console.log('Starting simple sync after auth success');
    
    if (!clerkUser || !clerkUser.id) {
      console.error('No user provided for sync');
      return { success: false, error: 'No user provided' };
    }

    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!primaryEmail) {
      console.error('No email found for user');
      return { success: false, error: 'No email found' };
    }

    console.log('Checking if email exists in database:', primaryEmail);
    
    // Check if user already exists by email
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_id, email')
      .eq('email', primaryEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking email existence:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingUser) {
      console.log('Email already exists in database');
      console.log(`   Existing user: ${existingUser.email} (${existingUser.user_id})`);
      
      // Always sync current Clerk data to database on sign-in
      console.log('Syncing current Clerk data to database...');
      
      // Debug: Log the entire Clerk user object structure
      console.log('DEBUG: Full Clerk user object:', {
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses,
        phoneNumbers: clerkUser.phoneNumbers,
        primaryEmailAddress: clerkUser.primaryEmailAddress,
        primaryPhoneNumber: clerkUser.primaryPhoneNumber,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        externalAccounts: clerkUser.externalAccounts,
        hasPhoneNumbers: !!clerkUser.phoneNumbers,
        phoneNumbersLength: clerkUser.phoneNumbers?.length || 0
      });
      
      // Try multiple ways to get phone number
      const primaryPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber || 
                          clerkUser.primaryPhoneNumber?.phoneNumber ||
                          null;
      
      console.log('Phone number extraction attempts:', {
        fromArray: clerkUser.phoneNumbers?.[0]?.phoneNumber || 'None',
        fromPrimary: clerkUser.primaryPhoneNumber?.phoneNumber || 'None',
        finalPhone: primaryPhone || 'None'
      });
      
      const hasSocialLogin = clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0;
      
      console.log('Current Clerk data to sync:', {
        clerkUserId: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        phone: primaryPhone || 'None',
        firstName: clerkUser.firstName || 'None',
        lastName: clerkUser.lastName || 'None',
        socialLogin: hasSocialLogin
      });
      
      // Get current database phone number before update
      const { data: currentDbUser } = await supabase
        .from('users')
        .select('phone')
        .eq('email', primaryEmail)
        .single();
      
      console.log('Database phone before sync:', currentDbUser?.phone || 'None');
      
      // Only update phone if we have a phone number from Clerk, otherwise preserve existing
      const updateData: any = {
        user_id: clerkUser.id,
        clerk_user_id: clerkUser.id,
        first_name: clerkUser.firstName || null,
        last_name: clerkUser.lastName || null,
        profile_image_url: clerkUser.imageUrl || null,
        is_social_login: hasSocialLogin,
        updated_at: new Date().toISOString()
      };
      
      // Only update phone if we have one from Clerk
      if (primaryPhone) {
        updateData.phone = primaryPhone;
        console.log('Will update phone number to:', primaryPhone);
      } else {
        console.log('No phone number from Clerk, preserving existing database value');
      }
      
      // Update the existing user record with current Clerk data
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('email', primaryEmail);

      if (updateError) {
        console.error('Error syncing Clerk data to database:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('Successfully synced current Clerk data to database');
      console.log(`   Phone number: ${primaryPhone || 'Preserved existing'} → Database updated`);
      
      return { success: true, message: 'User data synced from Clerk' };
    }

    // Email doesn't exist, add the user
    console.log('Email not found, adding new user to database...');
    
    const primaryPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber;
    const hasSocialLogin = clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0;
    const username = primaryEmail.split('@')[0];
    
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

    console.log('Adding new user:', {
      user_id: userData.user_id,
      username: userData.username,
      email: userData.email,
      is_social_login: userData.is_social_login
    });

    // Add the user to database
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
      console.error('Failed to add new user:', error);
      return { success: false, error: error.message };
    } else {
      console.log('New user added successfully!');
      console.log(`   Username: ${userData.username}`);
      console.log(`   Email: ${userData.email}`);
      return { success: true, data: userData };
    }

  } catch (error) {
    console.error('Error during simple sync:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 