import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ColorPicker from 'react-native-wheel-color-picker';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../backend/supabase';
import { safeUploadImages } from '../backend/safeUpload';
import { useItems } from '../context/ItemsContext';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;

interface AddItemScreenProps {
  onClose: () => void;
}

const AddItemScreen: React.FC<AddItemScreenProps> = ({ onClose }) => {
  const { user } = useUser();
  const { incrementItemsCount } = useItems();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [uploading, setUploading] = useState(false);

  // Size options
  const sizeOptions = ['S', 'M', 'L', 'XL'];

  const pickImages = () => {
    Alert.alert(
      'Select Images',
      'Choose how you want to add images',
      [
        {
          text: 'Camera',
          onPress: openCamera
        },
        {
          text: 'Photo Library',
          onPress: openPhotoLibrary
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch (error) {
      console.log('Camera picker error: ', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openPhotoLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library permissions to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const imagePaths = result.assets.map((asset: any) => asset.uri);
        setSelectedImages(prev => [...prev, ...imagePaths].slice(0, 5));
      }
    } catch (error) {
      console.log('Photo library picker error: ', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handlePostToP2P = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to post items');
      return;
    }

    setUploading(true);
    try {
      // Use completely safe upload function to prevent any React Native errors
      const uploadResult = await safeUploadImages(selectedImages, user.id);
      
      if (!uploadResult.success) {
        Alert.alert('Upload Issue', 'Please try again.');
        return;
      }
      
      const uploadedImageUrls = uploadResult.urls || [];

      const { data, error } = await supabase
        .from('fashion_items')
        .insert({
          user_id: user.id,
          name: title,
          description: description,
          price: parseFloat(price),
          sizes: selectedSizes,
          colors: selectedColors,
          category: 'clothing',
          condition: 'new',
          source_screen: 'p2p',
          quantity_sold: 0,
          image_urls: uploadedImageUrls,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Item saved successfully:', data);
      incrementItemsCount(); // Update the counter immediately
      Alert.alert('Success', 'Item posted to P2P marketplace!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      // Silent error handling - no console errors or technical details
      Alert.alert('Post Issue', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePostToRental = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to post items');
      return;
    }

    setUploading(true);
    try {
      // Use completely safe upload function to prevent any React Native errors
      const uploadResult = await safeUploadImages(selectedImages, user.id);
      
      if (!uploadResult.success) {
        Alert.alert('Upload Issue', 'Please try again.');
        return;
      }
      
      const uploadedImageUrls = uploadResult.urls || [];

      const { data, error } = await supabase
        .from('fashion_items')
        .insert({
          user_id: user.id,
          name: title,
          description: description,
          price: parseFloat(price),
          sizes: selectedSizes,
          colors: selectedColors,
          category: 'clothing',
          condition: 'new',
          source_screen: 'rent',
          quantity_sold: 0,
          image_urls: uploadedImageUrls,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Item saved successfully:', data);
      incrementItemsCount(); // Update the counter immediately
      Alert.alert('Success', 'Item posted to rental marketplace!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      // Silent error handling - no console errors or technical details
      Alert.alert('Post Issue', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    if (selectedImages.length === 0) {
      Alert.alert('Missing Images', 'Please upload at least one image');
      return false;
    }
    if (selectedColors.length === 0) {
      Alert.alert('Missing Colors', 'Please select at least one color');
      return false;
    }
    if (selectedSizes.length === 0) {
      Alert.alert('Missing Sizes', 'Please select at least one size');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a description');
      return false;
    }
    if (!price.trim()) {
      Alert.alert('Missing Price', 'Please enter a price');
      return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add item</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Upload Images Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.uploadContainer} onPress={pickImages}>
            <Image 
              source={require('../assets/images/ss logo black.png')} 
              style={styles.uploadIcon}
            />
            <Text style={styles.uploadText}>Upload images</Text>
          </TouchableOpacity>
          
          {selectedImages.length > 0 && (
                         <View style={styles.imagePreviewContainer}>
               {selectedImages.map((uri, index) => (
                 <View key={index} style={styles.imagePreview}>
                   <Image 
                     source={{ uri }} 
                     style={styles.previewImage} 
                   />
                   <TouchableOpacity 
                     style={styles.removeImageButton}
                     onPress={() => removeImage(index)}
                   >
                     <Text style={styles.removeImageText}>×</Text>
                   </TouchableOpacity>
                 </View>
               ))}
             </View>
          )}
        </View>

                 {/* Choose Colors Section */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Choose colours</Text>
           
           <View style={styles.colorPickerSection}>
             <View style={styles.selectedColorsContainer}>
               <TouchableOpacity 
                 style={styles.addColorButton}
                 onPress={() => setShowColorPicker(true)}
               >
                 <Text style={styles.addColorButtonText}>+</Text>
               </TouchableOpacity>

               {selectedColors.map((color, index) => (
                 <View key={index} style={styles.selectedColorItem}>
                   <View style={[styles.colorPreview, { backgroundColor: color }]} />
                   <TouchableOpacity 
                     style={styles.removeColorButton}
                     onPress={() => setSelectedColors(prev => prev.filter((_, i) => i !== index))}
                   >
                     <Text style={styles.removeColorText}>×</Text>
                   </TouchableOpacity>
                 </View>
               ))}
             </View>
           </View>

           {/* Color Picker Modal */}
           <Modal
             visible={showColorPicker}
             transparent={true}
             animationType="slide"
             onRequestClose={() => setShowColorPicker(false)}
           >
             <View style={styles.modalContainer}>
               <View style={styles.modalContent}>
                 <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>Select Color</Text>
                   <TouchableOpacity 
                     style={styles.modalCloseButton}
                     onPress={() => setShowColorPicker(false)}
                   >
                     <Text style={styles.modalCloseText}>×</Text>
                   </TouchableOpacity>
                 </View>

                 <View style={styles.colorPickerWrapper}>
                                                           <View style={styles.colorPickerBox}>
                      <View style={[styles.colorPreviewLarge, { backgroundColor: currentColor }]} />
                      
                      <View style={styles.colorPickerContainer}>
                        <ColorPicker
                          color={currentColor}
                          onColorChange={setCurrentColor}
                          thumbSize={25}
                          sliderSize={20}
                          noSnap={true}
                          row={false}
                          swatches={false}
                          discrete={false}
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.addThisColorButton}
                      onPress={() => {
                        setSelectedColors(prev => [...prev, currentColor].slice(0, 5));
                        setShowColorPicker(false);
                      }}
                    >
                      <Text style={styles.addThisColorText}>Add This Color</Text>
                    </TouchableOpacity>
                 </View>
               </View>
             </View>
           </Modal>
         </View>

        {/* Size Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Size selection</Text>
          <View style={styles.sizeContainer}>
            {sizeOptions.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeOption,
                  selectedSizes.includes(size) && styles.selectedSizeOption
                ]}
                onPress={() => toggleSize(size)}
              >
                <Text style={[
                  styles.sizeText,
                  selectedSizes.includes(size) && styles.selectedSizeText
                ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.section}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter product title"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Type here"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.section}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencyText}>RM</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Marketplace Buttons */}
        <View style={styles.marketplaceSection}>
          <TouchableOpacity 
            style={[styles.marketplaceButton, uploading && styles.marketplaceButtonDisabled]} 
            onPress={handlePostToP2P}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.marketplaceButtonText}>Uploading...</Text>
              </View>
            ) : (
              <Text style={styles.marketplaceButtonText}>To P2P marketplace</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>
          
          <TouchableOpacity 
            style={[styles.marketplaceButton, uploading && styles.marketplaceButtonDisabled]} 
            onPress={handlePostToRental}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.marketplaceButtonText}>Uploading...</Text>
              </View>
            ) : (
              <Text style={styles.marketplaceButtonText}>To rental marketplace</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image
          source={require('../assets/images/ss logo black.png')}
          style={styles.ssLogo}
        />
        <Image
          source={require('../assets/images/ss written logo.png')}
          style={styles.ssWrittenLogo}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    paddingTop: isSmallDevice ? 10 : isMediumDevice ? 12 : 15,
    paddingBottom: isSmallDevice ? 15 : isMediumDevice ? 18 : 20,
    backgroundColor: '#fafafa',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerTitle: {
    fontSize: isSmallDevice ? 18 : isMediumDevice ? 19 : 20,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 12,
  },
  uploadContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    width: '100%',
    maxWidth: 150,
    alignSelf: 'center',
  },
  uploadIcon: {
    width: 25,
    height: 25,
    marginBottom: 4,
    opacity: 0.6,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 250,
    alignSelf: 'center',
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: 45,
    height: 45,
    borderRadius: 6,
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  colorPickerSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  addColorButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addColorButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    marginTop: -2,
  },
  selectedColorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  selectedColorItem: {
    position: 'relative',
    marginRight: 8,
  },
  colorPreview: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 1,
    borderColor: '#000',
  },
  removeColorButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeColorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: '85%',
    maxWidth: 320,
    alignSelf: 'center',
    height: 450,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  modalCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  colorPickerWrapper: {
    paddingBottom: 15,
    flex: 1,
    justifyContent: 'space-between',
  },
  colorPreviewLarge: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#000',
    alignSelf: 'center',
  },
  colorPickerBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    alignSelf: 'center',
  },
  colorPickerContainer: {
    height: 240,
    width: '100%',
    marginBottom: 28,
  },

  addThisColorButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    width: '50%',
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 10,
    alignSelf: 'center',
  },
  addThisColorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  titleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 13,
    color: '#000',
    paddingVertical: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#000',
    borderWidth: 3,
  },
  colorCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
  sizeOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSizeOption: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  selectedSizeText: {
    color: '#fff',
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionInput: {
    fontSize: 13,
    color: '#000',
    minHeight: 60,
    textAlign: 'left',
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 5,
  },
  priceInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    minWidth: 50,
  },
  marketplaceSection: {
    alignItems: 'center',
  },
  marketplaceButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 12,
  },
  marketplaceButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '60%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  orText: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    fontWeight: '500',
    color: '#666',
    marginHorizontal: 15,
  },
  logoSection: {
    position: 'absolute',
    bottom: isSmallDevice ? 10 : isMediumDevice ? 15 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: isSmallDevice ? 10 : isMediumDevice ? 15 : 20,
  },
  ssLogo: {
    width: isSmallDevice ? 50 : isMediumDevice ? 60 : 70,
    height: isSmallDevice ? 50 : isMediumDevice ? 60 : 70,
    marginBottom: 0,
    resizeMode: 'contain',
  },
  ssWrittenLogo: {
    width: isSmallDevice ? 140 : isMediumDevice ? 160 : 180,
    height: isSmallDevice ? 35 : isMediumDevice ? 40 : 45,
    marginTop: isSmallDevice ? -12 : isMediumDevice ? -15 : -18,
    resizeMode: 'contain',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketplaceButtonDisabled: {
    opacity: 0.7,
  },
});

export default AddItemScreen; 