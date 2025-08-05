import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
  SafeAreaView,
  Modal
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../backend/supabase';

const { width, height } = Dimensions.get('window');

interface PlacedOrdersScreenProps {
  onBack: () => void;
  mode?: 'buyer' | 'seller';
}

interface Order {
  order_id: number;
  user_id: string;
  total_amount: number;
  placed_at: string;
  status: string;
}

interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  size: string;
  color: string;
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
  updated_at: string;
}

interface Payment {
  payment_id: number;
  order_id: number;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
}

const PlacedOrdersScreen: React.FC<PlacedOrdersScreenProps> = ({ onBack, mode = 'buyer' }): React.ReactElement => {
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

  const loadSellerEarnings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('💰 INCOMING SALES: Loading seller earnings for user:', user.id);

      // First check all seller earnings for this user
      const { data: allEarnings, error: allError } = await supabase
        .from('seller_earnings')
        .select('*')
        .eq('user_id', user.id);

      if (allError) {
        console.error('❌ Error fetching all seller earnings:', allError);
      } else {
        console.log('📊 Total seller earnings for user:', allEarnings?.length || 0);
        allEarnings?.forEach(earning => {
          console.log(`   - Item: ${earning.item_name}, Status: ${earning.payment_status}, Date: ${earning.sale_date}`);
        });
      }

      // Now get only pending earnings (incoming)
      const { data: earningsData, error: earningsError } = await supabase
        .from('seller_earnings')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'pending')  // Only pending items are "incoming"
        .order('sale_date', { ascending: false });

      if (earningsError) {
        console.error('❌ Error fetching pending seller earnings:', earningsError);
        return;
      }

      console.log('✅ Found incoming seller earnings (pending status):', earningsData?.length || 0);
      console.log('📋 Incoming earnings details:', earningsData);
      setSellerEarnings(earningsData || []);
    } catch (error) {
      console.error('❌ Error loading seller earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlacedOrders = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('📦 Loading placed orders for user:', user.id);

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

      // Get deliveries for these orders and filter for 'placed' status
      const orderIds = ordersData.map(order => order.order_id);
      
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .in('order_id', orderIds)
        .eq('delivery_status', 'placed'); // Only get placed orders

      if (deliveriesError) {
        console.error('❌ Error fetching deliveries:', deliveriesError);
        return;
      }

      if (!deliveriesData || deliveriesData.length === 0) {
        console.log('ℹ️ No placed orders found');
        setOrders([]);
        return;
      }

      // Filter orders to only those with placed deliveries
      const placedOrderIds = deliveriesData.map(d => d.order_id);
      const placedOrders = ordersData.filter(order => placedOrderIds.includes(order.order_id));

      // Get payments for placed orders
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('order_id', placedOrderIds);

      if (paymentsError) {
        console.error('❌ Error fetching payments:', paymentsError);
      }

      // Get order items for placed orders
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', placedOrderIds);

      if (itemsError) {
        console.error('❌ Error fetching order items:', itemsError);
      }

      console.log('📦 Found placed orders data:', {
        orders: placedOrders.length,
        items: orderItemsData?.length || 0,
        payments: paymentsData?.length || 0,
        deliveries: deliveriesData?.length || 0
      });

      setOrders(placedOrders);

      // Pre-populate the order items state
      const itemsMap: {[orderId: number]: OrderItem[]} = {};
      orderItemsData?.forEach(item => {
        if (!itemsMap[item.order_id]) {
          itemsMap[item.order_id] = [];
        }
        itemsMap[item.order_id].push(item);
      });
      setOrderItems(itemsMap);

      // Pre-populate the payments state
      const paymentsMap: {[orderId: number]: Payment} = {};
      paymentsData?.forEach(payment => {
        if (payment) {
          paymentsMap[payment.order_id] = payment;
        }
      });
      setPayments(paymentsMap);

      // Pre-populate the deliveries state
      const deliveriesMap: {[orderId: number]: Delivery} = {};
      deliveriesData?.forEach(delivery => {
        if (delivery) {
          deliveriesMap[delivery.order_id] = delivery;
        }
      });
      setDeliveries(deliveriesMap);

    } catch (error) {
      console.error('Error loading placed orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 PLACED ORDERS: useEffect triggered with mode:', mode, 'user:', user?.id?.substring(0, 8) + '...');
    
    if (user?.id) {
      if (mode === 'seller') {
        console.log('🏪 Running in SELLER mode - loading seller earnings');
        loadSellerEarnings();
      } else {
        console.log('🛒 Running in BUYER mode - loading regular orders');
        loadPlacedOrders();
      }
    }
  }, [user?.id, mode]);

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
    await loadPlacedOrders();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return `RM ${price.toFixed(2)}`;
  };

  const formatDeliveryDate = (placedDate: string) => {
    const placed = new Date(placedDate);
    const delivery = new Date(placed);
    delivery.setDate(delivery.getDate() + 14); // 2 weeks later
    return delivery.toLocaleDateString();
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

  const getMarketplaceName = (sourceScreen?: string) => {
    switch (sourceScreen?.toLowerCase()) {
      case 'rent': return 'Rental';
      case 'p2p': return 'P2P';
      case 'ai': return 'AI';
      case 'home': return 'Marketplace';
      default: 
        console.log('⚠️ Unknown marketplace:', sourceScreen);
        return sourceScreen || 'Marketplace';
    }
  };

  const renderOrderItem = (item: OrderItem) => (
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
            source={getMarketplaceIcon(item.source_screen)} 
            style={styles.marketplaceIcon} 
          />
          <Text style={styles.marketplaceText}>{getMarketplaceName(item.source_screen)}</Text>
        </View>
        <Text style={styles.itemDetails}>Product ID: {item.product_id}</Text>
        <Text style={styles.itemDetails}>Size: {item.size} | Color: {item.color}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
      </View>
    </View>
  );

  const handleEarningCardPress = (earning: any) => {
    setSelectedEarning(earning);
    setShowActionModal(true);
  };

  const handleAutoDeliver = async () => {
    if (!selectedEarning) return;

    try {
      console.log('🚚 Auto delivering item:', selectedEarning.item_name);
      
      // Update seller earnings status to shipped/paid
      const { error: earningsError } = await supabase
        .from('seller_earnings')
        .update({ payment_status: 'paid' })
        .eq('id', selectedEarning.id);

      if (earningsError) {
        console.error('❌ Error updating seller earnings:', earningsError);
        return;
      }

      // Update fashion_items status to active-sold (keeps item visible)  
      const { error: itemError } = await supabase
        .from('fashion_items')
        .update({ status: 'active-sold' })
        .eq('id', selectedEarning.item_id);

      if (itemError) {
        console.error('❌ Error updating item status:', itemError);
        return;
      }

      console.log('✅ Item auto delivered successfully');
      
      // Refresh the data
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
          {/* Item Image */}
          <Image
            source={
              earning.image_url && earning.image_url.startsWith('http')
                ? { uri: earning.image_url }
                : require('../assets/images/ss logo black.png')
            }
            style={styles.earningImage}
          />
          
          {/* Item Details */}
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
            <View style={styles.incomingBadge}>
              <Text style={styles.incomingBadgeText}>INCOMING</Text>
            </View>
          </View>
          
          {/* Arrow Icon */}
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
      <View key={order.order_id} style={styles.orderCard}>
        <TouchableOpacity 
          style={styles.orderHeader}
          onPress={() => toggleOrderExpansion(order.order_id)}
        >
          <View style={styles.orderHeaderLeft}>
            <View style={styles.orderTitleRow}>
              <Text style={styles.orderNumber}>Order #{orders.length - index}</Text>
              <View style={styles.orderImagesStack}>
                {orderItems[order.order_id]?.slice(0, 3).map((item, index) => (
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
                {orderItems[order.order_id]?.length > 3 && (
                  <View style={styles.moreItemsBadge}>
                    <Text style={styles.moreItemsText}>+{orderItems[order.order_id].length - 3}</Text>
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
              { backgroundColor: '#8BC34A' } // Light green for placed
            ]}>
              <Text style={styles.statusText}>Placed</Text>
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

            <Text style={styles.sectionTitle}>
              Order Items ({items.length})
            </Text>
            
            {orderItems[order.order_id] === undefined ? (
              <View style={styles.loadingItems}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.loadingText}>Loading items...</Text>
              </View>
            ) : items.length > 0 ? (
              items.map(renderOrderItem)
            ) : (
              <View style={styles.loadingItems}>
                <Text style={styles.loadingText}>No items found for this order</Text>
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
          <Text style={styles.headerTitle}>
            {mode === 'seller' ? 'Incoming Sales' : 'Placed Orders'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading placed orders...</Text>
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
        <Text style={styles.headerTitle}>
          {mode === 'seller' ? 'Incoming Sales' : 'Placed Orders'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>
            {mode === 'seller' ? 'Loading incoming sales...' : 'Loading orders...'}
          </Text>
        </View>
      ) : (mode === 'seller' ? sellerEarnings.length === 0 : orders.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Image 
            source={require('../assets/images/order placed.png')} 
            style={styles.emptyIcon} 
          />
          <Text style={styles.emptyTitle}>
            {mode === 'seller' ? 'No incoming sales yet' : 'No placed orders'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {mode === 'seller' 
              ? 'Incoming sales will appear here when items are purchased' 
              : 'Orders marked as placed will appear here'
            }
          </Text>
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

       {/* Action Modal */}
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
               style={styles.cancelButton}
               onPress={() => setShowActionModal(false)}
             >
               <Text style={styles.cancelButtonText}>Cancel</Text>
             </TouchableOpacity>
           </View>
         </View>
       </Modal>

       {/* Drop Off Modal */}
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

     </SafeAreaView>
   );
 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  orderImagesStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  moreItemsBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -15,
  },
  moreItemsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
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
    width: 16,
    height: 16,
    tintColor: '#666',
  },
  orderDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  trackingInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trackingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  carrierName: {
    fontSize: 12,
    color: '#666',
  },
  estimatedDeliveryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  estimatedDeliveryDate: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  orderItemCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
    marginRight: 6,
  },
  marketplaceText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
  },
  loadingItems: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
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

export default PlacedOrdersScreen; 