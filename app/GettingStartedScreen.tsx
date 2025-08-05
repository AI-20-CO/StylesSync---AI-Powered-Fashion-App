import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;

interface GettingStartedScreenProps {
  onGetStarted?: () => void;
}

const GettingStartedScreen: React.FC<GettingStartedScreenProps> = ({ onGetStarted }) => {
  // Intro animation state
  const [showIntro, setShowIntro] = useState(true);

  // Animated values for intro
  const introLogoY = useRef(new Animated.Value(height / 2 - 70)).current; // Centered
  const introLogoWhiteOpacity = useRef(new Animated.Value(0)).current; // Start with white hidden
  const introLogoBlackOpacity = useRef(new Animated.Value(1)).current; // Start with black visible
  const introBgColor = useRef(new Animated.Value(1)).current; // Start at 1: white, not 0: black
  const brandTextOpacity = useRef(new Animated.Value(0)).current;
  const brandTextTranslate = useRef(new Animated.Value(20)).current;
  const mainContentOpacity = useRef(new Animated.Value(0)).current;
  const mainContentTranslate = useRef(new Animated.Value(40)).current;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Text animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslate = useRef(new Animated.Value(20)).current;

  // Background icon animation
  const bgIconOpacity = useRef(new Animated.Value(0.15)).current;

  // Bottom section animation
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslate = useRef(new Animated.Value(60)).current;
  
  // Content inside black section animation
  const blackContentOpacity = useRef(new Animated.Value(0)).current;
  const blackContentTranslate = useRef(new Animated.Value(20)).current;

  // Button glow and animation effects
  const buttonGlowOpacity = useRef(new Animated.Value(0.3)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonRotation = useRef(new Animated.Value(0)).current;
  const particleScale1 = useRef(new Animated.Value(0)).current;
  const particleScale2 = useRef(new Animated.Value(0)).current;
  const particleScale3 = useRef(new Animated.Value(0)).current;
  const particleOpacity1 = useRef(new Animated.Value(0)).current;
  const particleOpacity2 = useRef(new Animated.Value(0)).current;
  const particleOpacity3 = useRef(new Animated.Value(0)).current;
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  const navigation = useNavigation();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const outroOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showIntro) {
      Animated.sequence([
        Animated.delay(200),
        // First: Move logo to top (black logo)
        Animated.timing(introLogoY, {
          toValue: 60, // match styles.topSection.paddingTop
          duration: 700,
          useNativeDriver: false,
        }),
        // Then: Fade in "STYLE SYNC" text
        Animated.parallel([
          Animated.timing(brandTextOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(brandTextTranslate, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(200),
        // Then: Animate in black section
        Animated.parallel([
          Animated.timing(bottomOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(bottomTranslate, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
        // Finally: Animate in content inside black section
        Animated.parallel([
          Animated.timing(blackContentOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blackContentTranslate, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => setShowIntro(false));
    }

    // Looping dimming animation for background icons
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgIconOpacity, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bgIconOpacity, {
          toValue: 0.1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button glow pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlowOpacity, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlowOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [showIntro]);

  const handleGetStarted = () => {
    setIsButtonPressed(true);
    Vibration.vibrate(50); // Haptic feedback

    // Amazing button animation sequence
    Animated.sequence([
      // Scale up and rotate
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(buttonRotation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      // Particle explosion effect
      Animated.parallel([
        // Particle 1
        Animated.timing(particleScale1, {
          toValue: 1.5,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(particleOpacity1, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Particle 2
        Animated.timing(particleScale2, {
          toValue: 2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(particleOpacity2, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        // Particle 3
        Animated.timing(particleScale3, {
          toValue: 2.5,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(particleOpacity3, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Fade out particles
      Animated.parallel([
        Animated.timing(particleOpacity1, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(particleOpacity2, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(particleOpacity3, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Fade out entire screen after animation
    setTimeout(() => {
      setIsFadingOut(true);
      Animated.timing(outroOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
             }).start(() => {
         navigation.navigate('SignUp' as never);
       });
    }, 800);
  };

  // Interpolate background color
  const bgColor = introBgColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000', '#fff'],
  });

  // Interpolate button rotation
  const buttonRotationInterpolate = buttonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Intro Animation Layer */}
      {showIntro && (
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 20 }]}> 
          {/* White logo fades out */}
          <Animated.Image
            source={require('../assets/images/ss logo white.png')}
            style={{
              position: 'absolute',
              left: width / 2 - 70,
              top: introLogoY,
              width: 140,
              height: 140,
              opacity: introLogoWhiteOpacity,
            }}
            resizeMode="contain"
          />
          {/* Black logo fades in */}
          <Animated.Image
            source={require('../assets/images/ss logo black.png')}
            style={{
              position: 'absolute',
              left: width / 2 - 70,
              top: introLogoY,
              width: 140,
              height: 140,
              opacity: introLogoBlackOpacity,
            }}
            resizeMode="contain"
          />
        </Animated.View>
      )}
      {/* Main Content Layer */}
      <View style={styles.topSection}>
        <Image
          source={require('../assets/images/ss logo black.png')}
          style={[styles.ssLogo, { opacity: showIntro ? 0 : 1 }]}
          resizeMode="contain"
        />
        <Animated.View
          style={{
            opacity: brandTextOpacity,
            transform: [{ translateY: brandTextTranslate }],
          }}
        >
          <Text style={styles.brandText}>STYLE SYNC</Text>
        </Animated.View>
      </View>
      
      {/* Background clothing icons */}
      <Animated.Image
        source={require('../assets/images/ss logo black.png')}
        style={[
          styles.bgIcon,
          { left: 40, top: 180, opacity: bgIconOpacity, transform: [{ scale: 1.5 }] },
        ]}
        resizeMode="contain"
      />
      <Animated.Image
        source={require('../assets/images/carts logo.png')}
        style={[
          styles.bgIcon,
          { right: 40, top: 320, opacity: bgIconOpacity, transform: [{ scale: 1.2 }] },
        ]}
        resizeMode="contain"
      />
      <Animated.Image
        source={require('../assets/images/rent logo.png')}
        style={[
          styles.bgIcon,
          { left: width / 2 - 30, top: 400, opacity: bgIconOpacity, transform: [{ scale: 1.1 }] },
        ]}
        resizeMode="contain"
      />

      <Animated.View
        style={[
          styles.bottomSection,
          { opacity: Animated.multiply(bottomOpacity, outroOpacity), transform: [{ translateY: bottomTranslate }] },
        ]}
        pointerEvents={showIntro ? 'none' : 'auto'}
      >
        <Animated.View
          style={{
            opacity: blackContentOpacity,
            transform: [{ translateY: blackContentTranslate }],
          }}
        >
          <View style={styles.contentSection}>
                          <Image
                source={require('../assets/images/ai logo.png')}
                style={styles.aiLogoTop}
                resizeMode="contain"
              />
            <Text style={styles.mainTitle}>
              Find Your best outfit
            </Text>
            <Text style={styles.subtitle}>
              Buy or rent your outfit with AI assisting you{"\n"}and look great
            </Text>
          </View>
          
          {/* Icons Flow */}
          <View style={styles.iconsContainer}>
            <View style={styles.iconGrid}>
              {/* Top row */}
              <View style={styles.iconRow}>
                                  <Image
                    source={require('../assets/images/arrow left logo.png')}
                    style={styles.arrowIcon}
                    resizeMode="contain"
                  />
                  <Image
                    source={require('../assets/images/p2p logo.png')}
                    style={styles.featureIcon}
                    resizeMode="contain"
                  />
                  <Image
                    source={require('../assets/images/arrow right logo.png')}
                    style={styles.arrowIcon}
                    resizeMode="contain"
                  />
              </View>
              {/* Bottom row */}
              <View style={styles.iconRow}>
                                  <Image
                    source={require('../assets/images/rent logo.png')}
                    style={styles.featureIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.spacer} />
                  <Image
                    source={require('../assets/images/carts logo.png')}
                    style={styles.featureIcon}
                    resizeMode="contain"
                  />
              </View>
            </View>
          </View>
          
          {/* Get Started Button with Glow Effect */}
          <View style={styles.buttonContainer}>
            {/* Particle Effects */}
            <Animated.View
              style={[
                styles.particle,
                {
                  transform: [{ scale: particleScale1 }],
                  opacity: particleOpacity1,
                  backgroundColor: '#f8f8f8',
                },
              ]}
            />
            <Animated.View
              style={[
                styles.particle,
                {
                  transform: [{ scale: particleScale2 }],
                  opacity: particleOpacity2,
                  backgroundColor: '#ffffff',
                },
              ]}
            />
            <Animated.View
              style={[
                styles.particle,
                {
                  transform: [{ scale: particleScale3 }],
                  opacity: particleOpacity3,
                  backgroundColor: '#f0f0f0',
                },
              ]}
            />
            
            {/* Glow Effect - Multiple Layers for Blur */}
            <Animated.View
              style={[
                styles.buttonGlowOuter,
                {
                  opacity: Animated.multiply(buttonGlowOpacity, 0.3),
                  transform: [{ scale: buttonScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.buttonGlowMid,
                {
                  opacity: Animated.multiply(buttonGlowOpacity, 0.5),
                  transform: [{ scale: buttonScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.buttonGlowInner,
                {
                  opacity: Animated.multiply(buttonGlowOpacity, 0.7),
                  transform: [{ scale: buttonScale }],
                },
              ]}
            />
            
            {/* Main Button */}
            <Animated.View
              style={[
                {
                  transform: [
                    { scale: buttonScale },
                    { rotate: buttonRotationInterpolate },
                  ],
                  opacity: opacityAnim,
                },
              ]}
            >
              <TouchableOpacity 
                style={styles.getStartedButton} 
                onPress={handleGetStarted}
                disabled={isButtonPressed}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                                  <Image
                    source={require('../assets/images/arrow for button.png')}
                    style={styles.buttonArrow}
                    resizeMode="contain"
                  />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: height * 0.08, // 8% of screen height
    paddingBottom: height * 0.1, // 10% of screen height
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
  bottomSection: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: height * 0.04,
    paddingTop: height * 0.18,
    alignItems: 'center',
    paddingHorizontal: width * 0.06,
    zIndex: 2,
    justifyContent: 'flex-end',
    paddingBottom: height * 0.08,
    borderTopLeftRadius: isSmallDevice ? 30 : 40,
    borderTopRightRadius: isSmallDevice ? 30 : 40,
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: height * 0.025,
  },
  mainTitle: {
    fontSize: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: height * 0.015,
  },
  subtitle: {
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    color: '#fff',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    opacity: 0.9,
  },
  iconsContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  iconGrid: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
  },
  featureIcon: {
    width: isSmallDevice ? 32 : isMediumDevice ? 36 : 40,
    height: isSmallDevice ? 32 : isMediumDevice ? 36 : 40,
    marginHorizontal: width * 0.02,
    tintColor: '#fff',
  },
  arrowIcon: {
    width: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    height: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    marginHorizontal: width * 0.02,
    tintColor: '#fff',
    marginTop: height * 0.04
  },
  spacer: {
    width: isSmallDevice ? 32 : isMediumDevice ? 36 : 40,
    height: isSmallDevice ? 32 : isMediumDevice ? 36 : 40,
    marginHorizontal: width * 0.02,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
    position: 'relative',
  },
  buttonGlowOuter: {
    position: 'absolute',
    width: isSmallDevice ? 180 : isMediumDevice ? 200 : 220,
    height: isSmallDevice ? 65 : isMediumDevice ? 72 : 80,
    borderRadius: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
    backgroundColor: 'rgba(248, 248, 248, 0.1)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
    elevation: 20,
  },
  buttonGlowMid: {
    position: 'absolute',
    width: isSmallDevice ? 165 : isMediumDevice ? 182 : 200,
    height: isSmallDevice ? 55 : isMediumDevice ? 60 : 65,
    borderRadius: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    backgroundColor: 'rgba(248, 248, 248, 0.15)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: isSmallDevice ? 15 : isMediumDevice ? 16 : 18,
    elevation: 15,
  },
  buttonGlowInner: {
    position: 'absolute',
    width: isSmallDevice ? 150 : isMediumDevice ? 167 : 185,
    height: isSmallDevice ? 45 : isMediumDevice ? 50 : 55,
    borderRadius: isSmallDevice ? 12 : isMediumDevice ? 14 : 16,
    backgroundColor: 'rgba(248, 248, 248, 0.2)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    elevation: 10,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: -1,
  },
  getStartedButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: isSmallDevice ? 10 : isMediumDevice ? 12 : 14,
    paddingHorizontal: isSmallDevice ? 20 : isMediumDevice ? 24 : 28,
    borderRadius: isSmallDevice ? 12 : isMediumDevice ? 13 : 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: isSmallDevice ? 40 : isMediumDevice ? 45 : 50,
    width: isSmallDevice ? 140 : isMediumDevice ? 160 : 180,
    shadowColor: '#f8f8f8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 248, 248, 0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonArrow: {
    width: isSmallDevice ? 12 : isMediumDevice ? 14 : 16,
    height: isSmallDevice ? 12 : isMediumDevice ? 14 : 16,
    tintColor: '#fff',
  },
  aiLogoTop: {
    width: isSmallDevice ? 24 : isMediumDevice ? 27 : 30,
    height: isSmallDevice ? 24 : isMediumDevice ? 27 : 30,
    marginBottom: height * 0.015,
  },
  diagonalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bgIcon: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
});

export default GettingStartedScreen; 