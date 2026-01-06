/**
 * Postinstall script to ensure lodash.get replacement is properly installed
 * This addresses the deprecation warning for lodash.get@4.4.2
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', 'lodash-get-replacement');
const targetDir = path.join(__dirname, '..', 'node_modules', 'lodash.get');

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: Source directory ${src} does not exist. Skipping lodash.get replacement.`);
    return;
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(dest);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Remove existing target if it exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  // Create target directory
  fs.mkdirSync(dest, { recursive: true });

  // Copy all files
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy lodash-get-replacement to lodash.get
try {
  copyDirectory(sourceDir, targetDir);
  console.log('✓ lodash.get replacement installed successfully');
} catch (error) {
  console.warn(`Warning: Failed to install lodash.get replacement: ${error.message}`);
}


