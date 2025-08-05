import { uploadMultipleProductImagesDirect } from './imageUploadDirect';
import { uploadMultipleProductImagesRN } from './imageUploadRN';
import { uploadMultipleProductImagesFormData } from './imageUploadFormData';
import { uploadMultipleProductImages } from './imageUpload';

/**
 * Completely error-safe upload function that prevents any errors from reaching React Native
 */
export const safeUploadImages = async (
  imageUris: string[],
  userId: string,
  productId?: string
): Promise<{ success: boolean; urls?: string[] }> => {
  // Try each method with complete error isolation
  const methods = [
    uploadMultipleProductImagesDirect,
    uploadMultipleProductImagesRN,
    uploadMultipleProductImagesFormData,
    uploadMultipleProductImages
  ];

  for (const method of methods) {
    try {
      const result = await method(imageUris, userId, productId);
      if (result.success && result.urls) {
        return { success: true, urls: result.urls };
      }
    } catch (error) {
      // Complete error suppression - continue to next method
    }
  }

  // If all methods fail, return graceful failure
  return { success: false };
}; 