import { supabase } from './supabase';

/**
 * Get the public URL for an uploaded image
 */
export const getImagePublicUrl = (fileName: string): string => {
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};

/**
 * Verify if an image URL is accessible and returns proper image content
 */
export const verifyImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    
    return response.ok && 
           contentType !== null && 
           contentType.startsWith('image/');
  } catch (error) {
          console.error('Image verification failed:', error);
    return false;
  }
};

/**
 * Upload a single image to Supabase storage as a proper image file
 */
export const uploadProductImage = async (
  imageUri: string, 
  userId: string, 
  productId?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    console.log('📸 Starting image upload:', imageUri);
    console.log('👤 User ID:', userId);

    // Detect image format from URI
    const imageFormat = imageUri.toLowerCase().includes('.png') ? 'png' : 
                       imageUri.toLowerCase().includes('.jpeg') ? 'jpeg' : 'jpg';
    
    // Create a unique filename with proper extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `${userId}/${productId || 'temp'}_${timestamp}_${randomId}.${imageFormat}`;

    console.log('Generated filename:', fileName);

    // Fetch the image and convert to proper format
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    // For React Native, we need to handle the blob differently
    let imageBlob: Blob;
    
    try {
      // First try to get as blob
      imageBlob = await response.blob();
      
      // Check if blob is empty (common issue)
      if (imageBlob.size === 0) {
        console.log('Blob is empty, trying ArrayBuffer approach...');
        
        // Refetch and try ArrayBuffer approach
        const response2 = await fetch(imageUri);
        const arrayBuffer = await response2.arrayBuffer();
        imageBlob = new Blob([new Uint8Array(arrayBuffer)], { 
          type: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}` 
        });
      }
    } catch (blobError) {
      console.log('Blob creation failed, using ArrayBuffer fallback...');
      
      // Fallback to ArrayBuffer approach
      const response2 = await fetch(imageUri);
      const arrayBuffer = await response2.arrayBuffer();
      imageBlob = new Blob([new Uint8Array(arrayBuffer)], { 
        type: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}` 
      });
    }
    
    console.log('Image size:', imageBlob.size, 'bytes');
    console.log('Image type:', imageBlob.type || `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`);
    
    // Validate blob has actual content
    if (imageBlob.size === 0) {
      throw new Error('Image blob is empty - failed to convert image');
    }

    // Check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 Session check:', session ? 'Session found' : 'No session', sessionError ? `Error: ${sessionError.message}` : '');

    // Upload to Supabase storage with proper content type
    const contentType = imageBlob.type || `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error.message,
        error: error
      });
      return { success: false, error: error.message };
    }

    console.log('Upload successful:', data.path);

    // Get the public URL for the image
    const publicUrl = getImagePublicUrl(data.path);
    console.log('🔗 Public URL:', publicUrl);
    console.log('📸 Image should be viewable at:', publicUrl);

    // Verify the URL is working
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      console.log(`🌐 URL test result: ${testResponse.status} ${testResponse.statusText}`);
      console.log(`Content-Type: ${testResponse.headers.get('content-type')}`);
    } catch (testError) {
      console.log('URL test failed:', testError instanceof Error ? testError.message : 'Unknown error');
      console.log('   This might indicate a storage policy issue');
    }

    return { success: true, url: publicUrl };

  } catch (error) {
    console.error('Image upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Upload multiple images for a product
 */
export const uploadMultipleProductImages = async (
  imageUris: string[],
  userId: string,
  productId?: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> => {
  try {
    console.log(`📸 Uploading ${imageUris.length} images...`);

    const uploadPromises = imageUris.map(uri => 
      uploadProductImage(uri, userId, productId)
    );

    const results = await Promise.all(uploadPromises);

    // Check if all uploads were successful
    const failedUploads = results.filter(result => !result.success);
    
    if (failedUploads.length > 0) {
      console.error('Some uploads failed:', failedUploads);
      return { 
        success: false, 
        error: `${failedUploads.length} of ${imageUris.length} uploads failed` 
      };
    }

    const urls = results.map(result => result.url!);
    console.log('All images uploaded successfully:', urls);

    return { success: true, urls };

  } catch (error) {
    console.error('Multiple image upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Delete an image from Supabase storage
 */
export const deleteProductImage = async (
  imageUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/product-images/');
    if (urlParts.length !== 2) {
      return { success: false, error: 'Invalid image URL format' };
    }

    const filePath = urlParts[1];
    console.log('Deleting image:', filePath);

    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('Image deleted successfully');
    return { success: true };

  } catch (error) {
    console.error('Image deletion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Delete multiple images from Supabase storage
 */
export const deleteMultipleProductImages = async (
  imageUrls: string[]
): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    console.log(`Deleting ${imageUrls.length} images...`);

    const deletePromises = imageUrls.map(url => deleteProductImage(url));
    const results = await Promise.all(deletePromises);

    const successfulDeletes = results.filter(result => result.success);
    const failedDeletes = results.filter(result => !result.success);

    console.log(`Successfully deleted ${successfulDeletes.length} images`);
    if (failedDeletes.length > 0) {
      console.log(`Failed to delete ${failedDeletes.length} images`);
    }

    return { 
      success: failedDeletes.length === 0,
      deletedCount: successfulDeletes.length,
      error: failedDeletes.length > 0 ? `Failed to delete ${failedDeletes.length} images` : undefined
    };

  } catch (error) {
    console.error('Multiple image deletion error:', error);
    return { 
      success: false, 
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 