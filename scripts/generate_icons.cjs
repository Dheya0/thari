const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ultra-luxurious SVG for Thari App Icon
const luxurySvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141920" />
      <stop offset="50%" stop-color="#0E1217" />
      <stop offset="100%" stop-color="#07090C" />
    </linearGradient>

    <!-- Radial Glow behind emblem -->
    <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#D9B978" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#D9B978" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#D9B978" stop-opacity="0" />
    </radialGradient>

    <!-- Metallic Champagne Gold Gradient -->
    <linearGradient id="goldGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFF3D6" />
      <stop offset="25%" stop-color="#E5CB96" />
      <stop offset="55%" stop-color="#D9B978" />
      <stop offset="85%" stop-color="#B88E3E" />
      <stop offset="100%" stop-color="#8F6A24" />
    </linearGradient>

    <!-- Border Accent Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF3D6" stop-opacity="0.8" />
      <stop offset="35%" stop-color="#D9B978" stop-opacity="0.5" />
      <stop offset="70%" stop-color="#B88E3E" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#D9B978" stop-opacity="0.6" />
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#D9B978" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Solid Canvas Background -->
  <rect width="1024" height="1024" fill="#07090C" />
  
  <!-- Rounded App Background -->
  <rect x="0" y="0" width="1024" height="1024" fill="url(#bgGrad)" />

  <!-- Ambient Glow -->
  <circle cx="512" cy="512" r="420" fill="url(#goldGlow)" />

  <!-- Outer Subtle Luxury Ring -->
  <circle cx="512" cy="512" r="380" stroke="url(#borderGrad)" stroke-width="3" stroke-dasharray="16 8" stroke-opacity="0.4" />

  <!-- Inner Soft Ring -->
  <circle cx="512" cy="512" r="340" stroke="url(#borderGrad)" stroke-width="1.5" stroke-opacity="0.25" />

  <!-- Main Emblem Group with Shadow -->
  <g filter="url(#shadow)">
    <!-- Three Growth Columns (Arabic Thaa dots / Wealth Pillars) -->
    <!-- Left Column (Start of Journey) -->
    <rect x="300" y="440" width="76" height="190" rx="38" fill="url(#goldGrad)" />
    <circle cx="338" cy="440" r="16" fill="#FFF3D6" fill-opacity="0.6" />

    <!-- Center Column (Peak Wealth & Stability) -->
    <rect x="474" y="270" width="76" height="360" rx="38" fill="url(#goldGrad)" />
    <circle cx="512" cy="270" r="18" fill="#FFF3D6" fill-opacity="0.8" />

    <!-- Right Column (Balanced Growth) -->
    <rect x="648" y="360" width="76" height="270" rx="38" fill="url(#goldGrad)" />
    <circle cx="686" cy="360" r="16" fill="#FFF3D6" fill-opacity="0.6" />

    <!-- Wealth Cradle / Foundation Shield Curve -->
    <path d="M 280 710 C 420 830 604 830 744 710" stroke="url(#goldGrad)" stroke-width="38" stroke-linecap="round" fill="none" />
  </g>

  <!-- Micro Accent Sparkles -->
  <polygon points="512,180 518,198 536,204 518,210 512,228 506,210 488,204 506,198" fill="#FFF3D6" />
</svg>
`;

// Adaptive Foreground for Android
const adaptiveForegroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFF3D6" />
      <stop offset="25%" stop-color="#E5CB96" />
      <stop offset="55%" stop-color="#D9B978" />
      <stop offset="85%" stop-color="#B88E3E" />
      <stop offset="100%" stop-color="#8F6A24" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
    </filter>
  </defs>

  <g filter="url(#shadow)" transform="translate(102, 102) scale(0.8)">
    <rect x="300" y="440" width="76" height="190" rx="38" fill="url(#goldGrad)" />
    <rect x="474" y="270" width="76" height="360" rx="38" fill="url(#goldGrad)" />
    <rect x="648" y="360" width="76" height="270" rx="38" fill="url(#goldGrad)" />
    <path d="M 280 710 C 420 830 604 830 744 710" stroke="url(#goldGrad)" stroke-width="38" stroke-linecap="round" fill="none" />
    <polygon points="512,180 518,198 536,204 518,210 512,228 506,210 488,204 506,198" fill="#FFF3D6" />
  </g>
</svg>
`;

async function main() {
  console.log('Generating Luxury Icons for Web, iOS & Android...');

  const svgBuffer = Buffer.from(luxurySvg);
  const fgBuffer = Buffer.from(adaptiveForegroundSvg);

  // 1. Web & PWA Icons in /public
  fs.writeFileSync(path.join(__dirname, '../public/logo.svg'), luxurySvg.trim());

  const webSizes = [
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'apple-touch-icon-180x180.png', size: 180 },
    { name: 'apple-touch-icon-152x152.png', size: 152 },
    { name: 'apple-touch-icon-167x167.png', size: 167 },
    { name: 'apple-touch-icon-120x120.png', size: 120 },
    { name: 'icon.png', size: 512 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-192.png', size: 192 },
    { name: 'favicon.png', size: 64 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-16x16.png', size: 16 }
  ];

  for (const item of webSizes) {
    const dest = path.join(__dirname, '../public', item.name);
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(dest);
    console.log(`Created public/${item.name} (${item.size}x${item.size})`);
  }

  // 2. iOS Xcode Assets in /ios/App/App/Assets.xcassets/AppIcon.appiconset/
  const iosIconDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
  if (fs.existsSync(iosIconDir)) {
    const iosSizes = [
      { name: 'AppIcon-20x20@2x.png', size: 40 },
      { name: 'AppIcon-20x20@3x.png', size: 60 },
      { name: 'AppIcon-29x29@2x.png', size: 58 },
      { name: 'AppIcon-29x29@3x.png', size: 87 },
      { name: 'AppIcon-40x40@2x.png', size: 80 },
      { name: 'AppIcon-40x40@3x.png', size: 120 },
      { name: 'AppIcon-60x60@2x.png', size: 120 },
      { name: 'AppIcon-60x60@3x.png', size: 180 },
      { name: 'AppIcon-20x20@1x.png', size: 20 },
      { name: 'AppIcon-29x29@1x.png', size: 29 },
      { name: 'AppIcon-40x40@1x.png', size: 40 },
      { name: 'AppIcon-76x76@1x.png', size: 76 },
      { name: 'AppIcon-76x76@2x.png', size: 152 },
      { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
      { name: 'AppIcon-512@2x.png', size: 1024 },
      { name: 'AppIcon-1024x1024.png', size: 1024 }
    ];

    for (const item of iosSizes) {
      await sharp(svgBuffer)
        .resize(item.size, item.size)
        .png({ quality: 100 })
        .toFile(path.join(iosIconDir, item.name));
    }
    console.log('Updated iOS AppIcon set with 1024x1024 high fidelity icons.');
  }

  // 3. Android Native Resources in /android/app/src/main/res/
  const androidResDir = path.join(__dirname, '../android/app/src/main/res');
  const androidMipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const m of androidMipmaps) {
    const fullDir = path.join(androidResDir, m.dir);
    if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });

    // Square launcher icon
    await sharp(svgBuffer)
      .resize(m.size, m.size)
      .png({ quality: 100 })
      .toFile(path.join(fullDir, 'ic_launcher.png'));

    // Round launcher icon
    const roundSvg = `
      <svg width="${m.size}" height="${m.size}" viewBox="0 0 ${m.size} ${m.size}">
        <clipPath id="circleClip">
          <circle cx="${m.size / 2}" cy="${m.size / 2}" r="${m.size / 2}" />
        </clipPath>
        <image href="data:image/png;base64,${(await sharp(svgBuffer).resize(m.size, m.size).png().toBuffer()).toString('base64')}" width="${m.size}" height="${m.size}" clip-path="url(#circleClip)" />
      </svg>
    `;
    await sharp(Buffer.from(roundSvg)).png().toFile(path.join(fullDir, 'ic_launcher_round.png'));
  }

  // Android Adaptive Icon Resources
  const drawableDir = path.join(androidResDir, 'drawable');
  if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });

  await sharp(fgBuffer)
    .resize(432, 432)
    .png({ quality: 100 })
    .toFile(path.join(drawableDir, 'ic_launcher_foreground.png'));

  const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0A0D10"
        android:pathData="M0,0h108v108h-108z" />
</vector>`;
  fs.writeFileSync(path.join(drawableDir, 'ic_launcher_background.xml'), backgroundXml);

  const mipmapAnyDpi = path.join(androidResDir, 'mipmap-anydpi-v26');
  if (!fs.existsSync(mipmapAnyDpi)) fs.mkdirSync(mipmapAnyDpi, { recursive: true });

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`;
  fs.writeFileSync(path.join(mipmapAnyDpi, 'ic_launcher.xml'), adaptiveXml);
  fs.writeFileSync(path.join(mipmapAnyDpi, 'ic_launcher_round.xml'), adaptiveXml);

  // Android values (strings, styles)
  const valuesDir = path.join(androidResDir, 'values');
  if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });

  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ثري</string>
    <string name="title_activity_main">ثري</string>
    <string name="package_name">com.thari.finance.app</string>
    <string name="custom_url_scheme">thari</string>
</resources>`;
  fs.writeFileSync(path.join(valuesDir, 'strings.xml'), stringsXml);

  console.log('All icons generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
