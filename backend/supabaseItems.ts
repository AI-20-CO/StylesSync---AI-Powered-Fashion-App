import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Currency conversion: INR to MYR (Malaysian Ringgit)
// 1 INR ≈ 0.055 MYR (approximate rate as of 2024)
// You can update this rate as needed for current exchange rates
const INR_TO_MYR_RATE = 0.055;

function convertINRtoMYR(priceInINR: number): number {
  return Math.round(priceInINR * INR_TO_MYR_RATE * 100) / 100; // Round to 2 decimal places
}

// Define allowed article types for public display
const ALLOWED_ARTICLE_TYPES = [
  // Clothing - Tops
  'Shirts', 'Tshirts', 'Tops', 'Kurtas', 'Kurtis', 'Tunics', 'Blazers', 'Jackets', 
  'Sweaters', 'Sweatshirts', 'Kurta Sets',
  
  // Clothing - Bottoms
  'Jeans', 'Trousers', 'Shorts', 'Track Pants', 'Capris', 'Leggings', 'Skirts',
  
  // Dresses & Sets
  'Dresses', 'Jumpsuit', 'Tracksuits', 'Sarees',
  
  // Footwear
  'Casual Shoes', 'Formal Shoes', 'Sports Shoes', 'Sandals', 'Sports Sandals', 
  'Heels', 'Flats', 'Flip Flops',
  
  // Accessories
  'Watches', 'Belts', 'Wallets', 'Handbags', 'Backpacks', 'Clutches', 'Sunglasses',
  'Caps', 'Mufflers', 'Scarves', 'Dupatta', 'Ties',
  
  // Jewelry
  'Earrings', 'Necklace and Chains', 'Bracelet', 'Ring', 'Pendant', 'Jewellery Set',
  
  // Bags
  'Duffel Bag', 'Laptop Bag', 'Messenger Bag', 'Travel Accessory'
];

// Helper function to check if article type is allowed
function isAllowedArticleType(articleType: any): boolean {
  if (!articleType || typeof articleType !== 'object' || !articleType.typeName) {
    return false;
  }
  return ALLOWED_ARTICLE_TYPES.includes(articleType.typeName);
}

// Helper function to create article type filter for Supabase queries
function getArticleTypeFilter() {
  return ALLOWED_ARTICLE_TYPES.map(type => `article_type->typeName.eq.${type}`).join(',');
}

export interface FashionItemForDisplay {
  id: number;
  product_display_name: string;
  brand_name: string;
  price: number;
  discounted_price?: number;
  myntra_rating: number;
  base_colour: string;
  colour1?: string;
  colour2?: string;
  selectedColor?: string;  // Selected color from color selector
  gender: string;
  article_type: string;
  image_url: string;
  size?: string; // Will be added randomly for display
  originalPrice?: number; // Added for display formatting
  isRental?: boolean; // Added for rental items
  sourceScreen?: string; // Added for likes screen marketplace icon
  isUserItem?: boolean; // Flag to identify user items
  sellerId?: string; // Add seller info
  description?: string; // Added for user-added items
  isSold?: boolean;
  isRented?: boolean;
  status?: string;
  quantitySold?: number;
}

// Function to get AI suggestions (women's items) with pagination
export async function getAISuggestions(page: number = 0, limit: number = 10): Promise<FashionItemForDisplay[]> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    // Increase database query limit to compensate for filtering
    const queryLimit = limit * 5; // Increased from 3x to 5x to account for heavy filtering
    const queryFrom = page * queryLimit;
    const queryTo = queryFrom + queryLimit - 1;

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .eq('gender', 'Women')
      .not('price', 'is', null)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching AI suggestions:', error);
      return [];
    }

          console.log(`Fetched ${data?.length || 0} AI suggestions from database (page ${page})`);

    // Filter out unwanted categories and add random sizes
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
          console.log(`After filtering: ${filteredData.length} allowed AI suggestions (${Math.round((1 - filteredData.length/(data?.length || 1)) * 100)}% filtered out)`);

    // Take only the requested limit from filtered results
    const limitedData = filteredData.slice(0, limit);
          console.log(`Final AI suggestions: ${limitedData.length} items`);

    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));

  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    return [];
  }
}

// Function to get exciting offers with pagination
export async function getExcitingOffers(page: number = 0, limit: number = 10): Promise<FashionItemForDisplay[]> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    // Increase database query limit to compensate for filtering
    const queryLimit = limit * 5; // Increased from 3x to 5x to account for heavy filtering
    const queryFrom = page * queryLimit;
    const queryTo = queryFrom + queryLimit - 1;

    console.log(`getExcitingOffers: page ${page}, fetching ${queryLimit} items from offset ${queryFrom}`);

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .lt('price', 500) // Increased from 200 to 500 to get more items
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching exciting offers:', error);
      return [];
    }

          console.log(`Fetched ${data?.length || 0} exciting offers from database (page ${page})`);

    // Filter out unwanted categories and add random sizes
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
          console.log(`After filtering: ${filteredData.length} allowed exciting offers (${Math.round((1 - filteredData.length/(data?.length || 1)) * 100)}% filtered out)`);

    // Take only the requested limit from filtered results
    const limitedData = filteredData.slice(0, limit);
          console.log(`Final exciting offers: ${limitedData.length} items`);

    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));

  } catch (error) {
    console.error('Error fetching exciting offers:', error);
    return [];
  }
}

// Function to get P2P items (men's items) with pagination
export async function getP2PItems(page: number = 0, limit: number = 10): Promise<FashionItemForDisplay[]> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    // Increase database query limit to compensate for filtering
    const queryLimit = limit * 5; // Increased from 3x to 5x to account for heavy filtering
    const queryFrom = page * queryLimit;
    const queryTo = queryFrom + queryLimit - 1;

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .eq('gender', 'Men')
      .not('price', 'is', null)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching P2P items:', error);
      return [];
    }

          console.log(`Fetched ${data?.length || 0} P2P items from database (page ${page})`);

    // Filter out unwanted categories and add random sizes
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
          console.log(`After filtering: ${filteredData.length} allowed P2P items (${Math.round((1 - filteredData.length/(data?.length || 1)) * 100)}% filtered out)`);

    // Take only the requested limit from filtered results
    const limitedData = filteredData.slice(0, limit);
          console.log(`Final P2P items: ${limitedData.length} items`);

    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));

  } catch (error) {
    console.error('Error fetching P2P items:', error);
    return [];
  }
}

// Function to get AI recommendation items (women's items) with pagination
export async function getAIRecommendations(page: number = 0, limit: number = 10): Promise<FashionItemForDisplay[]> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    // Increase database query limit to compensate for filtering
    const queryLimit = limit * 5; // Increased from 3x to 5x to account for heavy filtering
    const queryFrom = page * queryLimit;
    const queryTo = queryFrom + queryLimit - 1;

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .eq('gender', 'Women')
      .not('price', 'is', null)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching AI recommendations:', error);
      return [];
    }

          console.log(`Fetched ${data?.length || 0} AI recommendations from database (page ${page})`);

    // Filter out unwanted categories and add random sizes
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
          console.log(`After filtering: ${filteredData.length} allowed AI recommendations (${Math.round((1 - filteredData.length/(data?.length || 1)) * 100)}% filtered out)`);

    // Take only the requested limit from filtered results
    const limitedData = filteredData.slice(0, limit);
          console.log(`Final AI recommendations: ${limitedData.length} items`);

    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));

  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return [];
  }
}

// Function to get rental items (unisex items) with pagination
export async function getRentalItems(page: number = 0, limit: number = 10): Promise<FashionItemForDisplay[]> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    // Increase database query limit to compensate for filtering
    const queryLimit = limit * 5; // Increased from 3x to 5x to account for heavy filtering
    const queryFrom = page * queryLimit;
    const queryTo = queryFrom + queryLimit - 1;

    console.log(`getRentalItems: page ${page}, fetching ${queryLimit} items from offset ${queryFrom}`);

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .in('gender', ['Unisex', 'Men', 'Women']) // Expand from just 'Unisex' to all genders
      .not('price', 'is', null)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching rental items:', error);
      return [];
    }

          console.log(`Fetched ${data?.length || 0} rental items from database (page ${page})`);

    // Filter out unwanted categories and add random sizes
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
          console.log(`After filtering: ${filteredData.length} allowed rental items (${Math.round((1 - filteredData.length/(data?.length || 1)) * 100)}% filtered out)`);

    // Take only the requested limit from filtered results
    const limitedData = filteredData.slice(0, limit);
          console.log(`Final rental items: ${limitedData.length} items`);

    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: Math.round(convertINRtoMYR(item.discounted_price || item.price) * 0.2 * 100) / 100, // 20% of converted price for monthly rental
      originalPrice: convertINRtoMYR(item.price),
      isRental: true
    }));

  } catch (error) {
    console.error('Error fetching rental items:', error);
    return [];
  }
}

// Helper function to generate random sizes
function getRandomSize(): string {
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  return sizes[Math.floor(Math.random() * sizes.length)];
}

// Function to format price for display
export function formatPrice(price: number): string {
  return `RM ${price.toFixed(2)}`;
}

// Function to format rating for display
export function formatRating(rating: number): string {
  return rating ? rating.toFixed(1) : '4.0';
}

// Likes functionality
export interface ProductLike {
  like_id: number;
  user_id: string;
  product_id: number;
  liked_at: string;
}

// Function to like a product
export async function likeProduct(userId: string, productId: number, sourceScreen: string = 'home'): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`likeProduct: Attempting to like product ${productId} for user ${userId} from ${sourceScreen}`);
    
    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('product_likes')
      .select('like_id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('likeProduct: Error checking existing like:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingLike) {
      console.log('likeProduct: Product already liked by user');
      return { success: false, error: 'Product already liked' };
    }

    // Insert new like with source screen
    const { error: insertError } = await supabase
      .from('product_likes')
      .insert([{
        user_id: userId,
        product_id: productId,
        source_screen: sourceScreen,
        liked_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('likeProduct: Error inserting like:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`likeProduct: Successfully liked product ${productId} for user ${userId} from ${sourceScreen}`);
    return { success: true };

  } catch (error) {
    console.error('likeProduct: Catch block error:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// Function to unlike a product
export async function unlikeProduct(userId: string, productId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('product_likes')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error unliking product:', error);
      return { success: false, error: error.message };
    }

    console.log(`Product ${productId} unliked by user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error unliking product:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// Function to check if a product is liked by user
export async function isProductLiked(userId: string, productId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('product_likes')
      .select('like_id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if product is liked:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking if product is liked:', error);
    return false;
  }
}

// Function to get user's liked products
export async function getUserLikedProducts(userId: string, page: number = 0, limit: number = 20): Promise<FashionItemForDisplay[]> {
  try {
    console.log('getUserLikedProducts: Starting with userId:', userId, 'page:', page, 'limit:', limit);
    
    const from = page * limit;
    const to = from + limit - 1;

    console.log('getUserLikedProducts: Querying Supabase...');
    const { data, error } = await supabase
      .from('product_likes')
      .select(`
        product_id,
        source_screen,
        liked_at,
        detailed_fashion_items (
          id,
          product_display_name,
          brand_name,
          price,
          discounted_price,
          myntra_rating,
          base_colour,
          colour1,
          colour2,
          gender,
          article_type,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('liked_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('getUserLikedProducts: Supabase error:', error);
      return [];
    }

          console.log('getUserLikedProducts: Query successful, raw data:', data);
          console.log(`Fetched ${data?.length || 0} liked products for user ${userId} (page ${page})`);

    // Transform and filter unwanted categories
    console.log('getUserLikedProducts: Transforming and filtering data...');
    const transformedProducts = (data || []).map((like, index) => {
      console.log(`Processing like ${index}:`, like);
      const item = like.detailed_fashion_items as any;
      if (!item) {
        console.log(`No detailed_fashion_items for like ${index}`);
        return null;
      }
      
      // Check if article type is allowed
      if (!isAllowedArticleType(item.article_type)) {
        console.log(`🚫 Filtering out product ${item.id} - unwanted category:`, item.article_type?.typeName);
        return null;
      }
      
      const transformed = {
        id: item.id,
        product_display_name: item.product_display_name,
        brand_name: item.brand_name,
        price: convertINRtoMYR(item.discounted_price || item.price),
        discounted_price: item.discounted_price ? convertINRtoMYR(item.discounted_price) : undefined,
        myntra_rating: item.myntra_rating,
        base_colour: item.base_colour,
        colour1: item.colour1,
        colour2: item.colour2,
        gender: item.gender,
        article_type: item.article_type,
        image_url: item.image_url,
        size: getRandomSize(),
        originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined,
        sourceScreen: like.source_screen || 'home'
      } as FashionItemForDisplay;
      
      console.log(`Transformed product ${index}:`, transformed);
      return transformed;
    }).filter(Boolean) as FashionItemForDisplay[];

    console.log(`getUserLikedProducts: After filtering: ${transformedProducts.length} allowed products`);
    console.log('getUserLikedProducts: Final result:', transformedProducts.length, 'products');
    return transformedProducts;

  } catch (error) {
    console.error('getUserLikedProducts: Catch block error:', error);
    return [];
  }
}

// Recommendation system interfaces
export interface UserInteraction {
  user_id: string;
  product_id: number;
  interaction_type: 'view' | 'like' | 'purchase' | 'share';
  interaction_weight: number; // 1 for view, 2 for like, 3 for purchase, 4 for share
  created_at: string;
}

export interface UserPreference {
  user_id: string;
  category: string; // article_type.typeName
  preference_score: number; // 0-100
  interaction_count: number;
  last_interaction: string;
}

// Function to track user interaction
export async function trackUserInteraction(
  userId: string, 
  productId: number, 
  interactionType: 'view' | 'like' | 'purchase' | 'share'
): Promise<{ success: boolean; error?: string }> {
  try {
    const interactionWeight = {
      'view': 1,
      'like': 2, 
      'purchase': 3,
      'share': 4
    }[interactionType];

    const { error } = await supabase
      .from('user_interactions')
      .insert([{
        user_id: userId,
        product_id: productId,
        interaction_type: interactionType,
        interaction_weight: interactionWeight,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error tracking user interaction:', error);
      return { success: false, error: error.message };
    }

    console.log(`Tracked ${interactionType} interaction for user ${userId}, product ${productId}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking user interaction:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// Function to get user preferences based on interactions
export async function getUserPreferences(userId: string): Promise<UserPreference[]> {
  try {
    // First, get user interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('product_id, interaction_type, interaction_weight, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (interactionsError) {
      console.error('Error getting user interactions:', interactionsError);
      return [];
    }

    if (!interactions || interactions.length === 0) {
      console.log('No user interactions found');
      return [];
    }

    // Get product details for the interacted products
    const productIds = interactions.map(i => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from('detailed_fashion_items')
      .select('id, article_type')
      .in('id', productIds);

    if (productsError) {
      console.error('Error getting product details:', productsError);
      return [];
    }

    // Create a map of product_id to article_type
    const productMap = new Map();
    products?.forEach(product => {
      productMap.set(product.id, product.article_type);
    });

    // Calculate preferences by category
    const categoryScores: { [key: string]: { score: number; count: number; lastInteraction: string } } = {};
    
    interactions.forEach(interaction => {
      const articleType = productMap.get(interaction.product_id);
      const category = articleType?.typeName;
      
      if (category && isAllowedArticleType(articleType)) {
        if (!categoryScores[category]) {
          categoryScores[category] = { score: 0, count: 0, lastInteraction: interaction.created_at };
        }
        categoryScores[category].score += interaction.interaction_weight;
        categoryScores[category].count += 1;
        if (new Date(interaction.created_at) > new Date(categoryScores[category].lastInteraction)) {
          categoryScores[category].lastInteraction = interaction.created_at;
        }
      }
    });

    // Convert to UserPreference format
    const preferences: UserPreference[] = Object.entries(categoryScores).map(([category, data]) => ({
      user_id: userId,
      category,
      preference_score: Math.min(100, data.score * 10), // Scale score to 0-100
      interaction_count: data.count,
      last_interaction: data.lastInteraction
    }));

    // Sort by preference score (highest first)
    preferences.sort((a, b) => b.preference_score - a.preference_score);
    
    console.log(`User ${userId} preferences:`, preferences);
    return preferences;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return [];
  }
}

// Function to get similar products based on a purchased item
async function getSimilarProducts(
  productId: number,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    // First get the reference product details
    const { data: referenceProduct, error: refError } = await supabase
      .from('detailed_fashion_items')
      .select('article_type, gender, base_colour, brand_name')
      .eq('id', productId)
      .single();

    if (refError || !referenceProduct) {
      console.error('Error getting reference product:', refError);
      return [];
    }

    // Get similar products based on article type and gender
    const { data: similarProducts, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('id', 'eq', productId) // Exclude the purchased product
      .eq('gender', referenceProduct.gender)
      .eq('article_type->typeName', referenceProduct.article_type.typeName)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .order('myntra_rating', { ascending: false })
      .limit(limit * 2); // Get more items to allow for filtering

    if (error) {
      console.error('Error getting similar products:', error);
      return [];
    }

    // Score products by similarity
    const scoredProducts = (similarProducts || []).map(product => {
      let similarityScore = 0;

      // Same brand bonus (small weight to avoid too many same-brand items)
      if (product.brand_name === referenceProduct.brand_name) {
        similarityScore += 0.3;
      }

      // Color similarity
      if (product.base_colour === referenceProduct.base_colour) {
        similarityScore += 0.5;
      }

      // Rating bonus
      if (product.myntra_rating) {
        similarityScore += product.myntra_rating / 5; // Normalize to 0-1 range
      }

      return { ...product, similarityScore };
    });

    // Sort by similarity score and take top items
    scoredProducts.sort((a, b) => b.similarityScore - a.similarityScore);
    const limitedProducts = scoredProducts.slice(0, limit);

    return limitedProducts.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    console.error('Error in getSimilarProducts:', error);
    return [];
  }
}

// Function to get user's purchase history
async function getUserPurchases(userId: string): Promise<Set<number>> {
  try {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('product_id')
      .eq('user_id', userId)
      .eq('interaction_type', 'purchase');

    if (error) {
      console.error('Error getting user purchases:', error);
      return new Set();
    }

    return new Set(data.map(item => item.product_id));
  } catch (error) {
    console.error('Error in getUserPurchases:', error);
    return new Set();
  }
}

// Modified getPersonalizedRecommendations to consider purchases
export async function getPersonalizedRecommendations(
  userId: string, 
  page: number = 0, 
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const userPreferences = await getUserPreferences(userId);
    const purchasedItems = await getUserPurchases(userId);
    
    if (userPreferences.length === 0) {
      console.log('No user preferences found, returning randomized recommendations');
      return getRandomizedRecommendations(page, limit);
    }

    // Get top 3 preferred categories
    const topCategories = userPreferences.slice(0, 3).map(p => p.category);
    console.log('Top user categories:', topCategories);

    // Add random offset to ensure different products on each call
    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 10;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;

    // First, get similar products for recent purchases
    let similarProducts: FashionItemForDisplay[] = [];
    if (purchasedItems.size > 0) {
      const recentPurchases = Array.from(purchasedItems).slice(-3); // Get last 3 purchases
      for (const purchasedId of recentPurchases) {
        const similar = await getSimilarProducts(purchasedId, Math.floor(limit / 2));
        similarProducts = [...similarProducts, ...similar];
      }
    }

    // Then get regular recommendations
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .not('id', 'in', `(${Array.from(purchasedItems).join(',')})`) // Exclude purchased items
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching personalized recommendations:', error);
      return getRandomizedRecommendations(page, limit);
    }

    // Filter and prioritize by user preferences
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    // Score regular recommendations
    const scoredItems = filteredData.map(item => {
      const category = item.article_type?.typeName;
      const preference = userPreferences.find(p => p.category === category);
      const score = preference ? preference.preference_score : 0;
      return { ...item, preferenceScore: score };
    });

    // Sort by preference score and rating
    scoredItems.sort((a, b) => {
      if (b.preferenceScore !== a.preferenceScore) {
        return b.preferenceScore - a.preferenceScore;
      }
      return (b.myntra_rating || 0) - (a.myntra_rating || 0);
    });

    // Combine similar products with regular recommendations
    let finalRecommendations = [...similarProducts];
    
    // Add regular recommendations until we reach the limit
    const remainingSlots = limit - finalRecommendations.length;
    if (remainingSlots > 0) {
      finalRecommendations = [
        ...finalRecommendations,
        ...scoredItems.slice(0, remainingSlots)
      ];
    }

    // Add some randomization to prevent same products on reload
    const shuffledItems = [...finalRecommendations];
    for (let i = Math.min(5, shuffledItems.length - 1); i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }

    console.log(`Personalized recommendations: ${shuffledItems.length} items (${similarProducts.length} similar to purchases}`);

    return shuffledItems.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return getRandomizedRecommendations(page, limit);
  }
}

// Function to get randomized recommendations (fallback)
export async function getRandomizedRecommendations(
  page: number = 0, 
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    // Use a random offset to get different products on each call
    const randomOffset = Math.floor(Math.random() * 1000); // Random offset up to 1000
    const queryLimit = limit * 8; // Fetch more to account for filtering
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;

    console.log(`Randomized recommendations: page ${page}, random offset ${randomOffset}, fetching from ${queryFrom} to ${queryTo}`);

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching randomized recommendations:', error);
      return [];
    }

    // Filter and randomize
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    // Shuffle the array using Fisher-Yates algorithm for better randomization
    const shuffledData = [...filteredData];
    for (let i = shuffledData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
    }
    
    const limitedData = shuffledData.slice(0, limit);
    console.log(`Randomized recommendations: ${limitedData.length} items (from ${filteredData.length} filtered, random offset: ${randomOffset})`);

    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));

  } catch (error) {
    console.error('Error getting randomized recommendations:', error);
    return [];
  }
}

// Function to get personalized exciting offers (with price filter and randomization)
export async function getPersonalizedExcitingOffers(
  userId: string, 
  page: number = 0, 
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const userPreferences = await getUserPreferences(userId);
    
    if (userPreferences.length === 0) {
      // No user data, return randomized exciting offers
      console.log('No user preferences found, returning randomized exciting offers');
      return getRandomizedExcitingOffers(page, limit);
    }

    // Get top 3 preferred categories
    const topCategories = userPreferences.slice(0, 3).map(p => p.category);
    console.log('Top user categories (exciting offers):', topCategories);

    // Add random offset to ensure different products on each call
    const randomOffset = Math.floor(Math.random() * 500);
    
    // Fetch items from preferred categories with higher weight
    const queryLimit = limit * 10; // Fetch more to account for filtering and category distribution
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;

    console.log(`Personalized exciting offers: page ${page}, random offset ${randomOffset}, fetching from ${queryFrom} to ${queryTo}`);

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .lt('price', 500)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching personalized exciting offers:', error);
      return getRandomizedExcitingOffers(page, limit);
    }

    // Filter and prioritize by user preferences
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    // Sort by preference score
    const scoredItems = filteredData.map(item => {
      const category = item.article_type?.typeName;
      const preference = userPreferences.find(p => p.category === category);
      const score = preference ? preference.preference_score : 0;
      return { ...item, preferenceScore: score };
    });

    // Sort by preference score (highest first), then by rating
    scoredItems.sort((a, b) => {
      if (b.preferenceScore !== a.preferenceScore) {
        return b.preferenceScore - a.preferenceScore;
      }
      return (b.myntra_rating || 0) - (a.myntra_rating || 0);
    });

    // Add some randomization to prevent same products on reload
    const shuffledItems = [...scoredItems];
    for (let i = Math.min(5, shuffledItems.length - 1); i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }

    // Take the requested limit
    const limitedData = shuffledItems.slice(0, limit);
    console.log(`Personalized exciting offers: ${limitedData.length} items (from ${filteredData.length} filtered, random offset: ${randomOffset})`);

    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));

  } catch (error) {
    console.error('Error getting personalized exciting offers:', error);
    return getRandomizedExcitingOffers(page, limit);
  }
}

// Function to get randomized exciting offers (with price filter and randomization)
export async function getRandomizedExcitingOffers(
  page: number = 0, 
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    // Use a random offset to get different products on each call
    const randomOffset = Math.floor(Math.random() * 1000); // Random offset up to 1000
    const queryLimit = limit * 8; // Fetch more to account for filtering
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;

    console.log(`Randomized exciting offers: page ${page}, random offset ${randomOffset}, fetching from ${queryFrom} to ${queryTo}`);

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id,
        product_display_name,
        brand_name,
        price,
        discounted_price,
        myntra_rating,
        base_colour,
        colour1,
        colour2,
        gender,
        article_type,
        image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .lt('price', 500)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      console.error('Error fetching randomized exciting offers:', error);
      return [];
    }

    // Filter and randomize
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    // Shuffle the array using Fisher-Yates algorithm for better randomization
    const shuffledData = [...filteredData];
    for (let i = shuffledData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
    }
    
    const limitedData = shuffledData.slice(0, limit);
    console.log(`Randomized exciting offers: ${limitedData.length} items (from ${filteredData.length} filtered, random offset: ${randomOffset})`);

    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));

  } catch (error) {
    console.error('Error getting randomized exciting offers:', error);
    return [];
  }
}

// Function to get personalized rental items (randomized)
export async function getPersonalizedRentalItems(
  userId: string,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const userPreferences = await getUserPreferences(userId);
    if (userPreferences.length === 0) {
      return getRandomizedRentalItems(page, limit);
    }
    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 10;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .in('gender', ['Unisex', 'Men', 'Women']) // Match original logic
      .not('price', 'is', null)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);
    if (error) {
      return getRandomizedRentalItems(page, limit);
    }
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    const scoredItems = filteredData.map(item => {
      const category = item.article_type?.typeName;
      const preference = userPreferences.find(p => p.category === category);
      const score = preference ? preference.preference_score : 0;
      return { ...item, preferenceScore: score };
    });
    scoredItems.sort((a, b) => {
      if (b.preferenceScore !== a.preferenceScore) return b.preferenceScore - a.preferenceScore;
      return (b.myntra_rating || 0) - (a.myntra_rating || 0);
    });
    const shuffledItems = [...scoredItems];
    for (let i = Math.min(5, shuffledItems.length - 1); i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }
    const limitedData = shuffledItems.slice(0, limit);
    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: Math.round(convertINRtoMYR(item.discounted_price || item.price) * 0.2 * 100) / 100, // 20% of price for monthly rental
      originalPrice: convertINRtoMYR(item.price),
      isRental: true
    }));
  } catch (error) {
    return getRandomizedRentalItems(page, limit);
  }
}

export async function getRandomizedRentalItems(
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const randomOffset = Math.floor(Math.random() * 1000);
    const queryLimit = limit * 8;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .in('gender', ['Unisex', 'Men', 'Women']) // Match original logic
      .not('price', 'is', null)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);
    if (error) return [];
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    const shuffledData = [...filteredData];
    for (let i = shuffledData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
    }
    const limitedData = shuffledData.slice(0, limit);
    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: Math.round(convertINRtoMYR(item.discounted_price || item.price) * 0.2 * 100) / 100, // 20% of price for monthly rental
      originalPrice: convertINRtoMYR(item.price),
      isRental: true
    }));
  } catch (error) {
    return [];
  }
}

// P2P
export async function getPersonalizedP2PItems(
  userId: string,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const userPreferences = await getUserPreferences(userId);
    
    // Get both catalog items and user items
    const catalogItemsPromise = userPreferences.length === 0 
      ? getRandomizedP2PItems(page, Math.ceil(limit * 0.7)) // 70% catalog items
      : getPersonalizedCatalogP2PItems(userId, page, Math.ceil(limit * 0.7));
    
    const userItemsPromise = getUserAddedP2PItems(userId, page, Math.ceil(limit * 0.3)); // 30% user items

    const [catalogItems, userItems] = await Promise.all([catalogItemsPromise, userItemsPromise]);

    // Combine and shuffle the results
    const combinedItems = [...catalogItems, ...userItems];
    
    // Shuffle to mix catalog and user items
    for (let i = combinedItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedItems[i], combinedItems[j]] = [combinedItems[j], combinedItems[i]];
    }

    const limitedItems = combinedItems.slice(0, limit);
    console.log(`Combined P2P items: ${limitedItems.length} total (${catalogItems.length} catalog + ${userItems.length} user items)`);

    return limitedItems;
  } catch (error) {
    console.error('Error getting personalized P2P items:', error);
    return getRandomizedP2PItems(page, limit);
  }
}

// Helper function for catalog P2P items (renamed from original)
async function getPersonalizedCatalogP2PItems(
  userId: string,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const userPreferences = await getUserPreferences(userId);
    if (userPreferences.length === 0) {
      return getRandomizedP2PItems(page, limit);
    }
    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 10;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .eq('gender', 'Men')
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);
    if (error) {
      return getRandomizedP2PItems(page, limit);
    }
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    const scoredItems = filteredData.map(item => {
      const category = item.article_type?.typeName;
      const preference = userPreferences.find(p => p.category === category);
      const score = preference ? preference.preference_score : 0;
      return { ...item, preferenceScore: score };
    });
    scoredItems.sort((a, b) => {
      if (b.preferenceScore !== a.preferenceScore) return b.preferenceScore - a.preferenceScore;
      return (b.myntra_rating || 0) - (a.myntra_rating || 0);
    });
    const shuffledItems = [...scoredItems];
    for (let i = Math.min(5, shuffledItems.length - 1); i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }
    const limitedData = shuffledItems.slice(0, limit);
    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    return [];
  }
}

// Function to transform user-added items to FashionItemForDisplay format
export function transformUserItemToDisplay(item: any): FashionItemForDisplay {
  const isSold = item.status === 'active-sold';
  const isRented = item.status === 'active-rented';
  
  return {
    id: item.id,
    product_display_name: item.name, // Keep original name without status indicators
    brand_name: item.brand || 'User Item',
    price: Number(item.price),
    discounted_price: undefined,
    myntra_rating: 4.0, // Default rating for user items
    base_colour: item.colors?.[0] || 'Multi',
    colour1: item.colors?.[1] || undefined,
    colour2: item.colors?.[2] || undefined,
    gender: 'Unisex', // Default for user items
    article_type: item.category || 'Clothing',
    image_url: item.image_urls?.[0] || '',
    size: item.sizes?.[0] || getRandomSize(),
    originalPrice: undefined,
    sourceScreen: item.source_screen || 'p2p',
    isUserItem: true, // Flag to identify user items
    sellerId: item.user_id, // Add seller info
    description: item.description || '', // Ensure description is included
    // Add sold/rented status info
    isSold: isSold,
    isRented: isRented,
    status: item.status,
    quantitySold: item.quantity_sold || 0
  };
}

// Function to get user-added items for P2P marketplace
export async function getUserAddedP2PItems(
  excludeUserId?: string, // Exclude current user's items
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('fashion_items')
      .select('*')
      .eq('source_screen', 'p2p')
      .in('status', ['active', 'active-sold']) // Include sold items in P2P display
      .is('deleted_status', null) // Only show non-deleted items
      .order('created_at', { ascending: false })
      .range(from, to);

    // Exclude current user's items if specified
    if (excludeUserId) {
      query = query.not('user_id', 'eq', excludeUserId);
  }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user P2P items:', error);
      return [];
    }

          console.log(`Fetched ${data?.length || 0} user P2P items (page ${page})`);

    return (data || []).map(item => transformUserItemToDisplay(item));
  } catch (error) {
    console.error('Error in getUserAddedP2PItems:', error);
    return [];
  }
}

// Function to get user-added items for Rental marketplace
export async function getUserAddedRentalItems(
  excludeUserId?: string,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('fashion_items')
      .select('*')
      .eq('source_screen', 'rent')
      .in('status', ['active', 'active-rented']) // Include rented items in rental display
      .is('deleted_status', null) // Only show non-deleted items
      .order('created_at', { ascending: false })
      .range(from, to);

    if (excludeUserId) {
      query = query.not('user_id', 'eq', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user rental items:', error);
      return [];
    }

          console.log(`Fetched ${data?.length || 0} user rental items (page ${page})`);

    return (data || []).map(item => {
      const transformed = transformUserItemToDisplay(item);
      // Apply rental pricing (20% of original price)
      transformed.price = Math.round(transformed.price * 0.2);
      transformed.originalPrice = Number(item.price);
      transformed.isRental = true;
      return transformed;
    });
  } catch (error) {
    console.error('Error in getUserAddedRentalItems:', error);
    return [];
  }
}

// Enhanced search function to include user items
export const searchProducts = async (query: string): Promise<FashionItemForDisplay[]> => {
  try {
    // Split the search query into words
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    if (searchTerms.length === 0) {
      return [];
    }

    // Search in both detailed_fashion_items and fashion_items tables
    const [catalogResults, userResults] = await Promise.all([
      searchCatalogItems(searchTerms),
      searchUserItems(searchTerms)
    ]);

    // Combine results
    const allResults = [...catalogResults, ...userResults];
    
    // Sort by relevance score
    return allResults.sort((a, b) => (b as any).score - (a as any).score)
      .map(({ score, ...item }) => item as FashionItemForDisplay);

  } catch (error) {
    console.error('Error in searchProducts:', error);
    throw error;
  }
};

// Helper function to search catalog items
async function searchCatalogItems(searchTerms: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('detailed_fashion_items')
    .select(`
      id, product_display_name, price, discounted_price, myntra_rating, brand_name, gender, base_colour, fashion_type, season, usage, master_category, sub_category, article_type, image_url, sourceScreen:usage
    `)
    .or(searchTerms.map(term => 
      `product_display_name.ilike.%${term}%,brand_name.ilike.%${term}%,gender.ilike.%${term}%,base_colour.ilike.%${term}%,fashion_type.ilike.%${term}%,usage.ilike.%${term}%`
    ).join(','))
    .limit(30); // Reduced to make room for user items

  if (error) {
    console.error('Error searching catalog items:', error);
    return [];
  }

  return (data || []).map(item => {
    let score = 0;
    const itemText = `${item.product_display_name || ''} ${item.brand_name || ''} ${item.gender || ''} ${item.base_colour || ''} ${item.fashion_type || ''} ${item.usage || ''}`.toLowerCase();
    
    searchTerms.forEach(term => {
      if (itemText.includes(term)) {
        score += 1;
        if (item.product_display_name?.toLowerCase().includes(term)) score += 2;
        if (item.brand_name?.toLowerCase().includes(term)) score += 1;
        if (item.base_colour?.toLowerCase() === term) score += 1;
        if (item.gender?.toLowerCase() === term) score += 1;
      }
    });

    return {
      ...item,
      score,
      originalPrice: item.discounted_price ? convertINRtoMYR(item.price) : undefined,
      price: convertINRtoMYR(item.discounted_price || item.price),
      sourceScreen: item.usage?.toLowerCase() || 'home'
    };
  });
}

// Helper function to search user items
async function searchUserItems(searchTerms: string[]): Promise<any[]> {
  console.log('Searching user items with terms:', searchTerms);
  
  const { data, error } = await supabase
    .from('fashion_items')
    .select('*')
    .in('status', ['active', 'active-sold', 'active-rented']) // Include sold/rented items in search
    .is('deleted_status', null) // Only show non-deleted items
    .or(searchTerms.map(term => 
      `name.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%`
    ).join(','))
    .limit(20); // Limit user items in search

  if (error) {
    console.error('Error searching user items:', error);
    return [];
  }

      console.log('Found user items:', data?.length || 0);
      console.log('User items data:', data);

  return (data || []).map(item => {
    let score = 0;
    const itemText = `${item.name || ''} ${item.description || ''} ${item.brand || ''} ${item.category || ''}`.toLowerCase();
    
    searchTerms.forEach(term => {
      if (itemText.includes(term)) {
        score += 1;
        if (item.name?.toLowerCase().includes(term)) score += 2;
        if (item.brand?.toLowerCase().includes(term)) score += 1;
        if (item.category?.toLowerCase() === term) score += 1;
      }
    });

            console.log(`Processing user item: ${item.name}, score: ${score}`);
    
    const transformed = transformUserItemToDisplay(item);
            console.log('Transformed item:', transformed);
    
    return {
      ...transformed,
      score
    };
  });
}

/**
 * Ensures a user exists in Supabase database
 * Called when user first lands on home screen
 */
export const ensureUserInDatabase = async (
  clerkUserId: string,
  email: string,
  firstName?: string | null,
  lastName?: string | null,
  imageUrl?: string | null
) => {
  try {
    console.log('Ensuring user exists in database:', { clerkUserId, email });
    
    // Extract username from email
    const username = email.split('@')[0];
    
    // Call the sync function directly
    const { error } = await supabase.rpc('sync_clerk_user_custom', {
      p_clerk_user_id: clerkUserId,
      p_email: email,
      p_password: 'clerk_managed',
      p_first_name: firstName || null,
      p_last_name: lastName || null,
      p_profile_image_url: imageUrl || null,
      p_is_social_login: false
    });

    if (error) {
      console.error('Error syncing user:', error);
      return { success: false, error: error.message };
    }

    console.log('User sync successful');
    return { success: true };
  } catch (error) {
    console.error('Error in ensureUserInDatabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export async function getRandomizedP2PItems(
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const randomOffset = Math.floor(Math.random() * 1000);
    const queryLimit = limit * 8;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .eq('gender', 'Men')
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);
    if (error) return [];
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    const shuffledData = [...filteredData];
    for (let i = shuffledData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
    }
    const limitedData = shuffledData.slice(0, limit);
    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    return [];
  }
}

// AI
export async function getPersonalizedAISuggestions(
  userId: string,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const userPreferences = await getUserPreferences(userId);
    if (userPreferences.length === 0) {
      return getRandomizedAISuggestions(page, limit);
    }
    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 10;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .eq('gender', 'Women')
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);
    if (error) {
      return getRandomizedAISuggestions(page, limit);
    }
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    const scoredItems = filteredData.map(item => {
      const category = item.article_type?.typeName;
      const preference = userPreferences.find(p => p.category === category);
      const score = preference ? preference.preference_score : 0;
      return { ...item, preferenceScore: score };
    });
    scoredItems.sort((a, b) => {
      if (b.preferenceScore !== a.preferenceScore) return b.preferenceScore - a.preferenceScore;
      return (b.myntra_rating || 0) - (a.myntra_rating || 0);
    });
    const shuffledItems = [...scoredItems];
    for (let i = Math.min(5, shuffledItems.length - 1); i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }
    const limitedData = shuffledItems.slice(0, limit);
    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    return getRandomizedAISuggestions(page, limit);
  }
}

export async function getRandomizedAISuggestions(
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const randomOffset = Math.floor(Math.random() * 1000);
    const queryLimit = limit * 8;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .eq('gender', 'Women')
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);
    if (error) return [];
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    const shuffledData = [...filteredData];
    for (let i = shuffledData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
    }
    const limitedData = shuffledData.slice(0, limit);
    return limitedData.map(item => ({
      ...item,
      size: getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    return [];
  }
}

// ======================== ENHANCED QUESTIONNAIRE-AWARE RECOMMENDATIONS ========================

export interface QuestionnairePreferences {
  gender: string;
  age: string;
  height: string;
  length: string;
  waist: string;
  bust: string;
  size: string;
  style: string;
  occasion: string;
  fit: string;
}

// Flexible size scoring - preferred size gets highest score, adjacent sizes get good scores too
function calculateSizeScore(itemSize: string, preferredSize: string): number {
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const preferredIndex = sizeOrder.indexOf(preferredSize);
  const itemIndex = sizeOrder.indexOf(itemSize);
  
  if (preferredIndex === -1 || itemIndex === -1) {
    return 0; // Unknown sizes
  }
  
  const sizeDifference = Math.abs(itemIndex - preferredIndex);
  
  if (sizeDifference === 0) {
    return 25; // Perfect match - highest score
  } else if (sizeDifference === 1) {
    return 20; // Adjacent size (S/L for M) - still high score for flexibility
  } else if (sizeDifference === 2) {
    return 10; // Two sizes away - lower but still considered
  } else {
    return 0; // Too far from preferred size
  }
}

// Flexible size recommendation - mostly preferred size, sometimes adjacent sizes
function getSmartSizeRecommendation(preferredSize: string, index: number): string {
  if (!preferredSize) {
    return getRandomSize();
  }
  
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const preferredIndex = sizeOrder.indexOf(preferredSize);
  
  if (preferredIndex === -1) {
    return preferredSize; // Return as-is if not in our standard sizes
  }
  
  // Flexible size distribution: 70% preferred, 30% adjacent
  const random = Math.random();
  
  if (random < 0.7) {
    // 70% chance: Return preferred size
    return preferredSize;
  } else {
    // 30% chance: Return adjacent size (S or L for M)
    const availableAdjacent = [];
    
    // Add smaller size if available
    if (preferredIndex > 0) {
      availableAdjacent.push(sizeOrder[preferredIndex - 1]);
    }
    
    // Add larger size if available
    if (preferredIndex < sizeOrder.length - 1) {
      availableAdjacent.push(sizeOrder[preferredIndex + 1]);
    }
    
    if (availableAdjacent.length > 0) {
      const selectedSize = availableAdjacent[Math.floor(Math.random() * availableAdjacent.length)];
      console.log(`Size flexibility: Item ${index + 1} getting ${selectedSize} instead of ${preferredSize} (${Math.round((1-0.7)*100)}% variety)`);
      return selectedSize;
    }
  }
  
  // Fallback: return preferred size
  return preferredSize;
}

// Smart style matching - fuzzy matching for similar styles
function getStyleMatches(userStyle: string): string[] {
  const styleMap: { [key: string]: string[] } = {
    'Casual': ['Casual', 'Smart Casual', 'Relaxed', 'Everyday'],
    'Formal': ['Formal', 'Semi-Formal', 'Business', 'Professional', 'Elegant'],
    'Sporty': ['Sporty', 'Athletic', 'Active', 'Gym', 'Sports'],
    'Trendy': ['Trendy', 'Fashion', 'Contemporary', 'Modern', 'Stylish'],
    'Classic': ['Classic', 'Traditional', 'Timeless', 'Vintage', 'Conservative'],
    'Bohemian': ['Bohemian', 'Boho', 'Ethnic', 'Hippie', 'Free-spirited'],
    'Minimalist': ['Minimalist', 'Simple', 'Clean', 'Basic', 'Understated'],
  };
  
  // Return exact matches and similar styles
  return styleMap[userStyle] || [userStyle];
}

// Smart gender filtering - STRICT as requested
function matchesGender(itemGender: string, userGender: string): boolean {
  // Strict gender matching
  if (userGender === 'Male' && itemGender === 'Men') return true;
  if (userGender === 'Female' && itemGender === 'Women') return true;
  if (userGender === 'Non-binary' && itemGender === 'Unisex') return true;
  if (userGender === 'Prefer not to say') return true; // Show all if prefer not to say
  
  return false;
}

// Smart budget filtering based on questionnaire
function matchesBudget(itemPrice: number, budgetRange: string): boolean {
  const priceInMYR = convertINRtoMYR(itemPrice);
  
  switch (budgetRange) {
    case 'Under $25': return priceInMYR < 25;
    case '$25-$50': return priceInMYR >= 25 && priceInMYR <= 50;
    case '$50-$100': return priceInMYR >= 50 && priceInMYR <= 100;
    case '$100-$200': return priceInMYR >= 100 && priceInMYR <= 200;
    case '$200-$500': return priceInMYR >= 200 && priceInMYR <= 500;
    case '$500+': return priceInMYR >= 500;
    default: return true;
  }
}

// Enhanced recommendation scoring that builds on existing user preferences
function calculateEnhancedScore(
  item: any,
  userPreferences: any[],
  questionnairePrefs: QuestionnairePreferences
): number {
  let score = 0;
  
  // Base score from existing user interaction preferences (70% weight)
  const category = item.article_type?.typeName;
  const userPref = userPreferences.find(p => p.category === category);
  const baseScore = userPref ? userPref.preference_score : 0;
  score += baseScore * 0.7;
  
  // Questionnaire preferences (30% weight)
  let questionnaireScore = 0;
  
  // Gender match (strict - very important)
  if (matchesGender(item.gender, questionnairePrefs.gender)) {
    questionnaireScore += 30;
  } else {
    // If gender doesn't match, heavily penalize
    questionnaireScore -= 50;
  }
  
  // Style match with fuzzy matching
  const styleMatches = getStyleMatches(questionnairePrefs.style);
  const itemStyle = item.article_type?.displayName || item.product_display_name || '';
  const hasStyleMatch = styleMatches.some(style => 
    itemStyle.toLowerCase().includes(style.toLowerCase())
  );
  if (hasStyleMatch) {
    questionnaireScore += 20;
  }
  
  // Size and measurement preference (smart sizing)
  if (questionnairePrefs.size && item.size) {
    const sizeScore = calculateSizeScore(item.size, questionnairePrefs.size);
    questionnaireScore += sizeScore;
  }
  
  // Occasion match
  if (questionnairePrefs.occasion && item.product_display_name) {
    const occasionMap: { [key: string]: string[] } = {
      'Everyday wear': ['casual', 'everyday', 'daily', 'regular'],
      'Work attire': ['formal', 'business', 'office', 'professional'],
      'Party/Night out': ['party', 'evening', 'night', 'cocktail'],
      'Gym/Sports': ['sports', 'gym', 'athletic', 'active', 'workout'],
      'Special events': ['special', 'occasion', 'event', 'celebration'],
    };
    
    const occasionKeywords = occasionMap[questionnairePrefs.occasion] || [];
    const hasOccasionMatch = occasionKeywords.some(keyword =>
      item.product_display_name.toLowerCase().includes(keyword)
    );
    if (hasOccasionMatch) {
      questionnaireScore += 10;
    }
  }
  
  score += questionnaireScore * 0.3;
  
  // Rating boost (existing logic)
  score += (item.myntra_rating || 0) * 2;
  
  return score;
}

// Enhanced personalized recommendations that build on existing system
// NOTE: This is used by AI Screen ONLY. Other screens (Home, P2P, Rent) use their normal recommendation functions
export async function getEnhancedPersonalizedRecommendations(
  userId: string,
  questionnairePrefs: QuestionnairePreferences | null,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    // Get existing user preferences (interaction-based)
    const userPreferences = await getUserPreferences(userId);
    const purchasedItems = await getUserPurchases(userId);
    
    // If no questionnaire data, fall back to existing system
    if (!questionnairePrefs) {
      return getPersonalizedRecommendations(userId, page, limit);
    }
    
    // Get gender-appropriate items (STRICT filtering)
    let genderFilter: string[] = [];
    if (questionnairePrefs.gender === 'Male') genderFilter = ['Men'];
    else if (questionnairePrefs.gender === 'Female') genderFilter = ['Women'];
    else if (questionnairePrefs.gender === 'Non-binary') genderFilter = ['Unisex'];
    else genderFilter = ['Men', 'Women', 'Unisex']; // Prefer not to say
    
    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 15; // Increased to account for strict filtering
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;
    
    console.log(`Enhanced recommendations for gender: ${questionnairePrefs.gender}, filtering by: [${genderFilter.join(', ')}]`);
    
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .in('gender', genderFilter)
      .not('id', 'in', `(${Array.from(purchasedItems).join(',')})`)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);
    
    if (error) {
      console.error('Error in enhanced recommendations:', error);
      return getPersonalizedRecommendations(userId, page, limit);
    }
    
    // Filter allowed items
    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    // Calculate enhanced scores combining user interaction + questionnaire
    const scoredItems = filteredData.map(item => ({
      ...item,
      enhancedScore: calculateEnhancedScore(item, userPreferences, questionnairePrefs)
    }));
    
    // Sort by enhanced score
    scoredItems.sort((a, b) => b.enhancedScore - a.enhancedScore);
    
    // Add some randomization to top scored items to prevent staleness
    const topItems = scoredItems.slice(0, Math.min(scoredItems.length, limit * 3));
    for (let i = Math.min(5, topItems.length - 1); i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topItems[i], topItems[j]] = [topItems[j], topItems[i]];
    }
    
    const finalItems = topItems.slice(0, limit);
    
    console.log(`Enhanced personalized recommendations: ${finalItems.length} items for ${questionnairePrefs.gender}`);
    console.log(`Style preference: ${questionnairePrefs.style}, Size: ${questionnairePrefs.size}`);
    
    return finalItems.map((item, index) => ({
      ...item,
      size: getSmartSizeRecommendation(questionnairePrefs.size, index),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
    
  } catch (error) {
    console.error('Error in enhanced personalized recommendations:', error);
    return getPersonalizedRecommendations(userId, page, limit);
  }
}

// Enhanced P2P recommendations
export async function getEnhancedPersonalizedP2PItems(
  userId: string,
  questionnairePrefs: QuestionnairePreferences | null,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    if (!questionnairePrefs) {
      return getPersonalizedP2PItems(userId, page, limit);
    }

    const userPreferences = await getUserPreferences(userId);
    
    // Gender filtering for P2P (STRICT)
    let genderFilter: string[] = [];
    if (questionnairePrefs.gender === 'Male') genderFilter = ['Men'];
    else if (questionnairePrefs.gender === 'Female') genderFilter = ['Women'];
    else if (questionnairePrefs.gender === 'Non-binary') genderFilter = ['Unisex'];
    else genderFilter = ['Men', 'Women', 'Unisex'];

    // Get both catalog and user items
    const catalogItemsPromise = getEnhancedCatalogP2PItems(userId, questionnairePrefs, genderFilter, page, Math.ceil(limit * 0.7));
    const userItemsPromise = getUserAddedP2PItems(userId, page, Math.ceil(limit * 0.3));

    const [catalogItems, userItems] = await Promise.all([catalogItemsPromise, userItemsPromise]);

    // Combine and shuffle
    const combinedItems = [...catalogItems, ...userItems];
    for (let i = combinedItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedItems[i], combinedItems[j]] = [combinedItems[j], combinedItems[i]];
    }

    const limitedItems = combinedItems.slice(0, limit);
    console.log(`Enhanced P2P items: ${limitedItems.length} total for ${questionnairePrefs.gender}`);

    return limitedItems;
  } catch (error) {
    console.error('Error in enhanced P2P recommendations:', error);
    return getPersonalizedP2PItems(userId, page, limit);
  }
}

// Helper for enhanced catalog P2P items
async function getEnhancedCatalogP2PItems(
  userId: string,
  questionnairePrefs: QuestionnairePreferences,
  genderFilter: string[],
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    const userPreferences = await getUserPreferences(userId);
    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 15;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .in('gender', genderFilter)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) return [];

    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    const scoredItems = filteredData.map(item => ({
      ...item,
      enhancedScore: calculateEnhancedScore(item, userPreferences, questionnairePrefs)
    }));

    scoredItems.sort((a, b) => b.enhancedScore - a.enhancedScore);

    const limitedData = scoredItems.slice(0, limit);
    return limitedData.map(item => ({
      ...item,
      size: questionnairePrefs.size || getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    return [];
  }
}

// Enhanced AI suggestions
export async function getEnhancedPersonalizedAISuggestions(
  userId: string,
  questionnairePrefs: QuestionnairePreferences | null,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    if (!questionnairePrefs) {
      return getPersonalizedAISuggestions(userId, page, limit);
    }

    const userPreferences = await getUserPreferences(userId);
    
    // Gender filtering (STRICT)
    let genderFilter: string[] = [];
    if (questionnairePrefs.gender === 'Male') genderFilter = ['Men'];
    else if (questionnairePrefs.gender === 'Female') genderFilter = ['Women'];
    else if (questionnairePrefs.gender === 'Non-binary') genderFilter = ['Unisex'];
    else genderFilter = ['Men', 'Women', 'Unisex'];

    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 15;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .in('gender', genderFilter)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      return getPersonalizedAISuggestions(userId, page, limit);
    }

    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    const scoredItems = filteredData.map(item => ({
      ...item,
      enhancedScore: calculateEnhancedScore(item, userPreferences, questionnairePrefs)
    }));

    scoredItems.sort((a, b) => b.enhancedScore - a.enhancedScore);

    const limitedData = scoredItems.slice(0, limit);
    console.log(`Enhanced AI suggestions: ${limitedData.length} items for ${questionnairePrefs.gender}`);

    return limitedData.map(item => ({
      ...item,
      size: questionnairePrefs.size || getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    console.error('Error in enhanced AI suggestions:', error);
    return getPersonalizedAISuggestions(userId, page, limit);
  }
}

// Enhanced rental items
export async function getEnhancedPersonalizedRentalItems(
  userId: string,
  questionnairePrefs: QuestionnairePreferences | null,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    if (!questionnairePrefs) {
      return getPersonalizedRentalItems(userId, page, limit);
    }

    const userPreferences = await getUserPreferences(userId);
    
    // Gender filtering (STRICT)
    let genderFilter: string[] = [];
    if (questionnairePrefs.gender === 'Male') genderFilter = ['Men'];
    else if (questionnairePrefs.gender === 'Female') genderFilter = ['Women'];
    else if (questionnairePrefs.gender === 'Non-binary') genderFilter = ['Unisex'];
    else genderFilter = ['Men', 'Women', 'Unisex'];

    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 15;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .in('gender', genderFilter)
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      return getPersonalizedRentalItems(userId, page, limit);
    }

    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    const scoredItems = filteredData.map(item => ({
      ...item,
      enhancedScore: calculateEnhancedScore(item, userPreferences, questionnairePrefs)
    }));

    scoredItems.sort((a, b) => b.enhancedScore - a.enhancedScore);

    const limitedData = scoredItems.slice(0, limit);
    console.log(`Enhanced rental items: ${limitedData.length} items for ${questionnairePrefs.gender}`);

    return limitedData.map(item => ({
      ...item,
      size: questionnairePrefs.size || getRandomSize(),
      price: Math.round(convertINRtoMYR(item.discounted_price || item.price) * 0.2 * 100) / 100, // 20% for rental
      originalPrice: convertINRtoMYR(item.price),
      isRental: true
    }));
  } catch (error) {
    console.error('Error in enhanced rental recommendations:', error);
    return getPersonalizedRentalItems(userId, page, limit);
  }
}

// Enhanced exciting offers
export async function getEnhancedPersonalizedExcitingOffers(
  userId: string,
  questionnairePrefs: QuestionnairePreferences | null,
  page: number = 0,
  limit: number = 10
): Promise<FashionItemForDisplay[]> {
  try {
    if (!questionnairePrefs) {
      return getPersonalizedExcitingOffers(userId, page, limit);
    }

    const userPreferences = await getUserPreferences(userId);
    
    // Gender filtering (STRICT)
    let genderFilter: string[] = [];
    if (questionnairePrefs.gender === 'Male') genderFilter = ['Men'];
    else if (questionnairePrefs.gender === 'Female') genderFilter = ['Women'];
    else if (questionnairePrefs.gender === 'Non-binary') genderFilter = ['Unisex'];
    else genderFilter = ['Men', 'Women', 'Unisex'];

    const randomOffset = Math.floor(Math.random() * 500);
    const queryLimit = limit * 15;
    const queryFrom = (page * queryLimit) + randomOffset;
    const queryTo = queryFrom + queryLimit - 1;

    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .select(`
        id, product_display_name, brand_name, price, discounted_price, myntra_rating, base_colour, colour1, colour2, gender, article_type, image_url
      `)
      .not('image_url', 'is', null)
      .not('price', 'is', null)
      .in('gender', genderFilter)
      .lt('price', 500) // Keep the price filter for exciting offers
      .order('myntra_rating', { ascending: false })
      .range(queryFrom, queryTo);

    if (error) {
      return getPersonalizedExcitingOffers(userId, page, limit);
    }

    const filteredData = (data || []).filter(item => isAllowedArticleType(item.article_type));
    
    const scoredItems = filteredData.map(item => ({
      ...item,
      enhancedScore: calculateEnhancedScore(item, userPreferences, questionnairePrefs)
    }));

    scoredItems.sort((a, b) => b.enhancedScore - a.enhancedScore);

    const limitedData = scoredItems.slice(0, limit);
    console.log(`Enhanced exciting offers: ${limitedData.length} items for ${questionnairePrefs.gender}`);

    return limitedData.map(item => ({
      ...item,
      size: questionnairePrefs.size || getRandomSize(),
      price: convertINRtoMYR(item.discounted_price || item.price),
      originalPrice: item.price !== item.discounted_price ? convertINRtoMYR(item.price) : undefined
    }));
  } catch (error) {
    console.error('Error in enhanced exciting offers:', error);
    return getPersonalizedExcitingOffers(userId, page, limit);
  }
}

export interface CartItem extends FashionItemForDisplay {
  cart_item_id: number; // Unique identifier for each cart item
  cart_id: number;
  added_at: string;
}

interface CartItemResponse {
  cart_item_id: number;
  cart_id: number;
  quantity: number;
  size: string;
  color: string;
  source_screen: string;
  added_at: string;
  detailed_fashion_items: {
    id: number;
    product_display_name: string;
    brand_name: string;
    price: number;
    discounted_price: number | null;
    myntra_rating: number;
    base_colour: string;
    colour1: string;
    colour2: string;
    gender: string;
    article_type: string;
    image_url: string;
  };
}

export async function getUserCartItems(userId: string): Promise<{ success: boolean; data: CartItem[]; error?: string }> {
  try {
    // First get the user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('cart_id')
      .eq('user_id', userId)
      .single();

    if (cartError || !cart) {
      return { success: true, data: [] }; // No cart means empty cart
    }

    // Now get the cart items
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        cart_item_id,
        cart_id,
        quantity,
        size,
        color,
        source_screen,
        added_at,
        detailed_fashion_items!inner (
          id,
          product_display_name,
          brand_name,
          price,
          discounted_price,
          myntra_rating,
          base_colour,
          colour1,
          colour2,
          gender,
          article_type,
          image_url
        )
      `)
      .eq('cart_id', cart.cart_id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching cart items:', error);
      return { success: false, data: [], error: error.message };
    }

    const cartItems = (data as unknown as CartItemResponse[]).map(item => ({
      cart_item_id: item.cart_item_id, // Include the unique cart item ID
      cart_id: item.cart_id,
      added_at: item.added_at,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      sourceScreen: item.source_screen || 'home',
      ...item.detailed_fashion_items,
      id: item.detailed_fashion_items.id,
      price: convertINRtoMYR(item.detailed_fashion_items.discounted_price || item.detailed_fashion_items.price),
      originalPrice: item.detailed_fashion_items.price !== item.detailed_fashion_items.discounted_price ? convertINRtoMYR(item.detailed_fashion_items.price) : undefined
    })) as CartItem[];

    return { success: true, data: cartItems };
  } catch (error) {
    console.error('Error in getUserCartItems:', error);
    return { success: false, data: [], error: String(error) };
  }
}

async function getUserCart(userId: string): Promise<{ cart_id: number } | null> {
  console.log('Getting cart for user:', userId);
  
  // First try to get existing cart
  const { data, error } = await supabase
    .from('carts')
    .select('cart_id')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.log('No existing cart found, error:', error);
    console.log('Creating new cart for user:', userId);
    // Create a new cart for the user
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert({ 
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select('cart_id')
      .single();
    
    if (createError) {
      console.error('Error creating cart:', createError);
      return null;
    }
    console.log('Created new cart:', newCart);
    return newCart;
  }
  
  console.log('Found existing cart:', data);
  return data;
}

export async function addToCart(userId: string, productId: number, size: string, color: string | null, sourceScreen: string = 'home'): Promise<{ success: boolean; error?: string; alreadyInCart?: boolean }> {
  try {
    console.log('Adding to cart - userId:', userId, 'productId:', productId, 'size:', size, 'color:', color, 'sourceScreen:', sourceScreen);
    
    // First get or create the user's cart
    const cart = await getUserCart(userId);
    if (!cart) {
      console.error('Could not find or create cart');
      return { success: false, error: 'Could not find or create cart' };
    }
    
    console.log('Got cart:', cart);

    // Check if item already exists in cart with same size
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('cart_item_id, quantity')
      .eq('cart_id', cart.cart_id)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Item already exists in cart
      console.log('Item already exists in cart:', existingItem);
      return { success: false, error: 'Item already exists in cart', alreadyInCart: true };
    }

    // Insert new item if it doesn't exist
    console.log('Inserting new cart item');
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.cart_id,
        product_id: productId,
        quantity: 1,
        size: size,
        color: color,
        source_screen: sourceScreen,
        added_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting cart item:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('Successfully added cart item');
    return { success: true };
  } catch (error) {
    console.error('Error in addToCart:', error);
    return { success: false, error: String(error) };
  }
}

export async function removeFromCart(userId: string, productId: number) {
  // Get the user's cart
  const { data: cart } = await supabase
    .from('carts')
    .select('cart_id')
    .eq('user_id', userId)
    .single();

  if (!cart) {
    return { success: false, error: 'No cart found for user' };
  }

  // Remove the item from cart_items
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.cart_id)
    .eq('product_id', productId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateCartItemQuantity(
  userId: string, 
  productId: number, 
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error updating cart item quantity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error);
    return { success: false, error: String(error) };
  }
}

// Debug function to check all user items
export async function debugUserItems(): Promise<void> {
  try {
    console.log('DEBUG: Checking all user items in database...');
    
    const { data, error } = await supabase
      .from('fashion_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user items:', error);
      return;
    }

    console.log(`Total user items in database: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      data.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          id: item.id,
          name: item.name,
          status: item.status,
          source_screen: item.source_screen,
          user_id: item.user_id,
          created_at: item.created_at
        });
      });
    } else {
      console.log('No user items found in database');
    }
  } catch (error) {
    console.error('Error in debugUserItems:', error);
  }
}