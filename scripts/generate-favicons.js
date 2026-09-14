import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const publicDir = path.resolve('public');
const svgPath = path.join(publicDir, 'favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function buildIcons() {
  console.log('Generating favicon set from favicon.svg...');

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
  ];

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(publicDir, name));
    console.log(`✓ Generated ${name}`);
  }

  // Also write 32x32 as favicon.ico
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFormat('png')
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Generated favicon.ico');

  // Compress og-image.png and create og-image.webp
  const ogPng = path.join(publicDir, 'og-image.png');
  if (fs.existsSync(ogPng)) {
    await sharp(ogPng)
      .resize(1200, 630, { fit: 'cover' })
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(path.join(publicDir, 'og-image-opt.png'));
    fs.renameSync(path.join(publicDir, 'og-image-opt.png'), ogPng);

    await sharp(ogPng)
      .resize(1200, 630, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(path.join(publicDir, 'og-image.webp'));
    console.log('✓ Compressed og-image.png and created og-image.webp');
  }

  console.log('Favicon and image suite generated successfully.');
}

buildIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
