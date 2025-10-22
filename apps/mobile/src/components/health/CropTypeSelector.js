// Crop Type Selector Component
// Story 3.1: Image Capture and Upload Interface
// AC2: Photo capture with crop type selection (dropdown or voice)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import {
  CROP_TYPES,
  searchCropsByName,
  matchCropFromVoice,
} from '../../constants/CropTypes';

/**
 * CropTypeSelector Component
 * 
 * Allows user to select crop type via:
 * 1. Dropdown with search
 * 2. Voice input (integrates with Story 2.1 VoiceInputButton)
 * 
 * Props:
 * - selectedCropType: Currently selected crop type ID
 * - onSelectCropType: Callback when crop type is selected
 * - language: 'en' | 'ur' | 'pun' (default: 'ur')
 * - showVoiceInput: Show voice input button (default: false)
 * - disabled: Disable selector (default: false)
 */
const CropTypeSelector = ({
  selectedCropType,
  onSelectCropType,
  language = 'ur',
  showVoiceInput = false,
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCrops, setFilteredCrops] = useState(CROP_TYPES);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCrops(CROP_TYPES);
    } else {
      const results = searchCropsByName(searchQuery, language);
      setFilteredCrops(results);
    }
  }, [searchQuery, language]);

  const selectedCrop = CROP_TYPES.find((crop) => crop.id === selectedCropType);

  const getCropDisplayName = (crop) => {
    switch (language) {
      case 'en':
        return crop.name_en;
      case 'pun':
        return crop.name_pun;
      case 'ur':
      default:
        return crop.name_ur;
    }
  };

  const handleSelectCrop = (cropId) => {
    onSelectCropType(cropId);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const handleVoiceInput = (transcript) => {
    const matchedCrop = matchCropFromVoice(transcript);
    if (matchedCrop) {
      onSelectCropType(matchedCrop.id);
    } else {
      // If no match, use transcript as search query
      setSearchQuery(transcript);
      setIsModalVisible(true);
    }
  };

  const renderCropItem = ({ item }) => {
    const isSelected = item.id === selectedCropType;
    const displayName = getCropDisplayName(item);

    return (
      <TouchableOpacity
        style={[styles.cropItem, isSelected && styles.cropItemSelected]}
        onPress={() => handleSelectCrop(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.cropIcon}>{item.icon}</Text>
        <View style={styles.cropTextContainer}>
          <Text style={[styles.cropName, isSelected && styles.cropNameSelected]}>
            {displayName}
          </Text>
          {language !== 'en' && (
            <Text style={styles.cropNameSecondary}>{item.name_en}</Text>
          )}
        </View>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selector Button */}
      <TouchableOpacity
        style={[styles.selectorButton, disabled && styles.selectorButtonDisabled]}
        onPress={() => !disabled && setIsModalVisible(true)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {selectedCrop ? (
          <View style={styles.selectedCropDisplay}>
            <Text style={styles.selectedCropIcon}>{selectedCrop.icon}</Text>
            <Text style={styles.selectedCropText}>
              {getCropDisplayName(selectedCrop)}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>
            {language === 'ur' ? 'فصل منتخب کریں' : 'Select Crop Type'}
          </Text>
        )}
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      {/* Voice Input Button (optional) */}
      {showVoiceInput && !disabled && (
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={() => {
            // Integrate with VoiceInputButton from Story 2.1
            // For now, placeholder
            console.log('[CropTypeSelector] Voice input triggered');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.voiceButtonText}>🎤</Text>
        </TouchableOpacity>
      )}

      {/* Crop Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'ur' ? 'فصل منتخب کریں' : 'Select Crop Type'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder={language === 'ur' ? 'تلاش کریں...' : 'Search...'}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />

            {/* Crop List */}
            <FlatList
              data={filteredCrops}
              renderItem={renderCropItem}
              keyExtractor={(item) => item.id}
              style={styles.cropList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {language === 'ur' ? 'کوئی نتیجہ نہیں ملا' : 'No results found'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
  },
  selectorButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  selectedCropDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedCropIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  selectedCropText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  voiceButton: {
    width: 50,
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  voiceButtonText: {
    fontSize: 24,
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
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  cropList: {
    flex: 1,
  },
  cropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cropItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  cropIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  cropTextContainer: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  cropNameSelected: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  cropNameSecondary: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default CropTypeSelector;

