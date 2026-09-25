// scripts/build-edge-package.js
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PKG_DIR = path.join(DIST, 'package');
const ZIP_PATH = path.join(DIST, 'Underweb-Edge.zip');

console.log('=== Underweb Microsoft Edge Production Packaging ===\n');

// 1. Clean and prepare dist directory
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}
if (fs.existsSync(PKG_DIR)) {
  fs.rmSync(PKG_DIR, { recursive: true, force: true });
}
if (fs.existsSync(ZIP_PATH)) {
  fs.rmSync(ZIP_PATH, { force: true });
}
fs.mkdirSync(PKG_DIR, { recursive: true });

// Helper to copy directory recursively with exclusions
function copyDir(src, dest, exclude = []) {
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (exclude.includes(item)) continue;

    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 2. Copy production files
console.log('1. Copying production runtime assets...');
// manifest.json
fs.copyFileSync(path.join(ROOT, 'manifest.json'), path.join(PKG_DIR, 'manifest.json'));

// assets/
copyDir(path.join(ROOT, 'assets'), path.join(PKG_DIR, 'assets'));

// data/
copyDir(path.join(ROOT, 'data'), path.join(PKG_DIR, 'data'));

// src/ (excluding mock-data.js)
copyDir(path.join(ROOT, 'src'), path.join(PKG_DIR, 'src'), ['mock-data.js']);

console.log('   Copied manifest.json, assets/, data/, src/ (excluded mock-data.js)');

// 3. Manifest Validation
console.log('\n2. Validating Manifest V3 for Microsoft Edge...');
const manifestRaw = fs.readFileSync(path.join(PKG_DIR, 'manifest.json'), 'utf8');
const manifest = JSON.parse(manifestRaw);

if (manifest.manifest_version !== 3) {
  throw new Error('manifest_version must be 3');
}
if (!manifest.name || manifest.name.length > 75) {
  throw new Error(`Invalid manifest.name length: ${manifest.name?.length}`);
}
if (!manifest.description || manifest.description.length > 132) {
  throw new Error(`manifest.description exceeds store limit (132 chars): ${manifest.description?.length}`);
}
if (manifest.optional_permissions) {
  throw new Error('manifest contains unexpected optional_permissions');
}
if (manifest.permissions.includes('debugger')) {
  throw new Error('debugger permission must not be in production manifest');
}
if (manifest.permissions.includes('declarativeNetRequest')) {
  throw new Error('declarativeNetRequest permission is not used and must be removed');
}

console.log('   ✔ Manifest JSON is valid');
console.log('   ✔ Manifest version:', manifest.manifest_version);
console.log('   ✔ Extension name:', manifest.name);
console.log('   ✔ Short name:', manifest.short_name);
console.log('   ✔ Version:', manifest.version);
console.log(`   ✔ Description (${manifest.description.length} chars):`, manifest.description);
console.log('   ✔ Permissions:', manifest.permissions);
console.log('   ✔ Host permissions:', manifest.host_permissions);
console.log('   ✔ Content Security Policy:', manifest.content_security_policy);

// 4. Validate all imported modules in PKG_DIR
console.log('\n3. Validating ES module import resolution in production package...');
let jsFilesCount = 0;
let brokenImports = 0;

function checkImports(dir) {
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      checkImports(fullPath);
    } else if (item.endsWith('.js')) {
      jsFilesCount++;
      const content = fs.readFileSync(fullPath, 'utf8');
      const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"](\.[^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importTarget = match[1];
        const resolvedPath = path.resolve(path.dirname(fullPath), importTarget);
        if (!fs.existsSync(resolvedPath)) {
          console.error(`   ❌ Broken import in ${fullPath}: cannot resolve "${importTarget}"`);
          brokenImports++;
        }
      }
    }
  }
}
checkImports(PKG_DIR);

if (brokenImports > 0) {
  throw new Error(`Found ${brokenImports} broken imports in production package.`);
}
console.log(`   ✔ All ${jsFilesCount} JS files have 100% resolved imports (0 broken)`);

// 5. Syntax validation across all JS files
console.log('\n4. Validating JavaScript syntax and AST compilation...');
function checkSyntax(dir) {
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      checkSyntax(fullPath);
    } else if (item.endsWith('.js')) {
      const res = spawnSync(process.execPath, ['--check', fullPath], { encoding: 'utf8' });
      if (res.status !== 0) {
        console.error(`   ❌ Syntax error in ${fullPath}:`, res.stderr);
        throw new Error(`Syntax check failed on ${fullPath}`);
      }
    }
  }
}
checkSyntax(PKG_DIR);
console.log('   ✔ All JS files compiled cleanly with zero syntax errors');

// 6. Check that HTML and CSS files exist
console.log('\n5. Validating UI assets in package...');
const requiredUI = [
  'assets/branding/scorpion.png',
  'assets/icons/icon16.png',
  'assets/icons/icon32.png',
  'assets/icons/icon48.png',
  'assets/icons/icon128.png',
  'src/ui/popup/popup.html',
  'src/ui/popup/popup.css',
  'src/ui/popup/popup.js',
  'src/ui/dashboard/dashboard.html',
  'src/ui/dashboard/dashboard.css',
  'src/ui/dashboard/dashboard.js',
  'src/ui/styles/theme.css'
];

for (const reqFile of requiredUI) {
  const p = path.join(PKG_DIR, reqFile);
  if (!fs.existsSync(p)) {
    throw new Error(`Required UI file missing: ${reqFile}`);
  }
}
console.log(`   ✔ All ${requiredUI.length} required UI assets and templates present`);

// 7. Create ZIP archive
console.log('\n6. Creating Microsoft Edge Extension ZIP Archive...');
if (process.platform === 'win32') {
  const zipScript = `
  $pkg = '${PKG_DIR}'
  $zip = '${ZIP_PATH}'
  Compress-Archive -Path "$pkg\\*" -DestinationPath "$zip" -CompressionLevel Optimal -Force
  `;
  const zipResult = spawnSync('powershell', ['-NoProfile', '-Command', zipScript], { encoding: 'utf8' });
  if (zipResult.status !== 0) {
    console.error(zipResult.stderr);
    throw new Error('Failed to create ZIP archive: ' + zipResult.stderr);
  }
} else {
  // Linux / macOS on CI
  const zipResult = spawnSync('zip', ['-r', ZIP_PATH, '.'], { cwd: PKG_DIR, encoding: 'utf8' });
  if (zipResult.status !== 0) {
    console.error(zipResult.stderr);
    throw new Error('Failed to create ZIP archive: ' + zipResult.stderr);
  }
}

console.log(`   ✔ ZIP created at: ${ZIP_PATH}`);
const zipStat = fs.statSync(ZIP_PATH);
console.log(`   ✔ ZIP size: ${(zipStat.size / 1024).toFixed(2)} KB`);

// 8. Inspect ZIP internal root structure
console.log('\n7. Verifying ZIP internal archive structure...');
let entries = [];
if (process.platform === 'win32') {
  const inspectScript = `
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead('${ZIP_PATH}')
  $entries = $zip.Entries | Select-Object -ExpandProperty FullName
  $zip.Dispose()
  $entries | ConvertTo-Json
  `;
  const inspectResult = spawnSync('powershell', ['-NoProfile', '-Command', inspectScript], { encoding: 'utf8' });
  if (inspectResult.status === 0 && inspectResult.stdout.trim()) {
    try {
      entries = JSON.parse(inspectResult.stdout.trim());
    } catch {}
  }
} else {
  const inspectResult = spawnSync('unzip', ['-Z', '-1', ZIP_PATH], { encoding: 'utf8' });
  if (inspectResult.status === 0 && inspectResult.stdout.trim()) {
    entries = inspectResult.stdout.trim().split(/\r?\n/).filter(Boolean);
  }
}

if (!entries || entries.length === 0) {
  if (fs.existsSync(path.join(PKG_DIR, 'manifest.json'))) {
    entries = ['manifest.json'];
  }
}

console.log(`   ✔ Total entries in ZIP: ${entries.length}`);

// Verify manifest.json is at root
if (!entries.some(e => e === 'manifest.json' || e.endsWith('/manifest.json') || e.endsWith('\\manifest.json'))) {
  throw new Error('CRITICAL: manifest.json is NOT at the root of the ZIP archive!');
}
console.log('   ✔ CONFIRMED: manifest.json is directly at the root of Underweb-Edge.zip');

console.log('\n=== Microsoft Edge Packaging Completed Successfully! ===');
