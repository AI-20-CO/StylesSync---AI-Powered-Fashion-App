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
import { useSignIn, handlePasswordReset, handleSendPasswordResetEmail } from '../backend';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { signIn, isLoaded, setActive } = useSignIn();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [successfulCreation, setSuccessfulCreation] = useState(false);
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
  
  // Button animation
  const buttonPulse = useRef(new Animated.Value(1)).current;

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

    // Start animation systems
    setTimeout(() => {
      startParticleAnimations();
      startButtonPulse();
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

  const onSendResetEmailPress = async () => {
    if (!isLoaded || !signIn) return;

    setLoading(true);
    try {
      const result = await handleSendPasswordResetEmail(signIn, emailAddress);
      
      if (result.success) {
        setSuccessfulCreation(true);
        Alert.alert('Reset Email Sent', 'Please check your email for a password reset code.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      console.log('❌ Unexpected error:', err);
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPressReset = async () => {
    if (!isLoaded || !signIn) return;

    setLoading(true);
    try {
      const result = await handlePasswordReset(signIn, setActive, { code, password });
      
      if (result.success) {
        if (result.sessionActivated) {
          Alert.alert(
            'Password Reset Successful', 
            'Your password has been updated and you are now signed in!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigation will be handled automatically by the auth state change
                  console.log('✅ Password reset complete, navigation handled by auth state');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Password Reset Successful', 
            'Your password has been updated successfully. You can now sign in with your new password.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('SignIn')
              }
            ]
          );
        }
      } else {
        Alert.alert('Error', result.error || 'Password reset failed. Please try again.');
      }
    } catch (err: any) {
      console.log('❌ Unexpected password reset error:', err);
      Alert.alert('Error', 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
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
      
      <View style={styles.forgotPasswordContainer}>
        <View style={styles.formSection}>
          <Text style={styles.welcomeText}>Reset Password</Text>
          <Text style={styles.subtitleText}>
            {!successfulCreation 
              ? 'Enter your email address to receive a reset code' 
              : 'Enter the code sent to your email and your new password'
            }
          </Text>
          
          {!successfulCreation ? (
            <>
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
              
              <Animated.View
                style={{
                  transform: [{ scale: buttonPulse }],
                }}
              >
                <TouchableOpacity 
                  style={styles.resetButton} 
                  onPress={onSendResetEmailPress}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.resetButtonText}>Send Reset Code</Text>
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
                  placeholder="Reset Code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  onFocus={() => handleFieldFocus('code')}
                  onBlur={handleFieldBlur}
                  autoFocus={true}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'password' && styles.inputFocused
                  ]}
                  placeholder="New Password"
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
                  style={styles.resetButton} 
                  onPress={onPressReset}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.resetButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>

        <View style={styles.backToSignInContainer}>
          <Text style={styles.backToSignInText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.backToSignInLink}>Sign In</Text>
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
  forgotPasswordContainer: {
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
  resetButton: {
    backgroundColor: '#000',
    paddingVertical: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    paddingHorizontal: width * 0.08,
    borderRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    alignItems: 'center',
    marginTop: height * 0.015,
    marginBottom: height * 0.015,
  },
  resetButtonText: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#fff',
  },
  backToSignInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.015,
    paddingBottom: height * 0.015,
  },
  backToSignInText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#666',
  },
  backToSignInLink: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
    color: '#000',
  },
});

export default ForgotPasswordScreen;
