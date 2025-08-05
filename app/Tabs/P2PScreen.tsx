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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getPersonalizedP2PItems, formatPrice, formatRating, FashionItemForDisplay, trackUserInteraction, likeProduct, unlikeProduct, isProductLiked, getEnhancedPersonalizedP2PItems, QuestionnairePreferences } from '../../backend/supabaseItems';
import { useStylePreferences } from '../../context/StylePreferencesContext';
import ProductDetailScreen from '../ProductDetailScreen';
import LikesScreen from '../LikesScreen';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useLikes } from '../../context/LikesContext';
import CartIcon from '../../components/CartIcon';
import FilterModal, { FilterOptions } from '../../components/FilterModal';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;

type RootStackParamList = {
  MainTabs: undefined;
  Cart: undefined;
  Search: undefined;
  ProductDetail: { product: FashionItemForDisplay; sourceScreen: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const P2PScreen = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { likedProductIds, addLikedProduct, removeLikedProduct, loadLikedStateForProducts } = useLikes();
  const navigation = useNavigation<NavigationProp>();
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const { preferences } = useStylePreferences();

  // Animation refs for scroll effects
  const verticalScrollY = useRef(new Animated.Value(0)).current;
  
  // Screen transition animation
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(30)).current;

  // Product state management
  const [p2pProducts, setP2pProducts] = useState<FashionItemForDisplay[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Animation refs for new items
  const newItemAnimations = useRef<{ [key: string]: Animated.Value }>({});

  // Navigation state for product detail
  const [selectedProduct, setSelectedProduct] = useState<FashionItemForDisplay | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  // Update scroll position tracking to use ref
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPosition = useRef(0);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    priceRange: [0, 1000],
    gender: [],
    style: [],
    sortBy: '',
  });
  const [filterIconAnimation] = useState(new Animated.Value(1));

  // Add icons object for preloading
  const icons = {
    back: require('../../assets/images/arrow for back.png'),
    likes: require('../../assets/images/likes.png'),
    heart: require('../../assets/images/heart.png'),
    carts: require('../../assets/images/carts.png'),
    search: require('../../assets/images/search.png'),
    logo: require('../../assets/images/ss logo black.png'),
    filter: require('../../assets/images/filter.png'),
  };

  // Add filtered products state
  const [filteredProducts, setFilteredProducts] = useState<FashionItemForDisplay[]>([]);

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

      return () => {
        // Reset animation values when screen loses focus
        screenOpacity.setValue(0);
        screenTranslateY.setValue(30);
      };
    }, [])
  );

  // Load initial data when component mounts
  useEffect(() => {
    if (user?.id && p2pProducts.length === 0) {
      loadInitialP2PProducts();
    }
  }, [user?.id]);

  // Load liked products when products change
  useEffect(() => {
    if (user?.id && p2pProducts.length > 0) {
      loadLikedStateForProducts(p2pProducts.map(p => p.id));
    }
  }, [user?.id, p2pProducts]);

  // Filter animation
  useEffect(() => {
    if (hasActiveFilters()) {
      // Start continuous blinking animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(filterIconAnimation, {
            toValue: 0.3, // More dim
            duration: 800, // Faster
            useNativeDriver: true,
          }),
          Animated.timing(filterIconAnimation, {
            toValue: 1,
            duration: 800, // Faster
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation and reset opacity
      filterIconAnimation.stopAnimation();
      filterIconAnimation.setValue(1);
    }

    // Cleanup animation on unmount
    return () => {
      filterIconAnimation.stopAnimation();
    };
  }, [activeFilters]);

  // Update useEffect for p2pProducts to apply filters to new products
  useEffect(() => {
    if (p2pProducts.length > 0) {
      // If filters are active, apply them to all products
      if (hasActiveFilters()) {
        const filtered = applyFilters(p2pProducts, activeFilters);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(p2pProducts);
      }
    }
  }, [p2pProducts, activeFilters]); // Add activeFilters as dependency

  const hasActiveFilters = () => {
    return (
      activeFilters.gender.length > 0 ||
      activeFilters.style.length > 0 ||
      activeFilters.sortBy !== '' ||
      activeFilters.priceRange[0] !== 0 ||
      activeFilters.priceRange[1] !== 1000
    );
  };

  const applyFilters = (products: FashionItemForDisplay[], filters: FilterOptions) => {
    return products.filter(product => {
      // Defensive: ensure price is a number
      const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
      // Price filter
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // Gender filter
      if (filters.gender.length > 0 && !filters.gender.includes(product.gender)) {
        return false;
      }

      // Style filter
      if (filters.style.length > 0 && !filters.style.includes(product.article_type)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Defensive: ensure price is a number for sorting
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price);
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price);
      switch (filters.sortBy) {
        case 'Price: Low to High':
          return priceA - priceB;
        case 'Price: High to Low':
          return priceB - priceA;
        case 'Newest First':
          return b.id - a.id;
        case 'Popular':
          return b.myntra_rating - a.myntra_rating;
        default:
          return 0;
      }
    });
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
    const filtered = applyFilters(p2pProducts, filters);
    setFilteredProducts(filtered);
  };

  // Function to create zoom-in animation for new items
  const createNewItemAnimation = (itemKey: string, delay = 0) => {
    if (!newItemAnimations.current[itemKey]) {
      newItemAnimations.current[itemKey] = new Animated.Value(0);
      
      // Start zoom-in animation with consistent timing
      setTimeout(() => {
        Animated.spring(newItemAnimations.current[itemKey], {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, delay);
    }
    return newItemAnimations.current[itemKey];
  };

  const loadInitialP2PProducts = async () => {
    // Skip if we already have products
    if (p2pProducts.length > 0) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading initial P2P products...');
      
      console.log('🎯 P2P using normal recommendations (no questionnaire preferences)');
      
      const products = await getEnhancedPersonalizedP2PItems(user?.id || '', null, 0, 10); // P2P uses normal recommendations
      
        setP2pProducts(products);
        setPage(1);
      setHasMore(products.length > 0); // Set hasMore to true if any items returned
      console.log(`✅ Loaded ${products.length} initial P2P products, hasMore: ${products.length > 0}`);
      
    } catch (error) {
      console.error('❌ Error loading initial P2P products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreP2PProducts = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      console.log(`🔄 Loading more P2P products (page ${page})...`);
      
      // P2P uses normal recommendations (no questionnaire preferences)
      
      const newProducts = await getEnhancedPersonalizedP2PItems(user?.id || '', null, page, 10); // P2P uses normal recommendations
      
      if (newProducts.length > 0) {
        setP2pProducts(prev => [...prev, ...newProducts]);
        setPage(prev => prev + 1);
        console.log(`✅ Loaded ${newProducts.length} more P2P products`);
        
        // Pre-create animations for new items with staggered delays
        newProducts.forEach((item, index) => {
          const itemKey = `p2p-${item.id}-${p2pProducts.length + index}`;
          createNewItemAnimation(itemKey, index * 50); // 50ms delay between each item
        });
      } else {
        setHasMore(false);
        console.log('📭 No more P2P products to load');
      }
    } catch (error) {
      console.error('❌ Error loading more P2P products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrollEnd = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreP2PProducts();
    }
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

  // Handle like toggle
  const handleLikeToggle = async (productId: number, event?: any) => {
    if (event) {
      event.stopPropagation(); // Prevent triggering product click
    }
    
    if (!user?.id) return;

    try {
      const isLiked = likedProductIds.has(productId);
      
      if (isLiked) {
        const result = await unlikeProduct(user.id, productId);
        if (result.success) {
          removeLikedProduct(productId);
          // Track unlike interaction (optional, for analytics)
          await trackUserInteraction(user.id, productId, 'view'); // Use view weight for unlike
        }
      } else {
        const result = await likeProduct(user.id, productId, 'p2p');
        if (result.success) {
          addLikedProduct(productId);
          // Track like interaction
          await trackUserInteraction(user.id, productId, 'like');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle back from product detail
  const handleBackFromDetail = () => {
    setSelectedProduct(null);
    setShowProductDetail(false);
    
    // Restore scroll position after a short delay to allow render
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: scrollPosition.current,
        animated: false
      });
    }, 50);
  };

  const handleLikesPress = () => {
    setShowLikesOverlay(true);
  };

  const handleBackFromLikes = () => {
    setShowLikesOverlay(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  // Save scroll position when scrolling
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: verticalScrollY } } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        scrollPosition.current = event.nativeEvent.contentOffset.y;
      }
    }
  );

  const renderProductCard = (item: FashionItemForDisplay, index: number) => {
    // Create animation value for this item if it doesn't exist
    const itemKey = `p2p-${item.id}-${index}`;
    if (!newItemAnimations.current[itemKey]) {
      newItemAnimations.current[itemKey] = new Animated.Value(0);
      // Start animation
      Animated.spring(newItemAnimations.current[itemKey], {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
    
    const itemAnimation = newItemAnimations.current[itemKey];

    return (
      <TouchableOpacity 
        key={itemKey}
        onPress={() => handleProductClick(item)}
        style={styles.productCardContainer}
      >
        <Animated.View style={[
          styles.productCard,
          {
            transform: [
              { scale: itemAnimation },
              { translateY: itemAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}
            ],
            opacity: itemAnimation
          }
        ]}>
          {/* Image container with size badge */}
          <View style={styles.imageContainer}>
            <Image 
              source={item.image_url ? { uri: item.image_url } : icons.logo} 
              style={[styles.productImage, styles.verticalProductImage]} 
            />
            <View style={styles.sizeOverlay}>
              <Text style={styles.productSize}>{item.size}</Text>
            </View>
          </View>
          
          {/* Rating section */}
          {item.myntra_rating && (
            <View style={styles.ratingContainer}>
              <View style={styles.ratingSection}>
                <Image source={require('../../assets/images/rating.png')} style={styles.ratingImage} />
                <Text style={styles.verticalProductRating}>{formatRating(item.myntra_rating)}</Text>
              </View>
            </View>
          )}
          
          {/* Price and like section */}
          <View style={styles.verticalProductInfo}>
            <View style={styles.verticalPriceSection}>
              <Text style={styles.verticalProductPrice}>{formatPrice(item.price)}</Text>
              {item.originalPrice && (
                <Text style={styles.verticalOriginalPrice}>{formatPrice(item.originalPrice)}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.verticalLikeButton}
              onPress={(event) => handleLikeToggle(item.id, event)}
            >
              <Image 
                source={likedProductIds.has(item.id) ? icons.heart : icons.likes}
                style={[
                  styles.likeIcon, 
                  { 
                    tintColor: likedProductIds.has(item.id) ? '#E8B4B8' : '#333',
                    opacity: likedProductIds.has(item.id) ? 1 : 0.8
                  }
                ]} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Modify your renderProductList to use filteredProducts instead of p2pProducts
  const renderProductList = () => {
    return (
      <View style={styles.productsContainer}>
        {filteredProducts.map((item, index) => renderProductCard(item, index))}
      </View>
    );
  };

  // Handle product detail navigation
  useEffect(() => {
    if (showProductDetail && selectedProduct) {
      navigation.navigate('ProductDetail', {
        product: selectedProduct,
        sourceScreen: 'p2p'
      });
      setShowProductDetail(false);
    }
  }, [showProductDetail, selectedProduct, navigation]);

  // Show likes screen if selected
  if (showLikesOverlay) {
    return <LikesScreen onBack={handleBackFromLikes} />;
  }

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
          <Image source={icons.logo} style={styles.headerLogo} />
          
          {/* Search Box */}
          <TouchableOpacity 
            style={styles.searchContainer}
            onPress={() => navigation.navigate('Search')}
          >
            <Image source={icons.search} style={styles.searchIcon} />
            <Text style={styles.searchInput}>Search</Text>
          </TouchableOpacity>
          
          {/* Likes Icon */}
          <TouchableOpacity onPress={handleLikesPress}>
            <Image source={icons.likes} style={styles.headerIcon} />
          </TouchableOpacity>
          
          {/* Carts Icon */}
          <CartIcon />
        </View>

        {/* Discover Section */}
        <View style={styles.discoverSection}>
          <Text style={styles.discoverTitle}>Discover</Text>
          <TouchableOpacity 
            onPress={() => setShowFilter(true)}
          >
            <Animated.Image 
              source={icons.filter}
              style={[
                styles.filterIcon,
                { opacity: filterIconAnimation }
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Full Width Vertical Scroll Container */}
        <View style={styles.fullWidthVerticalScrollContainer}>
          <Animated.ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.verticalScrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleScrollEnd}
          >
            <View style={styles.productGrid}>
              {filteredProducts.map((item, index) => {
                if (index % 2 === 0) {
                  return (
                    <View key={`p2p-row-${index}`} style={styles.productRow}>
                      {renderProductCard(item, index)}
                      {filteredProducts[index + 1] && renderProductCard(filteredProducts[index + 1], index + 1)}
                    </View>
                  );
                }
                return null;
              })}
              
              {/* Loading indicator */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading more...</Text>
                </View>
              )}
            </View>
          </Animated.ScrollView>
        </View>

        {/* Filter Modal */}
        <FilterModal
          isVisible={showFilter}
          onClose={() => setShowFilter(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={activeFilters}
        />
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
  
  // Header Styles (same as HomePage)
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
  headerIcon: {
    width: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
    height: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
  },
  cartsIcon: {
    tintColor: '#333',
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    paddingVertical: height * 0.015,
  },
  pageTitle: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#333',
  },

  // Discover Section
  discoverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  discoverTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  filterIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  // Vertical Scroll Styles (same as HomePage)
  fullWidthVerticalScrollContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    flex: 1,
    marginBottom: -(isSmallDevice ? 75 : isMediumDevice ? 80 : 85),
    paddingBottom: isSmallDevice ? 95 : isMediumDevice ? 100 : 105,
  },
  verticalScrollContent: {
    padding: width * 0.03,
    paddingTop: width * 0.05,
  },
  
  // Product Card Styles (same as HomePage vertical cards)
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  productsContainer: {
    gap: width * 0.03,
  },
  scrollView: {
    flex: 1,
  },
  productCardContainer: {
    flex: 1,
  },
});

export default P2PScreen; 