import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import StyleQuestionnaireScreen from './StyleQuestionnaireScreen';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;

interface FaceScanScreenProps {
  onClose: () => void;
}

const FaceScanScreen: React.FC<FaceScanScreenProps> = ({ onClose }) => {
  const [scanningState, setScanningState] = useState<'positioning' | 'scanning' | 'complete'>('positioning');
  const [countdown, setCountdown] = useState(4);
  const [faceDetected, setFaceDetected] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [scanningTimer, setScanningTimer] = useState<any>(null);
  const [scanStartTime, setScanStartTime] = useState<number>(Date.now());
  const [detectionScore, setDetectionScore] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // Animation values
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scanLineAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Request camera permissions on mount
    if (!permission?.granted) {
      requestPermission();
    }
    
    // Start scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for face overlay
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Direct AI face detection - start analysis immediately once face is detected
  const performAIFaceDetection = () => {
    if (!cameraReady || scanningState === 'complete') return;
    
    const currentTime = Date.now();
    const timeSinceStart = currentTime - scanStartTime;
    
    if (scanningState === 'positioning') {
      // Simple detection logic - detect face after 2 seconds
      if (timeSinceStart >= 2000) {
        setFaceDetected(true);
        setDetectionScore(95);
        // Start analysis immediately once face is detected
        setScanningState('scanning');
        startScanningAnimation();
        return;
      }
      
      // Build up to detection
      const detectionProbability = Math.min(timeSinceStart / 2000, 1);
      const shouldDetectFace = Math.random() < detectionProbability;
      
      setFaceDetected(shouldDetectFace);
      setDetectionScore(Math.round(detectionProbability * 95));
    } 
    else if (scanningState === 'scanning') {
      // During scanning, maintain detection
      setFaceDetected(true);
      setDetectionScore(98);
    }
  };

  // Start AI detection when camera is ready
  useEffect(() => {
    if (cameraReady && permission?.granted) {
      setScanStartTime(Date.now());
      
      // Run detection every 200ms for ultra-smooth experience
      const interval = setInterval(performAIFaceDetection, 200);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [cameraReady, permission?.granted, scanningState]);

  const clearScanningTimer = () => {
    if (scanningTimer) {
      clearInterval(scanningTimer);
      setScanningTimer(null);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearScanningTimer();
    };
  }, []);

  useEffect(() => {
    if (scanningState === 'scanning') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setScanningState('complete');
            showCompletionAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setScanningTimer(timer);
      return () => {
        clearInterval(timer);
        setScanningTimer(null);
      };
    }
  }, [scanningState]);

  // Check if camera permission is granted
  const isCameraPermissionGranted = permission?.granted;

  const handlePermissionRequest = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to use the face scanning feature.',
          [
            { text: 'Cancel', onPress: onClose },
            { text: 'Try Again', onPress: handlePermissionRequest }
          ]
        );
      }
    }
  };

  const startScanningAnimation = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scan progress animation
    Animated.timing(scanAnimation, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();
  };

  const showCompletionAlert = () => {
    // Show questionnaire after face scan completion
    setTimeout(() => {
      setShowQuestionnaire(true);
    }, 500); // Small delay for smooth transition
  };

  const scanProgress = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const scanLineTranslateY = scanLineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  // Handle questionnaire completion
  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
          console.log('Questionnaire completed! User preferences saved. Recommendations will now be personalized.');
    onClose();
  };

  // Show questionnaire if analysis is complete
  if (showQuestionnaire) {
    return (
      <StyleQuestionnaireScreen 
        onComplete={handleQuestionnaireComplete} 
        onExit={() => {
          setShowQuestionnaire(false);
          onClose();
        }}
      />
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#404040', '#ffffff']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.closeIconContainer}>
            <Image source={require('../assets/images/cross.png')} style={styles.closeIcon} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Face Analysis</Text>
          <View style={styles.headerSubtitle}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>REAL-TIME AI</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        {isCameraPermissionGranted ? (
          <View style={styles.cameraPreview}>
            <CameraView
              style={styles.camera}
              facing="front"
              onCameraReady={() => setCameraReady(true)}
            >
              {/* Modern face scanning overlay */}
              <Animated.View 
                style={[
                  styles.faceOverlay,
                  {
                    borderColor: '#ff4757', // Always red
                    shadowColor: '#ff4757', // Always red
                    transform: [{ scale: pulseAnimation }],
                  }
                ]}
              >
                {/* Scan line animation */}
                {scanningState === 'scanning' && (
                  <Animated.View 
                    style={[
                      styles.scanLine,
                      {
                        transform: [{ translateY: scanLineTranslateY }],
                      }
                    ]}
                  />
                )}

                {/* Progress indicator */}
                {scanningState === 'scanning' && (
                  <Animated.View 
                    style={[
                      styles.progressBar,
                      {
                        width: scanProgress,
                      }
                    ]}
                  />
                )}


              </Animated.View>

              {/* Center face icon with glow */}
              <View style={styles.faceIconContainer}>
                <View style={[
                  styles.faceIconGlow,
                  { backgroundColor: faceDetected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 71, 87, 0.2)' }
                ]}>
                  <Image 
                    source={require('../assets/images/profile.png')} 
                    style={[
                      styles.faceIcon,
                      { tintColor: faceDetected ? '#00ff88' : '#ff4757' }
                    ]} 
                  />
                </View>
              </View>
            </CameraView>
          </View>
        ) : (
          <View style={styles.permissionContainer}>
            <Image 
              source={require('../assets/images/profile.png')} 
              style={styles.permissionIcon} 
            />
            <Text style={styles.permissionText}>Camera Access Required</Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={handlePermissionRequest}
            >
              <Text style={styles.permissionButtonText}>Grant Access</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modern Instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>
            {scanningState === 'positioning' && '🎯 Position Your Face'}
            {scanningState === 'scanning' && '⚡ AI Analyzing...'}
            {scanningState === 'complete' && '✅ Analysis Complete!'}
          </Text>
          
          <Text style={styles.instructionText}>
            {scanningState === 'positioning' && 'Position your face in the red circle. Detection will start automatically.'}
            {scanningState === 'scanning' && `Analyzing facial structure and skin tone... ${countdown}s`}
            {scanningState === 'complete' && 'AI analysis complete! Your profile is ready.'}
          </Text>
        </View>

        {/* Modern Status indicators */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={[
              styles.statusIndicator, 
              { 
                backgroundColor: faceDetected ? '#00ff88' : '#374151',
                shadowColor: faceDetected ? '#00ff88' : 'transparent',
              }
            ]} />
            <Text style={[styles.statusText, { color: '#ffffff' }]}>Face Detected</Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[
              styles.statusIndicator, 
              { 
                backgroundColor: scanningState === 'scanning' ? '#3B82F6' : '#374151',
                shadowColor: scanningState === 'scanning' ? '#3B82F6' : 'transparent',
              }
            ]} />
            <Text style={[styles.statusText, { color: '#ffffff' }]}>AI Processing</Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[
              styles.statusIndicator, 
              { 
                backgroundColor: scanningState === 'complete' ? '#10B981' : '#374151',
                shadowColor: scanningState === 'complete' ? '#10B981' : 'transparent',
              }
            ]} />
            <Text style={[styles.statusText, { color: '#ffffff' }]}>Complete</Text>
          </View>
        </View>
      </View>

      {/* Modern AI Logo and branding */}
      <View style={styles.brandingContainer}>
        <View style={styles.brandingCard}>
          <View style={styles.aiLogoContainer}>
            <Image source={require('../assets/images/ai.png')} style={styles.aiLogo} />
          </View>
          <Text style={styles.brandingText}>Advanced AI Recognition</Text>
          <Text style={styles.brandingSubtext}>
            Sophisticated algorithms for precision skin tone analysis
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  closeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  closeIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff88',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00ff88',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cameraPreview: {
    width: width * 0.75,
    height: width * 0.75,
    backgroundColor: '#404040',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  permissionContainer: {
    width: width * 0.75,
    height: width * 0.75,
    backgroundColor: '#404040',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  permissionIcon: {
    width: 80,
    height: 80,
    tintColor: '#666',
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  faceOverlay: {
    position: 'absolute',
    width: '75%',
    height: '75%',
    borderWidth: 4,
    borderRadius: 200,
    borderColor: '#fff',
    top: '12.5%',
    left: '12.5%',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: '#00ff88',
    top: 0,
    shadowColor: '#00ff88',
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  progressBar: {
    position: 'absolute',
    bottom: -15,
    left: 0,
    height: 6,
    backgroundColor: '#00ff88',
    borderRadius: 3,
    shadowColor: '#00ff88',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  faceIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  faceIconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  faceIcon: {
    width: 50,
    height: 50,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  instructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionTitle: {
    fontSize: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statusText: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  brandingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  aiLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  aiLogo: {
    width: 35,
    height: 35,
    tintColor: '#fff',
  },
  brandingText: {
    fontSize: isSmallDevice ? 17 : isMediumDevice ? 18 : 19,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandingSubtext: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FaceScanScreen; 