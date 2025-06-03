// cloud-cost-dashboard-frontend/src/components/UploadCsv.jsx
import React, { useState, useRef } from 'react';
import { parseBillingCsv } from '../utils/parseBillingCsv'; // Import the utility function

const UploadCsv = ({ onCsvParsed }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a valid CSV file.');
        return;
      }

      setFileName(file.name);
      setLoading(true);
      setError(null);

      try {
        const parsedData = await parseBillingCsv(file);
        console.log("Parsed CSV Data:", parsedData); // For debugging
        onCsvParsed(parsedData); // Pass data up to App.jsx
        alert(`Successfully parsed ${parsedData.length} rows from ${file.name}!`);
      } catch (err) {
        console.error("Error parsing CSV:", err);
        setError(`Failed to parse CSV: ${err.message}. Please ensure it's a valid AWS Cost & Usage Report.`);
        onCsvParsed(null); // Clear data on error
      } finally {
        setLoading(false);
        // Clear file input to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault(); // Prevent default to allow drop
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange({ target: { files: [files[0]] } });
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center
                    hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
         onDragOver={handleDragOver}
         onDrop={handleDrop}>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileChange}
        className="hidden" // Hide the default input
        id="csv-upload-input"
      />
      <label
        htmlFor="csv-upload-input"
        className="cursor-pointer block text-gray-600 dark:text-gray-300 text-lg mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Drag and drop your CSV file here, or <span className="text-blue-600 dark:text-blue-400 font-semibold">click to browse</span>
      </label>

      {fileName && <p className="mt-2 text-gray-700 dark:text-gray-300">Selected file: {fileName}</p>}

      {loading && (
        <div className="flex items-center justify-center mt-4 text-blue-600 dark:text-blue-400">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Parsing CSV... This may take a while for large files.
        </div>
      )}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default UploadCsv;
