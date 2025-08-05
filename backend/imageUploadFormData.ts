import { supabase } from './supabase';

/**
 * Alternative image upload using FormData approach for React Native
 */
export const uploadProductImageFormData = async (
  imageUri: string, 
  userId: string, 
  productId?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Starting FormData upload silently

    // Detect image format from URI
    const imageFormat = imageUri.toLowerCase().includes('.png') ? 'png' : 
                       imageUri.toLowerCase().includes('.jpeg') ? 'jpeg' : 'jpg';
    
    // Create a unique filename with proper extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `${userId}/${productId || 'temp'}_${timestamp}_${randomId}.${imageFormat}`;

    // Create FormData approach
    const formData = new FormData();
    
    // For React Native, we need to structure the file object properly
    const fileObject = {
      uri: imageUri,
      type: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`,
      name: fileName.split('/').pop() // Just the filename part
    } as any;

    formData.append('file', fileObject);

    // Check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Upload using Supabase storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, fileObject, {
        cacheControl: '3600',
        upsert: false,
        contentType: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get the public URL for the image
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    return { success: true, url: publicUrl };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Upload multiple images using FormData approach
 */
export const uploadMultipleProductImagesFormData = async (
  imageUris: string[],
  userId: string,
  productId?: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> => {
  try {
    const uploadPromises = imageUris.map(uri => 
      uploadProductImageFormData(uri, userId, productId)
    );

    const results = await Promise.all(uploadPromises);

    // Check if all uploads were successful
    const failedUploads = results.filter(result => !result.success);
    
    if (failedUploads.length > 0) {
      return { 
        success: false, 
        error: `${failedUploads.length} of ${imageUris.length} uploads failed` 
      };
    }

    const urls = results.map(result => result.url!);

    return { success: true, urls };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 