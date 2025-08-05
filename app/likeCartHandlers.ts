import { Alert } from 'react-native';
import { unlikeProduct, addToCart, FashionItemForDisplay } from '../backend/supabaseItems';

/**
 * Handles unliking a product and refreshes the liked products list on success.
 * @param userId - The user's ID
 * @param productId - The product's ID
 * @param refreshLikedProducts - Callback to refresh liked products
 */
export const handleUnlike = async (
  userId: string,
  productId: number,
  refreshLikedProducts: () => void
) => {
  const result = await unlikeProduct(userId, productId);
  if (result.success) refreshLikedProducts();
};

/**
 * Handles adding a product to the cart and shows an alert on success.
 * @param userId - The user's ID
 * @param product - The product to add (must have id, size, base_colour)
 */
export const handleAddToCart = async (
  userId: string,
  product: FashionItemForDisplay
) => {
  const result = await addToCart(
    userId,
    product.id,
    product.size || 'M',
    product.base_colour || null,
    'likes'
  );
  if (result.success) Alert.alert('Added to cart');
}; 