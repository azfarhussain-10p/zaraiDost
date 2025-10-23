// Supplier Contact Service
// Story 3.5: Local Supplier Integration
// Handles contacting suppliers via phone, WhatsApp, SMS, and directions

import { Linking, Platform, Alert } from 'react-native';
import { getDatabase } from '../../database/config/db.config';
import {
  CONTACT_METHODS,
  CONTACT_INTENT,
  PHONE_PATTERNS,
  DEFAULT_MESSAGES,
  ERROR_MESSAGES,
} from '../../constants/SupplierConstants';

/**
 * Supplier Contact Service
 * Handles all supplier contact methods
 *
 * Implements:
 * - AC6: Option to call supplier directly from app
 * - AC3: Contact information (phone, WhatsApp, SMS)
 */
class SupplierContactService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async _initDB() {
    if (!this.db) {
      this.db = getDatabase();
    }
  }

  /**
   * Call supplier by phone
   * AC6: Option to call supplier directly
   *
   * @param {string} phoneNumber - Supplier phone number
   * @param {string} supplierId - Supplier ID (for tracking)
   * @param {string} farmerId - Farmer ID (for tracking)
   * @param {string} intent - Contact intent (inquiry, order, etc.)
   * @returns {Promise<boolean>} Success status
   */
  async callSupplier(phoneNumber, supplierId, farmerId, intent = CONTACT_INTENT.INQUIRY) {
    try {
      const formattedNumber = this.formatPakistaniNumber(phoneNumber);
      const url = `tel:${formattedNumber}`;

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error('CANNOT_MAKE_CALLS');
      }

      await Linking.openURL(url);

      // Track contact attempt
      await this._trackContactAttempt(farmerId, supplierId, CONTACT_METHODS.PHONE, intent);

      return true;
    } catch (error) {
      console.error('[SupplierContact] Failed to call supplier:', error);
      Alert.alert('Error', ERROR_MESSAGES.CALL_FAILED.en);
      return false;
    }
  }

  /**
   * Contact supplier via WhatsApp
   * AC6: WhatsApp contact option
   */
  async whatsappSupplier(whatsappNumber, supplierId, farmerId, message = null, productName = null, intent = CONTACT_INTENT.INQUIRY) {
    try {
      const formattedNumber = this.formatPakistaniNumber(whatsappNumber);
      const cleanNumber = formattedNumber.replace('+', ''); // Remove '+' for WhatsApp

      // Build message
      const finalMessage = message || this._buildDefaultMessage(intent, productName);
      const encodedMessage = encodeURIComponent(finalMessage);

      const url = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        // WhatsApp not installed, try SMS instead
        console.log('[SupplierContact] WhatsApp not available, falling back to SMS');
        Alert.alert(
          'WhatsApp Not Available',
          'WhatsApp is not installed. Would you like to send an SMS instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send SMS',
              onPress: () => this.smsSupplier(whatsappNumber, supplierId, farmerId, finalMessage, intent),
            },
          ]
        );
        return false;
      }

      await Linking.openURL(url);

      // Track contact attempt
      await this._trackContactAttempt(farmerId, supplierId, CONTACT_METHODS.WHATSAPP, intent);

      return true;
    } catch (error) {
      console.error('[SupplierContact] Failed to WhatsApp supplier:', error);
      // Fallback to SMS
      return await this.smsSupplier(whatsappNumber, supplierId, farmerId, message, intent);
    }
  }

  /**
   * Send SMS to supplier
   * AC6: SMS contact option
   */
  async smsSupplier(phoneNumber, supplierId, farmerId, message = null, intent = CONTACT_INTENT.INQUIRY) {
    try {
      const formattedNumber = this.formatPakistaniNumber(phoneNumber);
      const finalMessage = message || this._buildDefaultMessage(intent);
      const encodedMessage = encodeURIComponent(finalMessage);

      // Platform-specific SMS URL
      const url = Platform.OS === 'ios'
        ? `sms:${formattedNumber}&body=${encodedMessage}`
        : `sms:${formattedNumber}?body=${encodedMessage}`;

      await Linking.openURL(url);

      // Track contact attempt
      await this._trackContactAttempt(farmerId, supplierId, CONTACT_METHODS.SMS, intent);

      return true;
    } catch (error) {
      console.error('[SupplierContact] Failed to SMS supplier:', error);
      Alert.alert('Error', 'Failed to open messaging app');
      return false;
    }
  }

  /**
   * Get directions to supplier
   * Opens native maps app with supplier location
   */
  async getDirections(supplierLocation, supplierName, supplierId, farmerId) {
    try {
      const { latitude, longitude } = supplierLocation;

      if (!latitude || !longitude) {
        throw new Error('NO_LOCATION');
      }

      const label = encodeURIComponent(supplierName);

      // Platform-specific maps URL
      const url = Platform.select({
        ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
        android: `google.navigation:q=${latitude},${longitude}&label=${label}`,
      });

      const webFallback = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      // Try native maps first
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web maps
        await Linking.openURL(webFallback);
      }

      // Track (not a contact attempt, but useful analytics)
      console.log(`[SupplierContact] Directions requested for ${supplierName}`);

      return true;
    } catch (error) {
      console.error('[SupplierContact] Failed to get directions:', error);
      Alert.alert('Error', 'Failed to open maps');
      return false;
    }
  }

  /**
   * Format Pakistani phone number to international format
   * Converts various formats to +92XXXXXXXXXX
   *
   * Examples:
   * - 03001234567 -> +923001234567
   * - 0300-1234567 -> +923001234567
   * - 923001234567 -> +923001234567
   */
  formatPakistaniNumber(phoneNumber) {
    if (!phoneNumber) return '';

    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Already starts with 92 (Pakistan code)
    if (cleaned.startsWith('92')) {
      return `+${cleaned}`;
    }

    // Starts with 0 (local format)
    if (cleaned.startsWith('0')) {
      return `+92${cleaned.substring(1)}`;
    }

    // Assume it's missing country code
    return `+92${cleaned}`;
  }

  /**
   * Validate Pakistani phone number
   */
  isValidPakistaniNumber(phoneNumber) {
    if (!phoneNumber) return false;

    // Remove all non-digits to check the raw number
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it's a valid Pakistani number pattern:
    // - Starts with 92 (country code): 923XXXXXXXXX (11-13 digits)
    // - Starts with 0 (local format): 03XXXXXXXXX or 0XX-XXXXXXX (10-11 digits)
    // Reject if starts with other country codes (e.g., +1 for US)

    if (cleaned.startsWith('92')) {
      // International format: 92[0-9]{9,11}
      return /^92[0-9]{9,11}$/.test(cleaned);
    } else if (cleaned.startsWith('0')) {
      // Local format: 0[0-9]{9,10}
      return /^0[0-9]{9,10}$/.test(cleaned);
    }

    // If doesn't start with 92 or 0, it's likely a foreign number
    return false;
  }

  /**
   * Build default message based on intent
   */
  _buildDefaultMessage(intent, productName = null) {
    const lang = 'en'; // TODO: Get from user preferences

    switch (intent) {
      case CONTACT_INTENT.INQUIRY:
        return DEFAULT_MESSAGES.PRODUCT_INQUIRY[lang] + (productName || 'agricultural products');

      case CONTACT_INTENT.CHECK_AVAILABILITY:
        return DEFAULT_MESSAGES.AVAILABILITY_CHECK[lang] + (productName || '');

      case CONTACT_INTENT.ORDER:
        return `${DEFAULT_MESSAGES.PRODUCT_INQUIRY[lang]}I would like to order ${productName || 'products'}.`;

      default:
        return DEFAULT_MESSAGES.PRODUCT_INQUIRY[lang];
    }
  }

  /**
   * Track contact attempt for analytics
   */
  async _trackContactAttempt(farmerId, supplierId, contactMethod, intent = null) {
    try {
      await this._initDB();

      const id = `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const query = `
        INSERT INTO supplier_contact_attempts (
          id, farmer_id, supplier_id, contact_method, contact_intent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      await this.db.runAsync(query, [
        id,
        farmerId,
        supplierId,
        contactMethod,
        intent,
        Date.now(),
      ]);

      console.log(`[SupplierContact] Tracked ${contactMethod} contact to ${supplierId}`);
    } catch (error) {
      console.error('[SupplierContact] Failed to track contact attempt:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Get contact history for a farmer
   */
  async getContactHistory(farmerId, limit = 20) {
    await this._initDB();

    const query = `
      SELECT
        sca.*,
        s.name as supplier_name,
        s.city
      FROM supplier_contact_attempts sca
      INNER JOIN suppliers s ON sca.supplier_id = s.id
      WHERE sca.farmer_id = ?
      ORDER BY sca.created_at DESC
      LIMIT ?
    `;

    return await this.db.getAllAsync(query, [farmerId, limit]);
  }

  /**
   * Get most contacted suppliers
   */
  async getMostContactedSuppliers(farmerId, limit = 10) {
    await this._initDB();

    const query = `
      SELECT
        s.*,
        COUNT(sca.id) as contact_count,
        MAX(sca.created_at) as last_contact
      FROM suppliers s
      INNER JOIN supplier_contact_attempts sca ON s.id = sca.supplier_id
      WHERE sca.farmer_id = ?
      GROUP BY s.id
      ORDER BY contact_count DESC, last_contact DESC
      LIMIT ?
    `;

    return await this.db.getAllAsync(query, [farmerId, limit]);
  }
}

export default SupplierContactService;
