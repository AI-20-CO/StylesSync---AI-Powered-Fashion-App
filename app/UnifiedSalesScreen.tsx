import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Alert
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../backend/supabase';

const { width, height } = Dimensions.get('window');

interface EarningItem {
  id: number;
  user_id: string;
  item_id: number;
  item_name: string;
  sale_amount: number;
  commission_rate: number;
  net_amount: number;
  sale_date: string;
  payment_status: string;
  image_url?: string;
}

interface UnifiedSalesScreenProps {
  onBack: () => void;
  filterType: 'all' | 'incoming' | 'shipped' | 'successful';
}

const UnifiedSalesScreen: React.FC<UnifiedSalesScreenProps> = ({ 
  onBack, 
  filterType 
}): React.ReactElement => {
  const { user } = useUser();
  const [sellerEarnings, setSellerEarnings] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState<EarningItem | null>(null);
  const [showDropOffModal, setShowDropOffModal] = useState(false);

  // Get screen configuration based on filterType
  const getScreenConfig = () => {
    switch (filterType) {
      case 'all':
        return {
          title: 'All Sales',
          emptyTitle: 'No Sales Yet',
          emptySubtitle: 'Your sales history will appear here once you sell items',
          emptyIcon: require('../assets/images/all orders.png'),
          statusFilter: null, // No filter - show all
          showActions: false
        };
      case 'incoming':
        return {
          title: 'Incoming Sales',
          emptyTitle: 'No incoming sales yet',
          emptySubtitle: 'Incoming sales will appear here when items are purchased',
          emptyIcon: require('../assets/images/order placed.png'),
          statusFilter: 'pending',
          showActions: true
        };
      case 'shipped':
        return {
          title: 'Shipped Sales',
          emptyTitle: 'No shipped sales yet',
          emptySubtitle: 'Shipped sales will appear here',
          emptyIcon: require('../assets/images/shipped orders.png'),
          statusFilter: 'paid',
          showActions: false
        };
      case 'successful':
        return {
          title: 'Successful Sales',
          emptyTitle: 'No successful sales yet',
          emptySubtitle: 'Successfully delivered sales will appear here',
          emptyIcon: require('../assets/images/all orders.png'),
          statusFilter: 'delivered',
          showActions: false
        };
      default:
        return getScreenConfig(); // fallback
    }
  };

  const config = getScreenConfig();

  const loadSellerEarnings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log(`💰 Loading ${filterType} seller earnings for user:`, user.id);

      let query = supabase
        .from('seller_earnings')
        .select('*')
        .eq('user_id', user.id);

      // Apply filter based on filterType
      if (config.statusFilter) {
        query = query.eq('payment_status', config.statusFilter);
      }

      const { data: earningsData, error: earningsError } = await query
        .order('sale_date', { ascending: false });

      if (earningsError) {
        console.error('❌ Error fetching seller earnings:', earningsError);
        return;
      }

      console.log(`✅ Found ${filterType} seller earnings:`, earningsData?.length || 0);
      setSellerEarnings(earningsData || []);
    } catch (error) {
      console.error('❌ Error loading seller earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadSellerEarnings();
    }
  }, [user?.id, filterType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSellerEarnings();
    setRefreshing(false);
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
        Alert.alert('Error', 'Failed to update earnings status');
        return;
      }

      // Update fashion_items status to active-sold (not shipped to avoid constraint error)
      const { error: itemError } = await supabase
        .from('fashion_items')
        .update({ status: 'active-sold' })
        .eq('id', selectedEarning.item_id);

      if (itemError) {
        console.error('❌ Error updating item status:', itemError);
        Alert.alert('Error', 'Failed to update item status');
        return;
      }

      console.log('✅ Item auto delivered successfully');
      Alert.alert('Success', 'Item marked as shipped successfully!');
      
      loadSellerEarnings();
      setShowActionModal(false);
      setSelectedEarning(null);
    } catch (error) {
      console.error('❌ Error in auto deliver:', error);
      Alert.alert('Error', 'Failed to process auto deliver');
    }
  };

  const handleDropOffCourier = () => {
    setShowActionModal(false);
    setShowDropOffModal(true);
  };

  const handleEarningPress = (earning: EarningItem) => {
    if (config.showActions && earning.payment_status === 'pending') {
      setSelectedEarning(earning);
      setShowActionModal(true);
    }
  };

  const renderEarningCard = (earning: EarningItem, index: number) => {
    const isActionable = config.showActions && earning.payment_status === 'pending';
    
    return (
      <TouchableOpacity 
        key={earning.id || index} 
        style={[styles.earningCard, isActionable && styles.actionableCard]}
        onPress={() => handleEarningPress(earning)}
        activeOpacity={isActionable ? 0.7 : 1}
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
            onError={() => {
              // Fallback to logo if image fails to load
              console.log('🖼️ Image failed to load, using fallback');
            }}
            defaultSource={require('../assets/images/ss logo black.png')}
          />
          
          {/* Item Details */}
          <View style={styles.earningInfo}>
            <View style={styles.earningHeader}>
              <Text style={styles.earningItemName} numberOfLines={2}>
                {earning.item_name}
              </Text>
              <Text style={styles.earningDate}>
                {new Date(earning.sale_date).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.earningAmounts}>
              <Text style={styles.saleAmount}>
                Sale: RM {Number(earning.sale_amount).toFixed(2)}
              </Text>
              <Text style={styles.netAmount}>
                Net: RM {Number(earning.net_amount).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.earningFooter}>
              <View style={[
                styles.paymentStatusBadge,
                { backgroundColor: earning.payment_status === 'paid' ? '#E8F5E9' : '#FFF3E0' }
              ]}>
                <Text style={[
                  styles.paymentStatusText,
                  { color: earning.payment_status === 'paid' ? '#2E7D32' : '#E65100' }
                ]}>
                  {earning.payment_status.toUpperCase()}
                </Text>
              </View>
              
              {isActionable && (
                <Text style={styles.actionHint}>Tap to ship</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading {filterType} sales...</Text>
        </View>
      ) : sellerEarnings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image source={config.emptyIcon} style={styles.emptyIcon} />
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
          {sellerEarnings.map((earning, index) => renderEarningCard(earning, index))}
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
              style={styles.cancelModalButton}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
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
            <Text style={styles.modalTitle}>Drop Off Details</Text>
            <Text style={styles.modalSubtitle}>
              Schedule courier pickup for "{selectedEarning?.item_name}"
            </Text>
            
            <View style={styles.courierInfo}>
              <Text style={styles.courierText}>📦 Courier: StylesSync Express</Text>
              <Text style={styles.courierText}>📍 Pickup within 24 hours</Text>
              <Text style={styles.courierText}>💰 Free pickup service</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={() => {
                Alert.alert('Success', 'Courier pickup scheduled successfully!');
                setShowDropOffModal(false);
                setSelectedEarning(null);
              }}
            >
              <Text style={styles.confirmButtonText}>Schedule Pickup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelModalButton}
              onPress={() => setShowDropOffModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: '#ccc',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  earningCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  actionableCard: {
    borderWidth: 2,
    borderColor: '#E8F5E9',
    backgroundColor: '#F9FFF9',
  },
  earningCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  earningImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  earningInfo: {
    flex: 1,
  },
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  earningItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 10,
  },
  earningDate: {
    fontSize: 12,
    color: '#666',
  },
  earningAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  saleAmount: {
    fontSize: 14,
    color: '#666',
  },
  netAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  earningFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionHint: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: width * 0.85,
    maxWidth: 400,
  },
  dropOffModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: width * 0.85,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  autoDeliverButton: {
    backgroundColor: '#E8F5E9',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  autoDeliverText: {
    color: '#2E7D32',
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  autoDeliverSubtext: {
    color: '#4CAF50',
  },
  courierInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  courierText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  confirmButton: {
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  cancelModalButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 15,
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
});

export default UnifiedSalesScreen; 