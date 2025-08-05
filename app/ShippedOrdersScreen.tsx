import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  SafeAreaView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../backend/supabase';

const { width, height } = Dimensions.get('window');

interface ShippedOrdersScreenProps {
  onBack: () => void;
  mode?: 'buyer' | 'seller';
}

const ShippedOrdersScreen: React.FC<ShippedOrdersScreenProps> = ({ onBack, mode = 'buyer' }): React.ReactElement => {
  const { user } = useUser();
  const [sellerEarnings, setSellerEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShippedEarnings = async () => {
    if (!user?.id || mode !== 'seller') return;

    try {
      setLoading(true);
      console.log('🚚 Loading shipped seller earnings for user:', user.id);

      const { data: earningsData, error: earningsError } = await supabase
        .from('seller_earnings')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')  // Items marked as shipped/paid
        .order('sale_date', { ascending: false });

      if (earningsError) {
        console.error('❌ Error fetching shipped earnings:', earningsError);
        return;
      }

      console.log('✅ Found shipped earnings:', earningsData?.length || 0);
      setSellerEarnings(earningsData || []);
    } catch (error) {
      console.error('❌ Error loading shipped earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      if (mode === 'seller') {
        loadShippedEarnings();
      } else {
        setLoading(false);
      }
    }
  }, [user?.id, mode]);

  const renderShippedEarningCard = (earning: any, index: number) => {
    return (
      <View key={earning.id || index} style={styles.earningCard}>
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
              Shipped on {new Date(earning.sale_date).toLocaleDateString()}
            </Text>
            <View style={styles.earningAmounts}>
              <Text style={styles.saleAmount}>
                Sale: RM {Number(earning.sale_amount).toFixed(2)}
              </Text>
              <Text style={styles.netAmount}>
                Net: RM {Number(earning.net_amount).toFixed(2)}
              </Text>
            </View>
            <View style={styles.shippedBadge}>
              <Text style={styles.shippedBadgeText}>SHIPPED</Text>
            </View>
          </View>
        </View>
      </View>
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
        <Text style={styles.headerTitle}>
          {mode === 'seller' ? 'Shipped Sales' : 'Shipped Orders'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (mode === 'seller' ? sellerEarnings.length === 0 : true) ? (
        <View style={styles.emptyContainer}>
          <Image 
            source={require('../assets/images/shipped orders.png')} 
            style={styles.emptyIcon} 
          />
          <Text style={styles.emptyTitle}>
            {mode === 'seller' ? 'No shipped sales yet' : 'No orders are shipped yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {mode === 'seller' ? 'Shipped sales will appear here' : 'Shipped orders will appear here'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {sellerEarnings.map((earning, index) => renderShippedEarningCard(earning, index))}
        </ScrollView>
      )}
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
    backgroundColor: '#f5f5f5',
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
  shippedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
  },
  shippedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
});

export default ShippedOrdersScreen; 