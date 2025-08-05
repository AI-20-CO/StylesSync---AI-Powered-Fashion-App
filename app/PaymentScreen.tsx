import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  TextInput,
  Alert,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useUser } from '@clerk/clerk-expo';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FashionItemForDisplay, CartItem } from '../backend/supabaseItems';
import { useCart } from '../context/CartContext';
import { useVoucher } from '../context/VoucherContext';
import { supabase } from '../backend/supabase';
import { RootStackParamList } from './MainTabsScreen';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

const PaymentScreen: React.FC = () => {
  const { user } = useUser();
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { updateCartCount } = useCart();
  
  // Handle both single product and multiple cart items
  const { product, cartItems, total: cartTotal } = route.params;
  const isCartPayment = !!cartItems && cartItems.length > 0;
  
  // Validate that we have either a product or cart items
  if (!product && !isCartPayment) {
    Alert.alert('Error', 'No product or cart items found');
    navigation.goBack();
    return null;
  }
  
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { activeVoucher, calculateDiscount, clearVoucher } = useVoucher();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [paymentIntentCreatedAt, setPaymentIntentCreatedAt] = useState<Date | null>(null);
  const [savedAddress, setSavedAddress] = useState('');
  const [isUsingCustomAddress, setIsUsingCustomAddress] = useState(false);

  useEffect(() => {
    if (user?.id && (product || (cartItems && cartItems.length > 0))) {
      initializePayment();
    }
  }, [user?.id, product, cartItems]);

  // Load user's saved address
  useEffect(() => {
    loadUserAddress();
  }, [user?.id]);

  // Sync voucher code with active voucher
  useEffect(() => {
    if (activeVoucher) {
      setVoucherCode(activeVoucher.code);
    }
  }, [activeVoucher]);

  const loadUserAddress = async () => {
    if (!user?.id) return;

    try {
      console.log('🏠 Loading user saved address...');
      
      const { data, error } = await supabase
        .from('users')
        .select('address')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error loading user address:', error);
        return;
      }

      console.log('🔍 Raw address data from database:', data?.address);

      if (data?.address) {
        let addressString = '';
        
        // Try to construct address from available fields
        if (data.address.full_address) {
          // Use full_address if available
          addressString = data.address.full_address;
          console.log('✅ Using full_address:', addressString);
        } else {
          // Construct from individual fields
          const addressParts = [];
          
          if (data.address.city) addressParts.push(data.address.city);
          if (data.address.post_code) addressParts.push(data.address.post_code);
          if (data.address.state) addressParts.push(data.address.state);
          
          if (addressParts.length > 0) {
            addressString = addressParts.join(', ');
            console.log('✅ Constructed address from parts:', addressString);
          }
        }
        
        if (addressString) {
          console.log('✅ Auto-populating shipping address:', addressString);
          setAddress(addressString);
          setSavedAddress(addressString);
          setIsUsingCustomAddress(false);
        } else {
          console.log('ℹ️ Address data exists but no usable address string found');
        }
      } else {
        console.log('ℹ️ No saved address found');
      }
    } catch (error) {
      console.error('❌ Error in loadUserAddress:', error);
    }
  };

  const handleAddressChange = (text: string) => {
    const previousTestingMode = address.toLowerCase().includes('testing mode low rate') || voucherCode.toLowerCase() === 'first';
    setAddress(text);
    
    // Check if the current address is different from saved address
    if (savedAddress && text !== savedAddress) {
      setIsUsingCustomAddress(true);
    } else {
      setIsUsingCustomAddress(false);
    }
    
    // Testing mode detection - payment will be reinitialized automatically by useEffect
    const newTestingMode = text.toLowerCase().includes('testing mode low rate') || voucherCode.toLowerCase() === 'first';
    if (previousTestingMode !== newTestingMode) {
      console.log('Testing mode changed, payment will be reinitialized automatically');
    }
  };

  const handleVoucherChange = (text: string) => {
    const previousTestingMode = address.toLowerCase().includes('testing mode low rate') || voucherCode.toLowerCase() === 'first';
    console.log('🎫 Voucher changed:', {
      previousCode: voucherCode,
      newCode: text,
      previousTestingMode,
      isFirstCode: text.toLowerCase() === 'first'
    });
    
    setVoucherCode(text);
    
    // Testing mode detection - payment will be reinitialized automatically by useEffect
    const newTestingMode = address.toLowerCase().includes('testing mode low rate') || text.toLowerCase() === 'first';
    if (previousTestingMode !== newTestingMode) {
      console.log('🔄 Testing mode changed via voucher, forcing payment reinitialization');
      // Reset payment sheet to ensure clean reinitializaton with correct amount
      setPaymentSheetInitialized(false);
      setLoading(false);
    }
  };

  const useSavedAddress = () => {
    setAddress(savedAddress);
    setIsUsingCustomAddress(false);
  };

  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [paymentSheetInitialized, setPaymentSheetInitialized] = useState(false);

  // Calculate totals
  const serviceTax = 4.00;
  const shippingFee = 4.00;
  const subtotal = isCartPayment ? (cartTotal || 0) : (product?.price || 0);
  const originalTotal = subtotal + serviceTax + shippingFee;
  
  // Apply voucher discount
  const { finalAmount, discountAmount } = calculateDiscount(originalTotal);
  
  // Check for testing mode (address or voucher)
  const isAddressTestingMode = address.toLowerCase().includes('testing mode low rate');
  const isVoucherTestingMode = voucherCode.toLowerCase() === 'first' || activeVoucher?.code.toLowerCase() === 'first';
  const isTestingMode = isAddressTestingMode || isVoucherTestingMode;
  const finalTotal = isTestingMode ? 0.01 : finalAmount;

  // Debug logging for testing mode
  console.log('💰 Payment calculation:', {
    isCartPayment,
    cartTotal,
    subtotal,
    serviceTax,
    shippingFee,
    address: address.substring(0, 20) + '...',
    voucherCode,
    isAddressTestingMode,
    isVoucherTestingMode,
    isTestingMode,
    finalTotal
  });

  useEffect(() => {
    if (user?.id && (product || (cartItems && cartItems.length > 0))) {
      // Add small delay to ensure voucher state is properly updated
      const timeoutId = setTimeout(() => {
        initializePayment();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id, product, cartItems, finalTotal, voucherCode]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      
      // Double-check voucher validation before creating payment intent
      const currentIsVoucherTestingMode = voucherCode.toLowerCase() === 'first';
      const currentIsAddressTestingMode = address.toLowerCase().includes('testing mode low rate');
      const currentIsTestingMode = currentIsAddressTestingMode || currentIsVoucherTestingMode;
      const validatedFinalTotal = currentIsTestingMode ? 0.01 : (subtotal + serviceTax + shippingFee);
      
      console.log('🔄 Initializing payment with validated amount:', {
        voucherCode,
        currentIsVoucherTestingMode,
        currentIsAddressTestingMode,
        currentIsTestingMode,
        calculatedTotal: finalTotal,
        validatedFinalTotal,
        amountToUse: validatedFinalTotal
      });

      // Create payment intent with validated amount
      const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: validatedFinalTotal,
          currency: 'myr',
          productId: isCartPayment ? cartItems?.[0]?.id : product?.id,
          userId: user?.id,
          paymentMethod: 'card',
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      const { publishableKey, clientSecret } = data;
      setPaymentIntentCreatedAt(new Date());

      let paymentSheetAppearance = {
        colors: {
          primary: '#000000',
          background: '#ffffff',
          componentBackground: '#ffffff',
          componentBorder: '#e0e0e0',
          componentDivider: '#e0e0e0',
          primaryText: '#000000',
          secondaryText: '#666666',
          componentText: '#000000',
          placeholderText: '#999999',
        },
        shapes: {
          borderRadius: 12,
        },
      };

      let initOptions: any = {
        merchantDisplayName: 'StylesSync',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          address: {
            country: 'MY',
          },
        },
        returnURL: 'stylesync://payment-completion',
        appearance: paymentSheetAppearance,
        customerEphemeralKeySecret: data.ephemeralKey,
        customerId: data.customerId,
        googlePay: false,
        applePay: false,
        allowsDelayedPaymentMethods: true,
      };

      // Reset payment sheet state before reinitializing
      setPaymentSheetInitialized(false);
      
      // Initialize payment sheet
      const { error: sheetError } = await initPaymentSheet(initOptions);

      if (sheetError) {
        throw new Error(sheetError.message);
      }

      setPaymentSheetInitialized(true);
      console.log('Payment sheet initialized successfully with amount:', finalTotal);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentRecord = async (amount: number, status: string, transactionId?: string, paymentMethod?: string) => {
    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      console.log('💳 Creating payment record with method:', paymentMethod);

      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount,
          payment_status: status,
          transaction_id: transactionId,
          paid_at: status === 'completed' ? new Date().toISOString() : null,
          payment_method: paymentMethod || 'card'  // Use actual payment method
        })
        .select()
        .single();

      if (error) throw error;
      return data.payment_id;
    } catch (error: any) {
      console.error('Error creating payment record:', error.message);
      throw error;
    }
  };

  const createDeliveryRecord = async (orderId: number) => {
    try {
      // Generate tracking number
      const trackingNumber = `ST${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Calculate estimated delivery date (7 days from now)
      const estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

      const { error } = await supabase
        .from('deliveries')
        .insert({
          order_id: orderId,
          tracking_number: trackingNumber,
          carrier_name: 'StylesSync Express',
          estimated_delivery_date: estimatedDeliveryDate.toISOString(),
          delivery_status: 'processing',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating delivery record:', error);
        throw new Error(`Failed to create delivery record: ${error.message}`);
      }

      console.log('✅ Delivery record created successfully for order:', orderId);
    } catch (error: any) {
      console.error('Error in createDeliveryRecord:', error);
      throw error;
    }
  };

  const clearCartItems = async (cartItemsToClear: CartItem[]) => {
    if (!user?.id) return;

    try {
      console.log('🗑️ Clearing cart items after successful purchase...');
      
      // Get user's cart
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('cart_id')
        .eq('user_id', user.id)
        .single();

      if (cartError || !cart) {
        console.log('ℹ️ No cart found to clear');
        return;
      }

      // Remove the purchased items from cart
      const productIds = cartItemsToClear.map(item => item.id);
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.cart_id)
        .in('product_id', productIds);

      if (deleteError) {
        console.error('❌ Error clearing cart items:', deleteError);
        // Don't throw here as the order was successful
      } else {
        console.log('✅ Cart items cleared successfully');
      }
    } catch (error) {
      console.error('❌ Error in clearCartItems:', error);
      // Don't throw here as the order was successful
    }
  };

  const handlePayment = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a shipping address');
      return;
    }

    if (!paymentSheetInitialized) {
      Alert.alert('Error', 'Payment is still initializing. Please try again in a moment.');
      return;
    }

    // Check if payment intent has expired (after 24 hours)
    if (paymentIntentCreatedAt) {
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - paymentIntentCreatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation >= 24) {
        // Reinitialize payment if expired
        await initializePayment();
        return;
      }
    }

    try {
      setLoading(true);

      // Step 1: Process payment through Stripe
      const { error: paymentError, paymentOption } = await presentPaymentSheet();
      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // Step 2: Create payment record (initially without order_id)
      console.log('💳 Payment completed with method:', paymentOption);
      
      const newPaymentId = await createPaymentRecord(
        finalTotal,
        'completed',
        paymentOption ? String(paymentOption) : undefined,
        paymentOption ? String(paymentOption) : 'card'
      );

      if (!newPaymentId) {
        throw new Error('Failed to create payment record');
      }

      setPaymentId(newPaymentId);

      try {
        // Step 3: Create order with payment status
        const orderId = await createOrdersForItems(paymentOption ? String(paymentOption) : 'card');

        // Step 4: Create delivery record for the order
        await createDeliveryRecord(orderId[0]);

        // Step 5: Update payment record with order_id
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({ order_id: orderId[0] })
          .eq('payment_id', newPaymentId);

        if (paymentUpdateError) {
          console.error('Failed to update payment with order ID:', paymentUpdateError);
          // Don't throw here as the order is already created
        }

        // Step 6: Ensure order has payment_id (bidirectional update)
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({ payment_id: newPaymentId })
          .eq('order_id', orderId[0]);

        if (orderUpdateError) {
          console.error('Failed to update order with payment ID:', orderUpdateError);
          // Don't throw here as the core functionality is complete
        }

        // Step 7: Process seller earnings for marketplace items
        try {
          const { processSellerEarnings } = await import('../backend/sellerEarnings');
          const earningsResult = await processSellerEarnings(orderId[0]);
          
          if (earningsResult.success) {
            console.log('✅ Seller earnings processed:', earningsResult.message);
          } else {
            console.error('❌ Failed to process seller earnings:', earningsResult.message);
            // Don't throw here as the main order was successful
          }
        } catch (earningsError) {
          console.error('❌ Error processing seller earnings:', earningsError);
          // Don't throw here as the main order was successful
        }

        // Step 8: Clear cart items if this was a cart purchase
        if (isCartPayment && cartItems) {
          await clearCartItems(cartItems);
          // Update cart count in context so CartScreen reflects the change immediately
          await updateCartCount();
        }

        // Payment and orders successful
        const itemCount = isCartPayment ? (cartItems?.length || 0) : 1;
        Alert.alert(
          'Success',
          `Your payment was successful! We will process your ${itemCount} order(s) shortly.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (orderError: any) {
        // If order creation fails after payment
        Alert.alert(
          'Warning',
          'Payment was successful, but there was an issue creating your orders. Our team will resolve this and contact you.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        console.error('Order creation error after successful payment:', orderError);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createOrdersForItems = async (paymentMethodUsed: string = 'card') => {
    try {
      if (!isCartPayment && !product) {
        throw new Error('No items to process');
      }

      if (!user?.id) {
        throw new Error('User ID is required');
      }

      const itemsToProcess = isCartPayment ? (cartItems || []) : (product ? [product] : []);
      
      if (itemsToProcess.length === 0) {
        throw new Error('No items to process');
      }

      let orderId: number;

      // For single product purchase, use the existing flow
      if (!isCartPayment && product) {
        console.log('🛒 Creating order for single product:', {
          productId: product.id,
          productName: product.product_display_name,
          imageUrl: product.image_url,
          sourceScreen: product.sourceScreen
        });

        // For single product, create order directly instead of using RPC
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            shipping_address: address,
            total_amount: finalTotal,
            order_status: 'processing',
            payment_status: 'paid',
            payment_id: paymentId || null,
            payment_method: 'card',
            placed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw new Error(`Order creation failed: ${orderError.message}`);
        }

        if (!orderData || !orderData.order_id) {
          throw new Error('No order data returned');
        }

        orderId = orderData.order_id;

        // Fetch the image URL from detailed_fashion_items if not available in product
        let imageUrl = product.image_url;
        if (!imageUrl) {
          console.log('📸 No image URL in product, fetching from database...');
          const { data: productData, error: fetchError } = await supabase
            .from('detailed_fashion_items')
            .select('image_url')
            .eq('id', product.id)
            .single();
          
          if (!fetchError && productData) {
            imageUrl = productData.image_url;
            console.log('✅ Fetched image URL from database:', imageUrl);
          } else {
            console.log('❌ Failed to fetch image URL from database:', fetchError);
          }
        }

        // Create order item for the single product
        const { error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderId,
            product_id: product.id,
            quantity: 1,
            size: product.size || 'M',
            color: product.selectedColor || product.colour1 || 'Not specified',
            price: product.price,
            image_url: imageUrl,
            source_screen: product.sourceScreen
          });

        console.log('📦 Order item created with image URL:', imageUrl);

        if (orderItemError) {
          console.error('❌ Order item creation error:', orderItemError);
          throw new Error(`Failed to create order item: ${orderItemError.message}`);
        } else {
          console.log('✅ Order item created successfully for product:', product.id);
        }

      } else {
        // For cart items, create a single order (keep existing code)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            shipping_address: address,
            total_amount: finalTotal,
            order_status: 'processing',
            payment_status: 'paid',
            payment_id: paymentId || null,
            payment_method: 'card',
            placed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw new Error(`Order creation failed: ${orderError.message}`);
        }

        if (!orderData || !orderData.order_id) {
          throw new Error('No order data returned');
        }

        orderId = orderData.order_id;

        // Create order items for each cart item
        console.log('🛒 Creating order for cart items:', cartItems?.length || 0);
        
        const orderItemsPromises = cartItems?.map(async (item) => {
          console.log('🛒 Processing cart item:', {
            productId: item.id,
            productName: item.product_display_name,
            imageUrl: item.image_url,
            sourceScreen: item.sourceScreen
          });

          // Fetch the image URL from detailed_fashion_items if not available in cart item
          let imageUrl = item.image_url;
          if (!imageUrl) {
            console.log('📸 No image URL in cart item, fetching from database...');
            const { data: productData, error: fetchError } = await supabase
              .from('detailed_fashion_items')
              .select('image_url')
              .eq('id', item.id)
              .single();
            
            if (!fetchError && productData) {
              imageUrl = productData.image_url;
              console.log('✅ Fetched image URL from database for cart item:', imageUrl);
            } else {
              console.log('❌ Failed to fetch image URL from database for cart item:', fetchError);
            }
          }

          console.log('📦 Creating order item with image URL:', imageUrl);
          
          return supabase
            .from('order_items')
            .insert({
              order_id: orderId,
              product_id: item.id,
              quantity: 1,
              size: item.size || 'M',
              color: item.selectedColor || item.colour1 || 'Not specified',
              price: item.price,
              image_url: imageUrl,
                              source_screen: item.sourceScreen
            });
        }) || [];

        const orderItemsResults = await Promise.all(orderItemsPromises);
        
        console.log('📦 Cart order items creation results:', orderItemsResults.length);
        
        // Check for any errors in order items creation
        const orderItemsError = orderItemsResults.find(result => result.error);
        if (orderItemsError) {
          console.error('❌ Order items creation error:', orderItemsError);
          throw new Error(`Failed to create some order items: ${orderItemsError.error?.message || 'Unknown error'}`);
        } else {
          console.log('✅ All cart order items created successfully');
        }
      }

      // Final verification: Check if order items were actually inserted
      const { data: verifyItems, error: verifyError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      
      if (verifyError) {
        console.error('❌ Error verifying order items:', verifyError);
      } else {
        console.log('🔍 Verification: Order items in database:', verifyItems?.length || 0);
        if (verifyItems && verifyItems.length > 0) {
          console.log('🔍 First verified item:', verifyItems[0]);
        }
      }

      return [orderId];
    } catch (error: any) {
      console.error('Error creating orders:', error);
      throw error;
    }
  };

  const getMarketplaceIcon = (sourceScreen?: string) => {
    switch (sourceScreen) {
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

  const renderSingleProduct = () => {
    if (!product) return null;
    
    return (
      <View style={styles.productSection}>
        <View style={styles.productRow}>
          <Image 
            source={product.image_url ? { uri: product.image_url } : require('../assets/images/ss logo black.png')} 
            style={styles.productImage} 
          />
          <View style={styles.productInfo}>
            <View style={styles.marketplaceRow}>
              <Image 
                source={getMarketplaceIcon(product.sourceScreen)} 
                style={styles.marketplaceIcon} 
              />
              <Text style={styles.marketplaceText}>Marketplace</Text>
            </View>
            <Text style={styles.productName}>{product.product_display_name}</Text>
            <Text style={styles.productPrice}>RM {product.price.toFixed(2)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>RM {product.originalPrice.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItemRow}>
      <Image 
        source={item.image_url ? { uri: item.image_url } : require('../assets/images/ss logo black.png')} 
        style={styles.cartItemImage} 
      />
      <View style={styles.cartItemInfo}>
        <View style={styles.cartItemMarketplaceRow}>
          <Image 
            source={getMarketplaceIcon(item.sourceScreen)} 
            style={styles.cartItemMarketplaceIcon} 
          />
          <Text style={styles.cartItemName} numberOfLines={2}>{item.product_display_name}</Text>
        </View>
        <Text style={styles.cartItemPrice}>RM {item.price.toFixed(2)}</Text>
        {item.size && <Text style={styles.cartItemSize}>Size: {item.size}</Text>}
      </View>
    </View>
  );

  const renderCartItems = () => {
    if (!cartItems || cartItems.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items ({cartItems.length})</Text>
        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        />
      </View>
    );
  };

  const sectionBox = [
    styles.sectionBox,
    // Add more dynamic styles if needed
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image 
            source={require('../assets/images/arrow for back.png')} 
            style={[styles.backIcon, { transform: [{ scaleX: -1 }] }]} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isCartPayment ? 'Checkout' : 'Payment'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Section - Single Product or Cart Items */}
        {isCartPayment ? renderCartItems() : renderSingleProduct()}

        {/* Shipping Address */}
        <View style={sectionBox}>
          <View style={styles.sectionBoxRow}>
            <Text style={styles.sectionBoxLabel}>Shipping Address</Text>
            {savedAddress && (
              <>
                {!isUsingCustomAddress ? (
                  <TouchableOpacity onPress={useSavedAddress} style={styles.refreshAddressButtonMoved}>
                    <Text style={styles.refreshAddressTextGreen}>Saved address</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={useSavedAddress} style={styles.customAddressButtonMoved}>
                    <Text style={styles.customAddressText}>Using custom address</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
          <TextInput
            style={styles.sectionBoxInput}
            value={address}
            onChangeText={handleAddressChange}
            placeholder="Enter your shipping address"
            multiline
            placeholderTextColor="#999"
          />
        </View>

        {/* Voucher */}
        <View style={sectionBox}>
          <View style={styles.sectionBoxRow}>
            <Text style={styles.sectionBoxLabel}>Voucher</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TextInput
                style={[
                  styles.sectionBoxInputRight,
                  isVoucherTestingMode && styles.testingModeInput,
                  { flex: 1 }
                ]}
                value={voucherCode}
                onChangeText={handleVoucherChange}
                placeholder="Enter Code"
                placeholderTextColor="#999"
                editable={!activeVoucher}
              />
              {activeVoucher && (
                <TouchableOpacity
                  onPress={() => {
                    clearVoucher();
                    setVoucherCode('');
                  }}
                  style={styles.clearVoucherButton}
                >
                  <Text style={styles.clearVoucherText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {activeVoucher && (
            <View style={styles.activeVoucherInfo}>
              <Text style={styles.activeVoucherTitle}>{activeVoucher.title}</Text>
              <Text style={styles.activeVoucherDescription}>{activeVoucher.description}</Text>
            </View>
          )}
        </View>

        {/* Estimated Delivery */}
        <View style={isCartPayment ? styles.section : styles.deliverySection}>
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryLabel}>Estimated delivery</Text>
            <Text style={styles.deliveryDate}>31st march, 2025</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={isCartPayment ? styles.section : styles.paymentDetailsSection}>
          <Text style={isCartPayment ? styles.sectionTitle : styles.paymentDetailsTitle}>Payment Details</Text>
          <View style={styles.paymentDetailsList}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Merchandise Subtotal</Text>
              <Text style={styles.paymentValue}>RM {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Product Service Tax</Text>
              <Text style={styles.paymentValue}>RM {serviceTax.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Shipping fees</Text>
              <Text style={styles.paymentValue}>RM {shippingFee.toFixed(2)}</Text>
            </View>
            {(activeVoucher || discountAmount > 0) && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>
                  Voucher discount {activeVoucher ? `(${activeVoucher.code})` : ''}
                </Text>
                <Text style={[
                  styles.paymentValue,
                  { color: '#4CAF50', fontWeight: '600' }
                ]}>
                  -RM {discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Market place</Text>
              <Text style={styles.paymentValue}>Retail</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Constraint</Text>
              <Text style={styles.paymentValue}>No return</Text>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Bottom Section with Total and Buy Button */}
      <View style={styles.bottomSection}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>
            Total: 
            <Text style={[styles.totalAmount, isTestingMode && styles.testingModePrice]}>
              {' '}RM {finalTotal.toFixed(2)}
            </Text>
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.buyButton, loading && styles.buyButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.buyButtonText}>
            {loading ? 'Please Wait...' : 'BUY NOW'}
          </Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    marginHorizontal: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  productSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    marginHorizontal: 8,
    borderRadius: 12,
    padding: 16,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  marketplaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemMarketplaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cartItemMarketplaceIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  cartItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  cartItemSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemSeparator: {
    height: 1,
          backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  sectionBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 16,
    marginHorizontal: 8,
  },
  sectionBoxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  sectionBoxInput: {
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  sectionBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionBoxInputRight: {
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    textAlign: 'right',
    minWidth: 100,
  },
  sectionBoxPaymentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBoxChangeText: {
    fontSize: 13,
    color: '#666',
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  deliverySection: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#666',
  },
  deliveryDate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paymentDetailsSection: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    marginTop: 16,
    marginHorizontal: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  paymentDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  paymentDetailsList: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 16,
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  buyButton: {
    backgroundColor: '#333',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  refreshAddressButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshAddressText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  refreshAddressTextGreen: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  customAddressButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  customAddressText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  refreshAddressButtonMoved: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: -7,
  },
  customAddressButtonMoved: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: -7,
  },

  testingModePrice: {
    color: '#856404',
    fontWeight: 'bold',
  },
  testingModeInput: {
    color: '#F59E0B',
  },
  testingModeIndicator: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FDF2F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8B4B8',
  },
  testingModeText: {
    fontSize: 12,
    color: '#E8B4B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  voucherTestingModePrice: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  clearVoucherButton: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearVoucherText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeVoucherInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  activeVoucherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  activeVoucherDescription: {
    fontSize: 12,
    color: '#388E3C',
  },

});

export default PaymentScreen; 