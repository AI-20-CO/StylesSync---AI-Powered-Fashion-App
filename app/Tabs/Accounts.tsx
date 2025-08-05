import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth, useUser } from '@clerk/clerk-expo';
import EditProfileScreen from '../EditProfileScreen';
import AddItemScreen from '../AddItemScreen';
import SellerProfileScreen from '../SellerProfileScreen';
import AddedItemsScreen from '../AddedItemsScreen';
import HelpCenterScreen from '../HelpCenterScreen';
import EarningsDetailsScreen from '../EarningsDetailsScreen';
import { supabase } from '../../backend/supabase';
import { useItems } from '../../context/ItemsContext';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isLargeDevice = width >= 400;

interface AccountsProps {
  onClose?: () => void;
}

type NavigationProp = StackNavigationProp<{
  AllOrders: { mode: 'buyer' | 'seller' };
  PlacedOrders: { mode: 'buyer' | 'seller' };
  ShippedOrders: { mode: 'buyer' | 'seller' };
  ReceivedOrders: undefined;
  ToMarketplace: undefined;
  Vouchers: undefined;
}>;

interface EarningDetails {
  item_id: number;
  item_name: string;
  sale_amount: number;
  net_amount: number;
  sale_date: string;
  payment_status: string;
  image_url?: string;
}

interface FashionItem {
  id: number;
  name: string;
  price: number;
  source_screen: 'p2p' | 'rent';
  status: 'active' | 'sold' | 'rented';
  created_at: string;
  sizes: string[];
  colors: string[];
  image_urls: string[];
}

const Accounts: React.FC<AccountsProps> = ({ onClose }) => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { itemsCount, setItemsCount } = useItems();
  const navigation = useNavigation<NavigationProp>();

  // State for expandable order details
  const [isOrderDetailsExpanded, setIsOrderDetailsExpanded] = useState(false);
  const [profileMode, setProfileMode] = useState<'buyer' | 'seller'>('buyer');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const [hasCompletedSellerProfile, setHasCompletedSellerProfile] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showEarningsDetails, setShowEarningsDetails] = useState(false);
  const [earningsDetails, setEarningsDetails] = useState<EarningDetails[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [showAddedItems, setShowAddedItems] = useState(false);
  const [showAddedItemsScreen, setShowAddedItemsScreen] = useState(false);
  const [addedItems, setAddedItems] = useState<FashionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showEarningsDetailsScreen, setShowEarningsDetailsScreen] = useState(false);
  
  // Animation values
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const buyerProfileButtonOpacity = useRef(new Animated.Value(1)).current;
  
  // Screen transition animation
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(30)).current;

  // Screen focus animation
  useFocusEffect(
    React.useCallback(() => {
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        screenOpacity.setValue(0);
        screenTranslateY.setValue(30);
      };
    }, [])
  );

  // Add this useEffect to check seller profile status
  useEffect(() => {
    checkSellerProfileStatus();
  }, [user?.id]);

  const checkSellerProfileStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking seller profile:', error);
        return;
      }

      setHasCompletedSellerProfile(!!data);
    } catch (error) {
      console.error('Error in checkSellerProfileStatus:', error);
    }
  };

  const toggleOrderDetails = () => {
    const toValue = isOrderDetailsExpanded ? 0 : 1;
    const buttonOpacityValue = isOrderDetailsExpanded ? 1 : 0;
    
    Animated.parallel([
      Animated.timing(expandAnimation, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnimation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buyerProfileButtonOpacity, {
        toValue: buttonOpacityValue,
        duration: 400, // Slightly longer for smoother fade
        useNativeDriver: true,
      }),
    ]).start();
    
    setIsOrderDetailsExpanded(!isOrderDetailsExpanded);
  };

  const toggleEarningsDetails = () => {
    const buttonOpacityValue = showEarningsDetails ? 1 : 0;
    
    Animated.timing(buyerProfileButtonOpacity, {
      toValue: buttonOpacityValue,
      duration: 200, // Much faster animation
      useNativeDriver: true,
    }).start();
    
    setShowEarningsDetails(!showEarningsDetails);
  };

  const toggleProfileMode = () => {
    const toValue = profileMode === 'buyer' ? 1 : 0;
    
    // If switching to seller mode and hasn't completed profile
    if (profileMode === 'buyer' && !hasCompletedSellerProfile) {
      setShowSellerProfile(true);
      return;
    }
    
    Animated.timing(slideAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setProfileMode(profileMode === 'buyer' ? 'seller' : 'buyer');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  const handleAllOrdersPress = () => {
    navigation.navigate('AllOrders', { mode: profileMode });
  };

  const handlePlacedOrdersPress = () => {
    navigation.navigate('PlacedOrders', { mode: profileMode });
  };

  const handleShippedOrdersPress = () => {
    navigation.navigate('ShippedOrders', { mode: profileMode });
  };

  const handleReceivedOrdersPress = () => {
    navigation.navigate('ReceivedOrders');
  };

  const handleToMarketplacePress = () => {
    navigation.navigate('ToMarketplace');
  };

  const handleVouchersPress = () => {
    navigation.navigate('Vouchers');
  };

  const handleHelpCenterPress = () => {
    setShowHelpCenter(true);
  };

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const orderDetailsHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [140, 240],
  });

  const slidePosition = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120], // Reduce slide distance to keep button inside
  });

  const textSlidePosition = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80], // Reduce slide distance to move text less to the right
  });

  const arrowDirection = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // For determining arrow direction
  });

  const buttonBackgroundColor = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000', '#fff'],
  });

  const buttonTextColor = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', '#000'],
  });

  const smallButtonColor = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', '#000'],
  });

  const buttonBorderColor = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#000'], // No border in seller mode, black border in buyer mode
  });

  const arrowTextColor = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#666', '#fff'], // Gray arrows initially, white when toggled
  });

  const mainButtonBorderColor = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#000'], // No border for seller, black border for buyer
  });

  const badgeBackgroundColor = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#000'], // Transparent for seller mode, black for buyer mode
  });

  const badgeTextColor = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000', '#fff'], // Black text for seller mode, white text for buyer mode
  });

  // Add this function to fetch earnings
  const fetchEarnings = async () => {
    if (!user?.id || profileMode !== 'seller') return;

    try {
      setLoadingEarnings(true);
      
      // Get total earnings
      const { data: totalData, error: totalError } = await supabase
        .from('seller_earnings')
        .select('net_amount')
        .eq('user_id', user.id);

      if (totalError) throw totalError;

      const total = totalData.reduce((sum, item) => sum + Number(item.net_amount), 0);
      setTotalEarnings(total);

      // Get detailed earnings if details view is open
      if (showEarningsDetails) {
        const { data: detailsData, error: detailsError } = await supabase
          .from('seller_earnings')
          .select('*')
          .eq('user_id', user.id)
          .order('sale_date', { ascending: false });

        if (detailsError) throw detailsError;

        setEarningsDetails(detailsData);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoadingEarnings(false);
    }
  };

  // Add useEffect to fetch earnings when profile mode changes
  useEffect(() => {
    fetchEarnings();
  }, [user?.id, profileMode, showEarningsDetails]);

  // Refresh earnings when returning to screen (focus effect)
  useFocusEffect(
    React.useCallback(() => {
      if (profileMode === 'seller') {
        fetchEarnings();
      }
    }, [profileMode])
  );

  // Add this function to fetch user's added items
  const fetchAddedItems = async () => {
    if (!user?.id || profileMode !== 'seller') return;

    try {
      setLoadingItems(true);
      // First check if table exists by catching the error
      const { data, error } = await supabase
        .from('fashion_items')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_status', null) // Only show non-deleted items
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist yet, just set empty array
        if (error.code === '42P01') { // relation does not exist
          setAddedItems([]);
          return;
        }
        throw error;
      }
      setAddedItems(data || []);
      setItemsCount(data?.length || 0); // Update context with items count
    } catch (error) {
      console.error('Error fetching added items:', error);
      // Don't show error to user if no items exist yet
      setAddedItems([]);
      setItemsCount(0);
    } finally {
      setLoadingItems(false);
    }
  };

  // Add useEffect to fetch items when profile mode changes
  useEffect(() => {
    fetchAddedItems();
  }, [user?.id, profileMode]);

  // If showing edit profile, render EditProfile component
  if (showEditProfile) {
    return <EditProfileScreen onClose={() => setShowEditProfile(false)} />;
  }

  // If showing add item, render AddItem component
  if (showAddItem) {
    return <AddItemScreen onClose={() => setShowAddItem(false)} />;
  }

  // If showing seller profile, render SellerProfileScreen component
  if (showSellerProfile) {
    return (
      <SellerProfileScreen 
        onClose={() => {
          setShowSellerProfile(false);
          checkSellerProfileStatus(); // Refresh status after completion
        }} 
      />
    );
  }

  // If showing added items screen
  if (showAddedItemsScreen) {
    return <AddedItemsScreen onClose={() => setShowAddedItemsScreen(false)} />;
  }

  // If showing help center
  if (showHelpCenter) {
    return <HelpCenterScreen onClose={() => setShowHelpCenter(false)} />;
  }

  // If showing earnings details screen
  if (showEarningsDetailsScreen) {
    return <EarningsDetailsScreen onClose={() => setShowEarningsDetailsScreen(false)} />;
  }

  return (
    <View style={styles.fullScreenContainer}>
      <Animated.View 
        style={[
          styles.profileContainer,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        {/* Header with close button and buyer/seller badge */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Image source={require('../../assets/images/cross.png')} style={styles.closeIcon} />
          </TouchableOpacity>
          
          <Animated.View style={[
            styles.badge,
            {
              backgroundColor: badgeBackgroundColor,
            }
          ]}>
            <Animated.Text style={[
              styles.badgeText,
              {
                color: badgeTextColor,
              }
            ]}>
              {profileMode.toUpperCase()}
            </Animated.Text>
          </Animated.View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={require('../../assets/images/profile.png')} 
              style={styles.profileImage}
            />
          </View>
          
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : 'Ayaan Izhar'
            }
          </Text>
          
          <TouchableOpacity style={styles.editProfileButton} onPress={() => setShowEditProfile(true)}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Add Earnings Section for Seller Mode */}
          {profileMode === 'seller' && (
            <TouchableOpacity 
              style={styles.earningsContainer}
              onPress={toggleEarningsDetails}
            >
              <View style={styles.earningsHeader}>
                <Text style={styles.earningsTitle}>Total Earnings</Text>
                <Text style={styles.earningsAmount}>
                  {loadingEarnings ? 'Loading...' : `RM ${totalEarnings.toFixed(2)}`}
                </Text>
              </View>

              {showEarningsDetails && (
                <View style={styles.earningsDetails}>
                  {loadingEarnings ? (
                    <ActivityIndicator size="small" color="#000" style={styles.loader} />
                  ) : earningsDetails.length > 0 ? (
                    <View>
                      {/* Show only the latest earning */}
                      {earningsDetails.slice(0, 1).map((earning, index) => (
                        <View key={index} style={styles.earningItem}>
                          <View style={styles.earningItemContent}>
                            {/* Item Image */}
                            <Image
                              source={
                                earning.image_url && earning.image_url.startsWith('http')
                                  ? { uri: earning.image_url }
                                  : require('../../assets/images/ss logo black.png')
                              }
                              style={styles.earningItemImage}
                              onError={() => console.log('Earnings image failed to load')}
                              defaultSource={require('../../assets/images/ss logo black.png')}
                            />
                            
                            {/* Item Details */}
                            <View style={styles.earningItemInfo}>
                              <View style={styles.earningItemHeader}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                  {earning.item_name}
                                </Text>
                                <Text style={styles.saleDate}>
                                  {new Date(earning.sale_date).toLocaleDateString()}
                                </Text>
                              </View>
                              <View style={styles.earningItemDetails}>
                                <Text style={styles.saleAmount}>
                                  Sale: RM {Number(earning.sale_amount).toFixed(2)}
                                </Text>
                                <Text style={styles.netAmount}>
                                  Net: RM {Number(earning.net_amount).toFixed(2)}
                                </Text>
                                <View style={[
                                  styles.paymentStatus,
                                  { backgroundColor: earning.payment_status === 'paid' ? '#E8F5E9' : '#FFF3E0' }
                                ]}>
                                  <Text style={[
                                    styles.paymentStatusText,
                                    { color: earning.payment_status === 'paid' ? '#2E7D32' : '#E65100' }
                                  ]}>
                                    {earning.payment_status.toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                      
                      {/* Show More Button */}
                      {earningsDetails.length > 1 && (
                        <TouchableOpacity 
                          style={styles.showMoreButton}
                          onPress={() => setShowEarningsDetailsScreen(true)}
                        >
                          <Text style={styles.showMoreText}>
                            View All Earnings ({earningsDetails.length} items)
                          </Text>
                          <Text style={styles.showMoreArrow}>›</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.noEarnings}>No earnings yet</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Order/Sales Details Box - Changes based on profile mode */}
        <Animated.View style={[styles.orderDetailsBox, { height: orderDetailsHeight }]}>
          <TouchableOpacity style={styles.orderDetailsHeader} onPress={toggleOrderDetails}>
            <View style={styles.centeredTextContainer}>
              <Text style={styles.orderDetailsTitle}>
                {profileMode === 'seller' ? 'Sales Details' : 'Your order details'}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Text style={styles.expandArrow}>›</Text>
            </Animated.View>
          </TouchableOpacity>
          
          <View style={styles.orderOptionsContainer}>
            <View style={styles.orderOptionsRow}>
              <TouchableOpacity style={styles.orderOption} onPress={handleAllOrdersPress}>
                <Image source={require('../../assets/images/all orders.png')} style={styles.orderIcon} />
                <Text style={styles.orderOptionText}>All orders</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.orderOption} onPress={handlePlacedOrdersPress}>
                <Image source={require('../../assets/images/order placed.png')} style={styles.orderIcon} />
                <Text style={styles.orderOptionText}>{profileMode === 'seller' ? 'incoming' : 'placed'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.orderOption} onPress={handleShippedOrdersPress}>
                <Image source={require('../../assets/images/shipped orders.png')} style={styles.orderIcon} />
                <Text style={styles.orderOptionText}>shipped</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.orderOption} onPress={handleReceivedOrdersPress}>
                <Image source={require('../../assets/images/orders received.png')} style={styles.orderIcon} />
                <Text style={styles.orderOptionText}>{profileMode === 'seller' ? 'successful' : 'Received'}</Text>
              </TouchableOpacity>
            </View>
            
            {isOrderDetailsExpanded && profileMode === 'buyer' && (
              <View style={styles.orderOptionsRow}>
                <TouchableOpacity style={styles.orderOption} onPress={handleToMarketplacePress}>
                  <Image source={require('../../assets/images/order placed.png')} style={styles.orderIcon} />
                  <Text style={styles.orderOptionText}>To marketplace</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.orderOption} onPress={handleVouchersPress}>
                  <Image source={require('../../assets/images/voucher.png')} style={styles.orderIcon} />
                  <Text style={styles.orderOptionText}>Vouchers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.orderOption} onPress={handleHelpCenterPress}>
                  <Image source={require('../../assets/images/helpdesk.png')} style={styles.orderIcon} />
                  <Text style={styles.orderOptionText}>Help center</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {isOrderDetailsExpanded && profileMode === 'seller' && (
              <View style={[styles.orderOptionsRow, { justifyContent: 'center' }]}>
                <TouchableOpacity style={styles.orderOption} onPress={handleHelpCenterPress}>
                  <Image source={require('../../assets/images/helpdesk.png')} style={styles.orderIcon} />
                  <Text style={styles.orderOptionText}>Help center</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Add Item Container - Only visible in seller mode */}
        {profileMode === 'seller' && (
          <>
          <View style={styles.addItemContainer}>
            <TouchableOpacity style={styles.addItemButton} onPress={() => setShowAddItem(true)}>
              <Text style={styles.addItemText}>Add item</Text>
              <View style={styles.addIconContainer}>
                <Text style={styles.addIcon}>+</Text>
              </View>
            </TouchableOpacity>
          </View>

            {/* Added Items Container */}
            <View style={styles.addedItemsContainer}>
              <TouchableOpacity 
                style={styles.addedItemsButton}
                onPress={() => setShowAddedItemsScreen(true)}
              >
                <View style={styles.addedItemsHeader}>
                  <Text style={styles.addedItemsTitle}>Added Items</Text>
                  <Text style={styles.itemCount}>{itemsCount} items</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Profile Mode Toggle */}
        <Animated.View 
          style={[
            styles.profileModeContainer,
            {
              opacity: buyerProfileButtonOpacity,
            }
          ]}
        >
          <TouchableOpacity 
            onPress={toggleProfileMode}
            activeOpacity={0.8}
          >
            <Animated.View style={[
              styles.profileModeButton, 
              { 
                backgroundColor: buttonBackgroundColor,
                borderColor: mainButtonBorderColor,
                borderWidth: 1,
              }
            ]}>
              <Animated.Text style={[
                styles.profileModeText, 
                { 
                  color: buttonTextColor,
                  transform: [{ translateX: textSlidePosition }]
                }
              ]}>
                {profileMode === 'buyer' ? 'Seller Profile' : 'Buyer Profile'}
              </Animated.Text>
              
              <Animated.View 
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: smallButtonColor,
                    borderColor: buttonBorderColor,
                    borderWidth: 1,
                    transform: [{ translateX: slidePosition }]
                  }
                ]}
              >
                <Animated.Text style={[styles.toggleArrows, { color: arrowTextColor }]}>
                  {profileMode === 'buyer' ? '‹ ‹ ‹' : '› › ›'}
                </Animated.Text>
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Logo Section */}
        <Animated.View 
          style={[
            styles.logoSection,
            {
              opacity: buyerProfileButtonOpacity,
            }
          ]}
        >
          <Image 
            source={require('../../assets/images/ss logo black.png')} 
            style={styles.ssLogo}
          />
          <Image 
            source={require('../../assets/images/ss written logo.png')} 
            style={styles.ssWrittenLogo}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: isSmallDevice ? 60 : isMediumDevice ? 65 : 70, // Responsive top spacing
    paddingHorizontal: isSmallDevice ? 8 : isMediumDevice ? 9 : 10, // Responsive horizontal padding
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderTopLeftRadius: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    borderTopRightRadius: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 16 : isMediumDevice ? 18 : 20, // Responsive margin
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    width: isSmallDevice ? 18 : isMediumDevice ? 19 : 20, // Responsive icon size
    height: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    tintColor: '#000',
  },
  badge: {
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    paddingVertical: isSmallDevice ? 4 : isMediumDevice ? 4.5 : 5,
    borderRadius: isSmallDevice ? 11 : isMediumDevice ? 12 : 13,
  },
  badgeText: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 10.5 : 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 25 : isMediumDevice ? 27 : 30, // Responsive margin
  },
  profileImageContainer: {
    width: isSmallDevice ? 70 : isMediumDevice ? 75 : 80, // Responsive size
    height: isSmallDevice ? 70 : isMediumDevice ? 75 : 80,
    borderRadius: isSmallDevice ? 35 : isMediumDevice ? 37.5 : 40,
    backgroundColor: '#f0f0f0',
    marginBottom: isSmallDevice ? 12 : isMediumDevice ? 13 : 15, // Responsive margin
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: isSmallDevice ? 45 : isMediumDevice ? 47 : 50, // Responsive size
    height: isSmallDevice ? 45 : isMediumDevice ? 47 : 50,
    resizeMode: 'contain',
  },
  userName: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18, // Responsive font size
    fontWeight: '500',
    color: '#000',
    marginBottom: isSmallDevice ? 8 : isMediumDevice ? 9 : 10, // Responsive margin
  },
  editProfileButton: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: isSmallDevice ? 12 : isMediumDevice ? 13 : 14, // Even smaller border radius
    paddingHorizontal: isSmallDevice ? 10 : isMediumDevice ? 11 : 12, // Much smaller horizontal padding
    paddingVertical: isSmallDevice ? 3 : isMediumDevice ? 4 : 5, // Much smaller vertical padding
  },
  editProfileText: {
    fontSize: isSmallDevice ? 9 : isMediumDevice ? 10 : 11, // Much smaller font size
    color: '#000',
  },
  orderDetailsBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    padding: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    marginBottom: isSmallDevice ? 25 : isMediumDevice ? 27 : 30,
    overflow: 'hidden',
  },
  orderDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 12 : isMediumDevice ? 13 : 15,
  },
  orderDetailsTitle: {
    fontSize: isSmallDevice ? 15 : isMediumDevice ? 15.5 : 16, // Responsive font size
    fontWeight: '500',
    color: '#000',
  },
  expandArrow: {
    fontSize: isSmallDevice ? 18 : isMediumDevice ? 19 : 20, // Responsive font size
    color: '#000',
    fontWeight: 'bold',
  },
  orderOptionsContainer: {
    flex: 1,
  },
  orderOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: isSmallDevice ? 15 : isMediumDevice ? 18 : 20, // Increase spacing between icon rows
  },
  orderOption: {
    alignItems: 'center',
    width: isSmallDevice ? 65 : isMediumDevice ? 67 : 70, // Responsive width
  },
  orderIcon: {
    width: isSmallDevice ? 35 : isMediumDevice ? 37 : 40, // Responsive size
    height: isSmallDevice ? 35 : isMediumDevice ? 37 : 40,
    marginBottom: isSmallDevice ? 3 : isMediumDevice ? 4 : 5, // Smaller margin between icon and text
    resizeMode: 'contain',
  },
  orderOptionText: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 10.5 : 11, // Responsive font size
    color: '#666',
    textAlign: 'center',
  },
  profileModeContainer: {
    position: 'absolute', // Position absolutely like the logo section
    bottom: isSmallDevice ? 100 : isMediumDevice ? 120 : 140, // Move button further down
    left: isSmallDevice ? 80 : isMediumDevice ? 90 : 100, // Increase margins to make button narrower
    right: isSmallDevice ? 80 : isMediumDevice ? 90 : 100, // Increase margins to make button narrower
    marginBottom: 0, // Remove margin since we're using absolute positioning
  },
  profileModeButton: {
    height: isSmallDevice ? 45 : isMediumDevice ? 47 : 50, // Responsive height
    borderRadius: isSmallDevice ? 22.5 : isMediumDevice ? 23.5 : 25, // Responsive border radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content for better animation
    paddingHorizontal: isSmallDevice ? 18 : isMediumDevice ? 19 : 20, // Responsive padding
    position: 'relative',
    overflow: 'hidden', // Hide elements that slide out of bounds
  },
  profileModeText: {
    fontSize: isSmallDevice ? 15 : isMediumDevice ? 15.5 : 16, // Responsive font size
    fontWeight: '600',
    position: 'absolute', // Position absolutely for better control
    left: isSmallDevice ? 15 : isMediumDevice ? 16 : 17, // Move text slightly more to the left
  },
  toggleButton: {
    position: 'absolute', // Position absolutely for sliding
    right: isSmallDevice ? 6 : isMediumDevice ? 8 : 10, // Move button slightly more to the right
    width: isSmallDevice ? 60 : isMediumDevice ? 65 : 70, // Smaller width
    height: isSmallDevice ? 30 : isMediumDevice ? 32 : 35, // Smaller height
    borderRadius: isSmallDevice ? 15 : isMediumDevice ? 16 : 17.5, // Responsive border radius
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleArrows: {
    fontSize: isSmallDevice ? 11 : isMediumDevice ? 11.5 : 12, // Responsive font size
  },
  logoSection: {
    position: 'absolute', // Position absolutely to stick to bottom
    bottom: isSmallDevice ? 5 : isMediumDevice ? 8 : 10, // Move logos much closer to bottom
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: isSmallDevice ? 5 : isMediumDevice ? 8 : 10, // Reduce padding as well
  },
  ssLogo: {
    width: isSmallDevice ? 60 : isMediumDevice ? 70 : 80, // Much larger and responsive
    height: isSmallDevice ? 60 : isMediumDevice ? 70 : 80,
    marginBottom: 0, // Reset to 0
    resizeMode: 'contain',
  },
  ssWrittenLogo: {
    width: isSmallDevice ? 160 : isMediumDevice ? 180 : 200, // Much larger and responsive
    height: isSmallDevice ? 40 : isMediumDevice ? 45 : 50, // Taller and responsive
    marginTop: isSmallDevice ? -15 : isMediumDevice ? -18 : -20, // Much more negative margin to pull it up closer
    resizeMode: 'contain',
  },
  centeredTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addItemContainer: {
    backgroundColor: '#fafafa', // Same background as other containers
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    padding: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    marginBottom: isSmallDevice ? 25 : isMediumDevice ? 27 : 30,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Space between text and icon
  },
  addItemText: {
    fontSize: isSmallDevice ? 15 : isMediumDevice ? 15.5 : 16,
    fontWeight: '500',
    color: '#000',
  },
  addIconContainer: {
    width: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
    height: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
    backgroundColor: '#000', // Black background for the icon
    borderRadius: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#fff', // White plus icon
  },
  earningsContainer: {
    width: '100%',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsTitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  earningsDetails: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    backgroundColor: '#fff',
    marginHorizontal: -15,
    marginBottom: -15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  earningsScroll: {
    maxHeight: 200,
  },
  earningItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  earningItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  earningItemInfo: {
    flex: 1,
  },
  earningItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  saleDate: {
    fontSize: 12,
    color: '#666',
  },
  earningItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleAmount: {
    fontSize: 13,
    color: '#666',
  },
  netAmount: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 20,
  },
  noEarnings: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginTop: 10,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  showMoreArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  addedItemsContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  addedItemsButton: {
    padding: 15,
  },
  addedItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addedItemsTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  addedItemsList: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  itemsScroll: {
    maxHeight: 300,
  },
  itemCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  marketplaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  marketplaceIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  marketplaceText: {
    fontSize: 12,
    color: '#666',
  },
  dateAdded: {
    fontSize: 12,
    color: '#999',
  },
  noItems: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  itemMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  itemTextInfo: {
    flex: 1,
  },
  itemSizes: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default Accounts;
