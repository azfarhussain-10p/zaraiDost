// Checksum Validator Utility
// Story 1.3: Offline AI Model Storage
// Implements: Task 2.4 (Verify model integrity after download)

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { CHECKSUM_ALGORITHM } from '../constants/ModelConstants';

/**
 * ChecksumValidator
 * Validates file integrity using checksums
 * AC2: Model integrity verification
 */
class ChecksumValidator {
  /**
   * Calculate SHA256 checksum of a file
   * Implements: Task 2.4
   *
   * @param {string} fileUri - URI of the file to check
   * @returns {Promise<string>} - SHA256 checksum
   */
  async calculateChecksum(fileUri) {
    try {
      console.log('[ChecksumValidator] Calculating checksum for:', fileUri);

      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Calculate SHA256 hash
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fileContent,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      console.log('[ChecksumValidator] Checksum calculated:', hash.substring(0, 16) + '...');
      return hash;
    } catch (error) {
      console.error('[ChecksumValidator] Checksum calculation failed:', error);
      throw new Error(`Checksum calculation failed: ${error.message}`);
    }
  }

  /**
   * Verify file against expected checksum
   * Implements: Task 2.4
   *
   * @param {string} fileUri - URI of the file to verify
   * @param {string} expectedChecksum - Expected checksum value
   * @returns {Promise<boolean>} - True if checksums match
   */
  async verifyChecksum(fileUri, expectedChecksum) {
    try {
      if (!expectedChecksum) {
        console.warn('[ChecksumValidator] No expected checksum provided, skipping verification');
        return true;
      }

      const actualChecksum = await this.calculateChecksum(fileUri);

      const isValid = actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();

      if (isValid) {
        console.log('[ChecksumValidator] Checksum verification passed');
      } else {
        console.error('[ChecksumValidator] Checksum mismatch!');
        console.error('  Expected:', expectedChecksum);
        console.error('  Actual:  ', actualChecksum);
      }

      return isValid;
    } catch (error) {
      console.error('[ChecksumValidator] Checksum verification failed:', error);
      throw error;
    }
  }

  /**
   * Verify model file integrity
   * Combines checksum verification with file existence check
   *
   * @param {string} fileUri - URI of the model file
   * @param {string} expectedChecksum - Expected checksum
   * @param {number} expectedSize - Expected file size in bytes (optional)
   * @returns {Promise<object>} - Verification result
   */
  async verifyModelIntegrity(fileUri, expectedChecksum, expectedSize = null) {
    try {
      console.log('[ChecksumValidator] Verifying model integrity:', fileUri);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        return {
          valid: false,
          reason: 'File does not exist',
        };
      }

      // Verify file size if provided
      if (expectedSize !== null && fileInfo.size !== expectedSize) {
        console.warn('[ChecksumValidator] File size mismatch');
        console.warn('  Expected:', expectedSize, 'bytes');
        console.warn('  Actual:  ', fileInfo.size, 'bytes');
        return {
          valid: false,
          reason: `File size mismatch (expected ${expectedSize}, got ${fileInfo.size})`,
          actualSize: fileInfo.size,
        };
      }

      // Verify checksum
      const checksumValid = await this.verifyChecksum(fileUri, expectedChecksum);

      if (!checksumValid) {
        return {
          valid: false,
          reason: 'Checksum mismatch',
        };
      }

      console.log('[ChecksumValidator] Model integrity verified successfully');
      return {
        valid: true,
        fileSize: fileInfo.size,
      };
    } catch (error) {
      console.error('[ChecksumValidator] Model integrity verification failed:', error);
      return {
        valid: false,
        reason: `Verification error: ${error.message}`,
        error,
      };
    }
  }

  /**
   * Quick file existence and size check (faster than full checksum)
   *
   * @param {string} fileUri - URI of the file
   * @param {number} minSize - Minimum expected file size (optional)
   * @returns {Promise<object>} - Quick check result
   */
  async quickFileCheck(fileUri, minSize = 1000) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        return {
          valid: false,
          reason: 'File does not exist',
        };
      }

      if (fileInfo.size < minSize) {
        return {
          valid: false,
          reason: `File too small (${fileInfo.size} bytes, minimum ${minSize})`,
          actualSize: fileInfo.size,
        };
      }

      return {
        valid: true,
        fileSize: fileInfo.size,
      };
    } catch (error) {
      console.error('[ChecksumValidator] Quick file check failed:', error);
      return {
        valid: false,
        reason: `Check error: ${error.message}`,
      };
    }
  }
}

export default new ChecksumValidator();
