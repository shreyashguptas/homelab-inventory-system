'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; name: string; message: string }[];
  newCategories: string[];
  newVendors: string[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (f && !f.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import Items</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Import items from a CSV file into your inventory
        </p>
      </div>

      <div className="space-y-6">
        {/* Upload zone */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              {file ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop your CSV file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    CSV files only
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <Button onClick={handleImport} loading={loading} disabled={!file}>
                Import Items
              </Button>
              {file && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.imported}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Items imported</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {result.skipped}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Rows skipped</div>
                </div>
              </div>

              {result.newCategories.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New categories created:
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.newCategories.join(', ')}
                  </p>
                </div>
              )}

              {result.newVendors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New vendors created:
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.newVendors.join(', ')}
                  </p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                    Errors ({result.errors.length}):
                  </p>
                  <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>
                        Row {err.row} ({err.name}): {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href="/items"
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                View imported items
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Help section */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your CSV should have a header row with the following columns:
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                      Column
                    </th>
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-400">
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2 pr-4 font-mono text-xs">name*</td>
                    <td className="py-2">Item name (required)</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2 pr-4 font-mono text-xs">tracking_mode</td>
                    <td className="py-2">"quantity" or "individual"</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2 pr-4 font-mono text-xs">quantity</td>
                    <td className="py-2">Number of items</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2 pr-4 font-mono text-xs">location</td>
                    <td className="py-2">Storage location</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2 pr-4 font-mono text-xs">category</td>
                    <td className="py-2">Category name (created if not exists)</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2 pr-4 font-mono text-xs">vendor</td>
                    <td className="py-2">Vendor name (created if not exists)</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2 pr-4 font-mono text-xs">tags</td>
                    <td className="py-2">Semicolon-separated tags</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-3">
              <a
                href="/api/export"
                download
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export current inventory as CSV template
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
