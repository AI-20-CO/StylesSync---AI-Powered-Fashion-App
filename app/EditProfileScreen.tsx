import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CountryPicker from 'react-native-country-picker-modal';
import { useUser, useSignUp, useAuth } from '@clerk/clerk-expo';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../backend/supabase';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;

interface EditProfileScreenProps {
  onClose: () => void;
}

interface UserData {
  user_id: string;
  username: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onClose }) => {
  const { user } = useUser();
  const { signUp } = useSignUp();
  const { signOut } = useAuth();
  const { createPaymentMethod } = useStripe();
  const [isProfileDetailsExpanded, setIsProfileDetailsExpanded] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isPaymentMethodExpanded, setIsPaymentMethodExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Separate loading states for each section
  const [addressLoading, setAddressLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('MY');
  const [callingCode, setCallingCode] = useState('60');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Verification states
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);
  const [pendingPhoneVerification, setPendingPhoneVerification] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Address form states
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [postCode, setPostCode] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);

  // Payment form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiry, setExpiry] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Fetch user data from Supabase
  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching user data for:', user.id);

      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, email, phone, first_name, last_name, profile_image_url, address, payment_method')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load profile data');
        return;
      }

      if (data) {
        console.log('✅ User data loaded:', data);
        
        // Set form data from Supabase
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        setFullName(`${firstName} ${lastName}`.trim());
        setEmail(data.email || '');
        
        // Parse phone number
        if (data.phone) {
          const phone = data.phone.replace(/\D/g, ''); // Remove non-digits
          if (phone.startsWith('60')) {
            // Malaysian number
            setCountryCode('MY');
            setCallingCode('60');
            setPhoneNumber(phone.substring(2)); // Remove country code
          } else if (phone.startsWith('1')) {
            // US number
            setCountryCode('US');
            setCallingCode('1');
            setPhoneNumber(phone.substring(1));
          } else {
            // Default parsing
            setPhoneNumber(phone);
          }
        }

        // Load address data if available
        if (data.address) {
          console.log('🏠 Loading address data:', data.address);
          setState(data.address.state || '');
          setCity(data.address.city || '');
          setPostCode(data.address.post_code || '');
          setFullAddress(data.address.full_address || '');
        }

        // Load payment method data if available
        if (data.payment_method) {
          console.log('💳 Loading payment method data:', data.payment_method);
          setCardNumber(data.payment_method.card_number || '');
          setCardholderName(data.payment_method.cardholder_name || '');
          setCvv(data.payment_method.cvv || '');
          setExpiry(data.payment_method.expiry || '');
          setBillingAddress(data.payment_method.billing_address || '');
        }
      }
    } catch (error) {
      console.error('❌ Error in fetchUserData:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Update user data in Supabase
  const updateUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔄 Starting profile update...');
      
      // Check what changed
      const [firstName, ...lastNameParts] = fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || 'User'; // Default to 'User' if no last name provided
      const fullPhoneNumber = `+${callingCode}${phoneNumber}`;
      
      const originalFirstName = user.firstName || '';
      const originalLastName = user.lastName || '';
      const originalEmail = user.emailAddresses?.[0]?.emailAddress || '';
      const originalPhone = user.phoneNumbers?.[0]?.phoneNumber || '';
      
      console.log('📊 Changes detected:', {
        name: `${originalFirstName} ${originalLastName}` !== fullName.trim(),
        email: originalEmail !== email,
        phone: originalPhone !== fullPhoneNumber
      });

      // Handle name changes (update Clerk first, then database)
      if (`${originalFirstName} ${originalLastName}`.trim() !== fullName.trim()) {
        console.log('📝 Updating name in Clerk...');
        try {
          await user.update({
            firstName: firstName || null,
            lastName: lastName || null
          });
          console.log('✅ Name updated in Clerk');
        } catch (error) {
          console.error('❌ Error updating name in Clerk:', error);
          Alert.alert('Error', 'Failed to update name. Please try again.');
          return;
        }
      }

      // Handle email changes (requires verification)
      if (originalEmail !== email && email !== newEmail) {
        console.log('📧 Email change detected, starting verification...');
        setNewEmail(email);
        await startEmailVerification(email);
        return; // Don't update database yet, wait for verification
      }

      // Handle email verification
      if (pendingEmailVerification && emailVerificationCode) {
        await verifyEmailCode();
        return; // Verification will handle database update
      }

      // Handle phone changes (requires verification)
      if (originalPhone !== fullPhoneNumber && fullPhoneNumber !== newPhone) {
        console.log('📱 Phone change detected, starting verification...');
        setNewPhone(fullPhoneNumber);
        await startPhoneVerification(fullPhoneNumber);
        return; // Don't update database yet, wait for verification
      }

      // Handle phone verification
      if (pendingPhoneVerification && phoneVerificationCode) {
        await verifyPhoneCode();
        return; // Verification will handle database update
      }

      // If only name changed (no verification needed), update database directly
      if (`${originalFirstName} ${originalLastName}`.trim() !== fullName.trim()) {
        console.log('📝 Updating database with name changes...');
        await updateDatabaseOnly(firstName, lastName, originalEmail, originalPhone);
      } else {
        console.log('ℹ️ No changes detected');
        Alert.alert('Info', 'No changes to save.');
      }

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Start email verification with actual Clerk
  const startEmailVerification = async (newEmailAddress: string) => {
    try {
      console.log('📧 Starting email verification with Clerk...');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Create new email address with Clerk
      const emailAddress = await user.createEmailAddress({
        email: newEmailAddress
      });

      // Prepare verification
      await emailAddress.prepareVerification({
        strategy: 'email_code'
      });
      
      setPendingEmailVerification(true);
      Alert.alert(
        'Verification Code Sent', 
        `A verification code has been sent to ${newEmailAddress}. Please check your email and enter the code below.`
      );
      
    } catch (error: any) {
      console.error('❌ Email verification error:', error);
      const errorMessage = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Failed to send verification email';
      Alert.alert('Error', errorMessage);
      setNewEmail('');
    }
  };

  // Start phone verification with actual Clerk
  const startPhoneVerification = async (newPhoneNumber: string) => {
    try {
      console.log('📱 Starting phone verification with Clerk...');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Create new phone number with Clerk
      const phoneNumber = await user.createPhoneNumber({
        phoneNumber: newPhoneNumber
      });

      // Prepare verification
      await phoneNumber.prepareVerification();
      
      setPendingPhoneVerification(true);
      Alert.alert(
        'Verification Code Sent', 
        `A verification code has been sent to ${newPhoneNumber}. Please check your phone and enter the code below.`
      );
      
    } catch (error: any) {
      console.error('❌ Phone verification error:', error);
      const errorMessage = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Failed to send verification SMS';
      Alert.alert('Error', errorMessage);
      setNewPhone('');
    }
  };

  // Verify email code with actual Clerk
  const verifyEmailCode = async () => {
    try {
      if (!emailVerificationCode || emailVerificationCode.length < 4) {
        Alert.alert('Invalid Code', 'Please enter a valid verification code.');
        return;
      }

      console.log('🔍 Verifying email code with Clerk...');
      
      // Find the email address that needs verification
      const emailAddress = user?.emailAddresses.find(email => email.emailAddress === newEmail);
      if (!emailAddress) {
        Alert.alert('Error', 'Email address not found for verification');
        return;
      }

      // Attempt verification with Clerk
      const result = await emailAddress.attemptVerification({
        code: emailVerificationCode
      });
      
      if (result.verification.status === 'verified') {
        console.log('✅ Email verified successfully with Clerk');
        
        // Set as primary email
        await user?.update({
          primaryEmailAddressId: emailAddress.id
        });
        
        setPendingEmailVerification(false);
        setEmailVerificationCode('');

        // Update database with new email
        const [firstName, ...lastNameParts] = fullName.trim().split(' ');
        const lastName = lastNameParts.join(' ') || 'User'; // Default to 'User' if no last name provided
        const fullPhoneNumber = `+${callingCode}${phoneNumber}`;
        
        await updateDatabaseOnly(firstName, lastName, newEmail, fullPhoneNumber);
      } else {
        Alert.alert('Verification Failed', 'Email verification was not successful. Please try again.');
      }
      
    } catch (error: any) {
      console.error('❌ Email verification failed:', error);
      const errorMessage = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Invalid verification code';
      Alert.alert('Verification Failed', errorMessage);
    }
  };

  // Verify phone code with actual Clerk
  const verifyPhoneCode = async () => {
    try {
      if (!phoneVerificationCode || phoneVerificationCode.length < 4) {
        Alert.alert('Invalid Code', 'Please enter a valid verification code.');
        return;
      }

      console.log('🔍 Verifying phone code with Clerk...');
      
      // Find the phone number that needs verification
      const phoneNumberObj = user?.phoneNumbers.find(phone => phone.phoneNumber === newPhone);
      if (!phoneNumberObj) {
        Alert.alert('Error', 'Phone number not found for verification');
        return;
      }

      // Attempt verification with Clerk
      const result = await phoneNumberObj.attemptVerification({
        code: phoneVerificationCode
      });
      
      if (result.verification.status === 'verified') {
        console.log('✅ Phone verified successfully with Clerk');
        
        // Set as primary phone
        await user?.update({
          primaryPhoneNumberId: phoneNumberObj.id
        });
        
        setPendingPhoneVerification(false);
        setPhoneVerificationCode('');

        // Update database with new phone
        const [firstName, ...lastNameParts] = fullName.trim().split(' ');
        const lastName = lastNameParts.join(' ') || 'User'; // Default to 'User' if no last name provided
        
        await updateDatabaseOnly(firstName, lastName, email, newPhone);
      } else {
        Alert.alert('Verification Failed', 'Phone verification was not successful. Please try again.');
      }
      
    } catch (error: any) {
      console.error('❌ Phone verification failed:', error);
      const errorMessage = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Invalid verification code';
      Alert.alert('Verification Failed', errorMessage);
    }
  };

  // Update database only (after verification or for non-sensitive data)
  const updateDatabaseOnly = async (firstName: string, lastName: string, emailAddress: string, phone: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          email: emailAddress,
          phone: phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) {
        console.error('❌ Error updating database:', error);
        Alert.alert('Error', 'Failed to update profile data');
        return;
      }

      console.log('✅ Database updated successfully');
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Reset verification states
      setNewEmail('');
      setNewPhone('');
      
    } catch (error) {
      console.error('❌ Error in updateDatabaseOnly:', error);
      Alert.alert('Error', 'Failed to update profile data');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user?.id]);

  const toggleProfileDetails = () => {
    if (isProfileDetailsExpanded) {
      // If already expanded, just close it
      setIsProfileDetailsExpanded(false);
    } else {
      // Close other sections and open this one
      setIsAddressExpanded(false);
      setIsPaymentMethodExpanded(false);
      setIsProfileDetailsExpanded(true);
    }
  };

  const toggleAddress = () => {
    if (isAddressExpanded) {
      // If already expanded, just close it
      setIsAddressExpanded(false);
    } else {
      // Close other sections and open this one
      setIsProfileDetailsExpanded(false);
      setIsPaymentMethodExpanded(false);
      setIsAddressExpanded(true);
    }
  };

  const togglePaymentMethod = () => {
    if (isPaymentMethodExpanded) {
      // If already expanded, just close it
      setIsPaymentMethodExpanded(false);
    } else {
      // Close other sections and open this one
      setIsProfileDetailsExpanded(false);
      setIsAddressExpanded(false);
      setIsPaymentMethodExpanded(true);
      
      // Auto-populate billing address with saved address when expanding payment section
      if (fullAddress && !billingAddress) {
        console.log('🏠 Auto-populating billing address with saved address');
        setBillingAddress(fullAddress);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('✅ User logged out successfully');
            } catch (error) {
              console.error('❌ Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Update address data in database
  const updateAddressData = async () => {
    if (!user?.id) return;

    // Validate that all address fields are filled
    const emptyFields = [];
    if (!state.trim()) emptyFields.push('State');
    if (!city.trim()) emptyFields.push('City');
    if (!postCode.trim()) emptyFields.push('Post Code');
    if (!fullAddress.trim()) emptyFields.push('Full Address');

    if (emptyFields.length > 0) {
      const message = `Please fill in the following fields:\n• ${emptyFields.join('\n• ')}`;
      Alert.alert('Incomplete Address', message);
      return;
    }

    setAddressLoading(true);
    try {
      console.log('🏠 Updating address data...');
      
      const addressData = {
        state: state.trim(),
        city: city.trim(),
        post_code: postCode.trim(),
        full_address: fullAddress.trim()
      };

      console.log('📊 Address data to save:', addressData);

      const { error } = await supabase
        .from('users')
        .update({
          address: addressData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error updating address:', error);
        Alert.alert('Error', 'Failed to update address');
        return;
      }

      console.log('✅ Address updated successfully');
      Alert.alert('Success', 'Address updated successfully!');
      
    } catch (error) {
      console.error('❌ Error in updateAddressData:', error);
      Alert.alert('Error', 'Failed to update address');
    } finally {
      setAddressLoading(false);
    }
  };

  // Basic validation only - Stripe validation will be handled by Stripe Elements
  const validateCardFields = () => {
    const errors = [];
    if (!cardNumber.trim()) errors.push('Card Number');
    if (!cardholderName.trim()) errors.push('Cardholder Name');
    if (!cvv.trim()) errors.push('CVV');
    if (!expiry.trim()) errors.push('Expiry Date');
    if (!billingAddress.trim()) errors.push('Billing Address');

    if (errors.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please fill in the following fields:\n• ${errors.join('\n• ')}`
      );
      return false;
    }

    // Parse expiry date
    const [month, year] = expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 4) {
      Alert.alert('Invalid Expiry', 'Expiry date must be in MM/YYYY format');
      return false;
    }

    return true;
  };

  // Update payment method data in database
  const updatePaymentMethodData = async () => {
    if (!user?.id) return;

    // Validate card fields
    if (!validateCardFields()) {
      return;
    }

    setPaymentLoading(true);
    try {
      console.log('💳 Updating payment method data...');
      
      const paymentData = {
        card_number: cardNumber.trim(),
        cardholder_name: cardholderName.trim(),
        cvv: cvv.trim(),
        expiry: expiry.trim(),
        billing_address: billingAddress.trim()
      };

      console.log('📊 Payment data to save:', paymentData);

      const { error } = await supabase
        .from('users')
        .update({
          payment_method: paymentData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error updating payment method:', error);
        Alert.alert('Error', 'Failed to update payment method');
        return;
      }

      console.log('✅ Payment method updated successfully');
      Alert.alert('Success', 'Payment method updated successfully!');
      
    } catch (error) {
      console.error('❌ Error in updatePaymentMethodData:', error);
      Alert.alert('Error', 'Failed to update payment method');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      
      {/* Main Profile Container - like Accounts page */}
      <View style={styles.mainProfileContainer}>
        {/* Header Buttons */}
        <View style={styles.headerButtons}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Image source={require('../assets/images/cross.png')} style={styles.closeIcon} />
          </TouchableOpacity>
          
          {/* Log Out Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={require('../assets/images/profile.png')}
                style={styles.profileImage}
              />
            </View>
            <Text style={styles.profileName}>
              {loading ? 'Loading...' : (fullName || (user?.firstName && user?.lastName)
                ? fullName || `${user?.firstName} ${user?.lastName}` 
                : user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User')}
            </Text>
          </View>

          {/* Profile Options */}
          <View style={styles.optionsContainer}>
            {/* Profile Details - Expandable */}
            <View style={styles.profileDetailsContainer}>
              <TouchableOpacity style={styles.profileDetailsHeader} onPress={toggleProfileDetails}>
                <View style={styles.profileDetailsHeaderContent}>
                  <View style={styles.profileDetailsTextContainer}>
                    <Text style={styles.optionTitle}>Profile Details</Text>
                    {!isProfileDetailsExpanded && (
                      <Text style={styles.optionSubtitle}>Change your name, phone number, email address</Text>
                    )}
                  </View>
                  <Text style={styles.profileDetailsArrow}>›</Text>
                </View>
              </TouchableOpacity>
              
              {isProfileDetailsExpanded && (
                <View style={styles.profileDetailsForm}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Full Name</Text>
                    <TextInput
                      style={styles.formInput}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Enter your full name (e.g., John Smith)"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Email</Text>
                    <TextInput
                      style={styles.formInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                    />
                  </View>

                  {pendingEmailVerification && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Email Verification Code</Text>
                      <TextInput
                        style={styles.formInput}
                        value={emailVerificationCode}
                        onChangeText={setEmailVerificationCode}
                        placeholder="Enter verification code"
                        keyboardType="numeric"
                        maxLength={6}
                      />
                      <Text style={styles.verificationHint}>
                        Please check your email for the verification code
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Phone Number</Text>
                    <TouchableOpacity 
                      style={styles.phoneInputContainer}
                      activeOpacity={1}
                    >
                      <TouchableOpacity 
                        style={styles.countryPickerButton}
                        onPress={() => setShowCountryPicker(true)}
                        activeOpacity={0.7}
                      >
                        <CountryPicker
                          countryCode={countryCode as any}
                          withFilter
                          withFlag
                          withCallingCode
                          withEmoji={false}
                          onSelect={(country) => {
                            setCountryCode(country.cca2);
                            setCallingCode(country.callingCode[0]);
                          }}
                          visible={showCountryPicker}
                          onClose={() => setShowCountryPicker(false)}
                        />
                        <Text style={styles.callingCodeText}>+{callingCode}</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.phoneInput}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                      />
                    </TouchableOpacity>
                  </View>

                  {pendingPhoneVerification && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Phone Verification Code</Text>
                      <TextInput
                        style={styles.formInput}
                        value={phoneVerificationCode}
                        onChangeText={setPhoneVerificationCode}
                        placeholder="Enter verification code"
                        keyboardType="numeric"
                        maxLength={6}
                      />
                      <Text style={styles.verificationHint}>
                        Please check your phone for the verification code
                      </Text>
                    </View>
                  )}
                  
                  <TouchableOpacity style={styles.applyButton} onPress={updateUserData} disabled={loading}>
                    <Text style={styles.applyButtonText}>
                      {loading ? 'Updating...' : 'Apply'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Address - Expandable */}
            <View style={styles.profileDetailsContainer}>
              <TouchableOpacity style={styles.profileDetailsHeader} onPress={toggleAddress}>
                <View style={styles.profileDetailsHeaderContent}>
                  <View style={styles.profileDetailsTextContainer}>
                    <Text style={styles.optionTitle}>Address</Text>
                    {!isAddressExpanded && (
                      <Text style={styles.optionSubtitle}>Change your address</Text>
                    )}
                  </View>
                  <Text style={styles.profileDetailsArrow}>
                    {isAddressExpanded ? '⌄' : '›'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {isAddressExpanded && (
                <View style={styles.profileDetailsForm}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>State</Text>
                    <TouchableOpacity 
                      style={styles.formInput}
                      onPress={() => setShowStatePicker(true)}
                    >
                      <Text style={styles.inputText}>
                        {state || 'Select State'}
                      </Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formRowContainer}>
                    <View style={styles.formRowItem}>
                      <Text style={styles.formLabel}>City</Text>
                      <TextInput
                        style={styles.formInput}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Enter city"
                      />
                    </View>
                    
                    <View style={styles.formRowItem}>
                      <Text style={styles.formLabel}>Post Code</Text>
                      <TextInput
                        style={styles.formInput}
                        value={postCode}
                        onChangeText={setPostCode}
                        placeholder="Enter post code"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Full Address</Text>
                    <TextInput
                      style={styles.formInput}
                      value={fullAddress}
                      onChangeText={setFullAddress}
                      placeholder="Enter full address"
                      multiline
                    />
                  </View>
                  
                  <TouchableOpacity style={styles.applyButton} onPress={updateAddressData} disabled={addressLoading}>
                    <Text style={styles.applyButtonText}>
                      {addressLoading ? 'Updating...' : 'Apply'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Payment Method - Expandable */}
            <View style={styles.profileDetailsContainer}>
              <TouchableOpacity style={styles.profileDetailsHeader} onPress={togglePaymentMethod}>
                <View style={styles.profileDetailsHeaderContent}>
                  <View style={styles.profileDetailsTextContainer}>
                    <Text style={styles.optionTitle}>Payment Method</Text>
                    {!isPaymentMethodExpanded && (
                      <Text style={styles.optionSubtitle}>Change your payment details</Text>
                    )}
                  </View>
                  <Text style={styles.profileDetailsArrow}>
                    {isPaymentMethodExpanded ? '⌄' : '›'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {isPaymentMethodExpanded && (
                <View style={styles.profileDetailsForm}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Card Number</Text>
                    <TextInput
                      style={styles.formInput}
                      value={cardNumber}
                      onChangeText={setCardNumber}
                      placeholder="Enter card number"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formRowContainer}>
                    <View style={styles.cardholderNameContainer}>
                      <Text style={styles.formLabel}>Cardholder Name</Text>
                      <TextInput
                        style={styles.formInput}
                        value={cardholderName}
                        onChangeText={setCardholderName}
                        placeholder="Enter name"
                      />
                    </View>
                    
                    <View style={styles.cvvContainer}>
                      <Text style={styles.formLabel}>CVV</Text>
                      <TextInput
                        style={styles.formInput}
                        value={cvv}
                        onChangeText={setCvv}
                        placeholder="xxx"
                        keyboardType="numeric"
                        maxLength={3}
                      />
                    </View>

                    <View style={styles.expiryContainer}>
                      <Text style={styles.formLabel}>Expiry</Text>
                      <TextInput
                        style={styles.formInput}
                        value={expiry}
                        onChangeText={setExpiry}
                        placeholder="MM/YYYY"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Billing Address</Text>
                    <TextInput
                      style={styles.formInput}
                      value={billingAddress}
                      onChangeText={setBillingAddress}
                      placeholder="Enter billing address"
                      multiline
                    />
                  </View>
                  
                  <TouchableOpacity style={styles.applyButton} onPress={updatePaymentMethodData} disabled={paymentLoading}>
                    <Text style={styles.applyButtonText}>
                      {paymentLoading ? 'Updating...' : 'Add Card'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.optionItem}>
              <Text style={styles.optionTitle}>Change Preferences</Text>
              <Text style={styles.optionSubtitle}>Change your preferences</Text>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* SS Logo Section */}
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/images/ss logo black.png')}
            style={styles.ssLogo}
          />
          <Image
            source={require('../assets/images/ss written logo.png')}
            style={styles.ssWrittenLogo}
          />
        </View>
      </View>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <Text style={styles.modalCloseButton}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.statesList} showsVerticalScrollIndicator={false}>
              {[
                'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca',
                'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya',
                'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
              ].map((stateName) => (
                <TouchableOpacity
                  key={stateName}
                  style={[
                    styles.stateItem,
                    state === stateName && styles.selectedStateItem
                  ]}
                  onPress={() => {
                    setState(stateName);
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.stateText,
                    state === stateName && styles.selectedStateText
                  ]}>
                    {stateName}
                  </Text>
                  {state === stateName && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainProfileContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderTopLeftRadius: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    borderTopRightRadius: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    marginTop: isSmallDevice ? 60 : isMediumDevice ? 65 : 70,
    marginHorizontal: isSmallDevice ? 8 : isMediumDevice ? 9 : 10,
    paddingHorizontal: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    paddingVertical: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerButtons: {
    position: 'absolute',
    top: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    left: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    right: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    width: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    height: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    tintColor: '#000',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 15,
    paddingHorizontal: isSmallDevice ? 12 : isMediumDevice ? 14 : 16,
    paddingVertical: isSmallDevice ? 6 : isMediumDevice ? 7 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: isSmallDevice ? 15 : 20,
    marginBottom: isSmallDevice ? 20 : 25,
  },
  profileImageContainer: {
    width: isSmallDevice ? 70 : isMediumDevice ? 75 : 80,
    height: isSmallDevice ? 70 : isMediumDevice ? 75 : 80,
    borderRadius: isSmallDevice ? 35 : isMediumDevice ? 37.5 : 40,
    backgroundColor: '#f0f0f0',
    marginBottom: isSmallDevice ? 12 : isMediumDevice ? 13 : 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: isSmallDevice ? 45 : isMediumDevice ? 47 : 50,
    height: isSmallDevice ? 45 : isMediumDevice ? 47 : 50,
    resizeMode: 'contain',
  },
  profileName: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '500',
    color: '#000',
  },
  optionsContainer: {
    flex: 0,
  },
  optionItem: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    padding: isSmallDevice ? 12 : isMediumDevice ? 14 : 16,
    marginBottom: isSmallDevice ? 8 : 10,
    position: 'relative',
  },
  optionTitle: {
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    color: '#666',
    fontWeight: '400',
  },
  optionArrow: {
    position: 'absolute',
    right: isSmallDevice ? 12 : isMediumDevice ? 14 : 16,
    top: '50%',
    transform: [{ translateY: -8 }],
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
  },
  logoSection: {
    position: 'absolute',
    bottom: isSmallDevice ? 5 : isMediumDevice ? 8 : 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: isSmallDevice ? 5 : isMediumDevice ? 8 : 10,
  },
  ssLogo: {
    width: isSmallDevice ? 60 : isMediumDevice ? 70 : 80,
    height: isSmallDevice ? 60 : isMediumDevice ? 70 : 80,
    marginBottom: 0,
    resizeMode: 'contain',
  },
  ssWrittenLogo: {
    width: isSmallDevice ? 160 : isMediumDevice ? 180 : 200,
    height: isSmallDevice ? 40 : isMediumDevice ? 45 : 50,
    marginTop: isSmallDevice ? -15 : isMediumDevice ? -18 : -20,
    resizeMode: 'contain',
  },
  profileDetailsContainer: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    padding: isSmallDevice ? 12 : isMediumDevice ? 14 : 16,
    marginBottom: isSmallDevice ? 8 : 10,
  },
  profileDetailsHeader: {
    position: 'relative',
  },
  profileDetailsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileDetailsTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  profileDetailsForm: {
    marginTop: 15,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: isSmallDevice ? 8 : isMediumDevice ? 9 : 10,
    padding: isSmallDevice ? 10 : isMediumDevice ? 12 : 14,
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: isSmallDevice ? 8 : isMediumDevice ? 9 : 10,
    height: isSmallDevice ? 38 : isMediumDevice ? 40 : 42,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 10 : isMediumDevice ? 12 : 14,
    paddingVertical: isSmallDevice ? 10 : isMediumDevice ? 12 : 14,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    minWidth: isSmallDevice ? 60 : isMediumDevice ? 65 : 70,
  },
  callingCodeText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#000',
    fontWeight: '500',
    marginLeft: 6,
  },
  phoneInput: {
    flex: 1,
    height: isSmallDevice ? 38 : isMediumDevice ? 40 : 42,
    paddingHorizontal: isSmallDevice ? 10 : isMediumDevice ? 12 : 14,
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#000',
    backgroundColor: 'transparent',
  },
  applyButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: isSmallDevice ? 8 : isMediumDevice ? 9 : 10,
    paddingVertical: isSmallDevice ? 6 : isMediumDevice ? 7 : 8,
    paddingHorizontal: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    fontWeight: '600',
    color: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: isSmallDevice ? 100 : isMediumDevice ? 120 : 140,
  },
  profileDetailsArrow: {
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
    marginTop: 1,
  },
  formRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  formRowItem: {
    flex: 1,
  },
  linkCardSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkCardText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    gap: 15,
  },
  paymentOption: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  applePayText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  googlePayText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  cardholderNameContainer: {
    flex: 1,
  },
  cvvContainer: {
    flex: 0.3,
    marginHorizontal: 3,
  },
  expiryContainer: {
    flex: 0.4,
    marginLeft: 6,
  },
  inputText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#000',
    fontWeight: '400',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statesList: {
    maxHeight: 300,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedStateItem: {
    backgroundColor: '#e8f4f8',
    borderColor: '#007AFF',
  },
  stateText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  selectedStateText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  verificationHint: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
    marginTop: 4,
  },
  useSavedAddressButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  useSavedAddressText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
});

export default EditProfileScreen; 