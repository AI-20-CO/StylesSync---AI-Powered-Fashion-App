import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { 
  getAISuggestions, 
  getExcitingOffers, 
  formatPrice, 
  formatRating,
  FashionItemForDisplay,
  likeProduct,
  unlikeProduct,
  isProductLiked,
  getPersonalizedRecommendations,
  trackUserInteraction,
  getPersonalizedExcitingOffers,
  ensureUserInDatabase,
  getEnhancedPersonalizedRecommendations,
  getEnhancedPersonalizedExcitingOffers,
  QuestionnairePreferences
} from '../../backend/supabaseItems';
import { useStylePreferences } from '../../context/StylePreferencesContext';
import ProductDetailScreen from '../ProductDetailScreen';
import LikesScreen from '../LikesScreen';
import { useLikes } from '../../context/LikesContext';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import CartIcon from '../../components/CartIcon';
import FaceScanScreen from '../FaceScanScreen';

type RootStackParamList = {
  MainTabs: undefined;
  Cart: undefined;
  Search: undefined;
  ProductDetail: {
    product: FashionItemForDisplay;
    sourceScreen: 'home' | 'p2p' | 'ai' | 'rent';
  };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;

const HomePage = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { likedProductIds, addLikedProduct, removeLikedProduct, loadLikedStateForProducts } = useLikes();
  const navigation = useNavigation<NavigationProp>();
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const { preferences } = useStylePreferences();
  const { setAIAnalysisActive } = useAIAnalysis();

  // State for fashion items from Supabase
  const [aiSuggestions, setAISuggestions] = useState<FashionItemForDisplay[]>([]);
  const [excitingOffers, setExcitingOffers] = useState<FashionItemForDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track liked products
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());
  
  // Track which items should animate (only new pagination items)
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  
  // Animation refs for new items
  const newItemAnimations = useRef<{ [key: string]: Animated.Value }>({});
  
  // Pagination state
  const [aiPage, setAiPage] = useState(0);
  const [offersPage, setOffersPage] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [aiHasMore, setAiHasMore] = useState(true);
  const [offersHasMore, setOffersHasMore] = useState(true);

  // Navigation state for product detail
  const [selectedProduct, setSelectedProduct] = useState<FashionItemForDisplay | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  // Face scan state
  const [showFaceScan, setShowFaceScan] = useState(false);

  // Scroll position preservation
  const [aiScrollPosition, setAiScrollPosition] = useState(0);
  const [offersScrollPosition, setOffersScrollPosition] = useState(0);
  const aiScrollViewRef = useRef<ScrollView>(null);
  const offersScrollViewRef = useRef<ScrollView>(null);

  // Animation refs for scroll effects
  const horizontalScrollX = useRef(new Animated.Value(0)).current;
  const verticalScrollY = useRef(new Animated.Value(0)).current;
  
  // Animation for offer icon
  const offerIconOpacity = useRef(new Animated.Value(1)).current;
  
  // Screen transition animation
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(30)).current;

  // Debounced scroll handler to prevent rapid firing
  const debouncedScrollHandler = useRef<NodeJS.Timeout | null>(null);

  // Screen focus animation
  useFocusEffect(
    React.useCallback(() => {
      // Animate in when screen comes into focus
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

      // Restore scroll positions when returning from product detail
      if (aiScrollPosition > 0 && aiScrollViewRef.current) {
        setTimeout(() => {
          aiScrollViewRef.current?.scrollTo({ y: aiScrollPosition, animated: false });
        }, 100);
      }
      
      if (offersScrollPosition > 0 && offersScrollViewRef.current) {
        setTimeout(() => {
          offersScrollViewRef.current?.scrollTo({ y: offersScrollPosition, animated: false });
        }, 100);
      }

      return () => {
        // Reset animation values when screen loses focus
        screenOpacity.setValue(0);
        screenTranslateY.setValue(30);
      };
    }, [aiScrollPosition, offersScrollPosition])
  );

  // Start continuous dimming and lighting animation
  useEffect(() => {
    const animateOfferIcon = () => {
      Animated.sequence([
        Animated.timing(offerIconOpacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(offerIconOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animateOfferIcon());
    };
    
    animateOfferIcon();
  }, []);

  // Cleanup debounced scroll handler on unmount
  useEffect(() => {
    return () => {
      if (debouncedScrollHandler.current) {
        clearTimeout(debouncedScrollHandler.current);
      }
    };
  }, []);

  // Load fashion data from Supabase on component mount
  useEffect(() => {
    const loadFashionData = async () => {
      try {
        setLoading(true);
        
        // First, ensure user exists in database
        if (user?.id && user?.emailAddresses?.[0]?.emailAddress) {
          console.log('🔄 Checking user in database...');
          const syncResult = await ensureUserInDatabase(
            user.id,
            user.emailAddresses[0].emailAddress,
            user.firstName,
            user.lastName,
            user.imageUrl
          );
          
          if (!syncResult.success) {
            console.error('⚠️ User sync warning:', syncResult.error);
            // Continue loading data even if sync fails
          }
        }
        
        // Reset pagination states to ensure fresh start
        setAiPage(0);
        setOffersPage(0);
        setAiHasMore(true);
        setOffersHasMore(true);
        console.log('🔄 Reset pagination states');
        
        console.log('🔄 Starting to load initial fashion data from Supabase...');
        
        // Add cache buster to ensure fresh recommendations on each reload
        const cacheBuster = Date.now();
        console.log(`🔄 Cache buster: ${cacheBuster}`);
        
        console.log('🎯 HomePage using normal recommendations (no questionnaire preferences)');

        const [aiData, offersData] = await Promise.all([
                  getEnhancedPersonalizedRecommendations(user?.id || '', null, 0, 10), // Normal recommendations (no questionnaire)
        getEnhancedPersonalizedExcitingOffers(user?.id || '', null, 0, 10)  // Normal exciting offers (no questionnaire)
        ]);
        
        console.log('📥 Initial data received:');
        console.log('  - AI Suggestions:', aiData.length, 'items');
        console.log('  - Exciting Offers:', offersData.length, 'items');
        
        setAISuggestions(aiData);
        setExcitingOffers(offersData);
        
        // Check if there's more data available (accounting for filtering)
        setAiHasMore(aiData.length > 0); // If we get any items, assume more available
        setOffersHasMore(offersData.length > 0); // If we get any items, assume more available
        
        console.log('✅ Successfully loaded initial fashion data');
        console.log(`📊 Initial hasMore states - AI: ${aiData.length > 0}, Offers: ${offersData.length > 0}`);
        console.log(`📊 Final pagination states - aiPage: 0, offersPage: 0, aiHasMore: ${aiData.length > 0}, offersHasMore: ${offersData.length > 0}`);
        
        // Log first few items for debugging
        if (offersData.length > 0) {
          console.log('🔍 First exciting offer item:', offersData[0]);
        } else {
          console.log('⚠️ No exciting offers to display');
        }
      } catch (error) {
        console.error('❌ Error loading fashion data:', error);
        // Add fallback data for testing if Supabase fails
        const fallbackAI = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          product_display_name: `Fallback Item ${i + 1}`,
          brand_name: 'Test Brand',
          price: 99.99,
          myntra_rating: 4.0,
          base_colour: 'Blue',
          gender: 'Unisex',
          article_type: 'Shirt',
          image_url: '',
          size: 'M'
        }));

        const fallbackOffers = Array.from({ length: 12 }, (_, i) => ({
          id: i + 100,
          product_display_name: `Offer Item ${i + 1}`,
          brand_name: 'Sale Brand',
          price: 49.99,
          myntra_rating: 4.2,
          base_colour: 'Red',
          gender: 'Unisex',
          article_type: 'T-Shirt',
          image_url: '',
          size: 'L'
        }));
        
        setAISuggestions(fallbackAI);
        setExcitingOffers(fallbackOffers);
        console.log('🔄 Using fallback data');
      } finally {
        setLoading(false);
      }
    };

    loadFashionData();
  }, [user?.id]);

  // Function to create zoom-in animation for new items
  const createNewItemAnimation = (itemKey: string) => {
    if (!newItemAnimations.current[itemKey]) {
      newItemAnimations.current[itemKey] = new Animated.Value(0);
      
      // Start zoom-in animation immediately
      Animated.spring(newItemAnimations.current[itemKey], {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
    return newItemAnimations.current[itemKey];
  };

  // Function to load more AI suggestions
  const loadMoreAISuggestions = async () => {
    if (aiLoading || !aiHasMore) return;
    
    setAiLoading(true);
    console.log('🔄 Loading more AI suggestions...');
    
    try {
      const nextPage = aiPage + 1;
      // HomePage uses normal recommendations (no questionnaire preferences)

              const newData = await getEnhancedPersonalizedRecommendations(user?.id || '', null, nextPage, 10);
      
      if (newData.length > 0) {
        const currentLength = aiSuggestions.length;
        setAISuggestions(prev => [...prev, ...newData]);
        setAiPage(nextPage);
        
        // Update hasMore based on returned items (accounting for filtering)
        setAiHasMore(newData.length > 0); // If we get any items, assume more available
        console.log(`✅ Loaded ${newData.length} more AI suggestions (page ${nextPage}), hasMore: ${newData.length > 0}`);
        
        // Mark new items for animation and create their animations
        const newAnimatingItems = new Set<string>();
        newData.forEach((item, index) => {
          const itemKey = `ai-${item.id}-${currentLength + index}`;
          newAnimatingItems.add(itemKey);
          createNewItemAnimation(itemKey);
          console.log(`🎬 Creating animation for item: ${itemKey}`);
        });
        
        // Update animating items set
        setAnimatingItems(prev => new Set([...prev, ...newAnimatingItems]));
        
        // Remove items from animating set after animation completes
        setTimeout(() => {
          setAnimatingItems(prev => {
            const updated = new Set(prev);
            newAnimatingItems.forEach(key => updated.delete(key));
            return updated;
          });
        }, 1000); // Animation duration
      } else {
        setAiHasMore(false);
        console.log('📭 No more AI suggestions available');
      }
    } catch (error) {
      console.error('❌ Error loading more AI suggestions:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Function to load more exciting offers
  const loadMoreExcitingOffers = async () => {
    if (offersLoading || !offersHasMore) return;
    
    setOffersLoading(true);
    console.log('🔄 Loading more exciting offers...');
    
    try {
      const nextPage = offersPage + 1;
      // Convert preferences for pagination requests
      // HomePage uses normal recommendations (no questionnaire preferences)

              const newData = await getEnhancedPersonalizedExcitingOffers(user?.id || '', null, nextPage, 10);
      
      if (newData.length > 0) {
        const currentLength = excitingOffers.length;
        setExcitingOffers(prev => [...prev, ...newData]);
        setOffersPage(nextPage);
        
        // Update hasMore based on returned items (accounting for filtering)
        setOffersHasMore(newData.length > 0); // If we get any items, assume more available
        console.log(`✅ Loaded ${newData.length} more exciting offers (page ${nextPage}), hasMore: ${newData.length > 0}`);
        
        // Mark new items for animation and create their animations
        const newAnimatingItems = new Set<string>();
        newData.forEach((item, index) => {
          const itemKey = `offers-${item.id}-${currentLength + index}`;
          newAnimatingItems.add(itemKey);
          createNewItemAnimation(itemKey);
          console.log(`🎬 Creating animation for item: ${itemKey}`);
        });
        
        // Update animating items set
        setAnimatingItems(prev => new Set([...prev, ...newAnimatingItems]));
        
        // Clear animations after they complete
        setTimeout(() => {
          setAnimatingItems(prev => {
            const newSet = new Set(prev);
            newAnimatingItems.forEach(key => newSet.delete(key));
            return newSet;
          });
        }, 1000);
      } else {
        setOffersHasMore(false);
        console.log('📄 No more exciting offers available');
      }
    } catch (error) {
      console.error('❌ Error loading more exciting offers:', error);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  // Handle horizontal scroll end for AI suggestions
  const handleHorizontalScrollEnd = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 200; // Increased from 100px to 200px to trigger earlier
    
    if (contentOffset.x >= contentSize.width - layoutMeasurement.width - paddingToBottom) {
      console.log('🔄 Horizontal scroll end detected, triggering loadMoreAISuggestions');
      loadMoreAISuggestions();
    }
  };

  // Handle vertical scroll for exciting offers (simplified)
  const handleVerticalScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 300; // Trigger loading when 300px from bottom
    
    // Clear any existing timeout
    if (debouncedScrollHandler.current) {
      clearTimeout(debouncedScrollHandler.current);
    }
    
    // Only trigger if not already loading and has more content
    if (!offersLoading && offersHasMore) {
      if (contentOffset.y >= contentSize.height - layoutMeasurement.height - paddingToBottom) {
        // Debounce the pagination call
        debouncedScrollHandler.current = setTimeout(() => {
          console.log('🔄 Scroll position detected, triggering loadMoreExcitingOffers');
          loadMoreExcitingOffers();
        }, 200) as any; // 200ms delay
      }
    }
  };

  // Track scroll positions for restoration
  const handleAiScroll = (event: any) => {
    setAiScrollPosition(event.nativeEvent.contentOffset.y);
  };

  const handleOffersScroll = (event: any) => {
    setOffersScrollPosition(event.nativeEvent.contentOffset.y);
  };

    // Handle product click
  const handleProductClick = async (product: FashionItemForDisplay) => {
    // Track user interaction
    if (user?.id) {
      await trackUserInteraction(user.id, product.id, 'view');
    }

    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // Handle face scan
  const handleFaceScanPress = () => {
    setShowFaceScan(true);
    setAIAnalysisActive(true);
  };

  const handleCloseFaceScan = () => {
    setShowFaceScan(false);
    setAIAnalysisActive(false);
  };

  // Handle back from product detail
  const handleBackFromDetail = () => {
    setSelectedProduct(null);
    setShowProductDetail(false);
  };

  const handleLikeToggle = async (productId: number, event?: any) => {
    if (event) {
      event.stopPropagation(); // Prevent triggering product click
    }
    
    if (!user?.id) return;

    try {
      const isLiked = likedProducts.has(productId);
      
      if (isLiked) {
        const result = await unlikeProduct(user.id, productId);
        if (result.success) {
          setLikedProducts(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
          // Track unlike interaction (optional, for analytics)
          await trackUserInteraction(user.id, productId, 'view'); // Use view weight for unlike
        }
      } else {
        const result = await likeProduct(user.id, productId, 'home');
        if (result.success) {
          setLikedProducts(prev => new Set(prev).add(productId));
          // Track like interaction
          await trackUserInteraction(user.id, productId, 'like');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Add icons object for preloading
  const icons = {
    back: require('../../assets/images/arrow for back.png'),
    likes: require('../../assets/images/likes.png'),
    heart: require('../../assets/images/heart.png'),
    carts: require('../../assets/images/carts.png'),
    search: require('../../assets/images/search.png'),
    logo: require('../../assets/images/ss logo black.png'),
  };

  const renderProductCard = (item: any, isHorizontal = false, index?: number, key?: string) => {
    let animatedStyle = {};
    
    // Only apply zoom-in animation to items marked for animation (new pagination items)
    let zoomInScale: Animated.Value | null = null;
    if (key && animatingItems.has(key)) {
      const animValue = newItemAnimations.current[key];
      if (animValue) {
        zoomInScale = animValue;
      }
    }
    
    if (isHorizontal && index !== undefined) {
      // Horizontal scroll animation
      const cardWidth = width * 0.4 + width * 0.03; // card width + gap
      const centerOffset = width * 0.2; // Adjust this value to fine-tune centering
      
      const inputRange = [
        (index - 1) * cardWidth - centerOffset,
        index * cardWidth - centerOffset,
        (index + 1) * cardWidth - centerOffset,
      ];
      
      const scrollScale = horizontalScrollX.interpolate({
        inputRange,
        outputRange: [0.9, 1.1, 0.9],
        extrapolate: 'clamp',
      });
      
      // Combine scroll scale with zoom-in scale if available
      const finalScale = zoomInScale ? Animated.multiply(
        scrollScale,
        zoomInScale.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
          extrapolate: 'clamp',
        })
      ) : scrollScale;
      
      const opacity = horizontalScrollX.interpolate({
        inputRange,
        outputRange: [0.6, 1, 0.6],
        extrapolate: 'clamp',
      });
      
      const shadowOpacity = horizontalScrollX.interpolate({
        inputRange,
        outputRange: [0.1, 0.3, 0.1],
        extrapolate: 'clamp',
      });
      
      animatedStyle = {
        transform: [{ scale: finalScale }],
        opacity,
        shadowOpacity,
        borderRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
      };
    } else if (!isHorizontal && index !== undefined) {
      // Remove vertical scroll animation to prevent blinking
      // Only apply zoom-in animation if available
      if (zoomInScale) {
        const zoomScale = zoomInScale.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        extrapolate: 'clamp',
      });
      
        animatedStyle = {
          transform: [{ scale: zoomScale }],
        };
      }
    } else if (zoomInScale) {
      // For items without scroll animation, just apply zoom-in
      const zoomScale = zoomInScale.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
        extrapolate: 'clamp',
      });
      
      animatedStyle = {
        transform: [{ scale: zoomScale }],
      };
    }

    return (
      <TouchableOpacity 
        key={key} 
        onPress={() => handleProductClick(item)}
        activeOpacity={0.8}
        style={!isHorizontal ? { flex: 1 } : undefined}
      >
      <Animated.View
        style={[
          styles.productCard, 
          isHorizontal && styles.horizontalProductCard,
          animatedStyle
        ]}
      >
        {/* Image container with size badge */}
        <View style={styles.imageContainer}>
          <Image 
            source={item.image_url ? { uri: item.image_url } : item.image} 
            style={[styles.productImage, !isHorizontal && styles.verticalProductImage, isHorizontal && styles.horizontalProductImage]} 
          />
          <View style={styles.sizeOverlay}>
            <Text style={styles.productSize}>{item.size}</Text>
          </View>
        </View>
        
        {/* Rating section - only for vertical cards */}
        {!isHorizontal && item.myntra_rating && (
          <View style={styles.ratingContainer}>
            <View style={styles.ratingSection}>
              <Image source={require('../../assets/images/rating.png')} style={styles.ratingImage} />
              <Text style={styles.verticalProductRating}>{formatRating(item.myntra_rating)}</Text>
            </View>
          </View>
        )}
        
        {/* Price and like section */}
        {isHorizontal ? (
          <View style={[styles.productInfo, styles.horizontalProductInfo]}>
            <View style={styles.priceSection}>
              <Text style={[styles.productPrice, styles.horizontalProductPrice]}>
                {typeof item.price === 'number' ? formatPrice(item.price) : item.price}
              </Text>
              {item.originalPrice && (
                <Text style={styles.originalPrice}>
                  {typeof item.originalPrice === 'number' ? formatPrice(item.originalPrice) : item.originalPrice}
                </Text>
              )}
              {item.myntra_rating && (
                <Text style={styles.productRating}>{formatRating(item.myntra_rating)}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.likeButton} onPress={(event) => handleLikeToggle(item.id, event)}>
              <Image 
                source={likedProducts.has(item.id) ? icons.heart : icons.likes}
                style={[
                  styles.likeIcon, 
                  { tintColor: likedProducts.has(item.id) ? '#E8B4B8' : '#333' }
                ]} 
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.verticalProductInfo}>
            <View style={styles.verticalPriceSection}>
              <Text style={styles.verticalProductPrice}>
                {typeof item.price === 'number' ? formatPrice(item.price) : item.price}
              </Text>
              {item.originalPrice && (
                <Text style={styles.verticalOriginalPrice}>
                  {typeof item.originalPrice === 'number' ? formatPrice(item.originalPrice) : item.originalPrice}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.verticalLikeButton} onPress={(event) => handleLikeToggle(item.id, event)}>
              <Image 
                source={likedProducts.has(item.id) ? icons.heart : icons.likes}
                style={[
                  styles.likeIcon, 
                  { 
                    tintColor: likedProducts.has(item.id) ? '#E8B4B8' : '#333',
                    opacity: likedProducts.has(item.id) ? 1 : 0.8
                  }
                ]} 
              />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
      </TouchableOpacity>
    );
  };

  // Handle product detail navigation
  useEffect(() => {
    if (showProductDetail && selectedProduct) {
      navigation.navigate('ProductDetail', {
        product: selectedProduct,
        sourceScreen: 'home'
      });
      setShowProductDetail(false);
    }
  }, [showProductDetail, selectedProduct, navigation]);

  const handleLikesPress = () => {
    setShowLikesOverlay(true);
  };

  const handleBackFromLikes = () => {
    setShowLikesOverlay(false);
  };

  // Show likes screen if selected
  if (showLikesOverlay) {
    return <LikesScreen onBack={handleBackFromLikes} />;
  }

  // Show face scan screen if selected
  if (showFaceScan) {
    return <FaceScanScreen onClose={handleCloseFaceScan} />;
  }

  // Add handleSearchPress function
  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.mainContainer,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* SS Logo */}
          <Image source={require('../../assets/images/ss logo black.png')} style={styles.headerLogo} />
          
          {/* Search Box */}
          <TouchableOpacity 
            style={styles.searchContainer}
            onPress={handleSearchPress}
          >
            <Image source={require('../../assets/images/search.png')} style={styles.searchIcon} />
            <Text style={styles.searchInput}>Search</Text>
          </TouchableOpacity>
          
          {/* Likes Icon */}
          <TouchableOpacity onPress={handleLikesPress}>
            <Image source={require('../../assets/images/likes.png')} style={styles.headerIcon} />
          </TouchableOpacity>
          
          {/* Carts Icon */}
          <CartIcon />
        </View>

        {/* AI Suggestions Section */}
        <View style={styles.aiSection}>
          {/* AI Icon Centered */}
          <View style={styles.aiHeader}>
            <Image source={require('../../assets/images/ai.png')} style={styles.aiIcon} />
            <Text style={styles.aiTitle}>For You</Text>
          </View>

          {/* Face Scan Button */}
          <TouchableOpacity 
            style={styles.faceScanButton} 
            onPress={handleFaceScanPress}
            activeOpacity={0.7}
          >
            <Text style={styles.faceScanText}>Personalized Recommendations</Text>
          </TouchableOpacity>
          
          {/* Horizontal Scroll Container */}
          <View style={styles.horizontalScrollContainer}>
            <Animated.ScrollView 
              ref={aiScrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: horizontalScrollX } } }],
                { 
                  useNativeDriver: true,
                  listener: handleAiScroll // Add scroll position tracking
                }
              )}
              onMomentumScrollEnd={handleHorizontalScrollEnd}
              scrollEventThrottle={16}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading fashion items...</Text>
                </View>
              ) : (
                <>
                  {aiSuggestions.map((item, index) => renderProductCard(item, true, index, `ai-${item.id}-${index}`))}
                  {aiLoading && (
                    <View style={styles.horizontalLoadingContainer}>
                      <Text style={styles.loadingText}>Loading more...</Text>
                    </View>
                  )}
                </>
              )}
            </Animated.ScrollView>
          </View>
        </View>

        {/* Exciting Offers Section */}
        <View style={styles.offersSection}>
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exciting offers</Text>
            <TouchableOpacity style={styles.arrowButton}>
              <Animated.Image 
                source={require('../../assets/images/offer.png')} 
                style={[styles.arrowIcon, { opacity: offerIconOpacity }]} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Full Width Vertical Scroll Container */}
          <View style={styles.fullWidthVerticalScrollContainer}>
            <Animated.ScrollView 
              ref={offersScrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.verticalScrollContent,
                { flexGrow: 1, minHeight: height * 0.4 }
              ]}
              style={{ maxHeight: height * 0.5 }}
              bounces={true}
              alwaysBounceVertical={false}
              keyboardShouldPersistTaps="handled"
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: verticalScrollY } } }],
                { 
                  useNativeDriver: true,
                  listener: handleVerticalScroll
                }
              )}
              scrollEventThrottle={32}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading exciting offers...</Text>
                </View>
              ) : excitingOffers.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>No exciting offers available</Text>
                </View>
              ) : (
                <>
                  <View style={styles.productGrid}>
                    {excitingOffers.map((item, index) => {
                      if (index % 2 === 0) {
                        return (
                          <View key={`offers-row-${index}`} style={styles.productRow}>
                            {renderProductCard(item, false, index, `offers-${item.id}-${index}`)}
                            {excitingOffers[index + 1] && renderProductCard(excitingOffers[index + 1], false, index + 1, `offers-${excitingOffers[index + 1].id}-${index + 1}`)}
                          </View>
                        );
                      }
                      return null;
                    })}
                  </View>
                  {offersLoading && (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Loading more offers...</Text>
                    </View>
                  )}
                </>
              )}
            </Animated.ScrollView>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#fff',
    gap: width * 0.03,
  },
  headerLogo: {
    width: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
    height: isSmallDevice ? 24 : isMediumDevice ? 26 : 28,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.012,
  },
  searchIcon: {
    width: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    height: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    marginRight: width * 0.02,
    tintColor: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#999',
  },
  headerIconButton: {
    width: isSmallDevice ? 36 : isMediumDevice ?  38 : 40,
    height: isSmallDevice ? 36 : isMediumDevice ? 38 : 40,
    borderRadius: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
    height: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
  },
  cartsIcon: {
    tintColor: '#333',
  },
  
  // AI Section Styles
  aiSection: {
    paddingTop: height * 0.0,
    paddingBottom: height * 0.025,
  },
  aiHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
  },
  aiIcon: {
    width: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    height: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    marginBottom: height * 0.008,
    opacity: 0.7,
  },
  aiTitle: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#333',
  },
  faceScanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginHorizontal: width * 0.19,
    marginBottom: height * 0.015,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  faceScanText: {
    fontSize: isSmallDevice ? 11 : isMediumDevice ? 12 : 13,
    fontWeight: '600',
    color: '#fff',
  },
  horizontalScrollContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    paddingVertical: height * 0.007,
    overflow: 'visible',
  },
  horizontalScrollContent: {
    paddingHorizontal: width * 0.004,
    gap: width * 0.03,
    paddingVertical: height * 0.010,
  },
  
  // Offers Section Styles
  offersSection: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.005,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#333',
  },
  arrowButton: {
    padding: 0,
  },
  arrowIcon: {
    width: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
    height: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
  },
  loadingAnimation: {
    width: isSmallDevice ? 50 : isMediumDevice ? 60 : 70,
    height: isSmallDevice ? 50 : isMediumDevice ? 60 : 70,
  },
  verticalScrollContainer: {
    backgroundColor: '#fafafa',
    borderRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    maxHeight: height * 0.5, // Limit height so only products scroll
  },
  fullWidthVerticalScrollContainer: {
    backgroundColor: '#fafafa',
    maxHeight: height * 0.5, // Set max height instead of min height
    marginHorizontal: -width * 0.04, // Extend beyond the section padding
    paddingHorizontal: width * 0.04, // Add back the padding inside
    paddingVertical: height * 0.02, // Add some vertical padding for better spacing
  },
  verticalScrollContent: {
    padding: width * 0.03,
    paddingBottom: height * 0.1, // Extra bottom padding to ensure scrollable content
  },
  
  // Product Card Styles
  productGrid: {
    gap: width * 0.03,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: width * 0.03,
    marginBottom: width * 0.03,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horizontalProductCard: {
    width: width * 0.4,
    flex: 0,
    marginHorizontal: width * 0.01,
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'visible',
    marginBottom: height * 0.015,
  },
  productImage: {
    width: '100%',
    height: isSmallDevice ? 120 : isMediumDevice ? 130 : 140,
    borderTopLeftRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    borderTopRightRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    borderBottomLeftRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    borderBottomRightRadius: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    position: 'relative',
    zIndex: 1,
  },
  verticalProductImage: {
    width: '87%',
    alignSelf: 'center',
  },
  horizontalProductImage: {
    width: '97%',
    alignSelf: 'center',
  },
  productOverlay: {
    position: 'absolute',
    bottom: height * 0.06,
    left: width * 0.02,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.005,
    borderRadius: 4,
  },
  sizeOverlay: {
    position: 'absolute',
    bottom: -height * 0.018,
    left: '50%',
    transform: [{ translateX: -width * 0.095 }],
    backgroundColor: '#f0f0f0',
    paddingHorizontal: width * 0.080,
    paddingTop: height * 0.010,
    paddingBottom: height * 0.0010,
    borderRadius: 10,
    zIndex: 0,
  },
  productSize: {
    fontSize: isSmallDevice ? 9 : isMediumDevice ? 10 : 11,
    color: '#000',
    fontWeight: '500',
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: width * 0.02,
  },
  horizontalProductInfo: {
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.015,
    position: 'relative',
    zIndex: -1,
  },
  priceSection: {
    flex: 1,
  },
  productPrice: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
    color: '#333',
  },
  horizontalProductPrice: {
    textAlign: 'center',
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
  },
  ratingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.008,
    gap: width * 0.008,
  },
  ratingImage: {
    width: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    height: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
  },
  verticalProductRating: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    color: '#666',
    textAlign: 'center',
  },
  verticalProductInfo: {
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.012,
    position: 'relative',
    zIndex: -1,
  },
  verticalPriceSection: {
    alignItems: 'center',
  },
  priceWithLikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
  },
  verticalProductPrice: {
    textAlign: 'center',
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    fontWeight: '600',
    color: '#333',
  },
  verticalOriginalPrice: {
    fontSize: isSmallDevice ? 9 : isMediumDevice ? 10 : 11,
    color: '#999',
    textDecorationLine: 'line-through',
    textAlign: 'center',
    marginTop: 2,
  },
  originalPrice: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    color: '#999',
    textDecorationLine: 'line-through',
    textAlign: 'center',
    marginTop: 2,
  },
  productRating: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    color: '#666',
    marginTop: 2,
  },
  likeButton: {
    padding: width * 0.01,
  },
  verticalLikeButton: {
    position: 'absolute',
    right: width * 0.03,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: width * 0.005,
  },
  likeIcon: {
    width: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    height: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
  },
  
  // Loading Styles
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.1,
    minWidth: width * 0.8,
  },
  horizontalLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
    width: width * 0.3,
  },
  loadingText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomePage; 