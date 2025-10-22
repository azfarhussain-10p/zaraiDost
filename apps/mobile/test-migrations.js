// Test Migrations Script
// Run with: node test-migrations.js (from apps/mobile directory)

console.log('🧪 Testing Database Constants and Migrations Setup...\n');

async function testMigrations() {
  try {
    // Import database config
    const { DATABASE_VERSION } = require('./src/constants/DatabaseConstants');
    console.log(`📊 Current Database Version: ${DATABASE_VERSION}`);

    // Check if version 7 is set
    if (DATABASE_VERSION !== 7) {
      console.error(`❌ FAIL: Expected DATABASE_VERSION to be 7, got ${DATABASE_VERSION}`);
      process.exit(1);
    }
    console.log('✓ Database version is correct (7)\n');

    // Import DiseaseClasses
    const DiseaseClasses = require('./src/constants/DiseaseClasses');
    const diseaseCount = DiseaseClasses.DISEASE_CLASSES.length;
    console.log(`🦠 Disease Classes Loaded: ${diseaseCount} diseases`);

    if (diseaseCount !== 55) {
      console.error(`❌ FAIL: Expected 55 diseases, got ${diseaseCount}`);
      process.exit(1);
    }
    console.log('✓ All 55 disease classes loaded correctly\n');

    // Test getDiseaseByClassId function
    const testDisease = DiseaseClasses.getDiseaseByClassId(0);
    if (!testDisease) {
      console.error('❌ FAIL: getDiseaseByClassId(0) returned null');
      process.exit(1);
    }
    console.log(`✓ getDiseaseByClassId works: ${testDisease.nameEn}\n`);

    // Verify key disease classes exist
    const keyClassIds = [0, 1, 10, 20, 30, 40, 50];
    for (const classId of keyClassIds) {
      const disease = DiseaseClasses.getDiseaseByClassId(classId);
      if (!disease) {
        console.error(`❌ FAIL: Missing disease at classId ${classId}`);
        process.exit(1);
      }
      console.log(`  ✓ Class ${classId}: ${disease.nameEn}`);
    }
    console.log('✓ Key disease classes verified\n');

    // Import InferenceConstants
    const InferenceConstants = require('./src/constants/InferenceConstants');
    console.log('📊 InferenceConstants Loaded:');
    console.log(`  - Model Input Size: ${InferenceConstants.MODEL_CONFIG.INPUT_SIZE}x${InferenceConstants.MODEL_CONFIG.INPUT_SIZE}`);
    console.log(`  - Number of Classes: ${InferenceConstants.MODEL_CONFIG.NUM_CLASSES}`);
    console.log(`  - Max Inference Time: ${InferenceConstants.PERFORMANCE_THRESHOLDS.MAX_INFERENCE_TIME}ms`);
    console.log(`  - Top-K Predictions: ${InferenceConstants.PREDICTION_CONFIG.TOP_K}`);
    console.log(`  - High Confidence Threshold: ${InferenceConstants.PREDICTION_CONFIG.HIGH_CONFIDENCE_THRESHOLD}\n`);

    if (InferenceConstants.MODEL_CONFIG.NUM_CLASSES !== 55) {
      console.error(`❌ FAIL: Expected NUM_CLASSES to be 55, got ${InferenceConstants.MODEL_CONFIG.NUM_CLASSES}`);
      process.exit(1);
    }
    console.log('✓ InferenceConstants configured correctly\n');

    // Test utility functions
    const testConfidence = 0.85;
    const isHigh = InferenceConstants.isHighConfidence(testConfidence);
    const needsCloud = InferenceConstants.needsCloudVerification(testConfidence);
    const level = InferenceConstants.getConfidenceLevel(testConfidence);

    console.log('🔧 Testing Utility Functions:');
    console.log(`  - isHighConfidence(0.85): ${isHigh} (expected: true)`);
    console.log(`  - needsCloudVerification(0.85): ${needsCloud} (expected: false)`);
    console.log(`  - getConfidenceLevel(0.85): ${level} (expected: 'high')\n`);

    if (!isHigh || needsCloud || level !== 'high') {
      console.error('❌ FAIL: Utility functions not working as expected');
      process.exit(1);
    }
    console.log('✓ Utility functions working correctly\n');

    // Summary
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n📋 Summary:');
    console.log(`  ✓ Database version: ${DATABASE_VERSION}`);
    console.log(`  ✓ Disease classes: ${diseaseCount}`);
    console.log(`  ✓ Model classes: ${InferenceConstants.MODEL_CONFIG.NUM_CLASSES}`);
    console.log(`  ✓ Top-K predictions: ${InferenceConstants.PREDICTION_CONFIG.TOP_K}`);
    console.log(`  ✓ Max inference time: ${InferenceConstants.PERFORMANCE_THRESHOLDS.MAX_INFERENCE_TIME}ms`);
    console.log('\n🎉 Ready to continue implementation!');
    console.log('\nNext steps:');
    console.log('  1. Continue with DiseaseResultParser service');
    console.log('  2. Extend DiseaseDetectionEngine');
    console.log('  3. Build MultiImageAnalyzer');
    console.log('  4. Create UI components');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testMigrations();

