import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
  Text,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useLikes } from '../context/LikesContext';
import { useAIAnalysis } from '../context/AIAnalysisContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = screenWidth < 350;
const isMediumDevice = screenWidth >= 350 && screenWidth < 400;

interface AnimatedGradientTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onAccountPress?: () => void;
}

// Custom animated gradient tab bar
const AnimatedGradientTabBar: React.FC<AnimatedGradientTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation, 
  onAccountPress 
}) => {
  const { showLikes, exitFromLikes } = useLikes();
  const { isAIAnalysisActive, setAIAnalysisActive } = useAIAnalysis();

  // Add Account tab manually since it's not in the navigator anymore
  const allTabs = [...state.routes, { name: 'Account', key: 'account-key' }];

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: isSmallDevice ? 75 : isMediumDevice ? 80 : 85,
      borderTopLeftRadius: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
      borderTopRightRadius: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
      overflow: 'hidden',
    }}>
      <View style={{ flex: 1 }}>
        {/* Base white gradient */}
        <LinearGradient
          colors={['#ffffff', '#ffffff', '#fafafa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingBottom: isSmallDevice ? 15 : isMediumDevice ? 17 : 20,
            paddingTop: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
          }}
        >
          {allTabs.map((route: any, index: number) => {
            const isAccountTab = route.name === 'Account';
            const isFocused = !isAccountTab && state.index === index;

            const onPress = () => {
              if (isAccountTab) {
                // Handle Account tab press
                if (onAccountPress) {
                  onAccountPress();
                }
                return;
              }

              // Check if AI analysis is active and trying to navigate to Home tab
              if (isAIAnalysisActive && route.name === 'Home') {
                Alert.alert(
                  'AI Analysis Incomplete',
                  'Your AI face analysis is not complete. If you leave now, you\'ll need to start over.',
                  [
                    {
                      text: 'Continue Analysis',
                      style: 'cancel',
                    },
                    {
                      text: 'Exit',
                      style: 'destructive',
                      onPress: () => {
                        setAIAnalysisActive(false);
                        // Proceed with navigation
                        navigation.navigate(route.name);
                      },
                    },
                  ]
                );
                return;
              }

              // Check if AI analysis is active and trying to navigate away from Home
              if (isAIAnalysisActive && route.name !== 'Home') {
                Alert.alert(
                  'AI Analysis Incomplete',
                  'Your AI face analysis is not complete. If you leave now, you\'ll need to start over.',
                  [
                    {
                      text: 'Continue Analysis',
                      style: 'cancel',
                    },
                    {
                      text: 'Exit',
                      style: 'destructive',
                      onPress: () => {
                        setAIAnalysisActive(false);
                        // Proceed with navigation
                        const event = navigation.emit({
                          type: 'tabPress',
                          target: route.key,
                          canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                          navigation.navigate(route.name);
                        }
                      },
                    },
                  ]
                );
                return;
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              // If likes screen is open, exit it first
              if (showLikes) {
                exitFromLikes();
              }

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            let iconSource;
            const isRentIcon = route.name === 'Rent';
            
            if (route.name === 'Home') {
              iconSource = require('../assets/images/home.png');
            } else if (route.name === 'Rent') {
              iconSource = require('../assets/images/rent.png');
            } else if (route.name === 'P2P') {
              iconSource = require('../assets/images/p2p.png');
            } else if (route.name === 'AI') {
              iconSource = require('../assets/images/ai.png');
            } else if (route.name === 'Account') {
              iconSource = require('../assets/images/profile.png');
            }

            return (
              <TouchableOpacity 
                key={route.key} 
                style={{ 
                  flex: 1, 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <Animated.View style={{ opacity: isFocused ? 1.0 : 0.6 }}>
                  <Image 
                    source={iconSource} 
                    style={{ 
                      width: isRentIcon 
                        ? (isSmallDevice ? 34 : isMediumDevice ? 36 : 38)
                        : (isSmallDevice ? 20 : isMediumDevice ? 22 : 24), 
                      height: isRentIcon 
                        ? (isSmallDevice ? 34 : isMediumDevice ? 36 : 38)
                        : (isSmallDevice ? 20 : isMediumDevice ? 22 : 24), 
                      tintColor: isFocused ? '#000' : '#666'
                    }} 
                  />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default AnimatedGradientTabBar; 