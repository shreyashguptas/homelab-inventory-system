'use client';

import { useState, useCallback } from 'react';
import { Modal, Button, Spinner } from '@/components/ui';
import { TempImageUploader, tempImageToBase64 } from '@/components/images/TempImageUploader';
import { VoiceRecorder } from './VoiceRecorder';
import type { TempImage, ExtractedFormData } from '@/lib/types/ai';
import type { Category, Vendor } from '@/lib/types/database';

type Step = 'images' | 'voice' | 'processing' | 'error';

interface VoiceAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ExtractedFormData, images: TempImage[]) => void;
  categories: Category[];
  vendors: Vendor[];
}

export function VoiceAssistModal({
  isOpen,
  onClose,
  onComplete,
  categories,
  vendors,
}: VoiceAssistModalProps) {
  const [step, setStep] = useState<Step>('images');
  const [images, setImages] = useState<TempImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const handleClose = useCallback(() => {
    // Cleanup blob URLs
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setStep('images');
    setError(null);
    setProcessingStatus('');
    onClose();
  }, [images, onClose]);

  const handleSkipImages = useCallback(() => {
    setStep('voice');
  }, []);

  const handleContinueToVoice = useCallback(() => {
    setStep('voice');
  }, []);

  const handleBackToImages = useCallback(() => {
    setStep('images');
  }, []);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setStep('processing');
    setError(null);

    try {
      // Step 1: Transcribe audio
      setProcessingStatus('Transcribing audio...');
      const transcribeForm = new FormData();
      transcribeForm.append('audio', audioBlob, 'recording.webm');

      const transcribeRes = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: transcribeForm,
      });

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json();
        throw new Error(errData.error || 'Transcription failed');
      }

      const { text } = await transcribeRes.json();

      if (!text || text.trim().length === 0) {
        throw new Error('No speech detected. Please try again and speak clearly.');
      }

      // Step 2: Convert images to base64
      setProcessingStatus('Processing images...');
      const imageBase64: string[] = [];
      for (const img of images) {
        const base64 = await tempImageToBase64(img);
        imageBase64.push(base64);
      }

      // Step 3: Extract form data
      setProcessingStatus('Extracting item details...');
      const extractRes = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          images: imageBase64,
          categories: categories.map(c => ({ id: c.id, name: c.name })),
          vendors: vendors.map(v => ({ id: v.id, name: v.name })),
        }),
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json();
        throw new Error(errData.error || 'Extraction failed');
      }

      const formData: ExtractedFormData = await extractRes.json();

      // Success! Pass data back to parent
      onComplete(formData, images);

      // Reset state but don't cleanup images (they're passed to parent)
      setStep('images');
      setImages([]);
      setError(null);
      setProcessingStatus('');

    } catch (err) {
      console.error('Voice assist error:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStep('error');
    }
  }, [images, categories, vendors, onComplete]);

  const handleRetry = useCallback(() => {
    setError(null);
    setStep('voice');
  }, []);

  const handleStartOver = useCallback(() => {
    // Cleanup blob URLs
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setStep('images');
    setError(null);
    setProcessingStatus('');
  }, [images]);

  const renderStepIndicator = () => {
    const steps = [
      { key: 'images', label: '1. Images', active: step === 'images' },
      { key: 'voice', label: '2. Voice', active: step === 'voice' },
      { key: 'processing', label: '3. Process', active: step === 'processing' || step === 'error' },
    ];

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`px-3 py-1 rounded-full text-sm ${
                s.active
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 mx-1" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 'images':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Upload up to 3 images of the item (optional). The first image will be the primary image.
            </p>
            <TempImageUploader
              images={images}
              onImagesChange={setImages}
              maxImages={3}
            />
            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={handleSkipImages}>
                Skip Images
              </Button>
              <Button type="button" onClick={handleContinueToVoice}>
                {images.length > 0 ? 'Continue' : 'Continue without images'}
              </Button>
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Describe the item you want to add. Include details like name, quantity, location, price, and specifications.
            </p>

            {images.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {images.length} image{images.length !== 1 ? 's' : ''} attached
              </div>
            )}

            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

            <div className="flex justify-start pt-4">
              <Button type="button" variant="ghost" onClick={handleBackToImages}>
                Back to Images
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Spinner size="lg" />
            <p className="text-gray-600 dark:text-gray-400">{processingStatus}</p>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <h4 className="font-medium text-red-800 dark:text-red-300 mb-1">Processing Failed</h4>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
            <div className="flex justify-center gap-3">
              <Button type="button" variant="ghost" onClick={handleStartOver}>
                Start Over
              </Button>
              <Button type="button" onClick={handleRetry}>
                Try Recording Again
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Item with Voice"
      size="lg"
    >
      {renderStepIndicator()}
      {renderContent()}
    </Modal>
  );
}
