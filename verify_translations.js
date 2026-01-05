const fs = require('fs');
const path = require('path');

const locales = ['en', 'ro', 'it'];
const srcDir = 'src';

// Namespaces from i18n/request.ts
const namespaces = ['common', 'menu', 'auth', 'online-forms', 'registratura', 'hr', 'catechesis', 'pilgrimages'];

// Helper function to recursively get all keys from JSON object
function getKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Get all translation keys defined in JSON files
function getDefinedKeys() {
  const definedKeys = {};
  
  namespaces.forEach(namespace => {
    definedKeys[namespace] = {};
    locales.forEach(locale => {
      try {
        const filePath = path.join(srcDir, 'locales', locale, `${namespace}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          const keys = getKeys(data);
          definedKeys[namespace][locale] = new Set(keys);
        } else {
          definedKeys[namespace][locale] = new Set();
        }
      } catch (e) {
        console.error(`Error reading ${locale}/${namespace}.json:`, e.message);
        definedKeys[namespace][locale] = new Set();
      }
    });
  });
  
  return definedKeys;
}

// Recursively get all TypeScript/TSX files
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist, etc.
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== '.next') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extract translation keys used in code
function extractUsedKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const usedKeys = {};
  
  // Find all useTranslations calls and map them to namespace
  // Pattern: const varName = useTranslations('namespace')
  const useTranslationsRegex = /const\s+(\w+)\s*=\s*useTranslations\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const namespaceMap = {}; // Maps variable name to namespace
  
  let match;
  while ((match = useTranslationsRegex.exec(content)) !== null) {
    const varName = match[1];
    const namespace = match[2];
    namespaceMap[varName] = namespace;
  }
  
  // Now find all translation function calls
  // Pattern: varName('key') or varName("key")
  Object.keys(namespaceMap).forEach(varName => {
    const namespace = namespaceMap[varName];
    if (!usedKeys[namespace]) {
      usedKeys[namespace] = new Set();
    }
    
    // Match: varName('key') or varName("key")
    // Handle both single and double quotes, and allow for whitespace
    const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const callRegex = new RegExp(`${escapedVarName}\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`, 'g');
    let keyMatch;
    while ((keyMatch = callRegex.exec(content)) !== null) {
      const key = keyMatch[1];
      usedKeys[namespace].add(key);
    }
  });
  
  return { usedKeys, filePath };
}

// Main function to verify translations
function verifyTranslations() {
  console.log('Scanning source files...\n');
  
  const allUsedKeys = {};
  namespaces.forEach(ns => allUsedKeys[ns] = new Set());
  const keyUsage = {}; // Track which files use which keys
  
  // Get all TS/TSX files
  const tsFiles = getAllTsFiles(srcDir);
  console.log(`Found ${tsFiles.length} TypeScript files\n`);
  
  // Extract keys from each file
  tsFiles.forEach(filePath => {
    try {
      const { usedKeys } = extractUsedKeys(filePath);
      Object.keys(usedKeys).forEach(namespace => {
        usedKeys[namespace].forEach(key => {
          allUsedKeys[namespace].add(key);
          
          // Track usage
          const fullKey = `${namespace}.${key}`;
          if (!keyUsage[fullKey]) {
            keyUsage[fullKey] = [];
          }
          keyUsage[fullKey].push(filePath.replace(/\\/g, '/'));
        });
      });
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e.message);
    }
  });
  
  // Get defined keys from JSON files
  console.log('Reading translation files...\n');
  const definedKeys = getDefinedKeys();
  
  // Compare and find issues
  const issues = {
    critical: [], // Keys used but missing in ALL locales
    missing: {}, // Keys missing in specific locales
    inconsistent: {}, // Keys inconsistent between locales
  };
  
  namespaces.forEach(namespace => {
    const used = allUsedKeys[namespace];
    const defined = definedKeys[namespace];
    
    if (!defined) {
      console.warn(`Warning: Namespace ${namespace} not found in defined keys`);
      return;
    }
    
    // Check each used key
    used.forEach(key => {
      const fullKey = `${namespace}.${key}`;
      const missingInLocales = [];
      const presentInLocales = [];
      
      locales.forEach(locale => {
        if (!defined[locale] || !defined[locale].has(key)) {
          missingInLocales.push(locale);
        } else {
          presentInLocales.push(locale);
        }
      });
      
      if (missingInLocales.length === locales.length) {
        // Missing in ALL locales - CRITICAL
        issues.critical.push({
          key: fullKey,
          usage: keyUsage[fullKey] || [],
        });
      } else if (missingInLocales.length > 0) {
        // Missing in some locales
        if (!issues.missing[namespace]) {
          issues.missing[namespace] = [];
        }
        issues.missing[namespace].push({
          key,
          fullKey,
          missingIn: missingInLocales,
          presentIn: presentInLocales,
          usage: keyUsage[fullKey] || [],
        });
      }
    });
    
    // Check for inconsistencies (keys in some locales but not others)
    const allDefinedKeys = new Set();
    locales.forEach(locale => {
      if (defined[locale]) {
        defined[locale].forEach(key => allDefinedKeys.add(key));
      }
    });
    
    allDefinedKeys.forEach(key => {
      const presentIn = [];
      const missingIn = [];
      
      locales.forEach(locale => {
        if (defined[locale] && defined[locale].has(key)) {
          presentIn.push(locale);
        } else {
          missingIn.push(locale);
        }
      });
      
      if (missingIn.length > 0 && presentIn.length > 0) {
        if (!issues.inconsistent[namespace]) {
          issues.inconsistent[namespace] = [];
        }
        issues.inconsistent[namespace].push({
          key,
          fullKey: `${namespace}.${key}`,
          presentIn,
          missingIn,
        });
      }
    });
  });
  
  // Generate report
  generateReport(issues, allUsedKeys, definedKeys, keyUsage);
}

// Generate Markdown report
function generateReport(issues, allUsedKeys, definedKeys, keyUsage) {
  const report = [];
  const timestamp = new Date().toISOString();
  
  report.push('# Translation Verification Report');
  report.push('');
  report.push(`Generated: ${timestamp}`);
  report.push('');
  report.push('## Executive Summary');
  report.push('');
  
  const criticalCount = issues.critical.length;
  let missingCount = 0;
  Object.values(issues.missing).forEach(arr => missingCount += arr.length);
  let inconsistentCount = 0;
  Object.values(issues.inconsistent).forEach(arr => inconsistentCount += arr.length);
  
  report.push('### Key Findings');
  report.push('');
  report.push(`1. **Critical Issues**: ${criticalCount} keys used in code but missing in ALL locales`);
  report.push(`2. **Missing Keys**: ${missingCount} keys missing in some locales`);
  report.push(`3. **Inconsistent Keys**: ${inconsistentCount} keys inconsistent between locales`);
  report.push('');
  report.push('---');
  report.push('');
  
  // Critical issues
  if (issues.critical.length > 0) {
    report.push('## 1. Critical Issues (Keys Missing in ALL Locales)');
    report.push('');
    report.push('⚠️ **These keys are used in code but do not exist in any locale file. The application will show missing translation errors.**');
    report.push('');
    
    issues.critical.forEach(issue => {
      report.push(`### ${issue.key}`);
      report.push('');
      report.push('**Status**: Missing in all locales (ro, en, it)');
      report.push('');
      report.push('**Used in files**:');
      const uniqueFiles = [...new Set(issue.usage)];
      uniqueFiles.forEach(file => {
        report.push(`- \`${file}\``);
      });
      report.push('');
      report.push('**Recommended fix**: Add this key to all locale files:');
      const namespace = issue.key.split('.')[0];
      report.push(`- \`src/locales/ro/${namespace}.json\``);
      report.push(`- \`src/locales/en/${namespace}.json\``);
      report.push(`- \`src/locales/it/${namespace}.json\``);
      report.push('');
    });
  } else {
    report.push('## 1. Critical Issues');
    report.push('');
    report.push('✅ No critical issues found. All keys used in code exist in at least one locale.');
    report.push('');
  }
  
  report.push('---');
  report.push('');
  
  // Missing keys per namespace
  if (Object.keys(issues.missing).length > 0) {
    report.push('## 2. Missing Keys (Per Locale)');
    report.push('');
    report.push('⚠️ **These keys are used in code but missing in specific locales.**');
    report.push('');
    
    Object.keys(issues.missing).sort().forEach(namespace => {
      const missing = issues.missing[namespace];
      report.push(`### ${namespace} Namespace`);
      report.push('');
      
      // Group by missing locales
      const byMissingLocale = {};
      missing.forEach(item => {
        item.missingIn.forEach(locale => {
          if (!byMissingLocale[locale]) {
            byMissingLocale[locale] = [];
          }
          byMissingLocale[locale].push(item);
        });
      });
      
      locales.forEach(locale => {
        if (byMissingLocale[locale]) {
          report.push(`#### Missing in ${locale.toUpperCase()} (${byMissingLocale[locale].length} keys)`);
          report.push('');
          byMissingLocale[locale].forEach(item => {
            report.push(`- **\`${item.key}\`** (present in: ${item.presentIn.join(', ')})`);
            if (item.usage.length > 0) {
              const uniqueFiles = [...new Set(item.usage)].slice(0, 3);
              report.push(`  - Used in: ${uniqueFiles.map(f => `\`${path.basename(f)}\``).join(', ')}${item.usage.length > 3 ? '...' : ''}`);
            }
          });
          report.push('');
        }
      });
    });
  } else {
    report.push('## 2. Missing Keys');
    report.push('');
    report.push('✅ No missing keys found.');
    report.push('');
  }
  
  report.push('---');
  report.push('');
  
  // Inconsistent keys
  if (Object.keys(issues.inconsistent).length > 0) {
    report.push('## 3. Inconsistent Keys (Between Locales)');
    report.push('');
    report.push('⚠️ **These keys exist in some locales but not all. Consider adding them to all locales for consistency.**');
    report.push('');
    
    Object.keys(issues.inconsistent).sort().forEach(namespace => {
      const inconsistent = issues.inconsistent[namespace];
      report.push(`### ${namespace} Namespace`);
      report.push('');
      
      inconsistent.forEach(item => {
        report.push(`- **\`${item.key}\`**`);
        report.push(`  - Present in: ${item.presentIn.join(', ')}`);
        report.push(`  - Missing in: ${item.missingIn.join(', ')}`);
      });
      report.push('');
    });
  } else {
    report.push('## 3. Inconsistent Keys');
    report.push('');
    report.push('✅ All keys are consistent across locales.');
    report.push('');
  }
  
  report.push('---');
  report.push('');
  report.push('## 4. Summary Statistics');
  report.push('');
  
  namespaces.forEach(namespace => {
    const usedCount = allUsedKeys[namespace] ? allUsedKeys[namespace].size : 0;
    const enCount = definedKeys[namespace] && definedKeys[namespace]['en'] ? definedKeys[namespace]['en'].size : 0;
    const roCount = definedKeys[namespace] && definedKeys[namespace]['ro'] ? definedKeys[namespace]['ro'].size : 0;
    const itCount = definedKeys[namespace] && definedKeys[namespace]['it'] ? definedKeys[namespace]['it'].size : 0;
    
    report.push(`### ${namespace}`);
    report.push(`- Keys used in code: ${usedCount}`);
    report.push(`- Keys defined in EN: ${enCount}`);
    report.push(`- Keys defined in RO: ${roCount}`);
    report.push(`- Keys defined in IT: ${itCount}`);
    report.push('');
  });
  
  // Write report
  const reportPath = 'TRANSLATION_VERIFICATION_REPORT.md';
  fs.writeFileSync(reportPath, report.join('\n'), 'utf8');
  console.log(`\n✅ Report generated: ${reportPath}`);
  console.log(`\nSummary:`);
  console.log(`- Critical issues: ${criticalCount}`);
  console.log(`- Missing keys: ${missingCount}`);
  console.log(`- Inconsistent keys: ${inconsistentCount}`);
}

// Run verification
verifyTranslations();

