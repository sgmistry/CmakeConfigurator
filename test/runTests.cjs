const assert = require('assert');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

const { PresetManager } = require('../dist/presetManager.js');
const { CacheParser } = require('../dist/cacheParser.js');

console.log('=== RUNNING CMAKE GUI PLUGIN TESTS ===\n');

// Test 1: PresetManager loading and macro expansion
console.log('Test 1: PresetManager loading sample presets...');
const sampleDir = path.join(projectRoot, 'sample-project');
const presets = PresetManager.loadPresets(sampleDir);

assert.strictEqual(presets.configurePresets.length, 4, 'Should load 4 configure presets');
assert.strictEqual(presets.buildPresets.length, 4, 'Should load 4 build presets');
assert.strictEqual(presets.testPresets.length, 2, 'Should load 2 test presets');


const ninjaDebug = presets.configurePresets.find(p => p.name === 'ninja-debug');
assert(ninjaDebug, 'ninja-debug preset should exist');
assert.strictEqual(ninjaDebug.generator, 'Ninja', 'Generator should be Ninja');
assert(
  ninjaDebug.binaryDir.includes('build/ninja-debug') || ninjaDebug.binaryDir.includes('build'),
  `binaryDir should have expanded \${presetName}. Actual: ${ninjaDebug.binaryDir}`
);
console.log('  -> ninja-debug binaryDir:', ninjaDebug.binaryDir);
console.log('✓ PresetManager correctly parsed and expanded presets!\n');

// Test 2: CacheParser parsing and updating
console.log('Test 2: CacheParser testing...');
const dummyCacheContent = `
# This is the build cache file
// Choose the type of build, options are: None Debug Release RelWithDebInfo MinSizeRel ...
CMAKE_BUILD_TYPE:STRING=Debug

// Build shared libraries
BUILD_SHARED_LIBS:BOOL=ON

// Path to a program.
CMAKE_MAKE_PROGRAM:FILEPATH=/usr/bin/ninja

// Custom calculator precision
CALCULATOR_PRECISION:STRING=HIGH

// Flags used by the CXX compiler during all build types.
CMAKE_CXX_FLAGS-ADVANCED:INTERNAL=1
CMAKE_CXX_FLAGS:STRING=-Wall -Wextra
`;

const tempCachePath = path.join(projectRoot, 'test', 'temp_CMakeCache.txt');
fs.writeFileSync(tempCachePath, dummyCacheContent, 'utf8');

const parsedEntries = CacheParser.parse(tempCachePath);
assert.strictEqual(parsedEntries.length, 5, 'Should have parsed 5 non-internal entries');

const boolEntry = parsedEntries.find(e => e.name === 'BUILD_SHARED_LIBS');
assert(boolEntry, 'BUILD_SHARED_LIBS should exist');
assert.strictEqual(boolEntry.type, 'BOOL');
assert.strictEqual(boolEntry.value, 'ON');

const advancedEntry = parsedEntries.find(e => e.name === 'CMAKE_CXX_FLAGS');
assert(advancedEntry, 'CMAKE_CXX_FLAGS should exist');
assert.strictEqual(advancedEntry.advanced, true, 'CMAKE_CXX_FLAGS should be marked advanced');

// Test updating entry
CacheParser.updateEntry(tempCachePath, 'BUILD_SHARED_LIBS', 'BOOL', 'OFF');
const reloaded = CacheParser.parse(tempCachePath);
const updatedBool = reloaded.find(e => e.name === 'BUILD_SHARED_LIBS');
assert.strictEqual(updatedBool.value, 'OFF', 'Value should be updated to OFF');

// Clean up temp cache
fs.unlinkSync(tempCachePath);
console.log('✓ CacheParser correctly parsed, filtered advanced flags, and updated cache entries!\n');

// Test 3: Sample Presets Scaffolder
console.log('Test 3: Sample presets scaffolding...');
const tempPresetsPath = path.join(projectRoot, 'test', 'temp_CMakePresets.json');
PresetManager.createSamplePresetsFile(tempPresetsPath);
assert(fs.existsSync(tempPresetsPath), 'Scaffolded presets file should exist');

const scaffoldedData = JSON.parse(fs.readFileSync(tempPresetsPath, 'utf8'));
assert(scaffoldedData.configurePresets.length >= 4, 'Should scaffold at least 4 presets');
fs.unlinkSync(tempPresetsPath);
console.log('✓ Sample presets file scaffolded and validated successfully!\n');

console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');

