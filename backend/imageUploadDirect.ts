import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

/**
 * Direct upload method - bypasses blob conversion entirely
 */
export const uploadProductImageDirect = async (
  imageUri: string, 
  userId: string, 
  productId?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Uploading image silently

    // Detect image format from URI
    const imageFormat = imageUri.toLowerCase().includes('.png') ? 'png' : 
                       imageUri.toLowerCase().includes('.jpeg') ? 'jpeg' : 'jpg';
    
    // Create a unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `${userId}/${productId || 'temp'}_${timestamp}_${randomId}.${imageFormat}`;

    // Method 1: Direct file object (React Native specific)
    try {
      // Create a proper file object for React Native
      const fileObj = {
        uri: imageUri,
        name: fileName.split('/').pop(),
        type: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`,
      };

      // Upload directly without any conversion
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, fileObj as any, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;

      // Test the URL quietly
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        const contentLength = testResponse.headers.get('content-length');
        if (contentLength === '0' || contentLength === null) {
          throw new Error('Upload resulted in empty file');
        }

        return { success: true, url: publicUrl };

      } catch (testError) {
        throw testError;
      }

    } catch (directError) {
      throw directError;
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Alternative: Use fetch to upload raw file data
 */
export const uploadProductImageRaw = async (
  imageUri: string, 
  userId: string, 
  productId?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Starting RAW upload method

    // Detect image format from URI
    const imageFormat = imageUri.toLowerCase().includes('.png') ? 'png' : 
                       imageUri.toLowerCase().includes('.jpeg') ? 'jpeg' : 'jpg';
    
    // Create a unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `${userId}/${productId || 'temp'}_${timestamp}_${randomId}.${imageFormat}`;

    // Get file info to verify it exists
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error('File does not exist or is empty');
    }

    // Read file as raw binary data
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64Data || base64Data.length === 0) {
      throw new Error('Failed to read file data');
    }

    // Convert base64 to Uint8Array (raw binary)
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload the raw binary data
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, bytes, {
        cacheControl: '3600',
        upsert: false,
        contentType: `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Test the URL
    const testResponse = await fetch(publicUrl, { method: 'HEAD' });
    const contentLength = testResponse.headers.get('content-length');
    if (contentLength === '0' || contentLength === null) {
      throw new Error('Upload resulted in empty file');
    }

    return { success: true, url: publicUrl };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Upload multiple images using direct methods
 */
export const uploadMultipleProductImagesDirect = async (
  imageUris: string[],
  userId: string,
  productId?: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> => {
  try {
    const results = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      
      // Try direct upload first
      let result = await uploadProductImageDirect(uri, userId, productId);
      
      // If direct fails, try raw upload
      if (!result.success) {
        result = await uploadProductImageRaw(uri, userId, productId);
      }
      
      if (!result.success) {
        return { 
          success: false, 
          error: `Failed to upload image ${i + 1}: ${result.error}` 
        };
      }
      
      results.push(result.url!);
    }
    return { success: true, urls: results };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 