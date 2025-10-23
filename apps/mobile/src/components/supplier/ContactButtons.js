// Contact Buttons Component
// Story 3.5: Local Supplier Integration
// Buttons for contacting supplier via phone, WhatsApp, SMS, directions

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import SupplierContactService from '../../services/supplier/SupplierContactService';
import { CONTACT_LABELS, CONTACT_INTENT } from '../../constants/SupplierConstants';

/**
 * ContactButtons Component
 * Provides buttons to contact supplier via various methods
 *
 * Props:
 * - supplier: Supplier object with contact information
 * - farmerId: Farmer ID for tracking
 * - productName: Optional product name for message
 * - intent: Contact intent (default: INQUIRY)
 * - language: Language for labels (default: 'en')
 * - layout: 'horizontal' | 'vertical' | 'grid' (default: 'horizontal')
 */
const ContactButtons = ({
  supplier,
  farmerId,
  productName = null,
  intent = CONTACT_INTENT.INQUIRY,
  language = 'en',
  layout = 'horizontal',
}) => {
  const contactService = new SupplierContactService();

  const handleCall = async () => {
    if (!supplier.phone) {
      Alert.alert('No Phone Number', 'Phone number not available for this supplier');
      return;
    }

    await contactService.callSupplier(
      supplier.phone,
      supplier.id,
      farmerId,
      intent
    );
  };

  const handleWhatsApp = async () => {
    if (!supplier.whatsappNumber && !supplier.phone) {
      Alert.alert('No WhatsApp', 'WhatsApp number not available for this supplier');
      return;
    }

    const number = supplier.whatsappNumber || supplier.phone;
    await contactService.whatsappSupplier(
      number,
      supplier.id,
      farmerId,
      null,
      productName,
      intent
    );
  };

  const handleSMS = async () => {
    if (!supplier.phone) {
      Alert.alert('No Phone Number', 'Phone number not available for this supplier');
      return;
    }

    await contactService.smsSupplier(
      supplier.phone,
      supplier.id,
      farmerId,
      null,
      intent
    );
  };

  const handleDirections = async () => {
    if (!supplier.latitude || !supplier.longitude) {
      Alert.alert('No Location', 'Location not available for this supplier');
      return;
    }

    await contactService.getDirections(
      { latitude: supplier.latitude, longitude: supplier.longitude },
      supplier.name,
      supplier.id,
      farmerId
    );
  };

  const getLabel = (key) => {
    return CONTACT_LABELS[key][language] || CONTACT_LABELS[key].en;
  };

  const containerStyle = layout === 'vertical'
    ? styles.verticalContainer
    : layout === 'grid'
    ? styles.gridContainer
    : styles.horizontalContainer;

  return (
    <View style={containerStyle}>
      {/* Call Button */}
      {supplier.phone && (
        <TouchableOpacity
          style={[styles.button, styles.callButton]}
          onPress={handleCall}
        >
          <Text style={styles.buttonIcon}>📞</Text>
          <Text style={styles.buttonText}>{getLabel('CALL')}</Text>
        </TouchableOpacity>
      )}

      {/* WhatsApp Button */}
      {(supplier.whatsappNumber || supplier.phone) && (
        <TouchableOpacity
          style={[styles.button, styles.whatsappButton]}
          onPress={handleWhatsApp}
        >
          <Text style={styles.buttonIcon}>💬</Text>
          <Text style={styles.buttonText}>{getLabel('WHATSAPP')}</Text>
        </TouchableOpacity>
      )}

      {/* SMS Button */}
      {supplier.phone && (
        <TouchableOpacity
          style={[styles.button, styles.smsButton]}
          onPress={handleSMS}
        >
          <Text style={styles.buttonIcon}>✉️</Text>
          <Text style={styles.buttonText}>{getLabel('SMS')}</Text>
        </TouchableOpacity>
      )}

      {/* Directions Button */}
      {supplier.latitude && supplier.longitude && (
        <TouchableOpacity
          style={[styles.button, styles.directionsButton]}
          onPress={handleDirections}
        >
          <Text style={styles.buttonIcon}>🗺️</Text>
          <Text style={styles.buttonText}>{getLabel('DIRECTIONS')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  verticalContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    gap: 4,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  smsButton: {
    backgroundColor: '#2196F3',
  },
  directionsButton: {
    backgroundColor: '#FF9800',
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ContactButtons;
