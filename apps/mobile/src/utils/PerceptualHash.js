// Perceptual Hash Utility
// Story 1.3: Offline AI Model Storage
// Implements: Task 5.3 (Cache lookup for similar images using perceptual hashing)

import * as FileSystem from 'expo-file-system';
import { CACHE_SETTINGS } from '../constants/ModelConstants';

/**
 * PerceptualHash
 * Generates perceptual hashes for image similarity detection
 * Used for finding cached inference results for similar images
 * AC5: Fallback to cached results for similar images
 */
class PerceptualHash {
  /**
   * Generate a simple perceptual hash from image URI
   * Implements: Task 5.3
   *
   * NOTE: This is a simplified implementation using file-based hashing.
   * For production, consider using actual perceptual hashing algorithms like:
   * - pHash (Perceptual Hash)
   * - dHash (Difference Hash)
   * - aHash (Average Hash)
   *
   * For now, we'll use a combination of file metadata and content sampling.
   *
   * @param {string} imageUri - URI of the image file
   * @returns {Promise<string>} - Perceptual hash string
   */
  async generateHash(imageUri) {
    try {
      console.log('[PerceptualHash] Generating hash for:', imageUri);

      // Get file information
      const fileInfo = await FileSystem.getInfoAsync(imageUri);

      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }

      // For now, use a simple hash based on file size and URI
      // In production, this should be replaced with actual perceptual hashing
      const simpleHash = this.simpleFileHash(imageUri, fileInfo.size);

      console.log('[PerceptualHash] Hash generated:', simpleHash);
      return simpleHash;
    } catch (error) {
      console.error('[PerceptualHash] Hash generation failed:', error);
      throw error;
    }
  }

  /**
   * Simple file-based hash (temporary implementation)
   * This will be replaced with proper perceptual hashing in Story 3.1/3.2
   *
   * @param {string} uri - File URI
   * @param {number} size - File size
   * @returns {string} - Simple hash
   */
  simpleFileHash(uri, size) {
    // Extract filename and size to create a simple hash
    const fileName = uri.split('/').pop();
    const hashInput = `${fileName}_${size}`;

    // Simple string hash function
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Calculate similarity between two perceptual hashes
   * Implements: Task 5.3
   *
   * NOTE: For production, implement proper Hamming distance calculation
   * for perceptual hash comparison.
   *
   * @param {string} hash1 - First perceptual hash
   * @param {string} hash2 - Second perceptual hash
   * @returns {number} - Similarity score (0.0 to 1.0, 1.0 = identical)
   */
  calculateSimilarity(hash1, hash2) {
    if (hash1 === hash2) {
      return 1.0; // Exact match
    }

    // Simple comparison for now
    // In production, use Hamming distance for perceptual hashes
    const maxLength = Math.max(hash1.length, hash2.length);
    let matchingChars = 0;

    for (let i = 0; i < maxLength; i++) {
      if (hash1[i] === hash2[i]) {
        matchingChars++;
      }
    }

    return matchingChars / maxLength;
  }

  /**
   * Check if two hashes are similar enough to be considered a match
   *
   * @param {string} hash1 - First hash
   * @param {string} hash2 - Second hash
   * @param {number} threshold - Similarity threshold (default from constants)
   * @returns {boolean} - True if hashes are similar
   */
  areSimilar(hash1, hash2, threshold = CACHE_SETTINGS.SIMILARITY_THRESHOLD) {
    const similarity = this.calculateSimilarity(hash1, hash2);
    return similarity >= threshold;
  }

  /**
   * Find best matching hash from a list of hashes
   *
   * @param {string} targetHash - Hash to match
   * @param {Array<{hash: string, data: any}>} hashList - List of hashes with associated data
   * @param {number} threshold - Minimum similarity threshold
   * @returns {object|null} - Best match or null
   */
  findBestMatch(targetHash, hashList, threshold = CACHE_SETTINGS.SIMILARITY_THRESHOLD) {
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const item of hashList) {
      const similarity = this.calculateSimilarity(targetHash, item.hash);

      if (similarity >= threshold && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = {
          ...item,
          similarity,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Future: Implement actual perceptual hash using image processing
   *
   * This method is a placeholder for future implementation in Story 3.2
   * when TensorFlow Lite and image processing are fully integrated.
   *
   * Algorithm steps for proper perceptual hashing:
   * 1. Resize image to 8x8 or 16x16 (for dHash/aHash)
   * 2. Convert to grayscale
   * 3. Compute hash based on pixel differences or averages
   * 4. Return binary hash as hex string
   *
   * @param {string} imageUri - Image file URI
   * @returns {Promise<string>} - Perceptual hash
   */
  async generatePerceptualHash(imageUri) {
    // TODO: Implement actual perceptual hashing when image processing is available
    // For now, use simple file-based hashing
    return this.generateHash(imageUri);
  }

  /**
   * Calculate Hamming distance between two binary hashes
   * Used for comparing perceptual hashes
   *
   * @param {string} hash1 - First hash (hex string)
   * @param {string} hash2 - Second hash (hex string)
   * @returns {number} - Hamming distance (number of differing bits)
   */
  hammingDistance(hash1, hash2) {
    if (hash1.length !== hash2.length) {
      throw new Error('Hash lengths must match for Hamming distance calculation');
    }

    let distance = 0;

    // Convert hex to binary and compare bit by bit
    for (let i = 0; i < hash1.length; i++) {
      const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);

      // Count number of 1s in XOR result (differing bits)
      distance += xor.toString(2).split('1').length - 1;
    }

    return distance;
  }

  /**
   * Normalize Hamming distance to similarity score (0.0 to 1.0)
   *
   * @param {number} hammingDistance - Hamming distance
   * @param {number} hashBits - Total bits in hash (default: 64 for 8x8 hash)
   * @returns {number} - Similarity score
   */
  normalizeSimilarity(hammingDistance, hashBits = 64) {
    return 1.0 - (hammingDistance / hashBits);
  }
}

export default new PerceptualHash();
