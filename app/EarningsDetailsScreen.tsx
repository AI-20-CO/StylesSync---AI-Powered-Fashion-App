import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { supabase } from '../backend/supabase';

interface EarningDetails {
  item_name: string;
  sale_amount: number;
  net_amount: number;
  sale_date: string;
  payment_status: string;
  image_url?: string;
}

interface EarningsDetailsScreenProps {
  onClose: () => void;
}

const EarningsDetailsScreen: React.FC<EarningsDetailsScreenProps> = ({ onClose }) => {
  const { user } = useUser();
  const [earningsDetails, setEarningsDetails] = useState<EarningDetails[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    fetchEarningsDetails();
  }, [user?.id]);

  const fetchEarningsDetails = async () => {
    if (!user?.id) return;

    try {
      setLoadingEarnings(true);
      const { data, error } = await supabase
        .from('seller_earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });

      if (error) {
        console.error('Error fetching earnings details:', error);
        return;
      }

      setEarningsDetails(data || []);
      
      // Calculate total earnings
      const total = (data || []).reduce((sum, earning) => sum + Number(earning.net_amount), 0);
      setTotalEarnings(total);
    } catch (error) {
      console.error('Error in fetchEarningsDetails:', error);
    } finally {
      setLoadingEarnings(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalAmount}>RM {totalEarnings.toFixed(2)}</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {loadingEarnings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading earnings...</Text>
          </View>
        ) : earningsDetails.length > 0 ? (
          earningsDetails.map((earning, index) => (
            <View key={index} style={styles.earningItem}>
              <View style={styles.earningItemContent}>
                {/* Item Image */}
                <Image
                  source={
                    earning.image_url && earning.image_url.startsWith('http')
                      ? { uri: earning.image_url }
                      : require('../assets/images/ss logo black.png')
                  }
                  style={styles.earningItemImage}
                  onError={() => console.log('🖼️ Earnings details image failed to load')}
                  defaultSource={require('../assets/images/ss logo black.png')}
                />
                
                {/* Item Details */}
                <View style={styles.earningItemInfo}>
                  <View style={styles.earningItemHeader}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {earning.item_name}
                    </Text>
                    <Text style={styles.saleDate}>
                      {new Date(earning.sale_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.earningItemDetails}>
                    <Text style={styles.saleAmount}>
                      Sale: RM {Number(earning.sale_amount).toFixed(2)}
                    </Text>
                    <Text style={styles.netAmount}>
                      Net: RM {Number(earning.net_amount).toFixed(2)}
                    </Text>
                    <View style={[
                      styles.paymentStatus,
                      { backgroundColor: earning.payment_status === 'paid' ? '#E8F5E9' : '#FFF3E0' }
                    ]}>
                      <Text style={[
                        styles.paymentStatusText,
                        { color: earning.payment_status === 'paid' ? '#2E7D32' : '#E65100' }
                      ]}>
                        {earning.payment_status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.noEarnings}>No earnings yet</Text>
            <Text style={styles.noEarningsSubtext}>Start selling to see your earnings here</Text>
          </View>
        )}
      </ScrollView>
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
  closeButton: {
    padding: 5,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 34,
  },
  totalSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  earningItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  earningItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  earningItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  earningItemInfo: {
    flex: 1,
  },
  earningItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 10,
  },
  saleDate: {
    fontSize: 12,
    color: '#666',
  },
  earningItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noEarnings: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  noEarningsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default EarningsDetailsScreen; 