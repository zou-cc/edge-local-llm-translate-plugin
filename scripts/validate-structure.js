#!/usr/bin/env node

/**
 * Extension Structure Validation Test
 * 
 * This script verifies that all required files and structure
 * are in place for the Edge Local LLM Translator extension.
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = path.resolve(__dirname, '..');

// Required files for a valid extension
const REQUIRED_FILES = [
  // Manifest
  'manifest.json',
  
  // Background scripts
  'background/background.js',
  'background/llm-client.js',
  'background/config-manager.js',
  
  // Content scripts
  'content/content.js',
  'content/floating-popup.js',
  'content/sidebar.js',
  'content/text-processor.js',
  'content/floating-popup.html',
  'content/styles/floating-popup.css',
  
  // Options page
  'options/options.html',
  'options/options.js',
  'options/options.css',
  
  // Side panel
  'sidepanel/sidepanel.html',
  'sidepanel/sidepanel.js',
  'sidepanel/sidepanel.css',
  
  // Shared modules
  'shared/constants.js',
  'shared/utils.js',
  'shared/tts.js',
  
  // Icons
  'icons/icon.svg',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'icons/README.md',
  
  // Documentation
  'README.md',
  'LICENSE'
];

// Optional but recommended files
const RECOMMENDED_FILES = [
  'docs/superpowers/specs/2025-03-29-edge-translator-design.md',
  'docs/superpowers/plans/2025-03-29-edge-translator-implementation.md'
];

// Required directories
const REQUIRED_DIRECTORIES = [
  'background',
  'content',
  'content/styles',
  'options',
  'sidepanel',
  'shared',
  'icons',
  'docs',
  'docs/superpowers',
  'docs/superpowers/specs',
  'docs/superpowers/plans'
];

// Manifest V3 required fields
const REQUIRED_MANIFEST_FIELDS = [
  'manifest_version',
  'name',
  'version',
  'description',
  'permissions',
  'background',
  'content_scripts',
  'icons',
  'action'
];

class ExtensionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0
    };
  }

  validate() {
    console.log('🔍 Edge Local LLM Translator - Structure Validation\n');
    
    this.checkDirectories();
    this.checkRequiredFiles();
    this.checkRecommendedFiles();
    this.validateManifest();
    this.calculateStats();
    this.report();
    
    return this.errors.length === 0;
  }

  checkDirectories() {
    console.log('📁 Checking directories...');
    
    REQUIRED_DIRECTORIES.forEach(dir => {
      const fullPath = path.join(EXTENSION_ROOT, dir);
      if (fs.existsSync(fullPath)) {
        console.log(`  ✓ ${dir}`);
        this.stats.totalDirectories++;
      } else {
        this.errors.push(`Missing directory: ${dir}`);
        console.log(`  ✗ ${dir} (MISSING)`);
      }
    });
    
    console.log('');
  }

  checkRequiredFiles() {
    console.log('📄 Checking required files...');
    
    REQUIRED_FILES.forEach(file => {
      const fullPath = path.join(EXTENSION_ROOT, file);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const size = this.formatSize(stats.size);
        console.log(`  ✓ ${file} (${size})`);
        this.stats.totalFiles++;
        this.stats.totalSize += stats.size;
        
        // Check for empty files
        if (stats.size === 0) {
          this.warnings.push(`Empty file: ${file}`);
        }
      } else {
        this.errors.push(`Missing required file: ${file}`);
        console.log(`  ✗ ${file} (MISSING)`);
      }
    });
    
    console.log('');
  }

  checkRecommendedFiles() {
    console.log('📋 Checking recommended files...');
    
    RECOMMENDED_FILES.forEach(file => {
      const fullPath = path.join(EXTENSION_ROOT, file);
      if (fs.existsSync(fullPath)) {
        console.log(`  ✓ ${file}`);
      } else {
        this.warnings.push(`Missing recommended file: ${file}`);
        console.log(`  ⚠ ${file} (optional)`);
      }
    });
    
    console.log('');
  }

  validateManifest() {
    console.log('📦 Validating manifest.json...');
    
    const manifestPath = path.join(EXTENSION_ROOT, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      this.errors.push('manifest.json does not exist');
      return;
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Check required fields
      REQUIRED_MANIFEST_FIELDS.forEach(field => {
        if (manifest[field] === undefined) {
          this.errors.push(`manifest.json missing required field: ${field}`);
          console.log(`  ✗ Missing field: ${field}`);
        } else {
          console.log(`  ✓ ${field}`);
        }
      });
      
      // Validate manifest_version
      if (manifest.manifest_version !== 3) {
        this.warnings.push(`Manifest version ${manifest.manifest_version} found, version 3 recommended`);
      }
      
      // Check icons reference
      if (manifest.icons) {
        ['16', '48', '128'].forEach(size => {
          if (!manifest.icons[size]) {
            this.warnings.push(`manifest.json missing icon${size}.png reference`);
          }
        });
      }
      
      // Check action icons
      if (manifest.action && manifest.action.default_icon) {
        ['16', '48', '128'].forEach(size => {
          if (!manifest.action.default_icon[size]) {
            this.warnings.push(`manifest.json missing action icon${size}.png reference`);
          }
        });
      }
      
    } catch (error) {
      this.errors.push(`Failed to parse manifest.json: ${error.message}`);
      console.log(`  ✗ Invalid JSON: ${error.message}`);
    }
    
    console.log('');
  }

  calculateStats() {
    console.log('📊 Calculating project statistics...\n');
  }

  report() {
    console.log('='.repeat(60));
    console.log('VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Statistics:`);
    console.log(`  Total files: ${this.stats.totalFiles}`);
    console.log(`  Total directories: ${this.stats.totalDirectories}`);
    console.log(`  Total size: ${this.formatSize(this.stats.totalSize)}`);
    
    if (this.errors.length === 0) {
      console.log(`\n✅ All required files and structure are present!`);
    } else {
      console.log(`\n❌ Found ${this.errors.length} error(s):`);
      this.errors.forEach(err => console.log(`   - ${err}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Found ${this.warnings.length} warning(s):`);
      this.warnings.forEach(warn => console.log(`   - ${warn}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('✅ Extension structure is VALID');
      process.exit(0);
    } else {
      console.log('❌ Extension structure is INVALID');
      process.exit(1);
    }
  }

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
}

// Run validation
const validator = new ExtensionValidator();
validator.validate();
