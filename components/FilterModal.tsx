import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface FilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  priceRange: [number, number];
  gender: string[];
  style: string[];
  sortBy: string;
}

// Default filter values
const DEFAULT_FILTERS: FilterOptions = {
  priceRange: [0, 1000],
  gender: [],
  style: [],
  sortBy: ''
};

const FilterModal: React.FC<FilterModalProps> = ({
  isVisible,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  // Force update hook
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Animation values
  const [modalAnimation] = useState(new Animated.Value(0));
  const [overlayAnimation] = useState(new Animated.Value(0));

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>(currentFilters.priceRange);
  const [selectedGender, setSelectedGender] = useState<string[]>(currentFilters.gender);
  const [selectedStyle, setSelectedStyle] = useState<string[]>(currentFilters.style);
  const [sortBy, setSortBy] = useState<string>(currentFilters.sortBy);

  // Constants
  const GENDER_OPTIONS = ['Men', 'Women', 'Unisex'];
  const STYLE_OPTIONS = ['Casual', 'Formal', 'Sports', 'Party', 'Traditional'];
  const SORT_OPTIONS = ['Price: Low to High', 'Price: High to Low', 'Newest First', 'Popular'];

  const PRICE_STEP = 50; // Step size for price adjustments

  // Reset filters when modal opens
  useEffect(() => {
    if (isVisible) {
      setPriceRange(currentFilters.priceRange);
      setSelectedGender(currentFilters.gender);
      setSelectedStyle(currentFilters.style);
      setSortBy(currentFilters.sortBy);
    }
  }, [isVisible, currentFilters]);

  const handleReset = () => {
    // Reset all filter states to default values
    setPriceRange(DEFAULT_FILTERS.priceRange);
    setSelectedGender(DEFAULT_FILTERS.gender);
    setSelectedStyle(DEFAULT_FILTERS.style);
    setSortBy(DEFAULT_FILTERS.sortBy);
    
    // Force a complete re-render
    forceUpdate();
  };

  const adjustPrice = (isMin: boolean, increase: boolean) => {
    setPriceRange(prev => {
      const [min, max] = prev;
      if (isMin) {
        // Adjusting minimum price
        const newMin = increase 
          ? Math.min(min + PRICE_STEP, max - PRICE_STEP) // Can't exceed max - PRICE_STEP
          : Math.max(0, min - PRICE_STEP);
        return [newMin, max];
      } else {
        // Adjusting maximum price
        const newMax = increase
          ? Math.min(1000, max + PRICE_STEP)
          : Math.max(min + PRICE_STEP, max - PRICE_STEP); // Can't go below min + PRICE_STEP
        return [min, newMax];
      }
    });
  };

  const handleGenderToggle = (gender: string) => {
    const currentIndex = selectedGender.indexOf(gender);
    let newGender: string[];
    
    if (currentIndex > -1) {
      // Remove if already selected
      newGender = [...selectedGender];
      newGender.splice(currentIndex, 1);
    } else {
      // Add if not selected
      newGender = [...selectedGender, gender];
    }
    
    setSelectedGender(newGender);
    forceUpdate();
  };

  const handleStyleToggle = (style: string) => {
    const currentIndex = selectedStyle.indexOf(style);
    let newStyle: string[];
    
    if (currentIndex > -1) {
      // Remove if already selected
      newStyle = [...selectedStyle];
      newStyle.splice(currentIndex, 1);
    } else {
      // Add if not selected
      newStyle = [...selectedStyle, style];
    }
    
    setSelectedStyle(newStyle);
    forceUpdate();
  };

  const handleSortByToggle = (option: string) => {
    // If clicking the currently selected option, clear it
    if (sortBy === option) {
      setSortBy('');
    } else {
      setSortBy(option);
    }
    forceUpdate();
  };

  const handleApply = () => {
    onApplyFilters({
      priceRange,
      gender: selectedGender,
      style: selectedStyle,
      sortBy,
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter</Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    style={styles.resetButton} 
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onClose}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Price Range Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Price Range</Text>
                <View style={styles.priceRangeContainer}>
                  {/* Minimum Price Controls */}
                  <View style={styles.priceControl}>
                    <Text style={styles.priceLabel}>Min:</Text>
                    <View style={styles.priceAdjust}>
                      <TouchableOpacity 
                        style={styles.priceButton}
                        onPress={() => adjustPrice(true, false)}
                        disabled={priceRange[0] <= 0}
                      >
                        <Text style={[styles.buttonText, priceRange[0] <= 0 && styles.buttonTextDisabled]}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.priceValue}>${priceRange[0]}</Text>
                      <TouchableOpacity 
                        style={styles.priceButton}
                        onPress={() => adjustPrice(true, true)}
                        disabled={priceRange[0] >= priceRange[1] - PRICE_STEP}
                      >
                        <Text style={[styles.buttonText, priceRange[0] >= priceRange[1] - PRICE_STEP && styles.buttonTextDisabled]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Maximum Price Controls */}
                  <View style={styles.priceControl}>
                    <Text style={styles.priceLabel}>Max:</Text>
                    <View style={styles.priceAdjust}>
                      <TouchableOpacity 
                        style={styles.priceButton}
                        onPress={() => adjustPrice(false, false)}
                        disabled={priceRange[1] <= priceRange[0] + PRICE_STEP}
                      >
                        <Text style={[styles.buttonText, priceRange[1] <= priceRange[0] + PRICE_STEP && styles.buttonTextDisabled]}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.priceValue}>${priceRange[1]}</Text>
                      <TouchableOpacity 
                        style={styles.priceButton}
                        onPress={() => adjustPrice(false, true)}
                        disabled={priceRange[1] >= 1000}
                      >
                        <Text style={[styles.buttonText, priceRange[1] >= 1000 && styles.buttonTextDisabled]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Gender Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gender</Text>
                <View style={styles.optionsContainer}>
                  {GENDER_OPTIONS.map((gender) => {
                    const isSelected = selectedGender.includes(gender);
                    return (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.optionButton,
                          isSelected && styles.selectedOption
                        ]}
                        onPress={() => handleGenderToggle(gender)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText
                        ]}>
                          {gender}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Style Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Style</Text>
                <View style={styles.optionsContainer}>
                  {STYLE_OPTIONS.map((style) => {
                    const isSelected = selectedStyle.includes(style);
                    return (
                      <TouchableOpacity
                        key={style}
                        style={[
                          styles.optionButton,
                          isSelected && styles.selectedOption
                        ]}
                        onPress={() => handleStyleToggle(style)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText
                        ]}>
                          {style}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Sort By Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sort By</Text>
                <View style={styles.optionsContainer}>
                  {SORT_OPTIONS.map((option) => {
                    const isSelected = sortBy === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionButton,
                          isSelected && styles.selectedOption
                        ]}
                        onPress={() => handleSortByToggle(option)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    paddingHorizontal: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  priceRangeContainer: {
    marginTop: 10,
  },
  priceControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  priceLabel: {
    fontSize: 16,
    width: 50,
  },
  priceAdjust: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  priceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  buttonText: {
    fontSize: 20,
    color: '#000',
  },
  buttonTextDisabled: {
    color: '#ccc',
  },
  priceValue: {
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#000',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FilterModal; 