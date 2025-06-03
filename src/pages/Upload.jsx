// cloud-cost-dashboard-frontend/src/pages/Upload.jsx
import React from 'react';
import UploadCsv from '../components/UploadCsv';

const Upload = ({ onCsvParsed }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Upload AWS Billing CSV</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Upload your AWS Cost & Usage Report (CUR) CSV file here to get started with analysis.
        You can typically download this from the AWS Billing Dashboard under "Cost & Usage Reports".
        Ensure you download the full report with all line items for detailed insights.
      </p>
      <UploadCsv onCsvParsed={onCsvParsed} />
    </div>
  );
};

export default Upload;
