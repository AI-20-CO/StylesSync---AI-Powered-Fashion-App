import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isLargeDevice = width >= 400;

interface HelpCenterScreenProps {
  onClose: () => void;
}

type RootStackParamList = {
  AllOrders: undefined;
  Vouchers: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  questions: HelpQuestion[];
}

interface HelpQuestion {
  id: string;
  question: string;
  answer: string;
}

const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({ onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSections, setFilteredSections] = useState<HelpSection[]>([]);

  // Animation values
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(30)).current;
  const searchAnimation = useRef(new Animated.Value(0)).current;

  // Screen focus animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: require('../assets/images/ss logo black.png'),
      questions: [
        {
          id: 'what-is-stylesync',
          question: 'What is StyleSync?',
          answer: 'StyleSync is a comprehensive fashion platform that combines AI-powered recommendations, peer-to-peer marketplace, rental services, and traditional shopping. Our AI helps you discover styles that match your preferences and skin tone, while our marketplace lets you buy, sell, and rent fashion items.'
        },
        {
          id: 'create-account',
          question: 'How do I create an account?',
          answer: 'You can sign up using your email and phone number, or use social login with Google, Apple, or Facebook. Simply tap "Sign Up" on the welcome screen and follow the verification steps.'
        },
        {
          id: 'buyer-seller-mode',
          question: 'What\'s the difference between Buyer and Seller mode?',
          answer: 'Buyer mode focuses on shopping, browsing recommendations, and managing your orders. Seller mode allows you to list items for sale, manage your inventory, track earnings, and view seller analytics. You can switch between modes anytime in your profile.'
        },
        {
          id: 'first-steps',
          question: 'What should I do first after signing up?',
          answer: 'Complete your profile, browse the AI recommendations to train our algorithm, explore the different sections (Home, P2P, AI, Rent), and consider setting up your seller profile if you want to sell items.'
        }
      ]
    },
    {
      id: 'account-profile',
      title: 'Account & Profile',
      icon: require('../assets/images/profile.png'),
      questions: [
        {
          id: 'edit-profile',
          question: 'How do I edit my profile?',
          answer: 'Go to the Accounts tab, tap on your profile section, then select "Edit Profile". You can update your personal information, contact details, and preferences.'
        },
        {
          id: 'seller-profile',
          question: 'How do I set up my seller profile?',
          answer: 'Switch to Seller mode in your account, then tap "Set up seller profile". Fill in your business information, payment details, and shipping preferences. This is required before you can start selling.'
        },
        {
          id: 'forgot-password',
          question: 'I forgot my password, what do I do?',
          answer: 'On the sign-in screen, tap "Forgot Password". Enter your email or phone number and we\'ll send you a reset link. Follow the instructions in the email to create a new password.'
        },
        {
          id: 'delete-account',
          question: 'How do I delete my account?',
          answer: 'Account deletion can be requested by contacting our support team. We\'ll need to ensure all pending orders are completed and any seller obligations are fulfilled before processing the deletion.'
        }
      ]
    },
    {
      id: 'shopping-orders',
      title: 'Shopping & Orders',
      icon: require('../assets/images/carts.png'),
      questions: [
        {
          id: 'place-order',
          question: 'How do I place an order?',
          answer: 'Browse items, tap on a product you like, select size/color if applicable, then tap "Add to Cart". Go to your cart, review items, and tap "Checkout". Choose your payment method and delivery address to complete the order.'
        },
        {
          id: 'track-order',
          question: 'How can I track my order?',
          answer: 'Go to Accounts > Order Details to see all your orders. Orders progress through: Placed → Shipped → Received. You\'ll get notifications at each stage and can track detailed status in the respective order screens.'
        },
        {
          id: 'cancel-order',
          question: 'Can I cancel my order?',
          answer: 'You can cancel orders that haven\'t been shipped yet. Go to "Placed Orders" and tap on the order to see cancellation options. Once shipped, you\'ll need to wait for delivery and initiate a return instead.'
        },
        {
          id: 'return-refund',
          question: 'What\'s your return and refund policy?',
          answer: 'We accept returns within 14 days of delivery for items in original condition. Go to "Received Orders", select the item, and follow the return process. Refunds are processed within 5-7 business days after we receive the returned item.'
        },
        {
          id: 'shipping-costs',
          question: 'What are the shipping costs?',
          answer: 'Shipping costs vary by location and item weight. Standard shipping is $5-15, express shipping is $15-25. Free shipping is available on orders over $75. Exact costs are calculated at checkout.'
        }
      ]
    },
    {
      id: 'p2p-marketplace',
      title: 'P2P Marketplace',
      icon: require('../assets/images/p2p.png'),
      questions: [
        {
          id: 'sell-items',
          question: 'How do I sell items on StyleSync?',
          answer: 'First, set up your seller profile. Then switch to Seller mode and tap "Add Item". Upload clear photos, write detailed descriptions, set your price, and choose shipping options. Items are reviewed before going live.'
        },
        {
          id: 'pricing-items',
          question: 'How should I price my items?',
          answer: 'Research similar items on the platform, consider the item\'s condition, original price, and brand value. Our AI provides pricing suggestions based on market data. Remember to factor in platform fees and shipping costs.'
        },
        {
          id: 'seller-fees',
          question: 'What are the seller fees?',
          answer: 'StyleSync charges a 10% commission on successful sales plus payment processing fees (2.9% + $0.30). These fees are automatically deducted from your earnings when a sale is completed.'
        },
        {
          id: 'seller-earnings',
          question: 'When do I receive my earnings?',
          answer: 'Earnings are released 3 days after the buyer confirms receipt (or 14 days after delivery if no action is taken). You can view your earnings and payout schedule in the Seller mode earnings section.'
        },
        {
          id: 'manage-listings',
          question: 'How do I manage my listings?',
          answer: 'In Seller mode, tap "Added Items" to see all your listings. You can edit prices, descriptions, mark items as sold, or remove listings. Active listings appear in the P2P section for buyers to discover.'
        }
      ]
    },
    {
      id: 'ai-recommendations',
      title: 'AI Recommendations',
      icon: require('../assets/images/ai.png'),
      questions: [
        {
          id: 'how-ai-works',
          question: 'How does the AI recommendation system work?',
          answer: 'Our AI analyzes your preferences, browsing history, skin tone, and style choices to suggest items you\'ll love. The more you interact with the app (liking, purchasing, browsing), the better the recommendations become.'
        },
        {
          id: 'skin-tone-matching',
          question: 'What is skin tone matching?',
          answer: 'Our AI can analyze your skin tone from photos and recommend colors and styles that complement you best. This feature is available in the AI tab and helps you discover flattering options you might not have considered.'
        },
        {
          id: 'improve-recommendations',
          question: 'How can I improve my recommendations?',
          answer: 'Like items you love, add favorites to your wishlist, complete purchases, and spend time browsing different categories. The AI also learns from items you skip or dislike. Update your style preferences in your profile for more targeted suggestions.'
        },
        {
          id: 'ai-not-accurate',
          question: 'The AI recommendations don\'t match my style. What can I do?',
          answer: 'Reset your preferences in the AI tab settings, actively like/dislike more items to retrain the algorithm, or update your profile with more detailed style preferences. The AI typically improves significantly after 10-20 interactions.'
        }
      ]
    },
    {
      id: 'rental-system',
      title: 'Rental System',
      icon: require('../assets/images/rent.png'),
      questions: [
        {
          id: 'how-rental-works',
          question: 'How does the rental system work?',
          answer: 'Browse rental items in the Rent tab, select your size and rental period (3-7 days), place your order, and wear the item for your event. Return it using the prepaid shipping label within the rental period.'
        },
        {
          id: 'rental-pricing',
          question: 'How is rental pricing calculated?',
          answer: 'Rental prices are typically 10-20% of the item\'s retail value per week. Designer and luxury items may have higher rates. The exact price depends on the item\'s value, demand, and rental duration.'
        },
        {
          id: 'rental-damage',
          question: 'What if I damage a rental item?',
          answer: 'Minor wear is expected and covered. For significant damage or stains, you may be charged a cleaning or repair fee. If an item is unreturnable, you\'ll be charged the full replacement cost. Consider purchasing rental insurance for valuable items.'
        },
        {
          id: 'late-return',
          question: 'What happens if I return a rental item late?',
          answer: 'Late returns incur daily fees equivalent to the daily rental rate. If an item is more than 7 days late, you may be charged the full purchase price. Always use the prepaid shipping label and allow 2-3 days for transit.'
        }
      ]
    },
    {
      id: 'payments-billing',
      title: 'Payment & Billing',
      icon: require('../assets/images/apple pay.png'),
      questions: [
        {
          id: 'payment-methods',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, debit cards, Apple Pay, Google Pay, and PayPal. All payments are processed securely through Stripe with end-to-end encryption.'
        },
        {
          id: 'save-payment',
          question: 'Can I save my payment information?',
          answer: 'Yes, you can securely save payment methods for faster checkout. Your payment information is encrypted and stored securely by our payment processor, Stripe. You can manage saved cards in your account settings.'
        },
        {
          id: 'billing-issues',
          question: 'I have a billing issue with my order',
          answer: 'Check your order history in the Accounts section first. If you see an incorrect charge, contact our support team with your order number. We\'ll investigate and resolve billing discrepancies within 24-48 hours.'
        },
        {
          id: 'vouchers-discounts',
          question: 'How do I use vouchers and discounts?',
          answer: 'Go to Accounts > Vouchers to see available discounts. During checkout, enter your voucher code or select from available offers. Some vouchers have minimum purchase requirements or expiration dates.'
        }
      ]
    },
    {
      id: 'technical-support',
      title: 'Technical Support',
      icon: require('../assets/images/helpdesk.png'),
      questions: [
        {
          id: 'app-not-loading',
          question: 'The app isn\'t loading properly',
          answer: 'Try closing and reopening the app, check your internet connection, or restart your device. If problems persist, ensure you have the latest app version from the App Store or Google Play.'
        },
        {
          id: 'photos-not-uploading',
          question: 'I can\'t upload photos',
          answer: 'Check that you\'ve granted camera and photo library permissions to StyleSync in your device settings. Ensure photos are under 10MB and in JPG or PNG format. Try reducing image size if uploads fail.'
        },
        {
          id: 'push-notifications',
          question: 'I\'m not receiving notifications',
          answer: 'Go to your device settings > Notifications > StyleSync and ensure notifications are enabled. Check your in-app notification preferences in the account settings. Restart the app after making changes.'
        },
        {
          id: 'search-not-working',
          question: 'Search isn\'t working correctly',
          answer: 'Try different search terms, check spelling, or use filters to narrow results. Clear the search bar and try again. If specific items aren\'t appearing, they may be out of stock or removed by sellers.'
        },
        {
          id: 'app-crashing',
          question: 'The app keeps crashing',
          answer: 'Update to the latest app version, restart your device, and ensure you have sufficient storage space. If crashes persist, contact support with your device model and iOS/Android version.'
        }
      ]
    }
  ];

  // Filter sections based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSections(helpSections);
      return;
    }

    const filtered = helpSections.map(section => ({
      ...section,
      questions: section.questions.filter(q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section => section.questions.length > 0);

    setFilteredSections(filtered);
  }, [searchQuery]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@stylesync.com?subject=StyleSync Help Request')
        },
        {
          text: 'Phone',
          onPress: () => Linking.openURL('tel:+1-555-STYLE-01')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleTrackOrderPress = () => {
    navigation.navigate('AllOrders');
  };

  const handleVouchersPress = () => {
    navigation.navigate('Vouchers');
  };

  const renderSection = (section: HelpSection) => (
    <View key={section.id} style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
      >
        <View style={styles.sectionTitleContainer}>
          <Image source={section.icon} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Image 
          source={require('../assets/images/arrow for back.png')} 
          style={[
            styles.expandArrow,
            selectedSection === section.id && styles.expandArrowRotated
          ]} 
        />
      </TouchableOpacity>

      {selectedSection === section.id && (
        <View style={styles.questionsContainer}>
          {section.questions.map(question => (
            <View key={question.id} style={styles.questionContainer}>
              <TouchableOpacity
                style={styles.questionHeader}
                onPress={() => toggleQuestion(question.id)}
              >
                <Text style={styles.questionText}>{question.question}</Text>
                <Image 
                  source={require('../assets/images/arrow for back.png')} 
                  style={[
                    styles.questionArrow,
                    expandedQuestion === question.id && styles.questionArrowRotated
                  ]} 
                />
              </TouchableOpacity>
              
              {expandedQuestion === question.id && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{question.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      
      <Animated.View 
        style={[
          styles.helpContainer,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Image source={require('../assets/images/cross.png')} style={styles.closeIcon} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Image source={require('../assets/images/helpdesk.png')} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Help Center</Text>
          </View>
          
          <View style={styles.placeholderView} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Image source={require('../assets/images/search.png')} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Image source={require('../assets/images/cross.png')} style={styles.clearSearchIcon} />
            </TouchableOpacity>
          )}
        </View>

        {/* Help Content */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.logoContainer}>
              <Image source={require('../assets/images/ss logo black.png')} style={styles.welcomeLogo} />
              <Text style={styles.welcomeTitle}>StyleSync Help Center</Text>
            </View>
            <Text style={styles.welcomeText}>
              Find answers to common questions, learn how to make the most of StyleSync, 
              and get support when you need it.
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionButton} onPress={handleTrackOrderPress}>
                <Image source={require('../assets/images/all orders.png')} style={styles.quickActionIcon} />
                <Text style={styles.quickActionText}>Track Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Image source={require('../assets/images/order placed.png')} style={styles.quickActionIcon} />
                <Text style={styles.quickActionText}>Return Item</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={handleContactSupport}>
                <Image source={require('../assets/images/chatapi.png')} style={styles.quickActionIcon} />
                <Text style={styles.quickActionText}>Contact Us</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={handleVouchersPress}>
                <Image source={require('../assets/images/voucher.png')} style={styles.quickActionIcon} />
                <Text style={styles.quickActionText}>My Vouchers</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Help Sections */}
          <View style={styles.sectionsContainer}>
            <Text style={styles.sectionsTitle}>Browse Help Topics</Text>
            {filteredSections.map(renderSection)}
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.contactSectionTitle}>Still Need Help?</Text>
            <Text style={styles.contactSectionText}>
              Our support team is here to help you with any questions or issues.
            </Text>
            
            <View style={styles.contactMethods}>
              <TouchableOpacity
                style={styles.contactMethodButton}
                onPress={() => Linking.openURL('mailto:support@stylesync.com')}
              >
                <Text style={styles.contactMethodTitle}>Email Support</Text>
                <Text style={styles.contactMethodDetail}>support@stylesync.com</Text>
                <Text style={styles.contactMethodTime}>Response within 24 hours</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactMethodButton}
                onPress={() => Linking.openURL('tel:+1-555-STYLE-01')}
              >
                <Text style={styles.contactMethodTitle}>Phone Support</Text>
                <Text style={styles.contactMethodDetail}>+1 (555) STYLE-01</Text>
                <Text style={styles.contactMethodTime}>Mon-Fri 9AM-6PM EST</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.appInfoContainer}>
              <Text style={styles.appInfoTitle}>App Information</Text>
              <Text style={styles.appInfoText}>StyleSync Version 1.0.0</Text>
              <Text style={styles.appInfoText}>© 2024 StyleSync. All rights reserved.</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: isSmallDevice ? 60 : isMediumDevice ? 65 : 70,
    paddingHorizontal: isSmallDevice ? 8 : isMediumDevice ? 9 : 10,
  },
  helpContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderTopLeftRadius: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    borderTopRightRadius: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    paddingHorizontal: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    paddingVertical: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    width: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    height: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    tintColor: '#000',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: isSmallDevice ? 22 : isMediumDevice ? 24 : 26,
    height: isSmallDevice ? 22 : isMediumDevice ? 24 : 26,
    marginRight: 8,
    tintColor: '#000',
  },
  headerTitle: {
    fontSize: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    fontWeight: '600',
    color: '#000',
  },
  placeholderView: {
    width: isSmallDevice ? 12 : isMediumDevice ? 14 : 16,
    height: isSmallDevice ? 6 : isMediumDevice ? 7 : 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
  },
  searchIcon: {
    width: 16,
    height: 16,
    tintColor: '#999',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#000',
  },
  clearSearchIcon: {
    width: 14,
    height: 14,
    tintColor: '#999',
  },
  scrollContainer: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 25 : isMediumDevice ? 30 : 35,
    paddingHorizontal: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeLogo: {
    width: isSmallDevice ? 60 : isMediumDevice ? 70 : 80,
    height: isSmallDevice ? 60 : isMediumDevice ? 70 : 80,
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
  },
  quickActionsContainer: {
    marginBottom: isSmallDevice ? 25 : isMediumDevice ? 30 : 35,
  },
  quickActionsTitle: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: isSmallDevice ? 15 : isMediumDevice ? 17 : 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionIcon: {
    width: isSmallDevice ? 30 : isMediumDevice ? 35 : 40,
    height: isSmallDevice ? 30 : isMediumDevice ? 35 : 40,
    marginBottom: 8,
    tintColor: '#000',
  },
  quickActionText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#000',
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionsContainer: {
    marginBottom: isSmallDevice ? 25 : isMediumDevice ? 30 : 35,
  },
  sectionsTitle: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isSmallDevice ? 15 : isMediumDevice ? 17 : 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    height: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    marginRight: 12,
    tintColor: '#000',
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 15 : isMediumDevice ? 16 : 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  expandArrow: {
    width: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    height: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    tintColor: '#666',
    transform: [{ rotate: '270deg' }],
  },
  expandArrowRotated: {
    transform: [{ rotate: '90deg' }],
  },
  questionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  questionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isSmallDevice ? 15 : isMediumDevice ? 17 : 20,
    paddingLeft: isSmallDevice ? 35 : isMediumDevice ? 40 : 45,
  },
  questionText: {
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  questionArrow: {
    width: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    height: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    tintColor: '#999',
    transform: [{ rotate: '270deg' }],
  },
  questionArrowRotated: {
    transform: [{ rotate: '90deg' }],
  },
  answerContainer: {
    paddingHorizontal: isSmallDevice ? 35 : isMediumDevice ? 40 : 45,
    paddingBottom: isSmallDevice ? 15 : isMediumDevice ? 17 : 20,
    paddingTop: 5,
  },
  answerText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: '#666',
    lineHeight: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
  },
  contactSection: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: isSmallDevice ? 20 : isMediumDevice ? 22 : 25,
    marginBottom: 20,
  },
  contactSectionTitle: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactSectionText: {
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
  },
  contactMethods: {
    marginBottom: 20,
  },
  contactMethodButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: isSmallDevice ? 15 : isMediumDevice ? 17 : 20,
    marginBottom: 10,
  },
  contactMethodTitle: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  contactMethodDetail: {
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    color: '#007AFF',
    marginBottom: 3,
  },
  contactMethodTime: {
    fontSize: isSmallDevice ? 11 : isMediumDevice ? 12 : 13,
    color: '#999',
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  appInfoTitle: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  appInfoText: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default HelpCenterScreen; 