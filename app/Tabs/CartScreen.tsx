import React, { useEffect, useState } from 'react';
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
import { useUser } from '@clerk/clerk-expo';
import { getUserCartItems, CartItem, removeFromCart } from '../../backend/supabaseItems';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLikes } from '../../context/LikesContext';
import LikesScreen from '../LikesScreen';
import { RootStackParamList } from '../MainTabsScreen';
import { useCart } from '../../context/CartContext';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const CartScreen = () => {
  const { user } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [total, setTotal] = useState(0);
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { showLikes, setShowLikes, exitFromLikes } = useLikes();
  const { updateCartCount } = useCart();
  const [itemAnimations] = useState<{[key: number]: Animated.Value}>({});

  useEffect(() => {
    if (user?.id) {
      fetchCart();
    }
  }, [user?.id]);

  // Refresh cart when screen comes into focus (e.g., after payment)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchCart();
      }
    }, [user?.id])
  );

  const fetchCart = async () => {
    if (!user?.id) return;
    const res = await getUserCartItems(user.id);
    if (res.success) {
      setCartItems(res.data);
      // Unselect all by default
      const sel: Record<number, boolean> = {};
      res.data.forEach(item => { sel[item.cart_item_id] = false; });
      setSelected(sel);
    }
  };

  useEffect(() => {
    // Update total when selected changes
    let sum = 0;
    cartItems.forEach(item => {
      if (selected[item.cart_item_id]) sum += item.price || 0;
    });
    setTotal(sum);
  }, [selected, cartItems]);

  const toggleSelect = (cartItemId: number) => {
    setSelected(prev => ({ ...prev, [cartItemId]: !prev[cartItemId] }));
  };

  const handleBuyNow = () => {
    const selectedItems = cartItems.filter(item => selected[item.cart_item_id]);
    
    if (selectedItems.length === 0) {
      Alert.alert(
        "No Products Selected",
        "Please select at least one product to proceed with purchase.",
        [{ text: "OK" }]
      );
      return;
    }

    const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
    
    navigation.navigate('Payment', {
      cartItems: selectedItems,
      total: selectedTotal
    });
  };

  const formatPrice = (price: number, rentalPeriod?: string) => {
    if (rentalPeriod) {
      return `RM ${price}/${rentalPeriod}`;
    }
    return `RM ${price.toFixed(2)}`;
  };

  const getSourceIcon = (item: CartItem) => {
    if (item.sourceScreen === 'rent') {
      return require('../../assets/images/rent.png');
    } else if (item.sourceScreen === 'p2p') {
      return require('../../assets/images/p2p.png');
    } else if (item.sourceScreen === 'ai') {
      return require('../../assets/images/ai.png');
    }
    return require('../../assets/images/home.png'); // Default to home marketplace
  };

  const getItemAnimation = (cartItemId: number) => {
    if (!itemAnimations[cartItemId]) {
      itemAnimations[cartItemId] = new Animated.Value(1);
    }
    return itemAnimations[cartItemId];
  };

  const handleRemoveFromCart = async (productId: number) => {
    if (!user?.id) return;
    
    try {
      // Configure the animation
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      // Animate the item out
      Animated.sequence([
        Animated.parallel([
          Animated.timing(getItemAnimation(productId), {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(async () => {
        // Remove from cart after animation
        await removeFromCart(user.id, productId);
        fetchCart();
        updateCartCount(); // Update cart count after removing item
      });
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  // Handle product click to navigate to product detail
  const handleProductClick = (product: CartItem) => {
    navigation.navigate('ProductDetail', {
      product,
      sourceScreen: (product.sourceScreen as 'home' | 'p2p' | 'ai' | 'rent' | 'search') || 'home'
    });
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../../assets/images/carts.png')} 
        style={styles.emptyIcon} 
      />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>Start adding items to your cart</Text>
    </View>
  );

  // Show likes screen if selected
  if (showLikes) {
    return <LikesScreen onBack={exitFromLikes} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image 
            source={require('../../assets/images/arrow for back.png')} 
            style={[styles.backIcon, { transform: [{ scaleX: -1 }] }]} 
          />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Image source={require('../../assets/images/search.png')} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity onPress={() => setShowLikes(true)}>
          <Image source={require('../../assets/images/likes.png')} style={styles.headerIcon} />
        </TouchableOpacity>
      </View>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>My Cart</Text>
        <Text style={styles.cartCount}>{cartItems.length}</Text>
      </View>

      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <ScrollView style={styles.scrollView}>
            {cartItems.map((item) => {
              const scaleAndOpacity = getItemAnimation(item.cart_item_id);
              
              return (
                <Animated.View 
                  key={item.cart_item_id} 
                  style={[
                    styles.cartItem,
                    {
                      opacity: scaleAndOpacity,
                      transform: [{ scale: scaleAndOpacity }],
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.checkbox, selected[item.cart_item_id] && styles.checkboxSelected]}
                    onPress={() => toggleSelect(item.cart_item_id)}
                  >
                    {selected[item.cart_item_id] && <View style={styles.checkboxInner} />}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.productCardContent}
                    onPress={() => handleProductClick(item)}
                  >
                    <TouchableOpacity 
                      style={styles.productImageContainer}
                      onPress={() => handleProductClick(item)}
                    >
                      <Image 
                        source={item.image_url ? { uri: item.image_url } : require('../../assets/images/ss logo black.png')} 
                        style={styles.productImage} 
                      />
                    </TouchableOpacity>
                    <View style={styles.infoSection}>
                      <TouchableOpacity 
                        style={styles.marketplaceRow}
                        onPress={() => handleProductClick(item)}
                      >
                        <Image source={getSourceIcon(item)} style={styles.marketplaceIcon} />
                        <Text style={styles.productName} numberOfLines={2}>{item.product_display_name}</Text>
                      </TouchableOpacity>
                      <Text style={styles.productPrice}>
                        {formatPrice(item.price, item.sourceScreen === 'rent' ? 'month' : undefined)}
                      </Text>
                      {item.originalPrice && (
                        <Text style={styles.originalPrice}>RM{item.originalPrice?.toFixed(2)}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleRemoveFromCart(item.id)}
                  >
                    <Image source={require('../../assets/images/trash.png')} style={styles.trashIcon} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
          <View style={styles.footer}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>RM {total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
              <Text style={styles.buyButtonText}>BUY NOW</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
    borderRadius: 20,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
  },
  searchIcon: {
    width: isSmallDevice ? 16 : 18,
    height: isSmallDevice ? 16 : 18,
    marginRight: width * 0.02,
    tintColor: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#333',
  },
  headerIcon: {
    width: isSmallDevice ? 21 : 23,
    height: isSmallDevice ? 21 : 23,
    tintColor: '#333',
  },
  scrollView: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#bbb',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#333',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoSection: {
    flex: 1,
    marginRight: 12,
  },
  marketplaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  marketplaceIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    resizeMode: 'contain',
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  originalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashIcon: {
    width: 18,
    height: 18,
    tintColor: '#333',
  },
  footer: {
    paddingHorizontal: width * 0.04,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  buyButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.1,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    tintColor: '#999',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  cartCount: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
  },
});

export default CartScreen; 