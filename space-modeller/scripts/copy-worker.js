#!/usr/bin/env node
/**
 * Script to copy the FragmentsManager worker file from node_modules to public assets
 * This is run as a postinstall script to ensure the worker is available locally
 * and avoid CORS issues when loading from external CDN
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', 'node_modules', '@thatopen', 'fragments', 'dist', 'Worker', 'worker.mjs');
const targetDir = path.join(__dirname, '..', 'public', 'assets', 'fragments');
const targetFile = path.join(targetDir, 'worker.mjs');

try {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('Created directory:', targetDir);
  }

  // Copy worker file
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log('✓ Copied FragmentsManager worker to public/assets/fragments/worker.mjs');
  } else {
    console.warn('⚠ Warning: FragmentsManager worker not found at', sourceFile);
    console.warn('  The worker file will need to be copied manually or the package may not be installed yet.');
  }
} catch (error) {
  console.error('✗ Error copying worker file:', error.message);
  process.exit(1);
}
