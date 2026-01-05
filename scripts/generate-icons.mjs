import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');
const iconsDir = join(publicDir, 'icons');

// Ensure icons directory exists
mkdirSync(iconsDir, { recursive: true });

// Read the SVG
const svgPath = join(publicDir, 'favicon.svg');
const svgBuffer = readFileSync(svgPath);

// Icon configurations
const icons = [
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  { name: 'icon-maskable-192.png', size: 192, padding: 20 }, // 10% padding for maskable
  { name: 'icon-maskable-512.png', size: 512, padding: 51 }, // 10% padding for maskable
  { name: 'apple-touch-icon.png', size: 180, padding: 0 },
];

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const icon of icons) {
    const outputPath = join(iconsDir, icon.name);

    if (icon.padding > 0) {
      // For maskable icons, resize smaller and add padding
      const innerSize = icon.size - (icon.padding * 2);
      const resizedSvg = await sharp(svgBuffer)
        .resize(innerSize, innerSize)
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: { r: 59, g: 130, b: 246, alpha: 1 } // #3b82f6
        }
      })
        .composite([{
          input: resizedSvg,
          top: icon.padding,
          left: icon.padding
        }])
        .png()
        .toFile(outputPath);
    } else {
      // Standard icons - just resize
      await sharp(svgBuffer)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);
    }

    console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
