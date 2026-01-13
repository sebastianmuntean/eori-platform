const fs = require('fs');
const path = require('path');

const locales = ['ro', 'en', 'it'];
const srcDir = 'src';
const localesDir = path.join(srcDir, 'locales');

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

// Load all translation files
function loadTranslations() {
  const translations = {};
  
  namespaces.forEach(namespace => {
    translations[namespace] = {};
    locales.forEach(locale => {
      try {
        const filePath = path.join(localesDir, locale, `${namespace}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          translations[namespace][locale] = data;
        } else {
          translations[namespace][locale] = {};
        }
      } catch (e) {
        console.error(`Error reading ${locale}/${namespace}.json:`, e.message);
        translations[namespace][locale] = {};
      }
    });
  });
  
  return translations;
}

// Check if a translation key exists in a locale
function hasTranslation(translations, namespace, key, locale) {
  const data = translations[namespace][locale];
  if (!data) return false;
  
  const keys = key.split('.');
  let current = data;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return false;
    }
  }
  
  return typeof current === 'string';
}

// Recursively get all TypeScript/TSX files in a directory
function getAllTsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
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

// Extract translation keys used in a file
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
  
  // Also handle direct useTranslations calls like useTranslations('namespace')('key')
  const directCallRegex = /useTranslations\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = directCallRegex.exec(content)) !== null) {
    const namespace = match[1];
    const key = match[2];
    if (!usedKeys[namespace]) {
      usedKeys[namespace] = new Set();
    }
    usedKeys[namespace].add(key);
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
  
  return usedKeys;
}

// Get all page files
function getAllPageFiles() {
  const pagesDir = path.join(srcDir, 'app', '[locale]');
  const pageFiles = [];
  
  function findPages(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findPages(filePath);
      } else if (file === 'page.tsx') {
        pageFiles.push(filePath);
      }
    });
  }
  
  findPages(pagesDir);
  
  // Also check root app directory
  const rootPage = path.join(srcDir, 'app', 'page.tsx');
  if (fs.existsSync(rootPage)) {
    pageFiles.push(rootPage);
  }
  
  return pageFiles;
}

// Resolve import path to actual file path
function resolveImportPath(importPath, fromFile) {
  // Handle @/ alias (points to src/)
  if (importPath.startsWith('@/')) {
    const relativePath = importPath.replace('@/', '');
    const resolvedPath = path.join(srcDir, relativePath);
    
    // Try different extensions
    const extensions = ['.tsx', '.ts', '/index.tsx', '/index.ts'];
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    // If it's a directory, try index file
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      const indexPath = path.join(resolvedPath, 'index.tsx');
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
      const indexPathTs = path.join(resolvedPath, 'index.ts');
      if (fs.existsSync(indexPathTs)) {
        return indexPathTs;
      }
    }
  }
  
  // Handle relative paths
  if (importPath.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, importPath);
    
    // Try different extensions
    const extensions = ['.tsx', '.ts', '/index.tsx', '/index.ts'];
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    // If it's a directory, try index file
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      const indexPath = path.join(resolvedPath, 'index.tsx');
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
      const indexPathTs = path.join(resolvedPath, 'index.ts');
      if (fs.existsSync(indexPathTs)) {
        return indexPathTs;
      }
    }
  }
  
  return null;
}

// Get component files used by a page by parsing imports
function getRelatedComponentFiles(pagePath, visited = new Set()) {
  if (visited.has(pagePath)) {
    return [];
  }
  visited.add(pagePath);
  
  const components = [];
  
  if (!fs.existsSync(pagePath)) {
    return components;
  }
  
  const content = fs.readFileSync(pagePath, 'utf8');
  
  // Parse import statements
  // Match: import ... from 'path' or import ... from "path"
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Skip node_modules and built-in modules
    if (importPath.startsWith('node:') || 
        !importPath.startsWith('@/') && 
        !importPath.startsWith('.') && 
        !importPath.startsWith('/')) {
      continue;
    }
    
    const resolvedPath = resolveImportPath(importPath, pagePath);
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      const stat = fs.statSync(resolvedPath);
      
      // Only include component files (tsx/ts files in components directory)
      if (stat.isFile() && 
          (resolvedPath.includes('/components/') || resolvedPath.includes('\\components\\')) &&
          (resolvedPath.endsWith('.tsx') || resolvedPath.endsWith('.ts'))) {
        if (!visited.has(resolvedPath)) {
          components.push(resolvedPath);
          // Recursively get components imported by this component (limit depth to avoid infinite loops)
          if (visited.size < 50) { // Limit recursion depth
            const nestedComponents = getRelatedComponentFiles(resolvedPath, visited);
            components.push(...nestedComponents);
          }
        }
      }
    }
  }
  
  return components;
}

// Generate report for a single page
function analyzePage(pagePath, translations) {
  const pageKeys = {};
  const relatedFiles = [pagePath, ...getRelatedComponentFiles(pagePath)];
  
  // Extract keys from page and related components
  relatedFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    
    try {
      const usedKeys = extractUsedKeys(filePath);
      Object.keys(usedKeys).forEach(namespace => {
        if (!pageKeys[namespace]) {
          pageKeys[namespace] = new Set();
        }
        usedKeys[namespace].forEach(key => {
          pageKeys[namespace].add(key);
        });
      });
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e.message);
    }
  });
  
  // Check translation status for each key
  const keyStatus = {};
  Object.keys(pageKeys).forEach(namespace => {
    keyStatus[namespace] = {};
    pageKeys[namespace].forEach(key => {
      keyStatus[namespace][key] = {
        ro: hasTranslation(translations, namespace, key, 'ro'),
        en: hasTranslation(translations, namespace, key, 'en'),
        it: hasTranslation(translations, namespace, key, 'it'),
      };
    });
  });
  
  return {
    pagePath,
    relatedFiles,
    keys: pageKeys,
    keyStatus,
  };
}

// Generate the full report
function generateReport() {
  console.log('Loading translations...');
  const translations = loadTranslations();
  
  console.log('Finding all pages...');
  const pageFiles = getAllPageFiles();
  console.log(`Found ${pageFiles.length} pages\n`);
  
  console.log('Analyzing pages...');
  const pageAnalyses = [];
  
  pageFiles.forEach((pagePath, index) => {
    const relativePath = path.relative(process.cwd(), pagePath);
    process.stdout.write(`\rProcessing ${index + 1}/${pageFiles.length}: ${relativePath}`);
    
    try {
      const analysis = analyzePage(pagePath, translations);
      pageAnalyses.push(analysis);
    } catch (e) {
      console.error(`\nError analyzing ${pagePath}:`, e.message);
    }
  });
  
  console.log('\n\nGenerating report...');
  
  // Generate markdown report
  const report = [];
  const timestamp = new Date().toISOString();
  
  report.push('# Page Translations Report');
  report.push('');
  report.push(`Generated: ${timestamp}`);
  report.push('');
  report.push(`Total Pages Analyzed: ${pageAnalyses.length}`);
  report.push('');
  report.push('---');
  report.push('');
  
  // Summary statistics
  let totalKeys = 0;
  let missingInAll = 0;
  let missingInSome = 0;
  let completeInAll = 0;
  
  pageAnalyses.forEach(analysis => {
    Object.keys(analysis.keys).forEach(namespace => {
      analysis.keys[namespace].forEach(key => {
        totalKeys++;
        const status = analysis.keyStatus[namespace][key];
        const hasRo = status.ro;
        const hasEn = status.en;
        const hasIt = status.it;
        
        if (!hasRo && !hasEn && !hasIt) {
          missingInAll++;
        } else if (hasRo && hasEn && hasIt) {
          completeInAll++;
        } else {
          missingInSome++;
        }
      });
    });
  });
  
  report.push('## Executive Summary');
  report.push('');
  report.push(`- **Total Translation Keys Found**: ${totalKeys}`);
  report.push(`- **Complete in All Languages**: ${completeInAll} (${((completeInAll / totalKeys) * 100).toFixed(1)}%)`);
  report.push(`- **Missing in Some Languages**: ${missingInSome} (${((missingInSome / totalKeys) * 100).toFixed(1)}%)`);
  report.push(`- **Missing in All Languages**: ${missingInAll} (${((missingInAll / totalKeys) * 100).toFixed(1)}%)`);
  report.push('');
  report.push('---');
  report.push('');
  
  // Detailed report per page
  report.push('## Detailed Report by Page');
  report.push('');
  
  pageAnalyses.forEach((analysis, index) => {
    const relativePath = path.relative(process.cwd(), analysis.pagePath).replace(/\\/g, '/');
    const pageName = relativePath.replace(/^src\/app\/\[locale\]\//, '').replace(/\/page\.tsx$/, '') || 'root';
    
    report.push(`### ${index + 1}. ${pageName}`);
    report.push('');
    report.push(`**File**: \`${relativePath}\``);
    report.push('');
    
    // Count keys by namespace
    const namespaceCounts = {};
    Object.keys(analysis.keys).forEach(namespace => {
      namespaceCounts[namespace] = analysis.keys[namespace].size;
    });
    
    if (Object.keys(namespaceCounts).length === 0) {
      report.push('⚠️ **No translation keys found in this page.**');
      report.push('');
      report.push('---');
      report.push('');
      return;
    }
    
    report.push('**Translation Keys by Namespace:**');
    Object.keys(namespaceCounts).sort().forEach(namespace => {
      report.push(`- \`${namespace}\`: ${namespaceCounts[namespace]} keys`);
    });
    report.push('');
    
    // Show status for each namespace
    Object.keys(analysis.keys).sort().forEach(namespace => {
      const keys = Array.from(analysis.keys[namespace]).sort();
      
      report.push(`#### ${namespace} namespace`);
      report.push('');
      
      // Group keys by status
      const complete = [];
      const missingSome = [];
      const missingAll = [];
      
      keys.forEach(key => {
        const status = analysis.keyStatus[namespace][key];
        const hasRo = status.ro;
        const hasEn = status.en;
        const hasIt = status.it;
        
        if (!hasRo && !hasEn && !hasIt) {
          missingAll.push({ key, status });
        } else if (hasRo && hasEn && hasIt) {
          complete.push(key);
        } else {
          const missing = [];
          if (!hasRo) missing.push('ro');
          if (!hasEn) missing.push('en');
          if (!hasIt) missing.push('it');
          missingSome.push({ key, missing, status });
        }
      });
      
      if (complete.length > 0) {
        report.push(`✅ **Complete (${complete.length})**: All languages have translations`);
        report.push('');
        complete.forEach(key => {
          report.push(`- \`${key}\``);
        });
        report.push('');
      }
      
      if (missingSome.length > 0) {
        report.push(`⚠️ **Missing in Some Languages (${missingSome.length})**:`);
        report.push('');
        missingSome.forEach(({ key, missing }) => {
          const present = locales.filter(l => !missing.includes(l));
          report.push(`- \`${key}\``);
          report.push(`  - ✅ Present in: ${present.join(', ')}`);
          report.push(`  - ❌ Missing in: ${missing.join(', ')}`);
        });
        report.push('');
      }
      
      if (missingAll.length > 0) {
        report.push(`❌ **Missing in All Languages (${missingAll.length})**:`);
        report.push('');
        missingAll.forEach(({ key }) => {
          report.push(`- \`${key}\``);
        });
        report.push('');
      }
    });
    
    report.push('---');
    report.push('');
  });
  
  // Write report
  const reportPath = 'PAGE_TRANSLATIONS_REPORT.md';
  fs.writeFileSync(reportPath, report.join('\n'), 'utf8');
  console.log(`\n✅ Report generated: ${reportPath}`);
  console.log(`\nSummary:`);
  console.log(`- Total pages: ${pageAnalyses.length}`);
  console.log(`- Total keys: ${totalKeys}`);
  console.log(`- Complete: ${completeInAll}`);
  console.log(`- Missing in some: ${missingInSome}`);
  console.log(`- Missing in all: ${missingInAll}`);
  
  // Generate translation plan report
  generateTranslationPlan(pageAnalyses, translations);
}

// Generate a separate report with missing translations as a work plan
function generateTranslationPlan(pageAnalyses, translations) {
  const plan = [];
  const timestamp = new Date().toISOString();
  
  plan.push('# Translation Work Plan');
  plan.push('');
  plan.push(`Generated: ${timestamp}`);
  plan.push('');
  plan.push('This document lists all missing translations that need to be added.');
  plan.push('Organized by namespace and locale for easy implementation.');
  plan.push('');
  plan.push('---');
  plan.push('');
  
  // Collect all missing keys organized by namespace and locale
  const missingByNamespace = {};
  
  pageAnalyses.forEach(analysis => {
    Object.keys(analysis.keys).forEach(namespace => {
      if (!missingByNamespace[namespace]) {
        missingByNamespace[namespace] = {};
        locales.forEach(locale => {
          missingByNamespace[namespace][locale] = {
            missingInAll: [],
            missingInSome: [],
          };
        });
      }
      
      analysis.keys[namespace].forEach(key => {
        const status = analysis.keyStatus[namespace][key];
        const hasRo = status.ro;
        const hasEn = status.en;
        const hasIt = status.it;
        
        if (!hasRo && !hasEn && !hasIt) {
          // Missing in all languages
          locales.forEach(locale => {
            if (!missingByNamespace[namespace][locale].missingInAll.includes(key)) {
              missingByNamespace[namespace][locale].missingInAll.push(key);
            }
          });
        } else {
          // Missing in some languages
          if (!hasRo) {
            if (!missingByNamespace[namespace]['ro'].missingInSome.includes(key)) {
              missingByNamespace[namespace]['ro'].missingInSome.push(key);
            }
          }
          if (!hasEn) {
            if (!missingByNamespace[namespace]['en'].missingInSome.includes(key)) {
              missingByNamespace[namespace]['en'].missingInSome.push(key);
            }
          }
          if (!hasIt) {
            if (!missingByNamespace[namespace]['it'].missingInSome.includes(key)) {
              missingByNamespace[namespace]['it'].missingInSome.push(key);
            }
          }
        }
      });
    });
  });
  
  // Generate plan by namespace
  Object.keys(missingByNamespace).sort().forEach(namespace => {
    const namespaceData = missingByNamespace[namespace];
    let hasMissing = false;
    
    locales.forEach(locale => {
      if (namespaceData[locale].missingInAll.length > 0 || 
          namespaceData[locale].missingInSome.length > 0) {
        hasMissing = true;
      }
    });
    
    if (!hasMissing) return;
    
    plan.push(`## ${namespace} Namespace`);
    plan.push('');
    plan.push(`**File**: \`src/locales/{locale}/${namespace}.json\``);
    plan.push('');
    
    // For each locale
    locales.forEach(locale => {
      const localeData = namespaceData[locale];
      const totalMissing = localeData.missingInAll.length + localeData.missingInSome.length;
      
      if (totalMissing === 0) return;
      
      plan.push(`### ${locale.toUpperCase()} (${locale === 'ro' ? 'Română' : locale === 'en' ? 'English' : 'Italiano'})`);
      plan.push('');
      
      if (localeData.missingInAll.length > 0) {
        plan.push(`#### Missing Keys (${localeData.missingInAll.length} keys)`);
        plan.push('');
        plan.push('These keys are missing in ALL languages and need to be added:');
        plan.push('');
        localeData.missingInAll.sort().forEach(key => {
          plan.push(`- \`${key}\`: `);
        });
        plan.push('');
      }
      
      if (localeData.missingInSome.length > 0) {
        plan.push(`#### Partial Keys (${localeData.missingInSome.length} keys)`);
        plan.push('');
        plan.push('These keys exist in other languages but are missing in this locale:');
        plan.push('');
        localeData.missingInSome.sort().forEach(key => {
          // Check which languages have it
          const hasIn = [];
          locales.forEach(l => {
            if (l !== locale) {
              const status = checkKeyStatus(translations, namespace, key, l);
              if (status) hasIn.push(l);
            }
          });
          plan.push(`- \`${key}\`: (present in: ${hasIn.join(', ')})`);
        });
        plan.push('');
      }
      
      plan.push('---');
      plan.push('');
    });
  });
  
  // Summary section
  plan.push('## Summary by Locale');
  plan.push('');
  
  locales.forEach(locale => {
    let totalMissing = 0;
    let totalPartial = 0;
    
    Object.keys(missingByNamespace).forEach(namespace => {
      totalMissing += missingByNamespace[namespace][locale].missingInAll.length;
      totalPartial += missingByNamespace[namespace][locale].missingInSome.length;
    });
    
    plan.push(`### ${locale.toUpperCase()}`);
    plan.push(`- Missing keys: ${totalMissing}`);
    plan.push(`- Partial keys: ${totalPartial}`);
    plan.push(`- **Total to add: ${totalMissing + totalPartial}**`);
    plan.push('');
  });
  
  // Write plan
  const planPath = 'TRANSLATION_WORK_PLAN.md';
  fs.writeFileSync(planPath, plan.join('\n'), 'utf8');
  console.log(`✅ Translation work plan generated: ${planPath}`);
}

// Helper function to check if a key exists in a locale
function checkKeyStatus(translations, namespace, key, locale) {
  return hasTranslation(translations, namespace, key, locale);
}

// Run the script
generateReport();

