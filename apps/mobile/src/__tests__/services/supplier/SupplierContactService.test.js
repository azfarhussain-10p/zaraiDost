// Tests for SupplierContactService
// Story 3.5: Local Supplier Integration

import SupplierContactService from '../../../services/supplier/SupplierContactService';
import { CONTACT_METHODS, CONTACT_INTENT } from '../../../constants/SupplierConstants';

describe('SupplierContactService', () => {
  let contactService;

  beforeEach(() => {
    contactService = new SupplierContactService();
  });

  describe('formatPakistaniNumber', () => {
    it('should format Pakistani mobile number starting with 0', () => {
      const formatted = contactService.formatPakistaniNumber('03001234567');
      expect(formatted).toBe('+923001234567');
    });

    it('should format Pakistani mobile number with dashes', () => {
      const formatted = contactService.formatPakistaniNumber('0300-1234567');
      expect(formatted).toBe('+923001234567');
    });

    it('should format Pakistani mobile number already with 92', () => {
      const formatted = contactService.formatPakistaniNumber('923001234567');
      expect(formatted).toBe('+923001234567');
    });

    it('should format Pakistani mobile number with +92', () => {
      const formatted = contactService.formatPakistaniNumber('+923001234567');
      expect(formatted).toBe('+923001234567');
    });

    it('should handle landline numbers', () => {
      const formatted = contactService.formatPakistaniNumber('04212345678');
      expect(formatted).toBe('+924212345678');
    });

    it('should handle numbers with spaces', () => {
      const formatted = contactService.formatPakistaniNumber('0300 123 4567');
      expect(formatted).toBe('+923001234567');
    });

    it('should return empty string for null/undefined', () => {
      expect(contactService.formatPakistaniNumber(null)).toBe('');
      expect(contactService.formatPakistaniNumber(undefined)).toBe('');
    });
  });

  describe('isValidPakistaniNumber', () => {
    it('should validate correct Pakistani mobile numbers', () => {
      expect(contactService.isValidPakistaniNumber('03001234567')).toBe(true);
      expect(contactService.isValidPakistaniNumber('+923001234567')).toBe(true);
      expect(contactService.isValidPakistaniNumber('923001234567')).toBe(true);
    });

    it('should validate Pakistani landline numbers', () => {
      expect(contactService.isValidPakistaniNumber('04212345678')).toBe(true); // Karachi
      expect(contactService.isValidPakistaniNumber('05112345678')).toBe(true); // Islamabad
    });

    it('should reject invalid numbers', () => {
      expect(contactService.isValidPakistaniNumber('123')).toBe(false);
      expect(contactService.isValidPakistaniNumber('03001234')).toBe(false); // Too short
      expect(contactService.isValidPakistaniNumber('+14155551234')).toBe(false); // US number
    });

    it('should reject empty/null numbers', () => {
      expect(contactService.isValidPakistaniNumber('')).toBe(false);
      expect(contactService.isValidPakistaniNumber(null)).toBe(false);
      expect(contactService.isValidPakistaniNumber(undefined)).toBe(false);
    });
  });

  describe('_buildDefaultMessage', () => {
    it('should build inquiry message', () => {
      const message = contactService._buildDefaultMessage(CONTACT_INTENT.INQUIRY, 'Fungicide');
      expect(message).toContain('Assalam-o-Alaikum');
      expect(message).toContain('Fungicide');
    });

    it('should build availability check message', () => {
      const message = contactService._buildDefaultMessage(CONTACT_INTENT.CHECK_AVAILABILITY, 'Neem Oil');
      expect(message).toContain('available');
      expect(message).toContain('Neem Oil');
    });

    it('should build order message', () => {
      const message = contactService._buildDefaultMessage(CONTACT_INTENT.ORDER, 'Pesticide');
      expect(message).toContain('order');
      expect(message).toContain('Pesticide');
    });

    it('should handle missing product name', () => {
      const message = contactService._buildDefaultMessage(CONTACT_INTENT.INQUIRY);
      expect(message).toContain('Assalam-o-Alaikum');
      expect(message).toBeTruthy();
    });
  });

  describe('Phone Number Formatting Edge Cases', () => {
    it('should handle numbers with multiple formats', () => {
      const testCases = [
        { input: '0300-123-4567', expected: '+923001234567' },
        { input: '(0300) 1234567', expected: '+923001234567' },
        { input: '0300.123.4567', expected: '+923001234567' },
        { input: '92 300 123 4567', expected: '+923001234567' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(contactService.formatPakistaniNumber(input)).toBe(expected);
      });
    });

    it('should handle Karachi landlines', () => {
      expect(contactService.formatPakistaniNumber('02112345678')).toBe('+922112345678');
      expect(contactService.formatPakistaniNumber('021-12345678')).toBe('+922112345678');
    });

    it('should handle Lahore landlines', () => {
      expect(contactService.formatPakistaniNumber('04212345678')).toBe('+924212345678');
      expect(contactService.formatPakistaniNumber('042-12345678')).toBe('+924212345678');
    });

    it('should handle Islamabad landlines', () => {
      expect(contactService.formatPakistaniNumber('05112345678')).toBe('+925112345678');
      expect(contactService.formatPakistaniNumber('051-12345678')).toBe('+925112345678');
    });
  });

  describe('Contact Method Validation', () => {
    it('should identify valid contact methods', () => {
      const methods = Object.values(CONTACT_METHODS);
      expect(methods).toContain('phone');
      expect(methods).toContain('whatsapp');
      expect(methods).toContain('sms');
    });

    it('should identify valid contact intents', () => {
      const intents = Object.values(CONTACT_INTENT);
      expect(intents).toContain('inquiry');
      expect(intents).toContain('order');
      expect(intents).toContain('check_availability');
    });
  });

  describe('Number Extraction and Cleaning', () => {
    it('should extract clean number from various formats', () => {
      const messyNumber = 'Call us at: 0300-123-4567 (WhatsApp available)';
      // The formatPakistaniNumber should handle dirty input
      const cleaned = messyNumber.match(/[\d-]+/)[0];
      const formatted = contactService.formatPakistaniNumber(cleaned);
      expect(formatted).toBe('+923001234567');
    });
  });

  describe('Mobile Number Patterns', () => {
    const mobileNetworks = [
      '0300', '0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309', // Mobilink/Jazz
      '0310', '0311', '0312', '0313', '0314', '0315', '0316', '0317', '0318', '0320', '0321', '0322', '0323', '0324', '0325', // Telenor
      '0330', '0331', '0332', '0333', '0334', '0335', '0336', '0337', '0345', '0346', '0347', // Ufone
      '0340', '0341', '0342', '0343', '0344', '0345', // Warid (now merged with Jazz)
    ];

    it.each(mobileNetworks)('should format %s network numbers correctly', (prefix) => {
      const number = `${prefix}1234567`;
      const formatted = contactService.formatPakistaniNumber(number);
      expect(formatted).toMatch(/^\+92\d{10}$/);
      expect(formatted).toBe(`+92${prefix.slice(1)}1234567`);
    });
  });
});
