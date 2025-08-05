import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

/**
 * React Native specific image upload using FileSystem API
 */
export const uploadProductImageRN = async (
  imageUri: string, 
  userId: string, 
  productId?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Starting React Native upload silently

    // Detect image format from URI
    const imageFormat = imageUri.toLowerCase().includes('.png') ? 'png' : 
                       imageUri.toLowerCase().includes('.jpeg') ? 'jpeg' : 'jpg';
    
    // Create a unique filename with proper extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `${userId}/${productId || 'temp'}_${timestamp}_${randomId}.${imageFormat}`;

    // Method 1: Try FileSystem approach (best for React Native)
    try {
      // Get file info to ensure it exists and has size
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      if (fileInfo.size === 0) {
        throw new Error('File is empty');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (base64.length === 0) {
        throw new Error('Failed to read file content');
      }

      // Convert base64 to blob
      const response = await fetch(`data:image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat};base64,${base64}`);
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Blob conversion resulted in empty file');
      }

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;

      // Test the URL silently
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        const contentLength = testResponse.headers.get('content-length');
        if (contentLength === '0') {
          throw new Error('Uploaded file is empty');
        }
      } catch (testError) {
        throw testError;
      }

      return { success: true, url: publicUrl };

    } catch (fsError) {
      throw fsError;
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Alternative method using fetch with proper headers
 */
export const uploadProductImageFetch = async (
  imageUri: string, 
  userId: string, 
  productId?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    console.log('Trying Fetch approach...');
    
    // Detect image format from URI
    const imageFormat = imageUri.toLowerCase().includes('.png') ? 'png' : 
                       imageUri.toLowerCase().includes('.jpeg') ? 'jpeg' : 'jpg';
    
    // Create a unique filename with proper extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `${userId}/${productId || 'temp'}_${timestamp}_${randomId}.${imageFormat}`;

    // Create FormData with proper file structure for React Native
    const formData = new FormData();
    
    // For React Native, we need to structure the file object properly
    const fileObject = {
      uri: imageUri,
      type: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`,
      name: fileName.split('/').pop()
    } as any;

          console.log('File object:', fileObject);

    // Upload directly to Supabase using the file object
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, fileObject, {
        cacheControl: '3600',
        upsert: false,
        contentType: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`
      });

    if (error) {
      console.error('Fetch upload error:', error);
      throw error;
    }

    console.log('Fetch upload successful:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;
    console.log('🔗 Public URL:', publicUrl);

    return { success: true, url: publicUrl };

  } catch (error) {
    console.error('Fetch image upload failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Upload multiple images with React Native optimized methods
 */
export const uploadMultipleProductImagesRN = async (
  imageUris: string[],
  userId: string,
  productId?: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> => {
  try {
    console.log(`📸 Uploading ${imageUris.length} images with React Native methods...`);

    const results = [];
    
    // Upload one by one to better handle errors
    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      console.log(`📸 Uploading image ${i + 1}/${imageUris.length}...`);
      
      // Try FileSystem first, then Fetch
      let result = await uploadProductImageRN(uri, userId, productId);
      
      if (!result.success) {
        console.log(`FileSystem failed for image ${i + 1}, trying Fetch...`);
        result = await uploadProductImageFetch(uri, userId, productId);
      }
      
      if (!result.success) {
        console.error(`Both methods failed for image ${i + 1}:`, result.error);
        return { 
          success: false, 
          error: `Failed to upload image ${i + 1}: ${result.error}` 
        };
      }
      
      results.push(result.url!);
      console.log(`Image ${i + 1} uploaded successfully`);
    }

    console.log('All React Native images uploaded successfully:', results);
    return { success: true, urls: results };

  } catch (error) {
    console.error('Multiple React Native image upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 