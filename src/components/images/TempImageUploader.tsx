'use client';

import { useState, useRef, useCallback } from 'react';
import type { TempImage } from '@/lib/types/ai';

interface TempImageUploaderProps {
  images: TempImage[];
  onImagesChange: (images: TempImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function TempImageUploader({
  images,
  onImagesChange,
  maxImages = 3,
  disabled = false,
}: TempImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => crypto.randomUUID();

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const newImages: TempImage[] = [];
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      // Size check
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        continue;
      }

      // Trust the browser's accept="image/*" filtering
      // Create blob URL for preview
      const previewUrl = URL.createObjectURL(file);
      const isFirst = images.length === 0 && newImages.length === 0;

      newImages.push({
        id: generateId(),
        file,
        previewUrl,
        isPrimary: isFirst,
      });
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images, maxImages, onImagesChange]);

  const handleDelete = useCallback((imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (imageToDelete) {
      URL.revokeObjectURL(imageToDelete.previewUrl);
    }

    const updatedImages = images.filter(img => img.id !== imageId);

    // If we deleted the primary image, make the first remaining image primary
    if (imageToDelete?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleSetPrimary = useCallback((imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <img
                src={image.previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {image.isPrimary && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded shadow">
                  Primary
                </div>
              )}

              {/* Action buttons - always visible in corner */}
              <div className="absolute top-1 right-1 flex gap-1">
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(image.id)}
                    disabled={disabled}
                    className="p-1.5 bg-white/90 hover:bg-white rounded-full text-gray-700 shadow-sm disabled:opacity-50 touch-manipulation"
                    title="Set as primary"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  disabled={disabled}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-full text-red-600 shadow-sm disabled:opacity-50 touch-manipulation"
                  title="Delete image"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canAddMore && (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`block border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 cursor-not-allowed'
              : dragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 cursor-pointer'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 active:border-primary-400 cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={disabled}
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
          />

          <svg
            className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          {disabled ? (
            <p className="mt-2 text-xs sm:text-sm text-gray-500 pointer-events-none">Upload disabled</p>
          ) : (
            <>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 pointer-events-none">
                <span className="sm:hidden">Tap to add images</span>
                <span className="hidden sm:inline">
                  Drag and drop or <span className="text-primary-600 dark:text-primary-400">browse</span>
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500 pointer-events-none">
                {images.length}/{maxImages} · PNG, JPG, WebP · Max 10MB
              </p>
            </>
          )}
        </label>
      )}
    </div>
  );
}

// Helper function to convert TempImage to base64 for AI processing
export async function tempImageToBase64(image: TempImage): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(image.file);
  });
}
