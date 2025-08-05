import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../app/MainTabsScreen';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 350;
const isMediumDevice = width >= 350 && width < 400;

type NavigationProp = StackNavigationProp<RootStackParamList>;

const CartIcon = () => {
  const navigation = useNavigation<NavigationProp>();
  const { cartCount } = useCart();

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Cart')} 
      style={styles.cartIconContainer}
    >
      <Image 
        source={require('../assets/images/carts.png')} 
        style={[styles.headerIcon, styles.cartsIcon]} 
      />
      {cartCount > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cartCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cartIconContainer: {
    position: 'relative',
  },
  headerIcon: {
    width: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
    height: isSmallDevice ? 21 : isMediumDevice ? 23 : 25,
  },
  cartsIcon: {
    tintColor: '#333',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#333',
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default CartIcon; 