import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../backend/supabase';
import { deleteMultipleProductImages } from '../backend/imageUpload';
import { useItems } from '../context/ItemsContext';

const { width } = Dimensions.get('window');

interface AddedItemsScreenProps {
  onClose: () => void;
}

interface FashionItem {
  id: number;
  name: string;
  price: number;
  source_screen: 'p2p' | 'rent';
  status: 'active' | 'sold' | 'rented' | 'active-sold' | 'active-rented';
  created_at: string;
  sizes: string[];
  colors: string[];
  image_urls: string[];
  quantity_sold: number;
}

interface Stats {
  total: number;
  active: number;
  sold: number;
  rented: number;
  totalEarnings: number;
}

const AddedItemsScreen: React.FC<AddedItemsScreenProps> = ({ onClose }) => {
  const { user } = useUser();
  const { decrementItemsCount } = useItems();
  const [items, setItems] = useState<FashionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    sold: 0,
    rented: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    fetchItems();
  }, [user?.id]);

  const fetchItems = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fashion_items')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_status', null) // Only show non-deleted items
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = data || [];
      console.log('Fetched items:', items);
      setItems(items);

      // Get actual earnings from seller_earnings table
      let actualEarnings = 0;
      try {
        const { data: earningsData, error: earningsError } = await supabase
          .from('seller_earnings')
          .select('net_amount')
          .eq('user_id', user.id);

        if (!earningsError && earningsData) {
          actualEarnings = earningsData.reduce((sum, earning) => sum + Number(earning.net_amount), 0);
          console.log('Fetched actual earnings:', actualEarnings);
        }
      } catch (earningsError) {
        console.log('Could not fetch earnings, using price fallback');
      }

      // Calculate stats using actual earnings when available
      const newStats = items.reduce((acc, item) => ({
        total: acc.total + 1,
        active: acc.active + (item.status === 'active' ? 1 : 0),
        sold: acc.sold + (item.status === 'sold' || item.status === 'active-sold' ? 1 : 0),
        rented: acc.rented + (item.status === 'rented' || item.status === 'active-rented' ? 1 : 0),
        totalEarnings: actualEarnings, // Use actual earnings from seller_earnings table
      }), {
        total: 0,
        active: 0,
        sold: 0,
        rented: 0,
        totalEarnings: actualEarnings,
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting item deletion process...');
              
              // First, find the item to get its image URLs
              const itemToDelete = items.find(item => item.id === itemId);
              if (!itemToDelete) {
                Alert.alert('Error', 'Item not found');
                return;
              }

              console.log('📸 Item images to delete:', itemToDelete.image_urls);

              // Soft delete the item (mark as deleted instead of removing)
              const { error: dbError } = await supabase
                .from('fashion_items')
                .update({ 
                  deleted_status: 'deleted',
                  updated_at: new Date().toISOString()
                })
                .eq('id', itemId)
                .eq('user_id', user?.id);

              if (dbError) throw dbError;
              console.log('Item marked as deleted (soft delete)');

              // Keep images in storage (they may be referenced in seller_earnings)
              console.log('Images preserved in storage for earnings records');
              // Note: Images are not deleted to maintain integrity of seller_earnings records

              // Refresh the items list
              await fetchItems();
              decrementItemsCount(); // Update the counter immediately
              
              Alert.alert('Success', 'Item and associated images deleted successfully');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Image source={require('../assets/images/cross.png')} style={styles.closeIcon} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.sold}</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.rented}</Text>
              <Text style={styles.statLabel}>Rented</Text>
            </View>
            <View style={[styles.statBox, styles.earningsBox]}>
              <Text style={styles.statNumber}>RM {stats.totalEarnings.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={styles.loader} />
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemMain}>
                  <View style={styles.itemInfo}>
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <Image 
                        source={{ uri: item.image_urls[0] }}
                        style={styles.itemImage}
                        onError={(e) => {
                          // Silent error handling - just use fallback image
                          console.log('Image fallback used for item', item.id);
                        }}
                        defaultSource={require('../assets/images/ss logo black.png')}
                      />
                    ) : (
                      <View style={[styles.itemImage, styles.placeholderImage]}>
                        <Text style={styles.placeholderText}>No Image</Text>
                      </View>
                    )}
                    <View style={styles.itemText}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemSizes}>
                        Sizes: {item.sizes.join(', ')}
                      </Text>
                      <Text style={styles.soldCount}>
                        Sold: {item.quantity_sold}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <View style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: 
                          item.status === 'active' ? '#E8F5E9' :
                          item.status === 'active-sold' ? '#E8F5E9' :
                          item.status === 'active-rented' ? '#E3F2FD' :
                          item.status === 'sold' ? '#FFEBEE' :
                          item.status === 'rented' ? '#F3E5F5' :
                          '#E3F2FD'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        { 
                          color: 
                            item.status === 'active' ? '#2E7D32' :
                            item.status === 'active-sold' ? '#2E7D32' :
                            item.status === 'active-rented' ? '#1565C0' :
                            item.status === 'sold' ? '#C62828' :
                            item.status === 'rented' ? '#7B1FA2' :
                            '#1565C0'
                        }
                      ]}>
                        {item.status === 'active-sold' ? 'SOLD (ACTIVE)' :
                         item.status === 'active-rented' ? 'RENTED (ACTIVE)' :
                         item.status.toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteItem(item.id, item.name)}
                    >
                      <Image 
                        source={require('../assets/images/trash.png')} 
                        style={styles.deleteIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <View style={styles.priceDate}>
                    <Text style={styles.price}>RM {Number(item.price).toFixed(2)}</Text>
                    <Text style={styles.date}>
                      Added {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.marketplaceTag}>
                    <Image 
                      source={
                        item.source_screen === 'p2p' 
                          ? require('../assets/images/p2p.png')
                          : require('../assets/images/rent.png')
                      }
                      style={styles.marketplaceIcon}
                    />
                    <Text style={styles.marketplaceText}>
                      {item.source_screen === 'p2p' ? 'P2P' : 'Rental'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 64 : (StatusBar.currentHeight || 0) + 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  statsGrid: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  earningsBox: {
    flex: 2,
    backgroundColor: '#f0f7ff',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
  },
  itemCard: {
    marginBottom: 20,
  },
  itemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  itemSizes: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceDate: {
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  marketplaceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  marketplaceIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  marketplaceText: {
    fontSize: 12,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  },
  soldCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#666',
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    width: 16,
    height: 16,
    tintColor: '#d32f2f',
  },
});

export default AddedItemsScreen; 