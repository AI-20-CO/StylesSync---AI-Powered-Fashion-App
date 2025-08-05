import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const lottieRef = useRef<LottieView>(null);
  const logoScale = useRef(new Animated.Value(2)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  // Start Lottie animation as soon as possible
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, []);

  useEffect(() => {
    Animated.timing(logoScale, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        // Fade out loading animation
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(onComplete, 400);
        });
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Main Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { scale: logoScale },
              { translateY: logoTranslateY },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/images/ss logo white.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      {/* Loading Animation */}
      <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}> 
        <LottieView
          ref={lottieRef}
          source={require('../assets/loading.json')}
          style={styles.lottieAnimation}
          loop
          autoPlay={false}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: isSmallDevice ? 80 : isMediumDevice ? 90 : 100,
    height: isSmallDevice ? 80 : isMediumDevice ? 90 : 100,
  },
  logo: {
    width: isSmallDevice ? 80 : isMediumDevice ? 90 : 100,
    height: isSmallDevice ? 80 : isMediumDevice ? 90 : 100,
  },
  loadingContainer: {
    position: 'absolute',
    top: height * 0.5 - (isSmallDevice ? 50 : isMediumDevice ? 55 : 60),
    left: width * 0.5 - (isSmallDevice ? 50 : isMediumDevice ? 55 : 60),
    width: isSmallDevice ? 100 : isMediumDevice ? 110 : 120,
    height: isSmallDevice ? 100 : isMediumDevice ? 110 : 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: isSmallDevice ? 100 : isMediumDevice ? 110 : 120,
    height: isSmallDevice ? 100 : isMediumDevice ? 110 : 120,
  },
});

export default SplashScreen; 