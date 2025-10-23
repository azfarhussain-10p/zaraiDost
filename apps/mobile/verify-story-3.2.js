// Quick verification of Story 3.2 implementation
// Checks files exist and configuration is correct

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Story 3.2: On-Device Disease Detection Model\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function check(name, condition, isWarning = false) {
  if (condition) {
    console.log(`✓ ${name}`);
    checks.passed++;
  } else {
    if (isWarning) {
      console.log(`⚠️ ${name}`);
      checks.warnings++;
    } else {
      console.log(`✗ ${name}`);
      checks.failed++;
    }
  }
}

// Check files exist
console.log('=== File Existence ===\n');

const requiredFiles = [
  'src/database/migrations/007_diseases.js',
  'src/constants/DiseaseClasses.js',
  'src/constants/InferenceConstants.js',
  'src/database/repositories/DiseaseRepository.js',
  'src/services/ai/DiseaseResultParser.js',
  'src/services/ai/DiseaseDetectionEngine.js',
  'src/services/ai/MultiImageAnalyzer.js',
  'src/screens/disease/DiseaseResultScreen.js',
  'src/__tests__/services/ai/DiseaseResultParser.test.js',
  'src/__tests__/services/ai/MultiImageAnalyzer.test.js',
  'src/utils/crypto-polyfill.js',
];

requiredFiles.forEach((file) => {
  const exists = fs.existsSync(path.join(__dirname, file));
  check(file, exists);
});

console.log('\n=== Configuration Checks ===\n');

// Check database version
try {
  const dbConfigContent = fs.readFileSync(
    path.join(__dirname, 'src/database/config/db.config.js'),
    'utf8'
  );
  check(
    'Database config includes migration 007',
    dbConfigContent.includes('runMigration007')
  );
} catch (error) {
  check('Database config readable', false);
}

// Check constants
try {
  const dbConstantsContent = fs.readFileSync(
    path.join(__dirname, 'src/constants/DatabaseConstants.js'),
    'utf8'
  );
  check('DATABASE_VERSION is 7 or higher', dbConstantsContent.includes('DATABASE_VERSION = 7') || dbConstantsContent.includes('DATABASE_VERSION = 8') || dbConstantsContent.includes('DATABASE_VERSION = 9'));
  check('DISEASES table defined', dbConstantsContent.includes('DISEASES:'));
} catch (error) {
  check('Database constants readable', false);
}

// Check disease classes count
try {
  const diseaseClassesContent = fs.readFileSync(
    path.join(__dirname, 'src/constants/DiseaseClasses.js'),
    'utf8'
  );
  
  // Count class entries (simple heuristic)
  const classMatches = diseaseClassesContent.match(/classId:\s*\d+/g);
  const classCount = classMatches ? classMatches.length : 0;
  
  check(`Found ${classCount} disease classes (expected 55)`, classCount === 55);
  check('Healthy class at classId 0', diseaseClassesContent.includes('classId: 0') && diseaseClassesContent.includes('Healthy'));
} catch (error) {
  check('Disease classes readable', false);
}

// Check App.js has crypto polyfill
try {
  const appContent = fs.readFileSync(path.join(__dirname, 'App.js'), 'utf8');
  check('Crypto polyfill imported in App.js', appContent.includes('crypto-polyfill'));
} catch (error) {
  check('App.js readable', false);
}

// Check HealthCheckSubmission integration
try {
  const healthCheckContent = fs.readFileSync(
    path.join(__dirname, 'src/screens/health/HealthCheckSubmission.js'),
    'utf8'
  );
  check('Disease detection integrated in HealthCheckSubmission', 
    healthCheckContent.includes('DiseaseDetectionEngine') &&
    healthCheckContent.includes('DiseaseResult')
  );
} catch (error) {
  check('HealthCheckSubmission readable', false);
}

console.log('\n=== Summary ===\n');

console.log(`✓ Passed: ${checks.passed}`);
console.log(`✗ Failed: ${checks.failed}`);
console.log(`⚠️ Warnings: ${checks.warnings}`);

const total = checks.passed + checks.failed + checks.warnings;
const successRate = Math.round((checks.passed / total) * 100);

console.log(`\nSuccess Rate: ${successRate}%\n`);

if (checks.failed === 0) {
  console.log('🎉 ALL CRITICAL CHECKS PASSED!\n');
  
  console.log('📋 Implementation Status:');
  console.log('✓ Database migration (007_diseases.js)');
  console.log('✓ Disease classes (55 diseases)');
  console.log('✓ Inference constants');
  console.log('✓ Disease repository');
  console.log('✓ AI services (Parser, Engine, Analyzer)');
  console.log('✓ UI screens (DiseaseResultScreen)');
  console.log('✓ Unit tests');
  console.log('✓ Integration with Story 3.1');
  console.log('✓ Crypto polyfill for web');
  
  console.log('\n🚀 Story 3.2 is READY FOR TESTING!\n');
  console.log('Next Steps:');
  console.log('1. Refresh browser (http://localhost:8081)');
  console.log('2. Check console for errors');
  console.log('3. Test UUID generation (create field/crop)');
  console.log('4. Navigate to health check flow');
  console.log('5. Submit images for disease detection');
  
  console.log('\n📖 See TESTING_GUIDE.md for detailed testing instructions');
  
  process.exit(0);
} else {
  console.log('❌ VERIFICATION FAILED - Some checks did not pass\n');
  console.log('Please review the failed checks above and fix any issues.');
  process.exit(1);
}

