import { supabase } from './supabase';

/**
 * Delete the oldest items from a storage bucket to free up space
 */
export async function deleteOldestStorageItems(
  bucketName: string = 'product-images', 
  itemsToDelete: number = 100
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    console.log(`🔍 Fetching items from bucket: ${bucketName}`);
    
    // List all items in the bucket, sorted by creation date (oldest first)
    const { data: items, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: Math.max(itemsToDelete * 2, 500), // Get more than needed
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listError) {
      console.error('❌ Error listing items:', listError);
      return { success: false, deletedCount: 0, error: listError.message };
    }

    if (!items || items.length === 0) {
      console.log('📭 No items found in bucket');
      return { success: true, deletedCount: 0 };
    }

    console.log(`📊 Found ${items.length} total items in bucket`);
    
    // Take only the oldest items
    const itemsToRemove = items.slice(0, Math.min(itemsToDelete, items.length));
    console.log(`🗑️  Preparing to delete ${itemsToRemove.length} oldest items...`);
    
    // Create array of file paths for deletion
    const filePaths = itemsToRemove.map(item => item.name);
    
    // Delete files in batches to avoid Supabase limits
    const batchSize = 50;
    let deletedCount = 0;
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      
      console.log(`🔄 Deleting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filePaths.length / batchSize)}`);
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(batch);

      if (deleteError) {
        console.error(`❌ Error deleting batch:`, deleteError);
        continue;
      }

      deletedCount += batch.length;
      console.log(`✅ Successfully deleted ${batch.length} files`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Cleanup completed! Deleted ${deletedCount} files from ${bucketName}`);
    return { success: true, deletedCount };
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get storage bucket information
 */
export async function getBucketStorageInfo(bucketName: string = 'product-images') {
  try {
    const { data: items, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000 });

    if (error) {
      console.error('Error getting bucket info:', error);
      return null;
    }

    const totalItems = items?.length || 0;
    const totalSize = items?.reduce((sum, item) => sum + (item.metadata?.size || 0), 0) || 0;
    
    return {
      bucketName,
      totalItems,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      oldestFile: items?.[0]?.name,
      oldestDate: items?.[0]?.created_at
    };
  } catch (error) {
    console.error('Error getting bucket info:', error);
    return null;
  }
}

/**
 * Emergency cleanup function - removes oldest 100 items from product-images
 */
export async function emergencyStorageCleanup(): Promise<void> {
  console.log('🚨 Starting emergency storage cleanup...');
  
  // Get current storage info
  const info = await getBucketStorageInfo('product-images');
  if (info) {
    console.log(`📊 Current storage: ${info.totalItems} items (${info.totalSizeMB} MB)`);
  }
  
  // Clean up product-images bucket
  const result = await deleteOldestStorageItems('product-images', 100);
  
  if (result.success) {
    console.log(`✅ Emergency cleanup successful: Deleted ${result.deletedCount} files`);
  } else {
    console.error(`❌ Emergency cleanup failed: ${result.error}`);
  }
}

// Export a simple function you can call from anywhere in your app
export const cleanupStorage = emergencyStorageCleanup;