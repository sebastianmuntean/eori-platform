const fs = require('fs');
const path = require('path');

const locales = ['en', 'ro', 'it'];
const files = ['common', 'registratura', 'catechesis', 'online-forms', 'pilgrimages'];

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

files.forEach(file => {
  console.log(`\n=== ${file}.json ===`);
  const allKeys = {};
  
  locales.forEach(locale => {
    try {
      const filePath = path.join('src/locales', locale, `${file}.json`);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      const keys = getKeys(data);
      allKeys[locale] = new Set(keys.sort());
      console.log(`${locale}: ${keys.length} keys`);
    } catch (e) {
      console.error(`Error reading ${locale}/${file}.json:`, e.message);
    }
  });
  
  const enKeys = allKeys['en'] || new Set();
  const roKeys = allKeys['ro'] || new Set();
  const itKeys = allKeys['it'] || new Set();
  
  const onlyEn = [...enKeys].filter(k => !roKeys.has(k) || !itKeys.has(k));
  const onlyRo = [...roKeys].filter(k => !enKeys.has(k) || !itKeys.has(k));
  const onlyIt = [...itKeys].filter(k => !enKeys.has(k) || !roKeys.has(k));
  
  if (onlyEn.length > 0) {
    console.log('\nKeys only in EN:');
    onlyEn.forEach(k => console.log(`  - ${k}`));
  }
  if (onlyRo.length > 0) {
    console.log('\nKeys only in RO:');
    onlyRo.forEach(k => console.log(`  - ${k}`));
  }
  if (onlyIt.length > 0) {
    console.log('\nKeys only in IT:');
    onlyIt.forEach(k => console.log(`  - ${k}`));
  }
  
  if (onlyEn.length === 0 && onlyRo.length === 0 && onlyIt.length === 0) {
    console.log('✓ All locales have the same key structure');
  } else {
    console.log(`\n⚠ Structure differences found!`);
  }
});






