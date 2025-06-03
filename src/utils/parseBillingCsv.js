// cloud-cost-dashboard-frontend/src/utils/parseBillingCsv.js
import Papa from 'papaparse';

/**
 * Parses an AWS billing CSV file using PapaParse.
 * It uses a Web Worker to prevent blocking the UI for large files.
 * @param {File} file - The CSV file to parse.
 * @returns {Promise<Array<Object>>} A promise that resolves with the parsed CSV data.
 */
export const parseBillingCsv = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,         // Treat first row as headers
      skipEmptyLines: true, // Skip empty lines in the CSV
      dynamicTyping: true,  // Attempt to convert numbers and booleans
      worker: true,         // VERY IMPORTANT: Use a Web Worker to parse large files in the background
      error: (err) => {
        console.error("PapaParse error:", err);
        reject(new Error(`CSV parsing error: ${err.message}`));
      },
      complete: (results) => {
        // Sanitize headers: remove spaces, slashes, and convert to camelCase for easier access
        const sanitizedData = results.data.map(row => {
          const newRow = {};
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              // Convert keys like 'lineItem/UnblendedCost' to 'lineItemUnblendedCost'
              // or 'product/productFamily' to 'productProductFamily'
              const sanitizedKey = key.replace(/[^a-zA-Z0-9]/g, ''); // Remove non-alphanumeric
              newRow[sanitizedKey] = row[key];
            }
          }
          return newRow;
        });
        resolve(sanitizedData);
      },
    });
  });
};
