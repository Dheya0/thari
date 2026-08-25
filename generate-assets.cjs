const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateAllAssets() {
  console.log('🚀 بدء توليد الأصول والصور لكافة المنصات...');

  // التأكد من وجود ملفات SVG المصدرية
  const iconSvgPath = path.join(__dirname, 'assets', 'icon.svg');
  const splashSvgPath = path.join(__dirname, 'assets', 'splash.svg');

  if (!fs.existsSync(iconSvgPath) || !fs.existsSync(splashSvgPath)) {
    console.error('❌ لم يتم العثور على assets/icon.svg أو assets/splash.svg');
    process.exit(1);
  }

  const iconSvg = fs.readFileSync(iconSvgPath);
  const splashSvg = fs.readFileSync(splashSvgPath);

  // ----------------------------------------------------
  // 1. أصول منصة iOS (AppIcon.appiconset)
  // ----------------------------------------------------
  console.log('📱 جارٍ إنشاء أيقونات iOS...');
  const iosAppIconDir = path.join(__dirname, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
  fs.mkdirSync(iosAppIconDir, { recursive: true });

  const iosSizes = [
    { name: 'AppIcon-20x20@1x.png', size: 20 },
    { name: 'AppIcon-20x20@2x.png', size: 40 },
    { name: 'AppIcon-20x20@3x.png', size: 60 },
    { name: 'AppIcon-29x29@1x.png', size: 29 },
    { name: 'AppIcon-29x29@2x.png', size: 58 },
    { name: 'AppIcon-29x29@3x.png', size: 87 },
    { name: 'AppIcon-40x40@1x.png', size: 40 },
    { name: 'AppIcon-40x40@2x.png', size: 80 },
    { name: 'AppIcon-40x40@3x.png', size: 120 },
    { name: 'AppIcon-60x60@2x.png', size: 120 },
    { name: 'AppIcon-60x60@3x.png', size: 180 },
    { name: 'AppIcon-76x76@1x.png', size: 76 },
    { name: 'AppIcon-76x76@2x.png', size: 152 },
    { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
    { name: 'AppIcon-512@2x.png', size: 1024 },
    { name: 'AppIcon-1024x1024.png', size: 1024 }
  ];

  for (const item of iosSizes) {
    await sharp(iconSvg)
      .resize(item.size, item.size)
      .png({ compressionLevel: 6 })
      .toFile(path.join(iosAppIconDir, item.name));
  }

  // ملف الفهرس المعياري لـ Xcode
  const iosContents = {
    images: [
      { size: '20x20', idiom: 'iphone', filename: 'AppIcon-20x20@2x.png', scale: '2x' },
      { size: '20x20', idiom: 'iphone', filename: 'AppIcon-20x20@3x.png', scale: '3x' },
      { size: '29x29', idiom: 'iphone', filename: 'AppIcon-29x29@2x.png', scale: '2x' },
      { size: '29x29', idiom: 'iphone', filename: 'AppIcon-29x29@3x.png', scale: '3x' },
      { size: '40x40', idiom: 'iphone', filename: 'AppIcon-40x40@2x.png', scale: '2x' },
      { size: '40x40', idiom: 'iphone', filename: 'AppIcon-40x40@3x.png', scale: '3x' },
      { size: '60x60', idiom: 'iphone', filename: 'AppIcon-60x60@2x.png', scale: '2x' },
      { size: '60x60', idiom: 'iphone', filename: 'AppIcon-60x60@3x.png', scale: '3x' },
      { size: '20x20', idiom: 'ipad', filename: 'AppIcon-20x20@1x.png', scale: '1x' },
      { size: '20x20', idiom: 'ipad', filename: 'AppIcon-20x20@2x.png', scale: '2x' },
      { size: '29x29', idiom: 'ipad', filename: 'AppIcon-29x29@1x.png', scale: '1x' },
      { size: '29x29', idiom: 'ipad', filename: 'AppIcon-29x29@2x.png', scale: '2x' },
      { size: '40x40', idiom: 'ipad', filename: 'AppIcon-40x40@1x.png', scale: '1x' },
      { size: '40x40', idiom: 'ipad', filename: 'AppIcon-40x40@2x.png', scale: '2x' },
      { size: '76x76', idiom: 'ipad', filename: 'AppIcon-76x76@1x.png', scale: '1x' },
      { size: '76x76', idiom: 'ipad', filename: 'AppIcon-76x76@2x.png', scale: '2x' },
      { size: '83.5x83.5', idiom: 'ipad', filename: 'AppIcon-83.5x83.5@2x.png', scale: '2x' },
      { size: '1024x1024', idiom: 'ios-marketing', filename: 'AppIcon-1024x1024.png', scale: '1x' },
      { size: '1024x1024', idiom: 'universal', platform: 'ios', filename: 'AppIcon-512@2x.png' }
    ],
    info: { version: 1, author: 'xcode' }
  };
  fs.writeFileSync(path.join(iosAppIconDir, 'Contents.json'), JSON.stringify(iosContents, null, 2));

  // شاشات البدء لـ iOS
  const iosSplashDir = path.join(__dirname, 'ios/App/App/Assets.xcassets/Splash.imageset');
  fs.mkdirSync(iosSplashDir, { recursive: true });
  await sharp(splashSvg).resize(2732, 2732).png().toFile(path.join(iosSplashDir, 'splash-2732x2732.png'));
  await sharp(splashSvg).resize(1821, 1821).png().toFile(path.join(iosSplashDir, 'splash-2732x2732-1.png'));
  await sharp(splashSvg).resize(910, 910).png().toFile(path.join(iosSplashDir, 'splash-2732x2732-2.png'));

  // ----------------------------------------------------
  // 2. أصول منصة Android (Mipmaps & Drawables)
  // ----------------------------------------------------
  console.log('🤖 جارٍ إنشاء أيقونات وشاشات Android...');
  const androidMipmaps = [
    { dir: 'mipmap-mdpi', l: 48, a: 108 },
    { dir: 'mipmap-hdpi', l: 72, a: 162 },
    { dir: 'mipmap-xhdpi', l: 96, a: 216 },
    { dir: 'mipmap-xxhdpi', l: 144, a: 324 },
    { dir: 'mipmap-xxxhdpi', l: 192, a: 432 }
  ];

  for (const m of androidMipmaps) {
    const d = path.join(__dirname, 'android/app/src/main/res', m.dir);
    fs.mkdirSync(d, { recursive: true });
    await sharp(iconSvg).resize(m.l, m.l).png().toFile(path.join(d, 'ic_launcher.png'));
    await sharp(iconSvg).resize(m.l, m.l).png().toFile(path.join(d, 'ic_launcher_round.png'));
    await sharp(iconSvg).resize(m.a, m.a).png().toFile(path.join(d, 'ic_launcher_foreground.png'));
    await sharp({
      create: { width: m.a, height: m.a, channels: 4, background: { r: 10, g: 13, b: 16, alpha: 1 } }
    }).png().toFile(path.join(d, 'ic_launcher_background.png'));
  }

  // ----------------------------------------------------
  // 3. أصول الويب و PWA (public & public/icons)
  // ----------------------------------------------------
  console.log('🌐 جارٍ إنشاء أيقونات الويب و PWA...');
  const publicIconsDir = path.join(__dirname, 'public/icons');
  fs.mkdirSync(publicIconsDir, { recursive: true });

  const webIcons = [
    { f: 'public/icons/icon-192.png', s: 192 },
    { f: 'public/icons/icon-512.png', s: 512 },
    { f: 'public/icon-192.png', s: 192 },
    { f: 'public/icon-512.png', s: 512 },
    { f: 'public/icon.png', s: 512 },
    { f: 'public/favicon.png', s: 64 },
    { f: 'public/favicon-32x32.png', s: 32 },
    { f: 'public/favicon-16x16.png', s: 16 },
    { f: 'public/apple-touch-icon.png', s: 180 },
    { f: 'public/apple-touch-icon-180x180.png', s: 180 }
  ];

  for (const item of webIcons) {
    await sharp(iconSvg).resize(item.s, item.s).png().toFile(path.join(__dirname, item.f));
  }

  console.log('✅ تم توليد كافة الصور بصيغة PNG ثنائية نقية بنجاح!');
}

generateAllAssets().catch(err => {
  console.error('❌ حدث خطأ أثناء التوليد:', err);
  process.exit(1);
});