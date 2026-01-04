'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

interface QRCodeDisplayProps {
  itemId: string;
  itemName: string;
}

export function QRCodeDisplay({ itemId, itemName }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await fetch(`/api/items/${itemId}/qr?format=dataurl`);
        const data = await res.json();
        setQrDataUrl(data.dataUrl);
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
  }, [itemId]);

  const handleDownload = async (format: 'png' | 'svg', label: boolean = false) => {
    try {
      const url = `/api/items/${itemId}/qr?format=${format}${label ? '&label=true' : ''}`;
      const res = await fetch(url);
      const blob = await res.blob();

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${itemName.replace(/[^a-z0-9]/gi, '_')}${label ? '_label' : ''}.${format}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* QR Code display */}
      <div className="flex justify-center p-4 bg-white rounded-lg">
        {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />}
      </div>

      {/* Download buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => handleDownload('png')}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          PNG
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleDownload('svg')}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          SVG
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleDownload('svg', true)}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Label
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Scan to view item details
      </p>
    </div>
  );
}
