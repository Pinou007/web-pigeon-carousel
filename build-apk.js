const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const sdkDir = 'C:\\Users\\Pinou\\AppData\\Local\\Android\\Sdk';
const buildTools = path.join(sdkDir, 'build-tools', '34.0.0');
const androidJar = path.join(sdkDir, 'platforms', 'android-36', 'android.jar');
const aapt = path.join(buildTools, 'aapt.exe');
const d8 = path.join(buildTools, 'd8.bat');
const zipalign = path.join(buildTools, 'zipalign.exe');
const apksigner = path.join(buildTools, 'apksigner.bat');

function run(cmd, opts = {}) {
    console.log(`> ${cmd}`);
    cp.execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe', ...opts });
}

// 1. Prepare directories
fs.mkdirSync('android/bin/classes', { recursive: true });
fs.mkdirSync('android/bin/dex', { recursive: true });
fs.mkdirSync('dist/installers', { recursive: true });

console.log('--- Step 1: Generating R.java with AAPT ---');
run(`"${aapt}" package -f -m -J android/src -M android/AndroidManifest.xml -S android/res -I "${androidJar}"`);

console.log('--- Step 2: Compiling Java with javac (Java 8 target) ---');
run(`javac -source 8 -target 8 -bootclasspath "${androidJar}" -d android/bin/classes android/src/fr/pinou007/pigeon/R.java android/src/fr/pinou007/pigeon/MainActivity.java`);

console.log('--- Step 3: Compiling classes to DEX with D8 ---');
run(`"${d8}" --lib "${androidJar}" --output android/bin/dex android/bin/classes/fr/pinou007/pigeon/R.class android/bin/classes/fr/pinou007/pigeon/MainActivity.class`);

console.log('--- Step 4: Packaging resources and assets into unaligned APK ---');
const unalignedApk = path.resolve('android/bin/unaligned.apk');
if (fs.existsSync(unalignedApk)) fs.unlinkSync(unalignedApk);
run(`"${aapt}" package -f -M android/AndroidManifest.xml -S android/res -A android/assets -I "${androidJar}" -F "${unalignedApk}"`);

console.log('--- Step 5: Adding classes.dex to APK ---');
const originalCwd = process.cwd();
process.chdir('android/bin/dex');
run(`"${aapt}" add "${unalignedApk}" classes.dex`);
process.chdir(originalCwd);

console.log('--- Step 6: Zipalign APK ---');
const alignedApk = path.resolve('android/bin/aligned.apk');
if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);
run(`"${zipalign}" -f -p 4 "${unalignedApk}" "${alignedApk}"`);

console.log('--- Step 7: Signing APK ---');
const keystore = path.resolve('android/pigeon.keystore');
if (!fs.existsSync(keystore)) {
    run(`keytool -genkey -v -keystore "${keystore}" -alias pigeon -keyalg RSA -keysize 2048 -validity 10000 -storepass pigeon123 -keypass pigeon123 -dname "CN=Pinou007, O=Pigeon, C=FR"`);
}

const finalApk = path.resolve('dist/installers/Pigeon-Mobile.apk');
if (fs.existsSync(finalApk)) fs.unlinkSync(finalApk);
run(`"${apksigner}" sign --ks "${keystore}" --ks-pass pass:pigeon123 --out "${finalApk}" "${alignedApk}"`);

console.log('--- Step 8: Verifying APK signature ---');
run(`"${apksigner}" verify "${finalApk}"`);

const stats = fs.statSync(finalApk);
console.log(`\n🎉 Android APK created successfully!`);
console.log(`File: ${finalApk} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
