import React, { useState } from 'react';
import apiClient from '../services/api.js';
import Button from './Button.jsx';

function CsvImportForm({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/products/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
      onImportSuccess(); // Notify parent component to refresh data
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during upload.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border-t mt-6">
      <h3 className="text-lg font-medium mb-2">Import from CSV</h3>
      <div className="flex items-center space-x-4">
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <Button onClick={handleUpload} disabled={isUploading || !file}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-green-700">
            Import complete! Processed: {result.processed_rows}, 
            Created: {result.successful_creates}, 
            Updated: {result.successful_updates}, 
            Errors: {result.errors.length}
          </p>
          {result.errors.length > 0 && (
            <ul className="list-disc list-inside mt-2 text-sm text-red-700">
              {result.errors.slice(0, 5).map(err => (
                 <li key={err.row_number}>Row {err.row_number} (SKU: {err.sku || 'N/A'}): {err.details}</li>
              ))}
              {result.errors.length > 5 && <li>...and {result.errors.length - 5} more errors.</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default CsvImportForm;