import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Animated,
  ImageURISource,
  Alert,
  Share,
} from 'react-native';
import { Asset } from 'expo-asset';
import { useUser } from '@clerk/clerk-expo';
import { FashionItemForDisplay } from '../backend/supabaseItems';
import { likeProduct, unlikeProduct, isProductLiked, addToCart, removeFromCart } from '../backend/supabaseItems';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLikes } from '../context/LikesContext';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from './MainTabsScreen';
import CartIcon from '../components/CartIcon';
import LikesScreen from './LikesScreen';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;

// Color option interface
interface ColorOption {
  color: string;
  name: string;
}

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

interface ProductDetailScreenProps {
  route: ProductDetailRouteProp;
  navigation: NavigationProp;
}

// Navigation type for this screen
type NavigationProp = StackNavigationProp<RootStackParamList>;

// Preload all icons
const icons = {
  back: require('../assets/images/arrow for back.png'),
  likes: require('../assets/images/likes.png'),
  heart: require('../assets/images/heart.png'),
  carts: require('../assets/images/carts.png'),
  logo: require('../assets/images/ss logo black.png'),
};

// Preload function
const preloadImages = async () => {
  const imageAssets = Object.values(icons).map(image => {
    if (typeof image === 'number') {
      return Asset.fromModule(image).downloadAsync();
    }
    return Promise.resolve();
  });
  await Promise.all(imageAssets);
};

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  route,
  navigation
}) => {
  const { product, sourceScreen } = route.params;
  const { user } = useUser();
  const { setShowLikes } = useLikes();
  const { updateCartCount } = useCart();
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.size || 'S');
  const [isLiked, setIsLiked] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showFloatingImage, setShowFloatingImage] = useState(false);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const likeButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const floatingImageScale = useRef(new Animated.Value(1)).current;
  const floatingImageOpacity = useRef(new Animated.Value(0)).current;
  const floatingImageTranslateY = useRef(new Animated.Value(0)).current;
  const floatingImageTranslateX = useRef(new Animated.Value(0)).current;
  const floatingHeartScale = useRef(new Animated.Value(1)).current;
  const floatingHeartOpacity = useRef(new Animated.Value(0)).current;
  const floatingHeartTranslateY = useRef(new Animated.Value(0)).current;
  const floatingHeartTranslateX = useRef(new Animated.Value(0)).current;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Map color names to hex values
  const colorNameToHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      // Primary colors
      'Red': '#DC143C',
      'Blue': '#1E90FF', 
      'Green': '#228B22',
      'Yellow': '#FFD700',
      'Orange': '#FF8C00',
      'Purple': '#9370DB',
      'Pink': '#FF1493',
      'Brown': '#8B4513',
      'Black': '#2D2D2D',
      'White': '#FFFFFF',
      'Grey': '#696969',
      'Gray': '#696969',
      
      // Variations
      'Navy Blue': '#000080',
      'Sky Blue': '#87CEEB',
      'Dark Blue': '#00008B',
      'Light Blue': '#ADD8E6',
      'Royal Blue': '#4169E1',
      'Turquoise Blue': '#40E0D0',
      'Teal': '#008080',
      
      'Dark Green': '#006400',
      'Light Green': '#90EE90',
      'Lime Green': '#32CD32',
      'Forest Green': '#228B22',
      'Olive': '#808000',
      
      'Maroon': '#800000',
      'Burgundy': '#800020',
      'Wine': '#722F37',
      'Rust': '#B7410E',
      
      'Beige': '#F5F5DC',
      'Cream': '#FFFDD0',
      'Off White': '#FAF0E6',
      'Ivory': '#FFFFF0',
      
      'Charcoal': '#36454F',
      'Charcoal Grey': '#36454F',
      'Silver': '#C0C0C0',
      'Metallic': '#B8860B',
      
      'Magenta': '#FF00FF',
      'Lavender': '#E6E6FA',
      'Violet': '#8A2BE2',
      'Coral': '#FF7F50',
      'Peach': '#FFCBA4',
      'Copper': '#B87333',
      'Gold': '#FFD700',
      'Bronze': '#CD7F32',
      
      // Multi-color fallback
      'Multi': '#808080',
      'Multicoloured': '#808080',
      'Printed': '#808080',
      'Floral': '#FF69B4',
      'Striped': '#4682B4',
      'Checked': '#32CD32',
    };

    // Normalize the color name and find match
    const normalizedName = colorName?.trim();
    if (!normalizedName) return '#808080'; // Default gray
    
    // Direct match
    if (colorMap[normalizedName]) {
      return colorMap[normalizedName];
    }
    
    // Partial match (contains color name)
    for (const [name, hex] of Object.entries(colorMap)) {
      if (normalizedName.toLowerCase().includes(name.toLowerCase())) {
        return hex;
      }
    }
    
    return '#808080'; // Default gray for unknown colors
  };

  // Generate color options from actual product data
  const generateProductColors = (): ColorOption[] => {
    const productColors: ColorOption[] = [];
    
    // Add base_colour (primary color)
    if (product.base_colour) {
      productColors.push({
        color: colorNameToHex(product.base_colour),
        name: product.base_colour
      });
    }
    
    // Add colour1 (secondary color) if different from base
    if (product.colour1 && product.colour1 !== product.base_colour) {
      productColors.push({
        color: colorNameToHex(product.colour1),
        name: product.colour1
      });
    }
    
    // Add colour2 (tertiary color) if different from base and colour1
    if (product.colour2 && 
        product.colour2 !== product.base_colour && 
        product.colour2 !== product.colour1) {
      productColors.push({
        color: colorNameToHex(product.colour2),
        name: product.colour2
      });
    }
    
    // If we have less than 3 colors, add some common defaults
    const commonColors = [
      { color: '#FFFFFF', name: 'White' },
      { color: '#2D2D2D', name: 'Black' },
      { color: '#696969', name: 'Gray' }
    ];
    
    for (const commonColor of commonColors) {
      if (productColors.length >= 3) break;
      
      // Don't add if we already have this color
      const alreadyExists = productColors.some(existing => 
        existing.color === commonColor.color || 
        existing.name.toLowerCase() === commonColor.name.toLowerCase()
      );
      
      if (!alreadyExists) {
        productColors.push(commonColor);
      }
    }
    
    // Ensure we have exactly 3 colors, trim if more
    return productColors.slice(0, 3);
  };

  // Use useMemo to generate colors once per product and keep them stable
  const colorOptions = useMemo(() => generateProductColors(), [product.id, product.base_colour, product.colour1, product.colour2]);

  // Size options - include product's size and common sizes
  const sizeOptions = useMemo(() => {
    const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const productSize = product.size;
    
    // If product has a size, make sure it's included in options
    if (productSize && !standardSizes.includes(productSize)) {
      return [...standardSizes, productSize].sort();
    }
    
    // Return standard sizes, but prioritize around the product's size
    if (productSize) {
      const productIndex = standardSizes.indexOf(productSize);
      if (productIndex !== -1) {
        // Show 3 sizes centered around the product size
        const start = Math.max(0, productIndex - 1);
        const end = Math.min(standardSizes.length, start + 3);
        return standardSizes.slice(start, end);
      }
    }
    
    // Default: show S, M, L
    return ['S', 'M', 'L'];
  }, [product.size]);

  // Get marketplace info based on source screen
  const getMarketplaceInfo = () => {
    switch (sourceScreen) {
      case 'home':
        return { name: 'Marketplace', icon: require('../assets/images/home.png') };
      case 'p2p':
        return { name: 'Marketplace', icon: require('../assets/images/p2p.png') };
      case 'ai':
        return { name: 'Marketplace', icon: require('../assets/images/ai.png') };
      case 'rent':
        return { name: 'Marketplace', icon: require('../assets/images/rent.png') };
      case 'search':
        return { name: 'Marketplace', icon: require('../assets/images/search.png') };
      default:
        return { name: 'Marketplace', icon: require('../assets/images/home.png') };
    }
  };

  const marketplaceInfo = getMarketplaceInfo();

  const formatPrice = (price: number) => {
    return `RM ${price.toFixed(2)}`;
  };

  const formatRating = (rating: number) => {
    return rating ? rating.toFixed(1) : '4.0';
  };

  useEffect(() => {
    const checkIsLiked = async () => {
      if (user?.id) {
        const liked = await isProductLiked(user.id, product.id);
        setIsLiked(liked);
      }
    };
    checkIsLiked();
  }, [product.id, user?.id]);

  // Preload images when component mounts
  useEffect(() => {
    const loadAssets = async () => {
      await preloadImages();
      setImagesLoaded(true);
    };
    loadAssets();
  }, []);

  useEffect(() => {
    // Only start entrance animation after images are loaded
    if (imagesLoaded) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [imagesLoaded]);

  const handleBack = () => {
    // Start exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const animateToLikes = () => {
    setShowFloatingHeart(true);
    floatingHeartScale.setValue(1);
    floatingHeartOpacity.setValue(1);
    floatingHeartTranslateY.setValue(0);
    floatingHeartTranslateX.setValue(0);

    Animated.parallel([
      Animated.timing(floatingHeartScale, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }),
      // Keep opacity high until near the end
      Animated.sequence([
        Animated.timing(floatingHeartOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(floatingHeartOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(floatingHeartTranslateY, {
        toValue: -height * 1.50,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(floatingHeartTranslateX, {
        toValue: width * 1.05,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowFloatingHeart(false);
    });
  };

  const handleLikeToggle = async () => {
    if (!user?.id) return;

    // Like button animation
    Animated.sequence([
      // Quick zoom in
      Animated.timing(likeButtonScaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      // Zoom out
      Animated.timing(likeButtonScaleAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (isLiked) {
        const result = await unlikeProduct(user.id, product.id);
        if (result.success) {
          setIsLiked(false);
        }
      } else {
        const result = await likeProduct(user.id, product.id);
        if (result.success) {
          setIsLiked(true);
          animateToLikes(); // Start the floating heart animation
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const animateToCart = () => {
    setShowFloatingImage(true);
    floatingImageScale.setValue(1);
    floatingImageOpacity.setValue(1);
    floatingImageTranslateY.setValue(0);
    floatingImageTranslateX.setValue(0);

    Animated.parallel([
      Animated.timing(floatingImageScale, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }),
      // Keep opacity high until near the end
      Animated.sequence([
        Animated.timing(floatingImageOpacity, {
          toValue: 1,
          duration: 400, // Stay visible for most of the animation
          useNativeDriver: true,
        }),
        Animated.timing(floatingImageOpacity, {
          toValue: 0,
          duration: 300, // Quick fade at the very end
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(floatingImageTranslateY, {
        toValue: -height * 1.50,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(floatingImageTranslateX, {
        toValue: width * 1.40,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowFloatingImage(false);
    });
  };

  const handleCartAction = async () => {
    if (!user?.id) return;
    
    if (isInCart) {
      // Remove from cart
      const result = await removeFromCart(user.id, product.id);
      if (result.success) {
        setIsInCart(false);
        updateCartCount(); // Update cart count after removing item
      }
    } else {
      // Add to cart with button animation
      Animated.sequence([
        // Quick zoom in
        Animated.timing(buttonScaleAnim, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        // Zoom out
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      // Add to cart
      // Get the selected color name
      const selectedColorName = colorOptions[selectedColor]?.name;
      console.log('🎨 Selected color for cart:', selectedColorName);
      
      const result = await addToCart(user.id, product.id, selectedSize, selectedColorName, sourceScreen);
      if (result.success) {
        setIsInCart(true);
        updateCartCount(); // Update cart count after adding item
        animateToCart(); // Start the floating image animation
      } else if (result.alreadyInCart) {
        Alert.alert(
          "Already in Cart",
          "This item is already in your cart.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handleBuyNow = () => {
    // Get the selected color name from colorOptions
    const selectedColorName = colorOptions[selectedColor]?.name;
    console.log('🎨 Selected color for purchase:', selectedColorName);
    
    // Include sourceScreen and selected color with the product
    const productWithDetails = {
      ...product,
      sourceScreen: sourceScreen,
      selectedColor: selectedColorName,
      size: selectedSize
    };
    navigation.navigate('Payment', { product: productWithDetails });
  };

  const handleLikesPress = () => {
    // Just show likes overlay instead of navigating
    setShowLikesOverlay(true);
  };

  // Handle back from likes
  const handleBackFromLikes = () => {
    setShowLikesOverlay(false);
  };

  // Handle share product
  const handleShareProduct = async () => {
    try {
      const shareContent = {
        message: `Check out this amazing ${product.product_display_name || 'product'} on StyleSync! 

${product.description || 'A great fashion item you\'ll love.'}

Price: ${formatPrice(product.discounted_price || 0)}
Rating: ${formatRating(product.myntra_rating)} ⭐

#StyleSync #Fashion #Shopping`,
        title: `${product.product_display_name || 'Product'} - StyleSync`,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing product:', error);
      Alert.alert('Error', 'Could not share product at this time');
    }
  };

  // If showing likes, render it as an overlay
  if (showLikesOverlay) {
    return <LikesScreen onBack={handleBackFromLikes} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Floating Heart */}
        {showFloatingHeart && (
          <Animated.Image
            source={icons.heart}
            style={[
              styles.floatingHeart,
              {
                opacity: floatingHeartOpacity,
                transform: [
                  { scale: floatingHeartScale },
                  { translateY: floatingHeartTranslateY },
                  { translateX: floatingHeartTranslateX },
                ],
              },
            ]}
          />
        )}

        {/* Floating Cart Image */}
        {showFloatingImage && (
          <Animated.Image
            source={product.image_url ? { uri: product.image_url } : icons.logo}
            style={[
              styles.floatingImage,
              {
                opacity: floatingImageOpacity,
                transform: [
                  { scale: floatingImageScale },
                  { translateY: floatingImageTranslateY },
                  { translateX: floatingImageTranslateX },
                ],
              },
            ]}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Image 
              source={icons.back}
              style={styles.backIcon} 
              defaultSource={icons.back}
            />
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={handleLikesPress}
              style={styles.headerIconContainer}
            >
              <Image source={icons.likes} style={styles.headerIcon} />
            </TouchableOpacity>
            <CartIcon />
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image
              source={product.image_url ? { uri: product.image_url } : icons.logo}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>

          {/* Sidebar - Marketplace */}
          <View style={styles.rightSidebar}>
            <View style={styles.marketplaceContainer}>
              <View style={styles.marketplaceLabelContainer}>
                <Text style={styles.marketplaceLabel}>Market</Text>
                <Text style={styles.marketplaceLabelSecond}>place</Text>
              </View>
              <View style={styles.marketplaceIcon}>
                <Image source={marketplaceInfo.icon} style={styles.marketplaceIconImage} />
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.colorContainer}>
              <Text style={styles.colorLabel}>Colour</Text>
              <View style={styles.colorOptions}>
                {colorOptions.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.color },
                      selectedColor === index && styles.selectedColorOption,
                    ]}
                    onPress={() => setSelectedColor(index)}
                  />
                ))}
              </View>
            </View>

            {/* Size Selection */}
            <View style={styles.sizeContainer}>
              <Text style={styles.sizeLabel}>Size</Text>
              <View style={styles.sizeOptions}>
                {sizeOptions.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeOption,
                      selectedSize === size && styles.selectedSizeOption,
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[
                      styles.sizeText,
                      selectedSize === size && styles.selectedSizeText,
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Product Details */}
          <View style={styles.productDetails}>
            <View style={styles.titleRow}>
              <Text style={styles.productTitle}>
                {product.product_display_name || 'User Item'}
              </Text>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.reviewsSection}>
                <Text style={styles.rating}>{formatRating(product.myntra_rating)}</Text>
                <Text style={styles.reviewsText}>Reviews</Text>
              </View>
              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={handleShareProduct}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/images/share.png')} 
                  style={styles.shareIcon} 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || 'A long-sleeve shirt is a versatile wardrobe essential designed for comfort and style. Made from a variety of fabrics such as cotton, polyester, linen, or blends, it offers breathability, durability, and a soft feel against the skin. Ideal for all seasons, it provides warmth in cooler weather while remaining lightweight enough for layering.'}
            </Text>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>
                {sourceScreen === 'rent' 
                  ? `RM ${product.price.toFixed(2)}/ mo` 
                  : `RM ${product.price.toFixed(2)}`
                }
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity 
                style={[styles.actionButton, isInCart && styles.actionButtonAdded]} 
                onPress={handleCartAction}
              >
                <View style={[styles.actionCircle, isInCart && styles.actionCircleAdded]}>
                  {isInCart ? (
                    <Image 
                      source={icons.carts}
                      style={[styles.actionCartIcon, { tintColor: '#fff' }]} 
                    />
                  ) : (
                    <Text style={styles.actionPlus}>+</Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={{ transform: [{ scale: likeButtonScaleAnim }] }}>
              <TouchableOpacity 
                style={styles.likeButton} 
                onPress={handleLikeToggle}
              >
                <Image 
                  source={isLiked ? icons.heart : icons.likes}
                  style={[
                    styles.actionIcon, 
                    { 
                      tintColor: isLiked ? '#E8B4B8' : '#333',
                      opacity: isLiked ? 1 : 0.8
                    }
                  ]} 
                />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
              <Text style={styles.buyButtonText}>
                {sourceScreen === 'rent' ? 'RENT NOW' : 'BUY NOW'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
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
  animatedContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    height: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    tintColor: '#333',
    transform: [{ scaleX: -1 }],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.04,
  },
  headerIconContainer: {
    padding: 5,
  },
  headerIcon: {
    width: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
    height: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
    tintColor: '#333',
  },
  logo: {
    width: isSmallDevice ? 25 : isMediumDevice ? 27 : 30,
    height: isSmallDevice ? 25 : isMediumDevice ? 27 : 30,
    resizeMode: 'contain',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#f5f5f5',
    marginTop: height * 0.05,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  rightSidebar: {
    position: 'absolute',
    right: 0,
    top: height * 0.02,
    width: width * 0.15,
    alignItems: 'center',
    gap: height * 0.03,
  },
  marketplaceContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marketplaceLabelContainer: {
    alignItems: 'center',
  },
  marketplaceLabel: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  marketplaceLabelSecond: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  marketplaceIcon: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketplaceIconImage: {
    width: '60%',
    height: '60%',
    resizeMode: 'contain',
  },
  colorContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorLabel: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  colorOptions: {
    gap: 8,
  },
  colorOption: {
    width: width * 0.06,
    height: width * 0.06,
    borderRadius: width * 0.03,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#333',
  },
  sizeContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sizeLabel: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sizeOptions: {
    gap: 6,
  },
  sizeOption: {
    width: width * 0.06,
    height: width * 0.06,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSizeOption: {
    backgroundColor: '#333',
  },
  sizeText: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    fontWeight: '600',
    color: '#333',
  },
  selectedSizeText: {
    color: '#fff',
  },
  productDetails: {
    paddingHorizontal: width * 0.05,
    paddingTop: 0,
    marginTop: height * 0.04,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.01,
  },
  productTitle: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.025,
  },
  reviewsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  reviewsText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#666',
    textDecorationLine: 'underline',
  },
  shareButton: {
    padding: 8,
  },
  shareIcon: {
    width: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    height: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    tintColor: '#666',
  },
  descriptionTitle: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.01,
  },
  description: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#666',
    lineHeight: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    marginBottom: height * 0.025,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.03,
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: width * 0.01,
  },
  priceLabel: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: isSmallDevice ? 18 : isMediumDevice ? 19 : 22,
    fontWeight: '700',
    color: '#333',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.02,
    width: '100%',
  },
  actionButton: {
    width: isSmallDevice ? 44 : isMediumDevice ? 48 : 52,
    height: isSmallDevice ? 44 : isMediumDevice ? 48 : 52,
    borderRadius: isSmallDevice ? 22 : isMediumDevice ? 24 : 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    marginRight: width * 0.04,
  },
  actionButtonAdded: {
    backgroundColor: '#fff',
    borderColor: '#333',
  },
  actionCircle: {
    width: isSmallDevice ? 36 : isMediumDevice ? 40 : 44,
    height: isSmallDevice ? 36 : isMediumDevice ? 40 : 44,
    borderRadius: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  actionCircleAdded: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  actionPlus: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: '600',
    color: '#333',
  },
  actionCartIcon: {
    width: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    height: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    tintColor: '#fff',
  },
  likeButton: {
    width: isSmallDevice ? 44 : isMediumDevice ? 48 : 52,
    height: isSmallDevice ? 44 : isMediumDevice ? 48 : 52,
    borderRadius: isSmallDevice ? 22 : isMediumDevice ? 24 : 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  actionIcon: {
    width: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    height: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
  },
  buyButton: {
    flex: 1,
    height: isSmallDevice ? 44 : isMediumDevice ? 48 : 52,
    backgroundColor: '#333',
    borderRadius: isSmallDevice ? 22 : isMediumDevice ? 24 : 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: width * 0.03,
  },
  buyButtonText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
  },
  bottomSpacing: {
    height: height * 0.05,
  },
  floatingImage: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: height * 0.45, // Adjust to match bottom of product image
    left: width * 0.45, // Center horizontally with product image
    zIndex: 999,
    borderRadius: 25,
  },
  floatingHeart: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: height * 0.45,
    left: width * 0.45,
    zIndex: 999,
    tintColor: '#E8B4B8',
  },
});

export default ProductDetailScreen; 