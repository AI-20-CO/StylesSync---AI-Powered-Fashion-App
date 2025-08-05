import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../backend/supabase';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

interface SellerProfileScreenProps {
  onClose: () => void;
}

const SellerProfileScreen: React.FC<SellerProfileScreenProps> = ({ onClose }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Bank Account Details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);

  // ID Verification
  const [idType, setIdType] = useState('nric');
  const [idNumber, setIdNumber] = useState('');
  const [showIdTypePicker, setShowIdTypePicker] = useState(false);

  // Business Address
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [postCode, setPostCode] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);

  // For demo purposes only - not storing these
  const [idFrontImage, setIdFrontImage] = useState<string | null>(null);
  const [idBackImage, setIdBackImage] = useState<string | null>(null);
  const [idSelfieImage, setIdSelfieImage] = useState<string | null>(null);

  // Fetch existing seller data if any
  useEffect(() => {
    fetchSellerData();
  }, [user?.id]);

  const fetchSellerData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching seller data:', error);
        Alert.alert('Error', 'Failed to load seller profile data');
        return;
      }

      if (data) {
        setBankName(data.bank_name || '');
        setAccountNumber(data.account_number || '');
        setAccountHolderName(data.account_holder_name || '');
        setIdType(data.id_type || 'nric');
        setIdNumber(data.id_number || '');
        setState(data.state || '');
        setCity(data.city || '');
        setPostCode(data.post_code || '');
        setFullAddress(data.full_address || '');
      }
    } catch (error) {
      console.error('Error in fetchSellerData:', error);
      Alert.alert('Error', 'Failed to load seller profile data');
    } finally {
      setLoading(false);
    }
  };

  // For demo purposes only
  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload ID documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        switch (type) {
          case 'front':
            setIdFrontImage(result.assets[0].uri);
            break;
          case 'back':
            setIdBackImage(result.assets[0].uri);
            break;
          case 'selfie':
            setIdSelfieImage(result.assets[0].uri);
            break;
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    // Validate required fields
    if (!bankName || !accountNumber || !accountHolderName || !idNumber || !state || !city || !postCode || !fullAddress) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate ID documents for demo purposes
    if (!idFrontImage || !idBackImage || !idSelfieImage) {
      Alert.alert('Error', 'Please upload all required ID documents');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('seller_profiles')
        .upsert({
          user_id: user.id,
          bank_name: bankName,
          account_number: accountNumber,
          account_holder_name: accountHolderName,
          id_type: idType,
          id_number: idNumber,
          state,
          city,
          post_code: postCode,
          full_address: fullAddress,
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating seller profile:', error);
        Alert.alert('Error', 'Failed to update seller profile');
        return;
      }

      Alert.alert(
        'Success', 
        'Your seller profile has been submitted for verification. We will review your documents and notify you once verified.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'Failed to update seller profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Image source={require('../assets/images/cross.png')} style={styles.closeIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Seller Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bank Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Bank Name</Text>
            <TouchableOpacity 
              style={styles.formInput}
              onPress={() => setShowBankPicker(true)}
            >
              <Text style={styles.inputText}>
                {bankName || 'Select Bank'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Account Number</Text>
            <TextInput
              style={styles.formInput}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter account number"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.formInput}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              placeholder="Enter account holder name"
            />
          </View>
        </View>

        {/* ID Verification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ID Verification</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>ID Type</Text>
            <TouchableOpacity 
              style={styles.formInput}
              onPress={() => setShowIdTypePicker(true)}
            >
              <Text style={styles.inputText}>
                {idType === 'nric' ? 'NRIC' : 'Passport'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>ID Number</Text>
            <TextInput
              style={styles.formInput}
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder={idType === 'nric' ? 'Enter NRIC number' : 'Enter passport number'}
            />
          </View>

          {/* ID Document Upload */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Front of ID</Text>
            <TouchableOpacity 
              style={[styles.uploadButton, idFrontImage && styles.uploadButtonSuccess]}
              onPress={() => pickImage('front')}
            >
              {idFrontImage ? (
                <Text style={styles.uploadButtonTextSuccess}>✓ Uploaded</Text>
              ) : (
                <Text style={styles.uploadButtonText}>Upload Image</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Back of ID</Text>
            <TouchableOpacity 
              style={[styles.uploadButton, idBackImage && styles.uploadButtonSuccess]}
              onPress={() => pickImage('back')}
            >
              {idBackImage ? (
                <Text style={styles.uploadButtonTextSuccess}>✓ Uploaded</Text>
              ) : (
                <Text style={styles.uploadButtonText}>Upload Image</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Selfie with ID</Text>
            <TouchableOpacity 
              style={[styles.uploadButton, idSelfieImage && styles.uploadButtonSuccess]}
              onPress={() => pickImage('selfie')}
            >
              {idSelfieImage ? (
                <Text style={styles.uploadButtonTextSuccess}>✓ Uploaded</Text>
              ) : (
                <Text style={styles.uploadButtonText}>Upload Image</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Please take a clear photo of yourself holding your ID document
            </Text>
          </View>
        </View>

        {/* Business Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Address</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>State</Text>
            <TouchableOpacity 
              style={styles.formInput}
              onPress={() => setShowStatePicker(true)}
            >
              <Text style={styles.inputText}>
                {state || 'Select State'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>City</Text>
            <TextInput
              style={styles.formInput}
              value={city}
              onChangeText={setCity}
              placeholder="Enter city"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Post Code</Text>
            <TextInput
              style={styles.formInput}
              value={postCode}
              onChangeText={setPostCode}
              placeholder="Enter post code"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Full Address</Text>
            <TextInput
              style={[styles.formInput, styles.multilineInput]}
              value={fullAddress}
              onChangeText={setFullAddress}
              placeholder="Enter full address"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Text style={styles.modalCloseButton}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.banksList} showsVerticalScrollIndicator={false}>
              {[
                'Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank', 'Hong Leong Bank',
                'AmBank', 'UOB Bank', 'Bank Rakyat', 'OCBC Bank', 'HSBC Bank'
              ].map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={[
                    styles.bankItem,
                    bankName === bank && styles.selectedBankItem
                  ]}
                  onPress={() => {
                    setBankName(bank);
                    setShowBankPicker(false);
                  }}
                >
                  <Text style={[
                    styles.bankText,
                    bankName === bank && styles.selectedBankText
                  ]}>
                    {bank}
                  </Text>
                  {bankName === bank && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ID Type Picker Modal */}
      <Modal
        visible={showIdTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIdTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select ID Type</Text>
              <TouchableOpacity onPress={() => setShowIdTypePicker(false)}>
                <Text style={styles.modalCloseButton}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.idTypeList} showsVerticalScrollIndicator={false}>
              {[
                { id: 'nric', label: 'NRIC' },
                { id: 'passport', label: 'Passport' }
              ].map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.idTypeItem,
                    idType === type.id && styles.selectedIdTypeItem
                  ]}
                  onPress={() => {
                    setIdType(type.id);
                    setShowIdTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.idTypeText,
                    idType === type.id && styles.selectedIdTypeText
                  ]}>
                    {type.label}
                  </Text>
                  {idType === type.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <Text style={styles.modalCloseButton}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.statesList} showsVerticalScrollIndicator={false}>
              {[
                'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca',
                'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya',
                'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
              ].map((stateName) => (
                <TouchableOpacity
                  key={stateName}
                  style={[
                    styles.stateItem,
                    state === stateName && styles.selectedStateItem
                  ]}
                  onPress={() => {
                    setState(stateName);
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.stateText,
                    state === stateName && styles.selectedStateText
                  ]}>
                    {stateName}
                  </Text>
                  {state === stateName && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  inputText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  banksList: {
    padding: 10,
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
  },
  selectedBankItem: {
    backgroundColor: '#f0f0f0',
  },
  bankText: {
    fontSize: 16,
    color: '#000',
  },
  selectedBankText: {
    fontWeight: '600',
  },
  idTypeList: {
    padding: 10,
  },
  idTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
  },
  selectedIdTypeItem: {
    backgroundColor: '#f0f0f0',
  },
  idTypeText: {
    fontSize: 16,
    color: '#000',
  },
  selectedIdTypeText: {
    fontWeight: '600',
  },
  statesList: {
    padding: 10,
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
  },
  selectedStateItem: {
    backgroundColor: '#f0f0f0',
  },
  stateText: {
    fontSize: 16,
    color: '#000',
  },
  selectedStateText: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadButtonSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#666',
  },
  uploadButtonTextSuccess: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default SellerProfileScreen; 