// ChecksumValidator Unit Tests
// Story 1.3: Offline AI Model Storage
// Implements: Task 7.2

import ChecksumValidator from '../../utils/ChecksumValidator';

// Mock expo modules
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { HEX: 'hex' },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

describe('ChecksumValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateChecksum', () => {
    it('should calculate SHA256 checksum', async () => {
      const Crypto = require('expo-crypto');
      const FileSystem = require('expo-file-system');

      FileSystem.readAsStringAsync.mockResolvedValue('base64data');
      Crypto.digestStringAsync.mockResolvedValue('abc123def456');

      const result = await ChecksumValidator.calculateChecksum('/path/to/file');

      expect(result).toBe('abc123def456');
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        '/path/to/file',
        expect.objectContaining({ encoding: 'base64' })
      );
    });

    it('should handle calculation errors', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockRejectedValue(new Error('File read error'));

      await expect(
        ChecksumValidator.calculateChecksum('/invalid/path')
      ).rejects.toThrow('Checksum calculation failed');
    });
  });

  describe('verifyChecksum', () => {
    it('should verify matching checksums', async () => {
      const Crypto = require('expo-crypto');
      const FileSystem = require('expo-file-system');

      FileSystem.readAsStringAsync.mockResolvedValue('data');
      Crypto.digestStringAsync.mockResolvedValue('abc123');

      const result = await ChecksumValidator.verifyChecksum('/path/to/file', 'abc123');

      expect(result).toBe(true);
    });

    it('should detect checksum mismatch', async () => {
      const Crypto = require('expo-crypto');
      const FileSystem = require('expo-file-system');

      FileSystem.readAsStringAsync.mockResolvedValue('data');
      Crypto.digestStringAsync.mockResolvedValue('abc123');

      const result = await ChecksumValidator.verifyChecksum('/path/to/file', 'xyz789');

      expect(result).toBe(false);
    });

    it('should skip verification if no expected checksum', async () => {
      const result = await ChecksumValidator.verifyChecksum('/path/to/file', null);

      expect(result).toBe(true);
    });
  });

  describe('verifyModelIntegrity', () => {
    it('should verify model integrity successfully', async () => {
      const Crypto = require('expo-crypto');
      const FileSystem = require('expo-file-system');

      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 25000000,
      });
      FileSystem.readAsStringAsync.mockResolvedValue('data');
      Crypto.digestStringAsync.mockResolvedValue('abc123');

      const result = await ChecksumValidator.verifyModelIntegrity(
        '/path/to/model',
        'abc123',
        25000000
      );

      expect(result.valid).toBe(true);
      expect(result.fileSize).toBe(25000000);
    });

    it('should fail if file does not exist', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.getInfoAsync.mockResolvedValue({ exists: false });

      const result = await ChecksumValidator.verifyModelIntegrity(
        '/path/to/model',
        'abc123'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('does not exist');
    });

    it('should fail on file size mismatch', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 20000000,
      });

      const result = await ChecksumValidator.verifyModelIntegrity(
        '/path/to/model',
        'abc123',
        25000000
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('size mismatch');
    });
  });

  describe('quickFileCheck', () => {
    it('should pass quick check for valid file', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 25000000,
      });

      const result = await ChecksumValidator.quickFileCheck('/path/to/file');

      expect(result.valid).toBe(true);
      expect(result.fileSize).toBe(25000000);
    });

    it('should fail if file is too small', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 500,
      });

      const result = await ChecksumValidator.quickFileCheck('/path/to/file', 1000);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('too small');
    });
  });
});
