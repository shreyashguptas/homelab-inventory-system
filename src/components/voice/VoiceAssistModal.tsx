'use client';

import { useState, useCallback } from 'react';
import { Modal, Button, Spinner } from '@/components/ui';
import { TempImageUploader, tempImageToBase64 } from '@/components/images/TempImageUploader';
import { VoiceRecorder } from './VoiceRecorder';
import type { TempImage, ExtractedFormData } from '@/lib/types/ai';
import type { Category, Vendor } from '@/lib/types/database';

type Step = 'images' | 'voice' | 'processing' | 'complete' | 'error';

type ProcessingStepStatus = 'pending' | 'running' | 'completed' | 'failed';

interface ProcessingStep {
  id: string;
  label: string;
  status: ProcessingStepStatus;
  output?: string;
  error?: string;
}

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
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedFormData | null>(null);

  const updateProcessingStep = (id: string, updates: Partial<ProcessingStep>) => {
    setProcessingSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleClose = useCallback(() => {
    // Cleanup blob URLs
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setStep('images');
    setError(null);
    setProcessingSteps([]);
    setExtractedData(null);
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
    setExtractedData(null);

    // Initialize processing steps
    const steps: ProcessingStep[] = [
      { id: 'transcribe', label: 'Transcribing audio', status: 'pending' },
      { id: 'images', label: 'Processing images', status: 'pending' },
      { id: 'extract', label: 'Extracting item details', status: 'pending' },
    ];
    setProcessingSteps(steps);

    let transcribedText = '';
    const imageBase64: string[] = [];

    try {
      // Step 1: Transcribe audio
      updateProcessingStep('transcribe', { status: 'running' });

      const transcribeForm = new FormData();
      transcribeForm.append('audio', audioBlob, 'recording.webm');

      const transcribeRes = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: transcribeForm,
      });

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json().catch(() => ({}));
        const errorMsg = errData.error || `HTTP ${transcribeRes.status}: ${transcribeRes.statusText}`;
        updateProcessingStep('transcribe', { status: 'failed', error: errorMsg });
        throw new Error(`Transcription failed: ${errorMsg}`);
      }

      const transcribeResult = await transcribeRes.json();
      transcribedText = transcribeResult.text;

      if (!transcribedText || transcribedText.trim().length === 0) {
        updateProcessingStep('transcribe', { status: 'failed', error: 'No speech detected' });
        throw new Error('No speech detected. Please try again and speak clearly.');
      }

      updateProcessingStep('transcribe', {
        status: 'completed',
        output: transcribedText
      });

      // Step 2: Convert images to base64
      updateProcessingStep('images', { status: 'running' });

      if (images.length > 0) {
        for (const img of images) {
          const base64 = await tempImageToBase64(img);
          imageBase64.push(base64);
        }
        updateProcessingStep('images', {
          status: 'completed',
          output: `${images.length} image${images.length !== 1 ? 's' : ''} processed`
        });
      } else {
        updateProcessingStep('images', {
          status: 'completed',
          output: 'No images to process'
        });
      }

      // Step 3: Extract form data
      updateProcessingStep('extract', { status: 'running' });

      const extractRes = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcribedText,
          images: imageBase64,
          categories: categories.map(c => ({ id: c.id, name: c.name })),
          vendors: vendors.map(v => ({ id: v.id, name: v.name })),
        }),
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json().catch(() => ({}));
        const errorMsg = errData.error || `HTTP ${extractRes.status}: ${extractRes.statusText}`;
        const details = errData.details ? `\nDetails: ${JSON.stringify(errData.details)}` : '';
        updateProcessingStep('extract', { status: 'failed', error: errorMsg + details });
        throw new Error(`Extraction failed: ${errorMsg}`);
      }

      const formData: ExtractedFormData = await extractRes.json();

      // Count extracted fields
      const extractedFields = Object.entries(formData).filter(([, v]) => v !== undefined && v !== null && v !== '').length;

      updateProcessingStep('extract', {
        status: 'completed',
        output: `${extractedFields} field${extractedFields !== 1 ? 's' : ''} extracted`
      });

      setExtractedData(formData);
      setStep('complete');

    } catch (err) {
      console.error('Voice assist error:', err);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof Error) {
        // Handle common fetch errors with user-friendly messages
        if (err.message === 'Failed to fetch') {
          errorMessage = 'Could not connect to the server. Please check your network connection and try again.';
        } else if (err.message.includes('NetworkError')) {
          errorMessage = 'Network error occurred. Please check your internet connection.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setStep('error');
    }
  }, [images, categories, vendors]);

  const handleApplyData = useCallback(() => {
    if (extractedData) {
      onComplete(extractedData, images);

      // Reset state but don't cleanup images (they're passed to parent)
      setStep('images');
      setImages([]);
      setError(null);
      setProcessingSteps([]);
      setExtractedData(null);
    }
  }, [extractedData, images, onComplete]);

  const handleRetry = useCallback(() => {
    setError(null);
    setProcessingSteps([]);
    setStep('voice');
  }, []);

  const handleStartOver = useCallback(() => {
    // Cleanup blob URLs
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setStep('images');
    setError(null);
    setProcessingSteps([]);
    setExtractedData(null);
  }, [images]);

  const renderStepIndicator = () => {
    const steps = [
      { key: 'images', label: '1. Images', shortLabel: '1', active: step === 'images' },
      { key: 'voice', label: '2. Voice', shortLabel: '2', active: step === 'voice' },
      { key: 'processing', label: '3. Process', shortLabel: '3', active: step === 'processing' || step === 'complete' || step === 'error' },
    ];

    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-6">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                s.active
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.shortLabel}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-4 sm:w-8 h-0.5 bg-gray-300 dark:bg-gray-600 mx-0.5 sm:mx-1" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProcessingStepIcon = (status: ProcessingStepStatus) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
        );
      case 'running':
        return <Spinner size="sm" />;
      case 'completed':
        return (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const renderProcessingSteps = () => (
    <div className="space-y-3 sm:space-y-4">
      {processingSteps.map((ps) => (
        <div key={ps.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {renderProcessingStepIcon(ps.status)}
            <span className={`font-medium text-sm sm:text-base ${
              ps.status === 'failed' ? 'text-red-600 dark:text-red-400' :
              ps.status === 'completed' ? 'text-green-600 dark:text-green-400' :
              ps.status === 'running' ? 'text-primary-600 dark:text-primary-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {ps.label}
            </span>
          </div>

          {/* Show output */}
          {ps.output && ps.status === 'completed' && (
            <div className="mt-2 ml-7 sm:ml-8">
              {ps.id === 'transcribe' ? (
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs sm:text-sm max-h-24 overflow-y-auto">
                  <span className="text-gray-500 dark:text-gray-400 text-xs block mb-1">Transcribed text:</span>
                  <p className="text-gray-700 dark:text-gray-300 italic">&quot;{ps.output}&quot;</p>
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{ps.output}</span>
              )}
            </div>
          )}

          {/* Show error */}
          {ps.error && ps.status === 'failed' && (
            <div className="mt-2 ml-7 sm:ml-8 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <span className="text-xs sm:text-sm text-red-600 dark:text-red-400 break-words">{ps.error}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'images':
        return (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
              Upload up to 3 images of the item (optional). The first image will be the primary image.
            </p>
            <TempImageUploader
              images={images}
              onImagesChange={setImages}
              maxImages={3}
            />
            <div className="flex flex-col sm:flex-row justify-between gap-2 pt-3 sm:pt-4">
              <Button type="button" variant="ghost" onClick={handleSkipImages} className="order-2 sm:order-1">
                Skip Images
              </Button>
              <Button type="button" onClick={handleContinueToVoice} className="order-1 sm:order-2">
                Continue
              </Button>
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
              Describe the item you want to add. Include details like name, quantity, location, and price.
            </p>

            {images.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {images.length} image{images.length !== 1 ? 's' : ''} attached
              </div>
            )}

            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

            <div className="flex justify-start pt-3 sm:pt-4">
              <Button type="button" variant="ghost" onClick={handleBackToImages}>
                Back
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mb-2 sm:mb-4">
              Processing your recording...
            </p>
            {renderProcessingSteps()}
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-sm sm:text-base text-green-800 dark:text-green-300">Processing Complete!</span>
              </div>
            </div>

            {renderProcessingSteps()}

            {extractedData && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-32 overflow-y-auto">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Extracted data preview:</span>
                <div className="text-xs sm:text-sm space-y-1">
                  {extractedData.name && (
                    <p><span className="text-gray-500">Name:</span> <span className="font-medium">{extractedData.name}</span></p>
                  )}
                  {extractedData.description && (
                    <p className="line-clamp-2"><span className="text-gray-500">Description:</span> {extractedData.description}</p>
                  )}
                  {extractedData.quantity && (
                    <p><span className="text-gray-500">Qty:</span> {extractedData.quantity}</p>
                  )}
                  {extractedData.location && (
                    <p><span className="text-gray-500">Location:</span> {extractedData.location}</p>
                  )}
                  {extractedData.category_name_suggestion && (
                    <p><span className="text-gray-500">Category:</span> {extractedData.category_name_suggestion}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={handleStartOver} className="order-2 sm:order-1">
                Start Over
              </Button>
              <Button type="button" onClick={handleApplyData} className="order-1 sm:order-2">
                Apply to Form
              </Button>
            </div>
          </div>
        );

      case 'error': {
        // Determine troubleshooting tips based on error message
        const getTroubleshootingTip = () => {
          if (!error) return null;
          const lowerError = error.toLowerCase();

          if (lowerError.includes('api key') || lowerError.includes('401') || lowerError.includes('unauthorized')) {
            return 'Check that GROQ_API_KEY is correctly set in your environment variables.';
          }
          if (lowerError.includes('rate limit') || lowerError.includes('429')) {
            return 'You\'ve made too many requests. Wait a minute before trying again.';
          }
          if (lowerError.includes('network') || lowerError.includes('connect') || lowerError.includes('fetch')) {
            return 'Check your internet connection and ensure the server is running.';
          }
          if (lowerError.includes('unavailable') || lowerError.includes('503')) {
            return 'The AI service is temporarily down. Please try again in a few minutes.';
          }
          if (lowerError.includes('no speech')) {
            return 'Make sure to speak clearly into the microphone and check your microphone settings.';
          }
          return null;
        };

        const troubleshootingTip = getTroubleshootingTip();

        return (
          <div className="space-y-3 sm:space-y-4">
            {renderProcessingSteps()}

            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <h4 className="font-medium text-sm sm:text-base text-red-800 dark:text-red-300 mb-1">Processing Failed</h4>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 break-words">{error}</p>
              {troubleshootingTip && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    <span className="font-medium">Tip:</span> {troubleshootingTip}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              <Button type="button" variant="ghost" onClick={handleStartOver} className="order-2 sm:order-1">
                Start Over
              </Button>
              <Button type="button" onClick={handleRetry} className="order-1 sm:order-2">
                Try Again
              </Button>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Item with Voice"
      size="md"
    >
      {renderStepIndicator()}
      {renderContent()}
    </Modal>
  );
}
