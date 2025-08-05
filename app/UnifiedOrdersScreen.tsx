import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../backend/supabase';
import { formatPrice } from '../backend/supabaseItems';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Order {
  order_id: number;
  user_id: string;
  shipping_address: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  placed_at: string;
}

interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  size: string;
  color: string;
  price: number;
  image_url?: string;
  source_screen?: string;
}

interface Delivery {
  delivery_id: number;
  order_id: number;
  tracking_number?: string;
  carrier_name?: string;
  delivery_status: string;
  estimated_delivery_date?: string;
}

interface Payment {
  payment_id: number;
  payment_method: string;
  amount: number;
  payment_status: string;
}

type FilterType = 'all' | 'placed' | 'rental';
type ModeType = 'buyer' | 'seller';

interface UnifiedOrdersScreenProps {
  onBack: () => void;
  filterType: FilterType;
  mode?: ModeType;
}

const UnifiedOrdersScreen: React.FC<UnifiedOrdersScreenProps> = ({ 
  onBack, 
  filterType, 
  mode = 'buyer' 
}): React.ReactElement => {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerEarnings, setSellerEarnings] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<{[orderId: number]: OrderItem[]}>({});
  const [deliveries, setDeliveries] = useState<{[orderId: number]: Delivery}>({});
  const [payments, setPayments] = useState<{[orderId: number]: Payment}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState<any>(null);
  const [showDropOffModal, setShowDropOffModal] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get screen configuration based on filterType
  const getScreenConfig = () => {
    switch (filterType) {
      case 'all':
        return {
          title: mode === 'seller' ? 'Sales History' : 'All Orders',
          emptyTitle: mode === 'seller' ? 'No Sales Yet' : 'No Orders Yet',
          emptySubtitle: mode === 'seller' 
            ? 'Your sales history will appear here once you sell items'
            : 'Your order history will appear here',
          emptyIcon: require('../assets/images/all orders.png'),
          orderPrefix: 'Order #',
          sectionTitle: 'Order Items',
          cancelButtonText: 'Cancel Order'
        };
      case 'placed':
        return {
          title: mode === 'seller' ? 'Incoming Sales' : 'Placed Orders',
          emptyTitle: mode === 'seller' ? 'No incoming sales yet' : 'No placed orders',
          emptySubtitle: mode === 'seller' 
            ? 'Incoming sales will appear here when items are purchased' 
            : 'Orders marked as placed will appear here',
          emptyIcon: require('../assets/images/order placed.png'),
          orderPrefix: 'Order #',
          sectionTitle: 'Order Items',
          cancelButtonText: 'Cancel Order'
        };
      case 'rental':
        return {
          title: 'Rental Orders',
          emptyTitle: 'No Rental Orders Yet',
          emptySubtitle: 'Your rental orders will appear here when you rent items from the rental marketplace',
          emptyIcon: require('../assets/images/rent.png'),
          orderPrefix: 'Rental Order #',
          sectionTitle: 'Rental Items',
          cancelButtonText: 'Cancel Rental Order'
        };
      default:
        return getScreenConfig(); // fallback to 'all'
    }
  };

  const config = getScreenConfig();

  const loadSellerEarnings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('💰 Loading seller earnings for user:', user.id);

      let query = supabase
        .from('seller_earnings')
        .select('*')
        .eq('user_id', user.id);

      // Apply filter based on filterType
      if (filterType === 'placed') {
        query = query.eq('payment_status', 'pending'); // Only pending items are "incoming"
      }

      const { data: earningsData, error: earningsError } = await query
        .order('sale_date', { ascending: false });

      if (earningsError) {
        console.error('❌ Error fetching seller earnings:', earningsError);
        return;
      }

      console.log('✅ Found seller earnings:', earningsData?.length || 0);
      setSellerEarnings(earningsData || []);
    } catch (error) {
      console.error('❌ Error loading seller earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log(`📦 Loading ${filterType} orders for user:`, user.id);

      // First get all orders for the user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        console.log('ℹ️ No orders found');
        setOrders([]);
        return;
      }

      // Get all order items first
      const orderIds = ordersData.map(order => order.order_id);
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('❌ Error fetching order items:', itemsError);
      }

      // Apply filtering logic based on filterType
      let filteredOrders = ordersData;
      let filteredItemsMap: {[orderId: number]: OrderItem[]} = {};

      if (filterType === 'rental') {
        // Filter orders that contain rental items
        const rentalOrderIds = new Set();
        
        orderItemsData?.forEach(item => {
          if (item.source_screen?.toLowerCase() === 'rent') {
            rentalOrderIds.add(item.order_id);
            if (!filteredItemsMap[item.order_id]) {
              filteredItemsMap[item.order_id] = [];
            }
            filteredItemsMap[item.order_id].push(item);
          }
        });

        filteredOrders = ordersData.filter(order => rentalOrderIds.has(order.order_id));
      } else {
        // For 'all' and 'placed', include all items but filter orders later if needed
        orderItemsData?.forEach(item => {
          if (!filteredItemsMap[item.order_id]) {
            filteredItemsMap[item.order_id] = [];
          }
          filteredItemsMap[item.order_id].push(item);
        });
      }

      if (filteredOrders.length === 0) {
        setOrders([]);
        setOrderItems({});
        setPayments({});
        setDeliveries({});
        return;
      }

      // Get payments and deliveries
      const filteredOrderIds = filteredOrders.map(order => order.order_id);
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('order_id', filteredOrderIds);

      if (paymentsError) {
        console.error('❌ Error fetching payments:', paymentsError);
      }

      let deliveriesQuery = supabase
        .from('deliveries')
        .select('*')
        .in('order_id', filteredOrderIds);

      // Apply delivery status filter for 'placed' filterType
      if (filterType === 'placed') {
        deliveriesQuery = deliveriesQuery.eq('delivery_status', 'placed');
      }

      const { data: deliveriesData, error: deliveriesError } = await deliveriesQuery;

      if (deliveriesError) {
        console.error('❌ Error fetching deliveries:', deliveriesError);
      }

      // For 'placed' filter, only keep orders that have placed deliveries
      if (filterType === 'placed' && deliveriesData) {
        const placedOrderIds = deliveriesData.map(d => d.order_id);
        filteredOrders = filteredOrders.filter(order => placedOrderIds.includes(order.order_id));
        
        // Also filter the items map
        const newFilteredItemsMap: {[orderId: number]: OrderItem[]} = {};
        placedOrderIds.forEach(orderId => {
          if (filteredItemsMap[orderId]) {
            newFilteredItemsMap[orderId] = filteredItemsMap[orderId];
          }
        });
        filteredItemsMap = newFilteredItemsMap;
      }

      console.log(`📦 Found ${filterType} orders:`, filteredOrders.length);

      setOrders(filteredOrders);
      setOrderItems(filteredItemsMap);

      // Set payments state
      const paymentsMap: {[orderId: number]: Payment} = {};
      paymentsData?.forEach(payment => {
        if (payment) {
          paymentsMap[payment.order_id] = payment;
        }
      });
      setPayments(paymentsMap);

      // Set deliveries state
      const deliveriesMap: {[orderId: number]: Delivery} = {};
      deliveriesData?.forEach(delivery => {
        if (delivery) {
          deliveriesMap[delivery.order_id] = delivery;
        }
      });
      setDeliveries(deliveriesMap);

    } catch (error) {
      console.error(`Error loading ${filterType} orders:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      if (mode === 'seller') {
        loadSellerEarnings();
      } else {
        loadOrders();
      }
    }
  }, [user?.id, mode, filterType]);

  const toggleOrderExpansion = (orderId: number) => {
    const numericOrderId = Number(orderId);
    const isExpanding = expandedOrderId !== numericOrderId;
    
    if (isExpanding) {
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        }),
        Animated.spring(rotationAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.spring(rotationAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        })
      ]).start();
    }
    
    setExpandedOrderId(isExpanding ? numericOrderId : null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (mode === 'seller') {
      await loadSellerEarnings();
    } else {
      await loadOrders();
    }
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDeliveryStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#4CAF50';
      case 'placed': return '#8BC34A';
      case 'shipped': return '#2196F3';
      case 'cancelled': return '#DC3545';
      case 'processing':
      default: return '#FF9800';
    }
  };

  const getDeliveryStatusText = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'Delivered';
      case 'placed': return 'Placed';
      case 'shipped': return 'Shipped';
      case 'cancelled': return 'Cancelled';
      case 'processing':
      default: return 'Processing';
    }
  };

  const updateDeliveryStatus = async (orderId: number, currentStatus: string) => {
    console.log('🔄 Attempting to update delivery status:', { orderId, currentStatus });
    
    if (currentStatus?.toLowerCase() !== 'processing') {
      console.log('❌ Cannot update - status is not processing:', currentStatus);
      return;
    }

    try {
      console.log('📡 Updating delivery status in database...');
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          delivery_status: 'placed',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) throw error;

      setDeliveries(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          delivery_status: 'placed'
        }
      }));

      console.log('✅ Updated delivery status to placed for order:', orderId);
    } catch (error) {
      console.error('❌ Error updating delivery status:', error);
    }
  };

  const formatDeliveryDate = (placedDate: string) => {
    const orderDate = new Date(placedDate);
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(orderDate.getDate() + 14);
    return estimatedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMarketplaceIcon = (sourceScreen?: string) => {
    switch (sourceScreen?.toLowerCase()) {
      case 'rent':
        return require('../assets/images/rent.png');
      case 'p2p':
        return require('../assets/images/p2p.png');
      case 'ai':
        return require('../assets/images/ai.png');
      case 'home':
        return require('../assets/images/home.png');
      default:
        return require('../assets/images/home.png');
    }
  };

  const getMarketplaceName = (sourceScreen?: string) => {
    switch (sourceScreen?.toLowerCase()) {
      case 'rent': return 'Rental';
      case 'p2p': return 'P2P';
      case 'ai': return 'AI';
      case 'home': return 'Marketplace';
      default: 
        return sourceScreen || 'Marketplace';
    }
  };

  // For rental filter, always show as rental
  const getDisplayMarketplace = (sourceScreen?: string) => {
    if (filterType === 'rental') {
      return {
        icon: require('../assets/images/rent.png'),
        name: 'Rental'
      };
    }
    return {
      icon: getMarketplaceIcon(sourceScreen),
      name: getMarketplaceName(sourceScreen)
    };
  };

  const renderOrderItem = (item: OrderItem) => {
    const marketplace = getDisplayMarketplace(item.source_screen);
    
    return (
      <View key={item.order_item_id} style={styles.orderItemCard}>
        <Image
          source={
            item.image_url && item.image_url.startsWith('http')
              ? { uri: item.image_url }
              : require('../assets/images/ss logo black.png')
          }
          style={styles.itemImage}
          onError={() => console.log('❌ Failed to load image:', item.image_url)}
        />
        <View style={styles.itemInfo}>
          <View style={styles.marketplaceRow}>
            <Image 
              source={marketplace.icon} 
              style={styles.marketplaceIcon} 
            />
            <Text style={styles.marketplaceText}>{marketplace.name}</Text>
          </View>
          <Text style={styles.itemDetails}>Product ID: {item.product_id}</Text>
          <Text style={styles.itemDetails}>Size: {item.size} | Color: {item.color}</Text>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
        </View>
      </View>
    );
  };

  const handleEarningCardPress = (earning: any) => {
    setSelectedEarning(earning);
    setShowActionModal(true);
  };

  const handleAutoDeliver = async () => {
    if (!selectedEarning) return;

    try {
      console.log('🚚 Auto delivering item:', selectedEarning.item_name);
      
      const { error: earningsError } = await supabase
        .from('seller_earnings')
        .update({ payment_status: 'paid' })
        .eq('id', selectedEarning.id);

      if (earningsError) {
        console.error('❌ Error updating seller earnings:', earningsError);
        return;
      }

      const { error: itemError } = await supabase
        .from('fashion_items')
        .update({ status: 'active-sold' })
        .eq('id', selectedEarning.item_id);

      if (itemError) {
        console.error('❌ Error updating item status:', itemError);
        return;
      }

      console.log('✅ Item auto delivered successfully');
      
      if (mode === 'seller') {
        loadSellerEarnings();
      }
      
      setShowActionModal(false);
      setSelectedEarning(null);
    } catch (error) {
      console.error('❌ Error in auto deliver:', error);
    }
  };

  const handleDropOffCourier = () => {
    setShowActionModal(false);
    setShowDropOffModal(true);
  };

  const renderSellerEarningCard = (earning: any, index: number) => {
    return (
      <TouchableOpacity 
        key={earning.id || index} 
        style={styles.earningCard}
        onPress={() => handleEarningCardPress(earning)}
        activeOpacity={0.7}
      >
        <View style={styles.earningCardContent}>
          <Image
            source={
              earning.image_url && earning.image_url.startsWith('http')
                ? { uri: earning.image_url }
                : require('../assets/images/ss logo black.png')
            }
            style={styles.earningImage}
          />
          
          <View style={styles.earningInfo}>
            <Text style={styles.earningItemName} numberOfLines={2}>
              {earning.item_name}
            </Text>
            <Text style={styles.earningDate}>
              Sold on {new Date(earning.sale_date).toLocaleDateString()}
            </Text>
            <View style={styles.earningAmounts}>
              <Text style={styles.saleAmount}>
                Sale: RM {Number(earning.sale_amount).toFixed(2)}
              </Text>
              <Text style={styles.netAmount}>
                Net: RM {Number(earning.net_amount).toFixed(2)}
              </Text>
            </View>
            {filterType === 'placed' && (
              <View style={styles.incomingBadge}>
                <Text style={styles.incomingBadgeText}>INCOMING</Text>
              </View>
            )}
          </View>
          
          <View style={styles.arrowContainer}>
            <Image 
              source={require('../assets/images/arrow right logo.png')}
              style={styles.arrowIcon}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOrderCard = (order: Order, index: number) => {
    const isExpanded = expandedOrderId === order.order_id;
    const delivery = deliveries[order.order_id];
    const payment = payments[order.order_id];
    const items = orderItems[order.order_id] || [];

    return (
      <View key={order.order_id} style={[
        styles.orderCard,
        delivery?.delivery_status === 'cancelled' && styles.cancelledOrder
      ]}>
        <View style={styles.orderCardGlow} />
        
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.03)']}
          style={styles.orderCardBottomGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <TouchableOpacity 
          style={styles.orderHeader}
          onPress={() => toggleOrderExpansion(order.order_id)}
        >
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.orderHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.orderHeaderLeft}>
              <View style={styles.orderTitleRow}>
                <Text style={styles.orderNumber}>
                  {config.orderPrefix}{orders.length - index}
                </Text>
                <View style={styles.orderImagesStack}>
                  {items.slice(0, 3).map((item, index) => (
                    <Image
                      key={item.order_item_id}
                      source={
                        item.image_url && item.image_url.startsWith('http')
                          ? { uri: item.image_url }
                          : require('../assets/images/ss logo black.png')
                      }
                      style={[
                        styles.stackedImage,
                        { 
                          zIndex: 3 - index,
                          marginLeft: index > 0 ? -15 : 0,
                          borderWidth: 1,
                          borderColor: '#fff'
                        }
                      ]}
                    />
                  ))}
                  {items.length > 3 && (
                    <View style={styles.moreItemsBadge}>
                      <Text style={styles.moreItemsText}>+{items.length - 3}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.orderDate}>Placed on {formatDate(order.placed_at)}</Text>
              <Text style={styles.orderTotal}>{formatPrice(order.total_amount)}</Text>
            </View>
            
            <View style={styles.orderHeaderRight}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getDeliveryStatusColor(delivery?.delivery_status) }
              ]}>
                <Text style={styles.statusText}>
                  {getDeliveryStatusText(delivery?.delivery_status)}
                </Text>
              </View>
              
              {payment && (
                <Text style={styles.paymentMethod}>
                  {payment.payment_method === 'grab_pay' ? 'Grab Pay' : payment.payment_method}
                </Text>
              )}
              
              <Animated.Image 
                source={require('../assets/images/arrow for back.png')}
                style={[
                  styles.expandIcon,
                  {
                    transform: [{
                      rotate: rotationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['270deg', '90deg']
                      })
                    }]
                  }
                ]}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View 
            style={[
              styles.orderDetails,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }]
              }
            ]}>
            <View style={styles.trackingInfo}>
              {delivery?.tracking_number ? (
                <>
                  <Text style={styles.trackingLabel}>Tracking: {delivery.tracking_number}</Text>
                  {delivery.carrier_name && (
                    <Text style={styles.carrierName}>{delivery.carrier_name}</Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.estimatedDeliveryLabel}>Estimated Delivery</Text>
                  <Text style={styles.estimatedDeliveryDate}>
                    {formatDeliveryDate(order.placed_at)}
                  </Text>
                </>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>
                {config.sectionTitle} ({items.length})
              </Text>
              {delivery?.delivery_status?.toLowerCase() === 'processing' && (
                <TouchableOpacity
                  onPress={() => {
                    console.log('🎯 Status update button clicked! Order ID:', order.order_id, 'Status:', delivery?.delivery_status);
                    updateDeliveryStatus(order.order_id, delivery?.delivery_status || '');
                  }}
                  style={[styles.statusUpdateButton, { backgroundColor: 'transparent' }]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statusUpdateButtonGradient, { backgroundColor: 'transparent' }]}>
                    <Text style={styles.statusUpdateText}>→ Mark as Placed</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            
            {items.length > 0 ? (
              items.map(renderOrderItem)
            ) : (
              <View style={styles.loadingItems}>
                <Text style={styles.loadingText}>No items found for this order</Text>
              </View>
            )}

            {delivery?.delivery_status !== 'cancelled' && (
              <View style={styles.cancelButtonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    Alert.alert(
                      `Cancel ${filterType === 'rental' ? 'Rental ' : ''}Order`,
                      `Are you sure you want to cancel this ${filterType === 'rental' ? 'rental ' : ''}order?`,
                      [
                        {
                          text: 'No',
                          style: 'cancel'
                        },
                        {
                          text: 'Yes, Cancel',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              const { error } = await supabase
                                .from('deliveries')
                                .update({ delivery_status: 'cancelled' })
                                .eq('order_id', order.order_id);

                              if (error) throw error;

                              setDeliveries(prev => ({
                                ...prev,
                                [order.order_id]: {
                                  ...prev[order.order_id],
                                  delivery_status: 'cancelled'
                                }
                              }));
                            } catch (error) {
                              console.error('Error cancelling order:', error);
                              Alert.alert('Error', 'Failed to cancel order. Please try again.');
                            }
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.cancelButtonText}>{config.cancelButtonText}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Image
              source={require('../assets/images/arrow for back.png')}
              style={[styles.backIcon, { transform: [{ scaleX: -1 }] }]}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading {filterType} orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Image
            source={require('../assets/images/arrow for back.png')}
            style={[styles.backIcon, { transform: [{ scaleX: -1 }] }]}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {(mode === 'seller' ? sellerEarnings.length === 0 : orders.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Image
            source={config.emptyIcon}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>{config.emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{config.emptySubtitle}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {mode === 'seller' 
            ? sellerEarnings.map((earning, index) => renderSellerEarningCard(earning, index))
            : orders.map((order, index) => renderOrderCard(order, index))
          }
        </ScrollView>
      )}

      {/* Action Modal for Seller Mode */}
      {mode === 'seller' && (
        <>
          <Modal
            visible={showActionModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowActionModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.actionModal}>
                <Text style={styles.modalTitle}>Choose Action</Text>
                <Text style={styles.modalSubtitle}>
                  What would you like to do with "{selectedEarning?.item_name}"?
                </Text>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleDropOffCourier}
                >
                  <Text style={styles.actionButtonText}>Drop off at Courier</Text>
                  <Text style={styles.actionButtonSubtext}>Schedule for pickup</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.autoDeliverButton]}
                  onPress={handleAutoDeliver}
                >
                  <Text style={[styles.actionButtonText, styles.autoDeliverText]}>Auto Deliver</Text>
                  <Text style={[styles.actionButtonSubtext, styles.autoDeliverSubtext]}>Mark as shipped immediately</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelModalButton}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showDropOffModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDropOffModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.dropOffModal}>
                <Text style={styles.modalTitle}>Drop Off Instructions</Text>
                <View style={styles.dropOffContent}>
                  <View style={styles.dropOffIcon}>
                    <Text style={styles.dropOffIconText}>📦</Text>
                  </View>
                  <Text style={styles.dropOffMessage}>
                    Please drop off your item at the nearest courier center by{" "}
                    <Text style={styles.dropOffDate}>
                      {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </Text>
                  </Text>
                  <Text style={styles.dropOffNote}>
                    You'll receive pickup confirmation once the courier collects your item.
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.dropOffButton}
                  onPress={() => setShowDropOffModal(false)}
                >
                  <Text style={styles.dropOffButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    position: 'relative',
  },
  orderCardGlow: {
    position: 'absolute',
    bottom: -2,
    left: 2,
    right: 2,
    height: 12,
    borderRadius: 18,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  orderCardBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    overflow: 'hidden',
  },
  orderHeaderGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    margin: -20,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderImagesStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  stackedImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  moreItemsBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  moreItemsText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusUpdateButton: {
    borderRadius: 20,
    marginLeft: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusUpdateButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  statusUpdateText: {
    color: 'transparent',
    fontSize: 12,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  expandIcon: {
    width: 12,
    height: 12,
    tintColor: '#666',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 20,
    backgroundColor: '#fff',
  },
  trackingInfo: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  carrierName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  estimatedDeliveryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  estimatedDeliveryDate: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  orderItemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
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
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  loadingItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    tintColor: '#ddd',
    marginBottom: 24,
    opacity: 0.6,
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
  cancelButtonContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DC3545',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 120,
    elevation: 2,
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#DC3545',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelledOrder: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  // Seller earnings styles
  earningCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  earningImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  earningInfo: {
    flex: 1,
  },
  earningItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  earningDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  earningAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saleAmount: {
    fontSize: 14,
    color: '#666',
  },
  netAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  incomingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFF3E0',
  },
  incomingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: '#999',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 340,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropOffModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 360,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  autoDeliverButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  autoDeliverText: {
    color: '#2E7D32',
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  autoDeliverSubtext: {
    color: '#4CAF50',
  },
  cancelModalButton: {
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelModalButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  dropOffContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dropOffIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropOffIconText: {
    fontSize: 40,
  },
  dropOffMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  dropOffDate: {
    fontWeight: '600',
    color: '#E65100',
  },
  dropOffNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  dropOffButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dropOffButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default UnifiedOrdersScreen; 