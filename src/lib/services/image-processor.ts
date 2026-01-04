import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const IMAGES_DIR = process.env.IMAGES_DIR || './data/images/compressed';
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const THUMBNAIL_SIZE = 200;
const WEBP_QUALITY = parseInt(process.env.IMAGE_QUALITY || '75');

export interface ProcessedImage {
  id: string;
  filename: string;
  thumbnailFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export async function processImage(
  inputBuffer: Buffer,
  originalFilename: string
): Promise<ProcessedImage> {
  const id = uuidv4();
  const ext = '.webp';
  const filename = `${id}${ext}`;
  const thumbnailFilename = `${id}_thumb${ext}`;

  // Ensure directory exists
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  // Process main image
  const mainImage = await sharp(inputBuffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 6,
      nearLossless: false,
    })
    .toBuffer();

  // Generate thumbnail
  const thumbnail = await sharp(inputBuffer)
    .rotate()
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'centre',
    })
    .webp({
      quality: 60,
      effort: 4,
    })
    .toBuffer();

  // Write files
  await Promise.all([
    fs.writeFile(path.join(IMAGES_DIR, filename), mainImage),
    fs.writeFile(path.join(IMAGES_DIR, thumbnailFilename), thumbnail),
  ]);

  // Get final dimensions
  const finalMetadata = await sharp(mainImage).metadata();

  return {
    id,
    filename,
    thumbnailFilename,
    mimeType: 'image/webp',
    sizeBytes: mainImage.length,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
  };
}

export async function deleteImage(filename: string): Promise<void> {
  const filepath = path.join(IMAGES_DIR, filename);
  const thumbPath = filepath.replace(/(\.[^.]+)$/, '_thumb$1');

  await Promise.all([
    fs.unlink(filepath).catch(() => {}),
    fs.unlink(thumbPath).catch(() => {}),
  ]);
}

export function getImagePath(filename: string): string {
  return path.join(IMAGES_DIR, filename);
}

export function getThumbnailPath(filename: string): string {
  return path.join(IMAGES_DIR, filename.replace(/(\.[^.]+)$/, '_thumb$1'));
}

export async function imageExists(filename: string): Promise<boolean> {
  try {
    await fs.access(path.join(IMAGES_DIR, filename));
    return true;
  } catch {
    return false;
  }
}
