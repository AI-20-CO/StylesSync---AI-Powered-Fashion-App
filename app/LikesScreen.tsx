import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  TextInput,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { 
  getUserLikedProducts, 
  unlikeProduct, 
  FashionItemForDisplay,
  formatPrice,
  addToCart,
  removeFromCart,
  getUserCartItems,
} from '../backend/supabaseItems';
import { useLikes } from '../context/LikesContext';
import { useCart } from '../context/CartContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './MainTabsScreen';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface LikesScreenProps {
  onBack: () => void;
}

// Add icons object for preloading
const icons = {
  back: require('../assets/images/arrow for back.png'),
  likes: require('../assets/images/likes.png'),
  heart: require('../assets/images/heart.png'),
  carts: require('../assets/images/carts.png'),
  search: require('../assets/images/search.png'),
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const LikesScreen: React.FC<LikesScreenProps> = ({ onBack }) => {
  const { user } = useUser();
  const { exitFromLikes } = useLikes();
  const navigation = useNavigation<NavigationProp>();
  const [likedProducts, setLikedProducts] = useState<FashionItemForDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [cartStates, setCartStates] = useState<Record<number, boolean>>({});
  const [isExiting, setIsExiting] = useState(false);
  const { cartCount, updateCartCount } = useCart();

  // Animation refs
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(30)).current;

  // Animation values for each product
  const [productAnimations] = useState<{[key: number]: Animated.Value}>({});

  const getProductAnimation = (productId: number) => {
    if (!productAnimations[productId]) {
      productAnimations[productId] = new Animated.Value(1);
    }
    return productAnimations[productId];
  };

  // Handle back navigation with animation
  const handleBack = useCallback(() => {
    if (isExiting) return; // Prevent multiple triggers
    setIsExiting(true);
    
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      exitFromLikes();
      if (onBack) onBack();
    });
  }, [exitFromLikes, onBack, screenOpacity, screenTranslateY, isExiting]);

  // Load liked products when screen mounts
  useEffect(() => {
    loadLikedProducts();
    
    // Animate screen entrance
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
  }, []);

  // Refresh cart states when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have products loaded
      if (likedProducts.length > 0) {
        loadCartStates();
      }
    }, [likedProducts])
  );

  const loadLikedProducts = async () => {
    console.log('🔍 LikesScreen: Starting loadLikedProducts...');
    console.log('🔍 LikesScreen: User ID:', user?.id);
    
    if (!user?.id) {
      console.log('❌ LikesScreen: No user ID found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 LikesScreen: Calling getUserLikedProducts...');
      const products = await getUserLikedProducts(user.id, 0, 20);
      console.log('✅ LikesScreen: Got products:', products.length);
      setLikedProducts(products);
      setHasMore(products.length === 20);
      
      // Also load cart states to sync with actual cart contents
      await loadCartStates(products);
    } catch (error) {
      console.error('❌ LikesScreen: Error loading liked products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartStates = async (productsToCheck?: FashionItemForDisplay[]) => {
    if (!user?.id) return;
    
    try {
      console.log('🛒 LikesScreen: Loading cart states...');
      const cartResult = await getUserCartItems(user.id);
      
      if (cartResult.success) {
        // Create a map of product IDs that are in the cart
        const cartProductIds = new Set(cartResult.data.map(item => item.id));
        
        // Use provided products or current liked products
        const products = productsToCheck || likedProducts;
        
        // Update cart states based on actual cart contents
        const newCartStates: Record<number, boolean> = {};
        products.forEach(product => {
          newCartStates[product.id] = cartProductIds.has(product.id);
        });
        
        console.log('✅ LikesScreen: Updated cart states:', newCartStates);
        setCartStates(newCartStates);
      }
    } catch (error) {
      console.error('❌ LikesScreen: Error loading cart states:', error);
    }
  };

  const handleUnlike = async (productId: number) => {
    if (!user?.id) return;

    try {
      const result = await unlikeProduct(user.id, productId);
      if (result.success) {
        // Configure the animation
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        // Animate the product out
        Animated.sequence([
          // First scale down and fade out
          Animated.parallel([
            Animated.timing(getProductAnimation(productId), {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // Remove product from the list after animation
          setLikedProducts(prev => prev.filter(product => product.id !== productId));
        });
      }
    } catch (error) {
      console.error('Error unliking product:', error);
    }
  };

  const handleAddToCart = async (productId: number) => {
    if (!user?.id) return;

    try {
      const isInCart = cartStates[productId];
      
      if (isInCart) {
        const result = await removeFromCart(user.id, productId);
        if (result.success) {
          setCartStates(prev => ({
            ...prev,
            [productId]: false
          }));
          updateCartCount();
        }
      } else {
        // Find the product to get its sourceScreen
        const product = likedProducts.find(p => p.id === productId);
        const sourceScreen = product?.sourceScreen || 'home';
        
        const result = await addToCart(user.id, productId, 'M', null, sourceScreen);
        if (result.success) {
          // Configure animation for cart addition
          LayoutAnimation.configureNext(
            LayoutAnimation.create(
              150, // duration
              LayoutAnimation.Types.easeInEaseOut,
              LayoutAnimation.Properties.opacity
            )
          );
          
          setCartStates(prev => ({
            ...prev,
            [productId]: true
          }));
          updateCartCount();
        } else if (result.alreadyInCart) {
          Alert.alert(
            "Already in Cart",
            "This item is already in your cart.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error('Error managing cart:', error);
    }
  };

  const getMarketplaceIcon = (product: FashionItemForDisplay) => {
    // Use the source screen information to determine the correct marketplace icon
    switch (product.sourceScreen) {
      case 'rent':
        return require('../assets/images/rent.png');
      case 'p2p':
        return require('../assets/images/p2p.png');
      case 'ai':
        return require('../assets/images/ai.png');
      case 'home':
      default:
        return require('../assets/images/home.png');
    }
  };

  // Handle product click to navigate to product detail
  const handleProductClick = (product: FashionItemForDisplay) => {
    // First animate out
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Then navigate to product detail
      exitFromLikes();
      if (onBack) onBack();
      
      // Navigate to product detail with source screen info
      navigation.navigate('ProductDetail', {
        product,
        sourceScreen: (product.sourceScreen as 'home' | 'p2p' | 'ai' | 'rent' | 'search') || 'home'
      });
    });
  };

  const renderLikedProduct = (product: FashionItemForDisplay, index: number) => {
    const productAnimation = getProductAnimation(product.id);
    const isInCart = cartStates[product.id] || false;

    return (
      <Animated.View
        key={`${product.id}-${index}`}
        style={[
          styles.productCard,
          { opacity: productAnimation, transform: [{ scale: productAnimation }] }
        ]}
      >
        <TouchableOpacity 
          style={styles.productCardContent}
          onPress={() => handleProductClick(product)}
        >
          <TouchableOpacity
            style={styles.productImageContainer}
            onPress={() => handleProductClick(product)}
          >
            {/* Product Image */}
            <Image 
              source={product.image_url ? { uri: product.image_url } : require('../assets/images/ss logo black.png')} 
              style={styles.productImage} 
              resizeMode="cover"
            />
          </TouchableOpacity>
          
          {/* Product Info */}
          <View style={styles.productInfo}>
            {/* Marketplace Icon */}
            <View style={styles.marketplaceRow}>
              <Image 
                source={getMarketplaceIcon(product)} 
                style={styles.marketplaceIcon} 
              />
              <Text style={styles.productName}>{product.product_display_name}</Text>
            </View>
            
            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.likeButton} 
            onPress={() => handleUnlike(product.id)}
          >
            <Image 
              source={icons.heart}
              style={[
                styles.actionIcon, 
                { 
                  tintColor: '#E8B4B8',
                  opacity: 1
                }
              ]} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addButton, isInCart && styles.addButtonActive]}
            onPress={() => handleAddToCart(product.id)}
          >
            <Image 
              source={icons.carts}
              style={[styles.actionIcon, { tintColor: isInCart ? '#fff' : '#333' }]} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const handleNavigateToCart = () => {
    exitFromLikes(); // Exit likes screen first
    navigation.navigate('Cart'); // Then navigate to cart
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          { flex: 1 },
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Image 
              source={icons.back}
              style={[styles.backIcon, { transform: [{ scaleX: -1 }] }]} 
            />
          </TouchableOpacity>
          
          <View style={styles.searchContainer}>
            <Image source={icons.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
            />
          </View>
          
          <TouchableOpacity onPress={handleNavigateToCart} style={styles.cartIconContainer}>
            <Image 
              source={icons.carts}
              style={styles.headerIcon} 
            />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Likes</Text>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your likes...</Text>
            </View>
          ) : likedProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No liked products yet</Text>
              <Text style={styles.emptySubtext}>Start exploring and like products you love!</Text>
            </View>
          ) : (
            likedProducts.map((product, index) => renderLikedProduct(product, index))
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#fff',
    gap: width * 0.03,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: isSmallDevice ? 18 : 20,
    height: isSmallDevice ? 18 : 20,
    tintColor: '#333',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
  },
  searchIcon: {
    width: isSmallDevice ? 16 : 18,
    height: isSmallDevice ? 16 : 18,
    marginRight: width * 0.02,
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#333',
  },
  cartIconContainer: {
    position: 'relative',
  },
  headerIcon: {
    width: isSmallDevice ? 20 : 22,
    height: isSmallDevice ? 20 : 22,
    tintColor: '#333',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#333',
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
  },
  pageTitle: {
    fontSize: isSmallDevice ? 22 : 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.04,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImageContainer: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: width * 0.03,
  },
  marketplaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.005,
  },
  marketplaceIcon: {
    width: isSmallDevice ? 14 : 16,
    height: isSmallDevice ? 14 : 16,
    marginRight: width * 0.02,
    tintColor: '#666',
  },
  productName: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.02,
  },
  currentPrice: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
  },
  originalPrice: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: width * 0.02,
    marginLeft: width * 0.03,
  },
  likeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonActive: {
    backgroundColor: '#333',
  },
  actionIcon: {
    width: isSmallDevice ? 16 : 18,
    height: isSmallDevice ? 16 : 18,
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.1,
  },
  loadingText: {
    fontSize: isSmallDevice ? 16 : 18,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.1,
  },
  emptyText: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.01,
  },
  emptySubtext: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LikesScreen; 