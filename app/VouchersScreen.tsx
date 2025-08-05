import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  SafeAreaView,
  ScrollView,
  TextInput,
  Animated,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVoucher } from '../context/VoucherContext';

const { width, height } = Dimensions.get('window');

interface VouchersScreenProps {
  onBack: () => void;
}

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  discountAmount?: number;
  discountPercentage?: number;
  expiryDate: string;
  isUsed: boolean;
  color: [string, string];
}

const VouchersScreen: React.FC<VouchersScreenProps> = ({ onBack }): React.ReactElement => {
  const [voucherCode, setVoucherCode] = useState('');
  const { applyVoucher } = useVoucher();
  const [availableVouchers] = useState<Voucher[]>([
          {
        id: '1',
        code: 'WELCOME20',
        title: 'Welcome Bonus',
        description: 'Get 20% off on your first order',
        discount: '20% OFF',
        discountPercentage: 20,
        expiryDate: '31 Dec 2024',
        isUsed: false,
        color: ['#667eea', '#764ba2']
      },
      {
        id: '2',
        code: 'SUMMER25',
        title: 'Summer Sale',
        description: 'Special summer discount',
        discount: '25% OFF',
        discountPercentage: 25,
        expiryDate: '30 Sep 2024',
        isUsed: false,
        color: ['#f093fb', '#f5576c']
      },
      {
        id: '3',
        code: 'FIRST',
        title: 'Testing Mode',
        description: 'Development testing voucher',
        discount: 'RM 0.01',
        expiryDate: 'No Expiry',
        isUsed: false,
        color: ['#4facfe', '#00f2fe']
      }
  ]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRedeemVoucher = () => {
    if (!voucherCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a voucher code');
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if voucher exists
    const voucher = availableVouchers.find(v => v.code.toLowerCase() === voucherCode.toLowerCase());
    
    if (voucher) {
      applyVoucher(voucher);
      Alert.alert(
        'Voucher Applied!',
        `${voucher.title} has been applied successfully. It will be automatically applied at checkout.`,
        [{ text: 'OK', onPress: () => setVoucherCode('') }]
      );
    } else {
      Alert.alert('Invalid Code', 'This voucher code is not valid or has expired.');
    }
  };

  const copyVoucherCode = (code: string) => {
    setVoucherCode(code);
    Alert.alert('Code Copied', `Voucher code "${code}" has been copied to the input field.`);
  };

  const renderVoucherCard = (voucher: Voucher) => (
    <TouchableOpacity 
      key={voucher.id}
      style={styles.voucherCard}
      onPress={() => copyVoucherCode(voucher.code)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={voucher.color}
        style={styles.voucherGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.voucherContent}>
          <View style={styles.voucherLeft}>
            <Text style={styles.voucherDiscount}>{voucher.discount}</Text>
            <Text style={styles.voucherTitle}>{voucher.title}</Text>
            <Text style={styles.voucherDescription}>{voucher.description}</Text>
            <Text style={styles.voucherExpiry}>Expires: {voucher.expiryDate}</Text>
          </View>
          <View style={styles.voucherRight}>
            <View style={styles.voucherCodeContainer}>
              <Text style={styles.voucherCodeLabel}>Code</Text>
              <Text style={styles.voucherCodeText}>{voucher.code}</Text>
            </View>
            <View style={styles.dashLine} />
            <TouchableOpacity style={styles.tapToCopyButton}>
              <Text style={styles.tapToCopyText}>Tap to Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.voucherCutout} />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Image
            source={require('../assets/images/arrow for back.png')}
            style={[styles.backIcon, { transform: [{ scaleX: -1 }] }]}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vouchers</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Redeem Section */}
          <View style={styles.redeemSection}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.redeemGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.redeemTitle}>Redeem Voucher</Text>
              <Text style={styles.redeemSubtitle}>Enter your voucher code to get amazing discounts</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.voucherInput}
                  placeholder="Enter voucher code"
                  placeholderTextColor="#999"
                  value={voucherCode}
                  onChangeText={setVoucherCode}
                  autoCapitalize="characters"
                />
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity 
                    style={styles.redeemButton}
                    onPress={handleRedeemVoucher}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#4facfe', '#00f2fe']}
                      style={styles.redeemButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.redeemButtonText}>Redeem</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </LinearGradient>
          </View>

          {/* Available Vouchers Section */}
          <View style={styles.availableSection}>
            <Text style={styles.sectionTitle}>Available Vouchers</Text>
            <Text style={styles.sectionSubtitle}>Tap any voucher to copy its code</Text>
            
            {availableVouchers.map(renderVoucherCard)}
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Tips</Text>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Click "Redeem" to apply vouchers at checkout</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Some vouchers have minimum order requirements</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Check expiry dates before using vouchers</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
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
  content: {
    flex: 1,
  },
  redeemSection: {
    margin: 16,
    marginBottom: 24,
  },
  redeemGradient: {
    borderRadius: 20,
    padding: 24,
  },
  redeemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  redeemSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voucherInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  redeemButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  redeemButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  availableSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  voucherCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  voucherGradient: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  voucherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherLeft: {
    flex: 1,
    paddingRight: 16,
  },
  voucherDiscount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  voucherTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  voucherExpiry: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  voucherRight: {
    alignItems: 'center',
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  voucherCodeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherCodeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  voucherCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  dashLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  tapToCopyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tapToCopyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  voucherCutout: {
    position: 'absolute',
    right: -10,
    top: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    transform: [{ translateY: -10 }],
  },
  tipsSection: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#667eea',
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default VouchersScreen; 