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
  Easing,
  Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;
import { useSignIn, useOAuth, oAuthStrategies, handleSignIn, handleOAuth, authUtils } from '../backend';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
};

type SignInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

interface SignInScreenProps {
  navigation: SignInScreenNavigationProp;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: oAuthStrategies.google });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: oAuthStrategies.apple });
  const { startOAuthFlow: facebookOAuth } = useOAuth({ strategy: oAuthStrategies.facebook });
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Focus states for input highlighting
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ANIMATION STATES ✨
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

  // ✨ ANIMATION SYSTEM INITIALIZATION ✨
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

  // Helper function to detect if identifier is a phone number


  const onSignInPress = async () => {
    if (!isLoaded || !signIn) return;

    setLoading(true);
    try {
      console.log('🔍 Starting sign in process...');
      console.log('📧 Identifier type:', authUtils.isPhoneNumber(identifier) ? 'Phone Number' : 'Email Address');
      
      const signInAttempt = await signIn.create({
        identifier,
        password,
      });

      console.log('📄 Sign in attempt result:', {
        status: signInAttempt.status,
        createdSessionId: signInAttempt.createdSessionId
      });

      if (signInAttempt.status === 'complete') {
        console.log('✅ Sign in complete, setting active session...');
        if (setActive && signInAttempt.createdSessionId) {
          await setActive({ session: signInAttempt.createdSessionId });
          console.log('✅ Session activated successfully');
        }
      } else if (signInAttempt.status === 'needs_first_factor') {
        console.log('🔍 Sign in needs verification, checking available factors...');
        
        // Find email or phone verification factor
        const emailFactor = signInAttempt.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );
        const phoneFactor = signInAttempt.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'phone_code'
        );
        
        if (emailFactor && emailFactor.emailAddressId) {
          // Prepare email verification
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
          
          setPendingVerification(true);
          console.log('📧 Email verification code sent');
          Alert.alert('Verification Required', 'Please check your email for a verification code.');
        } else if (phoneFactor && phoneFactor.phoneNumberId) {
          // Prepare phone verification
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneFactor.phoneNumberId,
          });
          
          setPendingVerification(true);
          console.log('📱 Phone verification code sent');
          Alert.alert('Verification Required', 'Please check your phone for a verification code.');
        } else {
          console.log('❌ No verification factor available');
          Alert.alert('Error', 'Verification not available. Please try again.');
        }
      } else {
        console.log('❌ Unexpected sign in status:', signInAttempt.status);
        Alert.alert('Error', 'Sign in failed. Please try again.');
      }
    } catch (err: any) {
      console.log('❌ Sign in error:', err);
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        console.log('❌ Clerk error details:', error);
        
        if (error.code === 'form_identifier_not_found') {
          if (authUtils.isPhoneNumber(identifier)) {
            errorMessage = 'No account found with this phone number. Please check the number or sign up.';
          } else {
            errorMessage = 'No account found with this email address. Please check the email or sign up.';
          }
        } else if (error.code === 'form_password_incorrect') {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'form_identifier_invalid') {
          if (authUtils.isPhoneNumber(identifier)) {
            errorMessage = 'Please enter a valid phone number with country code (e.g., +1234567890).';
          } else {
            errorMessage = 'Please enter a valid email address.';
          }
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || !signIn) return;

    setLoading(true);
    try {
      console.log('🔍 Starting verification with code:', code);
      
      // Try email verification first, then phone verification
      let completeSignIn;
      try {
        completeSignIn = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });
        console.log('📧 Email verification attempted');
      } catch (emailErr: any) {
        console.log('📧 Email verification failed, trying phone verification...');
        try {
          completeSignIn = await signIn.attemptFirstFactor({
            strategy: 'phone_code',
            code,
          });
          console.log('📱 Phone verification attempted');
        } catch (phoneErr: any) {
          throw emailErr; // Throw the original email error if both fail
        }
      }

      console.log('📄 Verification result:', {
        status: completeSignIn.status,
        createdSessionId: completeSignIn.createdSessionId
      });

      if (completeSignIn.status === 'complete') {
        console.log('✅ Verification complete, setting active session...');
        
        if (setActive && completeSignIn.createdSessionId) {
          await setActive({ session: completeSignIn.createdSessionId });
          console.log('✅ Session activated successfully');
        }
      } else {
        console.log('❌ Verification status:', completeSignIn.status);
        Alert.alert('Verification Incomplete', 'Please try again or contact support.');
      }
    } catch (err: any) {
      console.log('❌ Verification error:', err);
      let errorMessage = 'Verification failed. Please try again.';
      
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

  const onGoogleSignIn = async () => {
    try {
      const result = await handleOAuth.google(googleOAuth);
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Google sign in failed. Please try again.');
      }
    } catch (err: any) {
      console.log('❌ Google OAuth error:', err);
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    }
  };

  const onAppleSignIn = async () => {
    try {
      const result = await handleOAuth.apple(appleOAuth);
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Apple sign in failed. Please try again.');
      }
    } catch (err: any) {
      console.log('❌ Apple OAuth error:', err);
      Alert.alert('Error', 'Apple sign in failed. Please try again.');
    }
  };

  const onFacebookSignIn = async () => {
    try {
      const result = await handleOAuth.facebook(facebookOAuth);
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Facebook sign in failed. Please try again.');
      }
    } catch (err: any) {
      console.log('❌ Facebook OAuth error:', err);
      Alert.alert('Error', 'Facebook sign in failed. Please try again.');
    }
  };

  // ✨ ANIMATED VALUES FOR PARTICLE POSITIONING
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
    outputRange: [0, -3],
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
              transform: [
                { translateX: particle1X },
                { translateY: particle1Y },
              ],
              opacity: particle1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle2,
            {
              transform: [
                { translateX: particle2X },
                { translateY: particle2Y },
              ],
              opacity: particle2Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle3,
            {
              transform: [
                { translateX: particle3X },
                { translateY: particle3Y },
              ],
              opacity: particle3Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle4,
            {
              transform: [
                { translateX: particle4X },
                { translateY: particle4Y },
              ],
              opacity: particle4Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle5,
            {
              transform: [
                { translateX: particle5X },
                { translateY: particle5Y },
              ],
              opacity: particle5Opacity,
            },
          ]}
        />
        
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topSection}>
        <Image
          source={require('../assets/images/ss logo black.png')}
          style={styles.ssLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandText}>STYLE SYNC</Text>
      </View>
      
      <View style={styles.signInContainer}>
        <View style={styles.formSection}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>
            {pendingVerification 
              ? 'Check your email or phone for verification code' 
              : 'Sign in with your email or phone number'
            }
          </Text>
          
          {!pendingVerification ? (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'identifier' && styles.inputFocused
                  ]}
                  placeholder="Email or Phone"
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="default"
                  autoCapitalize="none"
                  onFocus={() => handleFieldFocus('identifier')}
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
                  style={styles.signInButton} 
                  onPress={onSignInPress}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'code' && styles.inputFocused
                  ]}
                  placeholder="Verification Code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  onFocus={() => handleFieldFocus('code')}
                  onBlur={handleFieldBlur}
                  autoFocus={true}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.signInButton} 
                onPress={onPressVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signInButtonText}>Verify Email</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity style={styles.forgotPasswordLink} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>
        </View>

        {/* OR Divider - Only show during normal sign in */}
        {!pendingVerification && (
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>
        )}

        {/* Bottom Section Container */}
        <View style={styles.bottomSectionContainer}>
          {/* Social Auth Buttons - Only show during normal sign in */}
          {!pendingVerification && (
            <Animated.View
              style={[
                styles.socialAuthContainer,
                {
                  transform: [{ translateY: socialFloatY }],
                },
              ]}
            >
              <TouchableOpacity style={styles.socialIconButton} onPress={onGoogleSignIn}>
                <Image
                  source={require('../assets/images/google logo.png')}
                  style={styles.socialIconOnly}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialIconButton} onPress={onAppleSignIn}>
                <Image
                  source={require('../assets/images/apple logo.png')}
                  style={styles.socialIconOnly}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialIconButton} onPress={onFacebookSignIn}>
                <Image
                  source={require('../assets/images/facebook logo.png')}
                  style={styles.socialIconOnly}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </Animated.View>
          )}
          
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
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
  signInContainer: {
    flex: 1,
    paddingHorizontal: width * 0.06,
    paddingTop: 0,
    paddingBottom: height * 0.05,
    justifyContent: 'space-between',
  },
  formSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: height * 0.01,
  },
  subtitleText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  inputContainer: {
    marginBottom: height * 0.012,
    position: 'relative',
  },
  input: {
    height: isSmallDevice ? 46 : isMediumDevice ? 48 : 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
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
  signInButton: {
    backgroundColor: '#000',
    paddingVertical: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    paddingHorizontal: width * 0.08,
    borderRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    alignItems: 'center',
    marginTop: height * 0.015,
    marginBottom: height * 0.015,
  },
  signInButtonText: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#fff',
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  forgotPasswordText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#666',
    textDecorationLine: 'underline',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.038,
    paddingBottom: height * 0.015,
  },
  signUpText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#666',
  },
  signUpLink: {
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
  bottomSectionContainer: {
    // Container for social auth and sign up link
  },
  socialAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.001,
    paddingHorizontal: width * 0.1,
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
  socialIconOnly: {
    width: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
    height: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
  },
});

export default SignInScreen; 