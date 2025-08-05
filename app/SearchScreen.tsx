import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import { FashionItemForDisplay, searchProducts, debugUserItems } from '../backend/supabaseItems';
import { useLikes } from '../context/LikesContext';
import debounce from 'lodash/debounce';

type RootStackParamList = {
  ProductDetail: { product: FashionItemForDisplay };
};

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 428;

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { setShowLikes } = useLikes();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FashionItemForDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Debug effect to check user items when component mounts
  useEffect(() => {
    debugUserItems();
  }, []);

  const performSearch = useCallback(
    debounce(async (query: string, showFullScreen: boolean = false) => {
      if (!query.trim()) {
        setSearchResults([]);
        setError('');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        console.log('Starting search for:', query);
        const results = await searchProducts(query);
        console.log('Search completed. Results:', results?.length || 0);
        setSearchResults(results || []);
        if (showFullScreen) {
          setIsFullScreen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching. Please try again.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    performSearch(text);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, true);
    }
  };

  const handleProductPress = (product: FashionItemForDisplay) => {
    navigation.navigate('ProductDetail', { 
      product,
      sourceScreen: 'search'
    });
  };

  const renderProductCard = ({ item }: { item: FashionItemForDisplay }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.brandName} numberOfLines={1}>
          {item.brand_name}
        </Text>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product_display_name}
        </Text>
        {item.description ? (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>RM {item.price.toFixed(2)}</Text>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>RM {item.originalPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../assets/images/arrow for back.png')}
              style={[styles.backIcon, { tintColor: '#000', transform: [{ scaleX: -1 }] }]}
            />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Image
              source={require('../assets/images/search.png')}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for products..."
              value={searchQuery}
              onChangeText={handleSearch}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoFocus
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => handleSearch('')}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : searchResults.length === 0 && searchQuery.trim() !== '' ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noResultsText}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
            numColumns={1}
          />
        )}
      </KeyboardAvoidingView>
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
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: width * 0.04,
    marginLeft: width * 0.02,
  },
  searchIcon: {
    width: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    height: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    marginRight: width * 0.02,
    tintColor: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    color: '#000',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 20,
    color: '#999',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  productList: {
    padding: width * 0.04,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: width * 0.04,
  },
  productImage: {
    width: width * 0.3,
    aspectRatio: 0.75,
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  brandName: {
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  productName: {
    fontSize: isSmallDevice ? 11 : 13,
    color: '#666',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: isSmallDevice ? 11 : 13,
    color: '#888',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: isSmallDevice ? 13 : 15,
    fontWeight: '600',
    color: '#000',
  },
  originalPrice: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
});

export default SearchScreen;