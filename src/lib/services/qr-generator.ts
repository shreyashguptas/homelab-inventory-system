import QRCode from 'qrcode';

export interface QROptions {
  format: 'png' | 'svg' | 'dataurl';
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function generateItemQR(
  itemId: string,
  options: QROptions = { format: 'png' }
): Promise<Buffer | string> {
  const url = `${BASE_URL}/items/${itemId}`;

  const qrOptions = {
    width: options.size || 200,
    margin: options.margin || 2,
    color: {
      dark: options.darkColor || '#000000',
      light: options.lightColor || '#ffffff',
    },
  };

  switch (options.format) {
    case 'svg':
      return QRCode.toString(url, { ...qrOptions, type: 'svg' });
    case 'dataurl':
      return QRCode.toDataURL(url, qrOptions);
    case 'png':
    default:
      return QRCode.toBuffer(url, qrOptions);
  }
}

// For label printing - compact format with item name
export async function generateLabelQR(
  itemId: string,
  itemName: string
): Promise<string> {
  const url = `${BASE_URL}/items/${itemId}`;

  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    width: 80,
    margin: 1,
  });

  // Escape HTML entities in item name
  const escapedName = itemName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Truncate name if too long
  const truncatedName =
    escapedName.length > 25 ? escapedName.substring(0, 22) + '...' : escapedName;

  // Wrap in a label-friendly SVG with text
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="110" viewBox="0 0 100 110">
  <rect width="100" height="110" fill="white"/>
  <g transform="translate(10, 5)">
    ${qrSvg.replace(/<\?xml[^?]*\?>/, '').replace(/<!DOCTYPE[^>]*>/, '')}
  </g>
  <text x="50" y="102" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="black">
    ${truncatedName}
  </text>
</svg>`;
}

// Generate multiple QR codes for batch printing
export async function generateBatchQR(
  items: { id: string; name: string }[]
): Promise<string> {
  const labels = await Promise.all(
    items.map((item) => generateLabelQR(item.id, item.name))
  );

  // Calculate grid layout (4 columns)
  const cols = 4;
  const labelWidth = 100;
  const labelHeight = 110;
  const padding = 5;
  const rows = Math.ceil(labels.length / cols);

  const totalWidth = cols * (labelWidth + padding) + padding;
  const totalHeight = rows * (labelHeight + padding) + padding;

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

  labels.forEach((label, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = padding + col * (labelWidth + padding);
    const y = padding + row * (labelHeight + padding);

    // Extract inner SVG content (remove xml declaration and outer svg tags)
    const innerContent = label
      .replace(/<\?xml[^?]*\?>/, '')
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>/, '')
      .replace(/<rect[^/]*\/>/, ''); // Remove background rect

    svgContent += `
  <g transform="translate(${x}, ${y})">
    <rect width="${labelWidth}" height="${labelHeight}" fill="white" stroke="#e5e7eb" stroke-width="0.5"/>
    ${innerContent}
  </g>`;
  });

  svgContent += '\n</svg>';

  return svgContent;
}
