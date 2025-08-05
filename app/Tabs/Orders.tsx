import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;
const isLargeDevice = width >= 400;
import { useAuth, useUser } from '@clerk/clerk-expo';

const Orders = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your orders will appear here once you start shopping
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: 'bold',
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#000',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: isSmallDevice ? 6 : isMediumDevice ? 7 : 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.05,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.075,
  },
  emptyIcon: {
    fontSize: isSmallDevice ? 50 : isMediumDevice ? 55 : 60,
    marginBottom: height * 0.02,
  },
  emptyTitle: {
    fontSize: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.01,
  },
  emptySubtitle: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 20 : isMediumDevice ? 21 : 22,
  },
});

export default Orders;
