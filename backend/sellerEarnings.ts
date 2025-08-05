import { supabase } from './supabase';

interface OrderItemData {
  order_item_id: number;
  product_id: number;
  price: number;
  source_screen: string;
  order_id: number;
}

interface SellerItemData {
  user_id: string;
  name: string;
  source_screen: 'p2p' | 'rent';
  status: string;
  quantity_sold: number;
  image_urls: string[];
}

/**
 * Process seller earnings for completed orders
 * This function should be called after a successful payment
 */
export async function processSellerEarnings(orderId: number): Promise<{ success: boolean; message: string }> {
  try {
    console.log('SELLER EARNINGS: Function called for order:', orderId);
    console.log('Processing seller earnings for order:', orderId);

    // Get all order items for this order
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_item_id, product_id, price, source_screen, order_id')
      .eq('order_id', orderId);

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return { success: false, message: 'Failed to fetch order items' };
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('No order items found for order:', orderId);
      return { success: true, message: 'No order items to process' };
    }

    console.log('Found order items:', orderItems.length);

    let processedCount = 0;
    let catalogItemsCount = 0;

    // Process each order item
    for (const orderItem of orderItems as OrderItemData[]) {
      console.log('Processing order item:', {
        product_id: orderItem.product_id,
        source_screen: orderItem.source_screen,
        price: orderItem.price
      });

      // Check if this item exists in fashion_items table (user-posted item)
      console.log(`CHECKING: Looking for product_id ${orderItem.product_id} in fashion_items table`);
      
      const { data: fashionItem, error: fashionError } = await supabase
        .from('fashion_items')
        .select('user_id, name, source_screen, status, quantity_sold, image_urls')
        .eq('id', orderItem.product_id)
        .single();

      if (fashionError || !fashionItem) {
        console.log('SKIPPING: Item not found in fashion_items (catalog item):', {
          product_id: orderItem.product_id,
          error: fashionError?.message
        });
        catalogItemsCount++;
        continue;
      }

      console.log('FOUND USER-POSTED ITEM:', {
        product_id: orderItem.product_id,
        seller_user_id: fashionItem.user_id,
        item_name: fashionItem.name,
        item_status: fashionItem.status,
        sale_price: orderItem.price
      });

      // Skip if item is already sold/rented
      if (fashionItem.status !== 'active') {
        console.log('SKIPPING: Item already sold/rented, status:', fashionItem.status);
        continue;
      }



      // Calculate earnings (5% commission)
      const saleAmount = orderItem.price;
      const commissionRate = 5.0;
      const commissionAmount = (saleAmount * commissionRate) / 100;
      const netAmount = saleAmount - commissionAmount;

      console.log('CALCULATING EARNINGS:', {
        sale_amount: saleAmount,
        commission: commissionAmount.toFixed(2),
        net_amount: netAmount.toFixed(2),
        seller_id: fashionItem.user_id
      });

      // Create seller earnings record
      console.log('CREATING SELLER EARNINGS RECORD...');
      
      // Get the first image URL from the fashion item
      const imageUrl = fashionItem.image_urls && fashionItem.image_urls.length > 0 
        ? fashionItem.image_urls[0] 
        : null;
      
      const { data: earningsData, error: earningsError } = await supabase
        .from('seller_earnings')
        .insert({
          user_id: fashionItem.user_id,        // Seller's Clerk ID
          item_id: orderItem.product_id,       // Item ID
          item_name: fashionItem.name,         // Item name
          sale_amount: saleAmount,             // Full sale price
          commission_rate: commissionRate,     // 5%
          net_amount: netAmount,               // Amount seller gets
          payment_status: 'pending',           // Will be paid later
          sale_date: new Date().toISOString(),
          image_url: imageUrl                  // First image from fashion item
        })
        .select();

      if (earningsError) {
        console.error('FAILED TO CREATE SELLER EARNINGS:', earningsError);
        continue;
      }

      console.log('🎉 SUCCESS! Created seller earnings record:', {
        seller_user_id: fashionItem.user_id,
        item_name: fashionItem.name,
        net_amount: netAmount.toFixed(2),
        earnings_id: earningsData?.[0]?.id || 'unknown'
      });

      // Update item status to sold/rented and increment quantity_sold
      const newStatus = fashionItem.source_screen === 'p2p' ? 'active-sold' : 'active-rented';
      console.log(`UPDATING ITEM STATUS to '${newStatus}'...`);
      
      const { error: updateItemError } = await supabase
        .from('fashion_items')
        .update({
          status: newStatus,
          quantity_sold: fashionItem.quantity_sold + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderItem.product_id);

      if (updateItemError) {
        console.error('FAILED TO UPDATE ITEM STATUS:', updateItemError);
        continue;
      }

      console.log(`Updated item status to '${newStatus}' and incremented quantity_sold`);
      processedCount++;
    }

    const message = `✅ SUCCESS! Processed ${processedCount} marketplace items, ${catalogItemsCount} catalog items`;
    console.log('🎉 SELLER EARNINGS PROCESSING COMPLETED:', message);
    console.log(`Total seller earnings created: ${processedCount}`);

    return { success: true, message };

  } catch (error) {
    console.error('Error in processSellerEarnings:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update seller earnings payment status to 'paid'
 * Call this when seller receives payment
 */
export async function updateSellerEarningsPaymentStatus(
  userId: string, 
  itemIds: number[], 
  status: 'pending' | 'paid'
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('💳 Updating seller earnings payment status:', { userId, itemIds, status });

    const { error } = await supabase
      .from('seller_earnings')
      .update({ 
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('item_id', itemIds);

    if (error) {
      console.error('Error updating payment status:', error);
      return { success: false, message: error.message };
    }

    console.log('Updated seller earnings payment status');
    return { success: true, message: 'Payment status updated successfully' };

  } catch (error) {
    console.error('Error in updateSellerEarningsPaymentStatus:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get seller statistics for dashboard
 */
export async function getSellerStats(userId: string): Promise<{
  totalEarnings: number;
  totalSales: number;
  pendingEarnings: number;
  paidEarnings: number;
}> {
  try {
    const { data, error } = await supabase
      .from('seller_earnings')
      .select('net_amount, payment_status')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = (data || []).reduce((acc, earning) => {
      const amount = Number(earning.net_amount);
      acc.totalEarnings += amount;
      acc.totalSales += 1;

      if (earning.payment_status === 'paid') {
        acc.paidEarnings += amount;
      } else {
        acc.pendingEarnings += amount;
      }

      return acc;
    }, {
      totalEarnings: 0,
      totalSales: 0,
      pendingEarnings: 0,
      paidEarnings: 0
    });

    return stats;
  } catch (error) {
    console.error('Error getting seller stats:', error);
    return {
      totalEarnings: 0,
      totalSales: 0,
      pendingEarnings: 0,
      paidEarnings: 0
    };
  }
} 