// cloud-cost-dashboard-frontend/src/components/CostSummary.jsx
import React from 'react';

const CostSummary = ({ parsedCsvData }) => {
  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md text-blue-800 dark:text-blue-200">
        No CSV data available for summary. Please upload a file.
      </div>
    );
  }

  // Calculate total cost
  const totalCost = parsedCsvData.reduce((sum, row) => {
    // Access 'lineItemUnblendedCost' because we sanitized headers in parseBillingCsv.js
    const cost = parseFloat(row.lineItemUnblendedCost) || 0;
    return sum + cost;
  }, 0);

  // Calculate cost by service (top 5)
  const serviceCosts = parsedCsvData.reduce((acc, row) => {
    const service = row.productProductFamily || row.productServiceCode || 'Unknown Service';
    const cost = parseFloat(row.lineItemUnblendedCost) || 0;
    acc[service] = (acc[service] || 0) + cost;
    return acc;
  }, {});

  const sortedServiceCosts = Object.entries(serviceCosts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 services

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Cost Summary</h3>
      <div className="mb-4">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Total Overall Cost: <span className="font-bold text-green-600 dark:text-green-400">${totalCost.toFixed(2)}</span>
        </p>
      </div>

      <h4 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Top 5 Services by Cost:</h4>
      {sortedServiceCosts.length > 0 ? (
        <ul className="list-disc list-inside space-y-1">
          {sortedServiceCosts.map(([service, cost]) => (
            <li key={service} className="text-gray-600 dark:text-gray-400">
              {service}: <span className="font-semibold">${cost.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">No service costs to display.</p>
      )}
    </div>
  );
};

export default CostSummary;
