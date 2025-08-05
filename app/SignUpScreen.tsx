import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import { useSignUp, useOAuth, oAuthStrategies, handleSignUp, handleOAuth, handleVerification, syncUserAfterAuth } from '../backend';
import { useUser } from '@clerk/clerk-expo';
import { StackNavigationProp } from '@react-navigation/stack';
import CountryPicker from 'react-native-country-picker-modal';

type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
};

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

interface SignUpScreenProps {
  navigation: SignUpScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { signUp, isLoaded, setActive } = useSignUp();
  const { user } = useUser();
  const { startOAuthFlow: googleAuth } = useOAuth({ strategy: oAuthStrategies.google });
  const { startOAuthFlow: appleAuth } = useOAuth({ strategy: oAuthStrategies.apple });
  const { startOAuthFlow: facebookAuth } = useOAuth({ strategy: oAuthStrategies.facebook });
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [callingCode, setCallingCode] = useState('1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingPhoneVerification, setPendingPhoneVerification] = useState(false);
  const [code, setCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneWasIncludedInSignup, setPhoneWasIncludedInSignup] = useState(false);

  // Focus states for input highlighting
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // SIMPLE ANIMATION STATES ✨
  // Floating particles system
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;
  const particle5 = useRef(new Animated.Value(0)).current;
  const particle1Opacity = useRef(new Animated.Value(0.3)).current;
  const particle2Opacity = useRef(new Animated.Value(0.5)).current;
  const particle3Opacity = useRef(new Animated.Value(0.4)).current;
  const particle4Opacity = useRef(new Animated.Value(0.6)).current;
  const particle5Opacity = useRef(new Animated.Value(0.3)).current;
  
  // Button and social animations
  const buttonPulse = useRef(new Animated.Value(1)).current;
  const socialIconsFloat = useRef(new Animated.Value(0)).current;

  // ✨ SIMPLE ANIMATION SYSTEM INITIALIZATION ✨
  useEffect(() => {

    // Floating particles system - continuous motion
    const startParticleAnimations = () => {
      Animated.loop(
        Animated.parallel([
          // Particle 1 - Circular motion
          Animated.sequence([
            Animated.timing(particle1, {
              toValue: 1,
              duration: 4000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle1, {
              toValue: 0,
              duration: 4000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          // Particle 2 - Figure-8 motion
          Animated.sequence([
            Animated.timing(particle2, {
              toValue: 1,
              duration: 6000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(particle2, {
              toValue: 0,
              duration: 6000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          // Particle 3 - Vertical float
          Animated.sequence([
            Animated.timing(particle3, {
              toValue: 1,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle3, {
              toValue: 0,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          // Particle 4 - Diagonal drift
          Animated.sequence([
            Animated.timing(particle4, {
              toValue: 1,
              duration: 5000,
              easing: Easing.inOut(Easing.circle),
              useNativeDriver: true,
            }),
            Animated.timing(particle4, {
              toValue: 0,
              duration: 5000,
              easing: Easing.inOut(Easing.circle),
              useNativeDriver: true,
            }),
          ]),
          // Particle 5 - Spiral motion
          Animated.sequence([
            Animated.timing(particle5, {
              toValue: 1,
              duration: 7000,
              easing: Easing.inOut(Easing.elastic(1)),
              useNativeDriver: true,
            }),
            Animated.timing(particle5, {
              toValue: 0,
              duration: 7000,
              easing: Easing.inOut(Easing.elastic(1)),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };



    // Button pulse animation
    const startButtonPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonPulse, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(buttonPulse, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Social icons floating animation
    const startSocialFloat = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(socialIconsFloat, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(socialIconsFloat, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Start animation systems
    setTimeout(() => {
      startParticleAnimations();
      startButtonPulse();
      startSocialFloat();
    }, 500);

    // Cleanup timeout on unmount
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    setFocusedField(null);
  };

  const handleFieldFocus = (fieldName: string) => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    setFocusedField(fieldName);
  };

  const handleFieldBlur = () => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    // Instant unfocus - no delay
    setFocusedField(null);
  };

  // Validation functions
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhoneNumber = (phone: string, countryCode: string) => {
    // Check if phone number has at least 10 digits (including country code)
    const phoneDigits = phone.replace(/\D/g, '');
    const countryCodeDigits = countryCode.replace(/\D/g, '');
    const totalDigits = phoneDigits.length + countryCodeDigits.length;
    
    console.log('📱 Phone validation:', {
      phone,
      countryCode,
      phoneDigits: phoneDigits.length,
      countryCodeDigits: countryCodeDigits.length,
      totalDigits,
      isValid: totalDigits >= 10 && totalDigits <= 15
    });
    
    return totalDigits >= 10 && totalDigits <= 15 && phoneDigits.length >= 7;
  };

  const validateForm = () => {
    // Step 1: Check if all fields are empty first
    const emptyFields = [];
    if (!firstName.trim()) emptyFields.push('First Name');
    if (!lastName.trim()) emptyFields.push('Last Name');
    if (!emailAddress.trim()) emptyFields.push('Email Address');
    if (!password.trim()) emptyFields.push('Password');
    if (!phoneNumber.trim()) emptyFields.push('Phone Number');
    
    if (emptyFields.length === 5) {
      Alert.alert('All Fields Required', 'Please fill in all the required fields to create your account.');
      return false;
    }
    
    if (emptyFields.length > 1) {
      Alert.alert('Multiple Fields Missing', `Please fill in the following fields:\n• ${emptyFields.join('\n• ')}`);
      return false;
    }
    
    if (emptyFields.length === 1) {
      Alert.alert('Required Field Missing', `Please enter your ${emptyFields[0].toLowerCase()}.`);
      return false;
    }
    
    // Step 2: Check field formats
    if (!isValidEmail(emailAddress)) {
      Alert.alert('Invalid Format', 'Please enter a valid email address (e.g., user@example.com).');
      return false;
    }
    
    if (password.length < 8) {
      Alert.alert('Invalid Format', 'Password must be at least 8 characters long.');
      return false;
    }
    
    // Additional password strength check
    if (password.length > 0 && password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long for security.');
      return false;
    }
    
    if (!isValidPhoneNumber(phoneNumber, callingCode)) {
      const totalDigits = phoneNumber.replace(/\D/g, '').length + callingCode.replace(/\D/g, '').length;
      Alert.alert('Invalid Format', `Please enter a valid phone number. Current: ${totalDigits} digits (need 10-15 total with country code).`);
      return false;
    }
    
    // Step 3: Final validation summary
    console.log('📊 Validation Summary:', {
      firstName: firstName.trim() ? '✅' : '❌',
      lastName: lastName.trim() ? '✅' : '❌',
      emailAddress: isValidEmail(emailAddress) ? '✅' : '❌',
      password: password.length >= 8 ? '✅' : '❌',
      phoneNumber: isValidPhoneNumber(phoneNumber, callingCode) ? '✅' : '❌'
    });
    
    // All validations passed
    console.log('✅ All form validations passed');
    return true;
  };

  const onGoogleSignUp = async () => {
    try {
      console.log('🔍 Starting Google OAuth...');
      const { createdSessionId, setActive: oauthSetActive, signUp: oauthSignUp, signIn: oauthSignIn } = await googleAuth();
      
      console.log('📄 Google OAuth result:', {
        createdSessionId,
        hasSetActive: !!oauthSetActive,
        hasSignUp: !!oauthSignUp,
        hasSignIn: !!oauthSignIn
      });

      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        console.log('✅ Google sign up successful - session activated');
        
        // Unified sync immediately after Google OAuth success
        console.log('🔄 Starting unified sync for Google user...');
        setTimeout(async () => {
          if (user) {
            const { unifiedUserSync } = await import('../backend/unifiedSync');
            const syncResult = await unifiedUserSync(user);
            if (syncResult.success) {
              console.log('✅ Google user synced successfully!');
            } else {
              console.error('❌ Google user sync failed:', syncResult.error);
            }
          }
        }, 1000);
      } else if (oauthSignUp) {
        console.log('🔍 Google OAuth created sign up, checking status...');
        console.log('📊 SignUp status:', oauthSignUp.status);
        
        if (oauthSignUp.status === 'missing_requirements') {
          console.log('⚠️ Missing requirements for Google OAuth, attempting to complete...');
          
          // Try to complete the sign up with minimal required info
          try {
            const completeSignUp = await oauthSignUp.update({
              phoneNumber: '+12345678901', // Valid E.164 dummy phone number for OAuth users
            });
            
            if (completeSignUp.status === 'complete' && completeSignUp.createdSessionId && setActive) {
              await setActive({ session: completeSignUp.createdSessionId });
              console.log('✅ Google OAuth completed with dummy phone');
            }
          } catch (updateErr: any) {
            console.log('❌ Failed to complete OAuth signup:', updateErr);
            Alert.alert(
              'Additional Information Required',
              'Please complete the sign up form with the required information.',
              [{ text: 'OK' }]
            );
          }
        }
      } else if (oauthSignIn) {
        console.log('🔍 Google OAuth created sign in, checking status...');
        console.log('📊 SignIn status:', oauthSignIn.status);
      } else {
        console.log('❌ No session, signUp, or signIn returned from Google OAuth');
        Alert.alert('Error', 'Google sign up failed. Please try the manual sign up form.');
      }
    } catch (err: any) {
      console.log('❌ Google sign up error:', err);
      console.log('❌ Error details:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Google sign up failed. Please try again.';
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const onAppleSignUp = async () => {
    try {
      console.log('🔍 Starting Apple OAuth...');
      const { createdSessionId, setActive: oauthSetActive, signUp: oauthSignUp, signIn: oauthSignIn } = await appleAuth();
      
      console.log('📄 Apple OAuth result:', {
        createdSessionId,
        hasSetActive: !!oauthSetActive,
        hasSignUp: !!oauthSignUp,
        hasSignIn: !!oauthSignIn
      });

      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        console.log('✅ Apple sign up successful - session activated');
        
        // Unified sync for social login
        setTimeout(async () => {
          try {
            if (user) {
              console.log('🚀 Starting unified sync for Apple user');
              const { unifiedUserSync } = await import('../backend/unifiedSync');
              const syncResult = await unifiedUserSync(user);
              if (syncResult.success) {
                console.log('✅ Apple user synced successfully!');
              } else {
                console.error('❌ Apple user sync failed:', syncResult.error);
              }
            }
          } catch (error) {
            console.error('❌ Error during Apple user unified sync:', error);
          }
        }, 1500);
      } else if (oauthSignUp) {
        console.log('🔍 Apple OAuth created sign up, checking status...');
        console.log('📊 SignUp status:', oauthSignUp.status);
        
        if (oauthSignUp.status === 'missing_requirements') {
          console.log('⚠️ Missing requirements for Apple OAuth, attempting to complete...');
          
          // Try to complete the sign up with minimal required info
          try {
            const completeSignUp = await oauthSignUp.update({
              phoneNumber: '+12345678901', // Valid E.164 dummy phone number for OAuth users
            });
            
            if (completeSignUp.status === 'complete' && completeSignUp.createdSessionId && setActive) {
              await setActive({ session: completeSignUp.createdSessionId });
              console.log('✅ Apple OAuth completed with dummy phone');
            }
          } catch (updateErr: any) {
            console.log('❌ Failed to complete OAuth signup:', updateErr);
            Alert.alert(
              'Additional Information Required',
              'Please complete the sign up form with the required information.',
              [{ text: 'OK' }]
            );
          }
        }
      } else if (oauthSignIn) {
        console.log('🔍 Apple OAuth created sign in, checking status...');
        console.log('📊 SignIn status:', oauthSignIn.status);
      } else {
        console.log('❌ No session, signUp, or signIn returned from Apple OAuth');
        Alert.alert('Error', 'Apple sign up failed. Please try the manual sign up form.');
      }
    } catch (err: any) {
      console.log('❌ Apple sign up error:', err);
      console.log('❌ Error details:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Apple sign up failed. Please try again.';
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const onFacebookSignUp = async () => {
    try {
      console.log('🔍 Starting Facebook OAuth...');
      const { createdSessionId, setActive: oauthSetActive, signUp: oauthSignUp, signIn: oauthSignIn } = await facebookAuth();
      
      console.log('📄 Facebook OAuth result:', {
        createdSessionId,
        hasSetActive: !!oauthSetActive,
        hasSignUp: !!oauthSignUp,
        hasSignIn: !!oauthSignIn
      });

      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        console.log('✅ Facebook sign up successful - session activated');
        
        // Unified sync for social login
        setTimeout(async () => {
          try {
            if (user) {
              console.log('🚀 Starting unified sync for Facebook user');
              const { unifiedUserSync } = await import('../backend/unifiedSync');
              const syncResult = await unifiedUserSync(user);
              if (syncResult.success) {
                console.log('✅ Facebook user synced successfully!');
              } else {
                console.error('❌ Facebook user sync failed:', syncResult.error);
              }
            }
          } catch (error) {
            console.error('❌ Error during Facebook user unified sync:', error);
          }
        }, 1500);
      } else if (oauthSignUp) {
        console.log('🔍 Facebook OAuth created sign up, checking status...');
        console.log('📊 SignUp status:', oauthSignUp.status);
        
        if (oauthSignUp.status === 'missing_requirements') {
          console.log('⚠️ Missing requirements for Facebook OAuth, attempting to complete...');
          
          // Try to complete the sign up with minimal required info
          try {
            const completeSignUp = await oauthSignUp.update({
              phoneNumber: '+12345678901', // Valid E.164 dummy phone number for OAuth users
            });
            
            if (completeSignUp.status === 'complete' && completeSignUp.createdSessionId && setActive) {
              await setActive({ session: completeSignUp.createdSessionId });
              console.log('✅ Facebook OAuth completed with dummy phone');
            }
          } catch (updateErr: any) {
            console.log('❌ Failed to complete OAuth signup:', updateErr);
            Alert.alert(
              'Additional Information Required',
              'Please complete the sign up form with the required information.',
              [{ text: 'OK' }]
            );
          }
        }
      } else if (oauthSignIn) {
        console.log('🔍 Facebook OAuth created sign in, checking status...');
        console.log('📊 SignIn status:', oauthSignIn.status);
      } else {
        console.log('❌ No session, signUp, or signIn returned from Facebook OAuth');
        Alert.alert('Error', 'Facebook sign up failed. Please try the manual sign up form.');
      }
    } catch (err: any) {
      console.log('❌ Facebook sign up error:', err);
      console.log('❌ Error details:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Facebook sign up failed. Please try again.';
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const onSignUpPress = async () => {
    if (!isLoaded || !signUp) return;

    console.log('🔍 Create Account button pressed');
    console.log('📝 Starting form validation...');
    
    // Step 1: Validate form (empty fields + format validation)
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed, proceeding with signup...');
    setLoading(true);
    try {
      console.log('🔍 Starting sign up process...');
      console.log('📧 Email:', emailAddress);
      console.log('📱 Phone:', `+${callingCode}${phoneNumber}`);
      
      // First, try to create account with phone number
      try {
        console.log('📝 Attempting signup with phone number...');
        await signUp.create({
          emailAddress,
          password,
          firstName,
          lastName,
          phoneNumber: `+${callingCode}${phoneNumber}`,
        });
        console.log('✅ Signup with phone number successful');
        setPhoneWasIncludedInSignup(true);
      } catch (phoneErr: any) {
        // If phone number is not supported, try without it
        if (phoneErr.errors?.[0]?.longMessage?.includes('phone_number is not a valid parameter')) {
          console.log('⚠️ Phone number not supported in Clerk config, trying without phone...');
          await signUp.create({
            emailAddress,
            password,
            firstName,
            lastName,
          });
          console.log('✅ Signup without phone number successful');
          setPhoneWasIncludedInSignup(false);
        } else {
          throw phoneErr; // Re-throw if it's a different error
        }
      }

      console.log('📧 Preparing email verification...');
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      console.log('✅ Email verification prepared successfully');
    } catch (err: any) {
      console.log('❌ Sign up error:', err);
      console.log('❌ Full error details:', JSON.stringify(err, null, 2));
      let errorMessage = 'Sign up failed. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        console.log('❌ Primary error:', error);
        
        if (error.code === 'form_identifier_exists') {
          // Better detection: check error message content and context
          const errorMsg = error.message || error.longMessage || '';
          const isPhoneConflict = errorMsg.toLowerCase().includes('phone') || 
                                 error.meta?.paramName === 'phone_number' ||
                                 errorMsg.includes(phoneNumber) ||
                                 errorMsg.includes(`+${callingCode}${phoneNumber}`);
          const isEmailConflict = errorMsg.toLowerCase().includes('email') || 
                                 error.meta?.paramName === 'email_address' ||
                                 errorMsg.includes(emailAddress);
          
          console.log('🔍 Conflict detection:', {
            errorMsg,
            paramName: error.meta?.paramName,
            isPhoneConflict,
            isEmailConflict,
            phoneNumber: `+${callingCode}${phoneNumber}`,
            emailAddress
          });
          
          if (isPhoneConflict) {
            errorMessage = 'An account with this phone number already exists. Please try signing in instead.';
          } else if (isEmailConflict) {
            errorMessage = 'An account with this email address already exists. Please try signing in instead.';
          } else {
            // If we can't determine which one, try to be helpful
            errorMessage = 'An account with this email or phone number already exists. Please try signing in instead.';
          }
        } else if (error.code === 'form_phone_number_exists') {
          errorMessage = 'An account with this phone number already exists. Please try signing in instead.';
        } else if (error.code === 'form_identifier_invalid') {
          if (error.meta?.paramName === 'email_address') {
            errorMessage = 'Please enter a valid email address.';
          } else if (error.meta?.paramName === 'phone_number') {
            errorMessage = 'Please enter a valid phone number with country code.';
          } else {
            errorMessage = 'Please enter a valid email address.';
          }
        } else if (error.code === 'form_phone_number_invalid') {
          errorMessage = 'Please enter a valid phone number with country code (e.g., +1234567890).';
        } else if (error.code === 'form_password_pwned') {
          errorMessage = 'This password has been found in a data breach. Please choose a different password.';
        } else if (error.code === 'form_password_length_too_short') {
          errorMessage = 'Password must be at least 8 characters long.';
        } else if (error.code === 'form_password_size_in_bytes_exceeded') {
          errorMessage = 'Password is too long. Please choose a shorter password.';
        } else if (error.code === 'form_param_format_invalid') {
          if (error.meta?.paramName === 'phone_number') {
            errorMessage = 'Phone number format is invalid. Please include country code (e.g., +1234567890).';
          } else if (error.meta?.paramName === 'email_address') {
            errorMessage = 'Email address format is invalid. Please enter a valid email.';
          } else {
            errorMessage = 'Invalid format. Please check your information and try again.';
          }
        } else if (error.longMessage?.includes('phone_number is not a valid parameter')) {
          errorMessage = 'Phone number signup is not enabled. Please contact support or try signing up with email only.';
        } else {
          errorMessage = error.message || error.longMessage || errorMessage;
        }
        
        // Additional check for multiple errors
        if (err.errors.length > 1) {
          console.log('❌ Additional errors:', err.errors.slice(1));
          // If there are multiple errors, we might want to show the most relevant one
          const phoneError = err.errors.find((e: any) => 
            e.code === 'form_phone_number_exists' || 
            e.meta?.paramName === 'phone_number' ||
            (e.message || e.longMessage || '').toLowerCase().includes('phone')
          );
          const emailError = err.errors.find((e: any) => 
            e.code === 'form_identifier_exists' || 
            e.meta?.paramName === 'email_address' ||
            (e.message || e.longMessage || '').toLowerCase().includes('email')
          );
          
          if (phoneError && emailError) {
            errorMessage = 'Both email and phone number are already in use. Please try signing in instead.';
          } else if (phoneError) {
            errorMessage = 'An account with this phone number already exists. Please try signing in instead.';
          } else if (emailError) {
            errorMessage = 'An account with this email address already exists. Please try signing in instead.';
          }
        }
        
        // If we still have a generic message and it's a form_identifier_exists error, 
        // add more context to help the user
        if (errorMessage.includes('email or phone number') && error.code === 'form_identifier_exists') {
          errorMessage += `\n\nEmail: ${emailAddress}\nPhone: +${callingCode}${phoneNumber}`;
        }
      }
      
      Alert.alert('Sign Up Failed', errorMessage, [
        {
          text: 'Try Again',
          style: 'default'
        },
        {
          text: 'Sign In Instead',
          style: 'default',
          onPress: () => navigation.navigate('SignIn')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || !signUp) return;

    setLoading(true);
    try {
      console.log('🔍 Starting email verification with code:', code);
      
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      console.log('📄 Email verification result:', {
        status: completeSignUp.status,
        createdSessionId: completeSignUp.createdSessionId,
        createdUserId: completeSignUp.createdUserId,
        hasPhoneNumber: phoneNumber && phoneNumber.length > 0
      });

      if (completeSignUp.status === 'complete') {
        console.log('✅ Email verification complete');
        
        // Complete signup and set active session first
        console.log('✅ Setting active session...');
        if (setActive && completeSignUp.createdSessionId) {
          await setActive({ session: completeSignUp.createdSessionId });
          console.log('✅ Session activated successfully');
          
          // Check if we need to add and verify phone number
          if (!phoneWasIncludedInSignup && phoneNumber && phoneNumber.length > 0) {
            console.log('📱 Phone number was not included in initial signup');
            
            // Since Clerk doesn't support phone numbers in this configuration,
            // we'll store the phone number in our database during sync
            console.log('📱 Phone number will be stored during database sync');
          }
          
          // Sync user data
          console.log('🔄 Triggering immediate user sync...');
          
          // Import the sync functions
          const { unifiedUserSync } = await import('../backend/unifiedSync');
          
          // Log phone number that should be stored
          if (!phoneWasIncludedInSignup && phoneNumber && phoneNumber.length > 0) {
            console.log('📱 Phone number for database sync:', `+${callingCode}${phoneNumber}`);
          }
          
          // Use unified sync for consistent behavior
          try {
            if (user) {
              console.log('🚀 Starting unified sync...');
              
              const syncResult = await unifiedUserSync(user);
              console.log('📊 Unified sync result:', syncResult);
              
              if (!syncResult.success) {
                console.error('❌ Unified sync failed:', syncResult.error);
                  // Don't alert the user, just log the error
              }
            } else {
              console.log('⚠️ User object not available yet, sync will be retried');
              // Set a retry after a short delay
              setTimeout(async () => {
                if (user) {
                  console.log('🔄 Retrying sync with user object...');
                  const retryResult = await unifiedUserSync(user);
                  console.log('📊 Sync retry result:', retryResult);
                }
              }, 2000);
            }
          } catch (syncError) {
            console.error('❌ Error during user sync:', syncError);
            // Don't alert the user, just log the error
          }
        }
      } else if (completeSignUp.status === 'missing_requirements') {
        console.log('⚠️ Missing requirements after email verification');
        
        // Check if phone number was provided and needs verification
        if (phoneNumber && phoneNumber.length > 0) {
          console.log('📱 Phone number provided, preparing phone verification...');
          try {
            await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
            setPendingVerification(false);
            setPendingPhoneVerification(true);
            setPhoneCode('');
            Alert.alert(
              'Phone Verification Required', 
              `We've sent a verification code to +${callingCode}${phoneNumber}. Please enter it below.`
            );
          } catch (phoneErr: any) {
            console.log('❌ Phone verification preparation failed:', phoneErr);
            Alert.alert('Error', 'Could not prepare phone verification. Please try again.');
          }
        } else {
          console.log('⚠️ No phone number provided, but missing requirements detected');
          Alert.alert('Verification Incomplete', 'Additional verification required. Please contact support.');
        }
      } else {
        console.log('❌ Email verification status:', completeSignUp.status);
        
        // Check if we should automatically proceed to phone verification
        if (phoneNumber && phoneNumber.length > 0) {
          console.log('📱 Email verified but phone verification may be needed');
          try {
            await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
            setPendingVerification(false);
            setPendingPhoneVerification(true);
            setPhoneCode('');
            Alert.alert(
              'Phone Verification Required', 
              `We've sent a verification code to +${callingCode}${phoneNumber}. Please enter it below.`
            );
          } catch (phoneErr: any) {
            console.log('❌ Phone verification preparation failed:', phoneErr);
            Alert.alert('Verification Incomplete', `Email verified but additional steps required. Status: ${completeSignUp.status}`);
          }
        } else {
          Alert.alert('Verification Incomplete', `Status: ${completeSignUp.status}. Please try again or contact support.`);
        }
      }
    } catch (err: any) {
      console.log('❌ Email verification error:', err);
      let errorMessage = 'Email verification failed. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        console.log('❌ Clerk error details:', error);
        
        if (error.code === 'verification_already_verified') {
          errorMessage = 'This email is already verified. Please try signing in instead.';
        } else if (error.code === 'verification_failed') {
          errorMessage = 'Invalid verification code. Please check and try again.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerifyPhone = async () => {
    if (!isLoaded || !signUp) return;

    setLoading(true);
    try {
      console.log('🔍 Starting phone verification with code:', phoneCode);
      
      const completeSignUp = await signUp.attemptPhoneNumberVerification({
        code: phoneCode,
      });

      console.log('📄 Phone verification result:', {
        status: completeSignUp.status,
        createdSessionId: completeSignUp.createdSessionId,
        createdUserId: completeSignUp.createdUserId
      });

      if (completeSignUp.status === 'complete') {
        console.log('✅ Phone verification complete, setting active session...');
        
        if (setActive && completeSignUp.createdSessionId) {
          await setActive({ session: completeSignUp.createdSessionId });
          console.log('✅ Session activated successfully');
          
          // Immediate sync after successful phone verification
          console.log('🔄 Triggering immediate user sync after phone verification...');
          
          // Wait a moment for Clerk to fully update, then sync
          setTimeout(async () => {
            try {
              if (user) {
                console.log('🚀 Starting simple sync after phone verification');
                const syncResult = await syncUserAfterAuth(user);
                if (syncResult.success) {
                  console.log('✅ Phone verification sync completed!');
                } else {
                  console.error('❌ Phone verification sync failed:', syncResult.error);
                }
              } else {
                console.log('⚠️ User object not available yet after phone verification, sync will happen via App.tsx useEffect');
              }
            } catch (error) {
              console.error('❌ Error during phone verification immediate sync:', error);
            }
          }, 1500); // Give Clerk time to fully update the user object
          
          // Additional verification that session is active
          console.log('🔍 Verifying session activation...');
          setTimeout(() => {
            console.log('📊 Post-activation auth state check');
          }, 500);
        } else {
          console.log('❌ Missing setActive function or session ID');
          Alert.alert('Error', 'Sign up completed but session could not be activated. Please try signing in.');
        }
      } else {
        console.log('❌ Phone verification status:', completeSignUp.status);
        Alert.alert('Verification Incomplete', `Status: ${completeSignUp.status}. Please try again or contact support.`);
      }
    } catch (err: any) {
      console.log('❌ Phone verification error:', err);
      let errorMessage = 'Phone verification failed. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        console.log('❌ Clerk error details:', error);
        
        if (error.code === 'verification_failed') {
          errorMessage = 'Invalid verification code. Please check and try again.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✨ ANIMATED VALUES FOR PARTICLE POSITIONING (same as SignInScreen)
  const particle1X = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.1, width * 0.8],
  });
  const particle1Y = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.2, height * 0.6],
  });

  const particle2X = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.7, width * 0.2],
  });
  const particle2Y = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.15, height * 0.7],
  });

  const particle3X = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.3, width * 0.6],
  });
  const particle3Y = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.3, height * 0.1],
  });

  const particle4X = particle4.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.8, width * 0.1],
  });
  const particle4Y = particle4.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.5, height * 0.2],
  });

  const particle5X = particle5.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.5, width * 0.9],
  });
  const particle5Y = particle5.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.6, height * 0.3],
  });

  const socialFloatY = socialIconsFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>

        {/* ✨ FLOATING PARTICLE SYSTEM */}
        <Animated.View
          style={[
            styles.particle,
            styles.particle1,
            {
              opacity: particle1Opacity,
              transform: [
                { translateX: particle1X },
                { translateY: particle1Y },
                {
                  scale: particle1.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 0.8],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle2,
            {
              opacity: particle2Opacity,
              transform: [
                { translateX: particle2X },
                { translateY: particle2Y },
                {
                  rotate: particle2.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle3,
            {
              opacity: particle3Opacity,
              transform: [
                { translateX: particle3X },
                { translateY: particle3Y },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle4,
            {
              opacity: particle4Opacity,
              transform: [
                { translateX: particle4X },
                { translateY: particle4Y },
                {
                  scale: particle4.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle5,
            {
              opacity: particle5Opacity,
              transform: [
                { translateX: particle5X },
                { translateY: particle5Y },
                {
                  rotate: particle5.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '720deg'],
                  }),
                },
              ],
            },
          ]}
        />

        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* 🎯 SIMPLE LOGO SECTION */}
          <View style={styles.topSection}>
            <Image
              source={require('../assets/images/ss logo black.png')}
              style={styles.ssLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>
              STYLE SYNC
            </Text>
          </View>
      
      <View style={styles.signUpContainer}>
        <View style={styles.formSection}>
          <Text style={styles.welcomeText}>Welcome to Style Sync</Text>
          <Text style={styles.subtitleText}>
            {pendingPhoneVerification 
              ? 'Check your phone for verification code' 
              : pendingVerification 
                ? 'Check your email for verification code' 
                : 'Create your account to get started'
            }
          </Text>
        
        {!pendingVerification && !pendingPhoneVerification ? (
          <>
            <View style={styles.nameRowContainer}>
              <View style={styles.nameInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'firstName' && styles.inputFocused
                  ]}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  onFocus={() => handleFieldFocus('firstName')}
                  onBlur={handleFieldBlur}
                />
              </View>
              
              <View style={styles.nameInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'lastName' && styles.inputFocused
                  ]}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  onFocus={() => handleFieldFocus('lastName')}
                  onBlur={handleFieldBlur}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={[
                  styles.phoneInputContainer,
                  focusedField === 'phoneNumber' && styles.phoneInputFocused
                ]}
                onPress={() => handleFieldFocus('phoneNumber')}
                activeOpacity={1}
              >
                <TouchableOpacity 
                  style={styles.countryPickerButton}
                  onPress={() => {
                    setShowCountryPicker(true);
                    handleFieldFocus('phoneNumber');
                  }}
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
                    onClose={() => {
                      setShowCountryPicker(false);
                      handleFieldFocus('phoneNumber');
                    }}
                  />
                  <Text style={styles.callingCodeText}>+{callingCode}</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  onFocus={() => handleFieldFocus('phoneNumber')}
                  onBlur={handleFieldBlur}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'emailAddress' && styles.inputFocused
                ]}
                placeholder="Email Address"
                value={emailAddress}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => handleFieldFocus('emailAddress')}
                onBlur={handleFieldBlur}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'password' && styles.inputFocused
                ]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => handleFieldFocus('password')}
                onBlur={handleFieldBlur}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Image
                  source={showPassword 
                    ? require('../assets/images/password hide.png')
                    : require('../assets/images/password view.png')
                  }
                  style={styles.passwordToggleIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            
            <Animated.View
              style={{
                transform: [{ scale: buttonPulse }],
              }}
            >
              <TouchableOpacity 
                style={styles.signUpButton} 
                onPress={onSignUpPress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : pendingVerification ? (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'code' && styles.inputFocused
                ]}
                placeholder="Email Verification Code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                onFocus={() => handleFieldFocus('code')}
                onBlur={handleFieldBlur}
                autoFocus={true}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.signUpButton} 
              onPress={onPressVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText}>Verify Email</Text>
              )}
            </TouchableOpacity>
          </>
        ) : pendingPhoneVerification ? (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'phoneCode' && styles.inputFocused
                ]}
                placeholder="Phone Verification Code"
                value={phoneCode}
                onChangeText={setPhoneCode}
                keyboardType="number-pad"
                onFocus={() => handleFieldFocus('phoneCode')}
                onBlur={handleFieldBlur}
                autoFocus={true}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.signUpButton} 
              onPress={onPressVerifyPhone}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText}>Verify Phone</Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}
        </View>
        
        {/* OR Divider */}
        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* Social Auth Buttons */}
        <Animated.View
          style={[
            styles.socialAuthContainer,
            {
              transform: [{ translateY: socialFloatY }],
            },
          ]}
        >
          <TouchableOpacity style={styles.socialIconButton} onPress={onGoogleSignUp}>
            <Image 
              source={require('../assets/images/google logo.png')} 
              style={styles.socialIconOnly} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialIconButton} onPress={onAppleSignUp}>
            <Image 
              source={require('../assets/images/apple logo.png')} 
              style={styles.socialIconOnly} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialIconButton} onPress={onFacebookSignUp}>
            <Image 
              source={require('../assets/images/facebook logo.png')} 
              style={styles.socialIconOnly} 
            />
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  // ✨ FLOATING PARTICLE SYSTEM
  particle: {
    position: 'absolute',
    borderRadius: 15,
    zIndex: 1,
  },
  particle1: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 182, 193, 0.6)',
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  particle2: {
    width: 25,
    height: 25,
    backgroundColor: 'rgba(173, 216, 230, 0.7)',
    shadowColor: '#ADD8E6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
  },
  particle3: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255, 255, 224, 0.8)',
    shadowColor: '#FFFFE0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 7,
  },
  particle4: {
    width: 35,
    height: 35,
    backgroundColor: 'rgba(221, 160, 221, 0.5)',
    shadowColor: '#DDA0DD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
  },
  particle5: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(152, 251, 152, 0.6)',
    shadowColor: '#98FB98',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 11,
    elevation: 5,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: height * 0.025,
  },
  topSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: height * 0.02,
    zIndex: 1,
  },
  ssLogo: {
    width: isSmallDevice ? 100 : isMediumDevice ? 120 : 140,
    height: isSmallDevice ? 100 : isMediumDevice ? 120 : 140,
    marginBottom: height * 0.015,
  },
  brandText: {
    fontSize: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#222',
    marginBottom: height * 0.015,
  },
  signUpContainer: {
    flex: 1,
    paddingHorizontal: width * 0.06,
    paddingTop: 0,
    paddingBottom: height * 0.01,
    justifyContent: 'space-between',
  },
  formSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: height * 0.006,
  },
  subtitleText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  inputContainer: {
    marginBottom: height * 0.012,
    position: 'relative',
  },
  nameRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.012,
    gap: width * 0.03,
  },
  nameInputContainer: {
    flex: 1,
  },
  input: {
    height: isSmallDevice ? 44 : isMediumDevice ? 46 : 48,
    borderColor: '#e0e0e0',
    borderWidth: 0.0,
    borderRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    paddingHorizontal: width * 0.04,
    paddingRight: width * 0.12, // Extra space for password toggle
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    backgroundColor: '#f8f9fa',
  },
  passwordToggle: {
    position: 'absolute',
    right: width * 0.03,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  passwordToggleIcon: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: isSmallDevice ? 44 : isMediumDevice ? 46 : 48,
    borderColor: '#e0e0e0',
    borderWidth: 0.0,
    borderRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    backgroundColor: '#f8f9fa',
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    minWidth: width * 0.18,
  },
  callingCodeText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#333',
    marginLeft: width * 0.01,
  },
  phoneInput: {
    flex: 1,
    height: isSmallDevice ? 44 : isMediumDevice ? 46 : 48,
    paddingHorizontal: width * 0.03,
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    backgroundColor: 'transparent',
  },
  phoneInputFocused: {
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    backgroundColor: '#fff',
    transform: [{ scale: 1.01 }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  inputFocused: {
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    backgroundColor: '#fff',
    transform: [{ scale: 1.01 }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  signUpButton: {
    backgroundColor: '#000',
    paddingVertical: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    paddingHorizontal: width * 0.08,
    borderRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    alignItems: 'center',
    marginTop: height * 0.015,
    marginBottom: height * 0.015,
  },
  signUpButtonText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    fontWeight: '600',
    color: '#fff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.015,
    paddingBottom: height * 0.015,
  },
  loginText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#666',
  },
  loginLink: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
    color: '#000',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: height * 0.015,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    marginHorizontal: width * 0.04,
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#666',
    fontWeight: '500',
  },
  socialAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.1,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  socialIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    width: isSmallDevice ? 44 : isMediumDevice ? 47 : 50,
    height: isSmallDevice ? 44 : isMediumDevice ? 47 : 50,
    // Glowing effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  socialIcon: {
    width: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    height: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    marginRight: width * 0.03,
  },
  socialIconOnly: {
    width: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
    height: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default SignUpScreen;
