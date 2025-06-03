// cloud-cost-dashboard-frontend/src/pages/AnomalyDetection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const AnomalyDetection = ({ parsedCsvData }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [thresholdPercent, setThresholdPercent] = useState(30); // Default threshold: 30% increase
  const [lookbackDays, setLookbackDays] = useState(7); // Default lookback: 7 days for rolling average
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (parsedCsvData && parsedCsvData.length > 0) {
      detectAnomalies(parsedCsvData, thresholdPercent, lookbackDays);
    } else {
      setAnomalies([]);
      setError("Please upload a CSV file to detect anomalies.");
    }
  }, [parsedCsvData, thresholdPercent, lookbackDays]); // Recalculate if data or settings change

  const detectAnomalies = (data, threshold, lookback) => {
    setIsLoading(true);
    setError(null);
    const dailyCosts = {}; // { 'YYYY-MM-DD': { totalCost: X, services: { 'ServiceA': Y, ... } } }

    data.forEach(row => {
      const dateStr = row.lineItemUsageStartDate instanceof Date
        ? row.lineItemUsageStartDate.toISOString().split('T')[0]
        : row.lineItemUsageStartDate; // Ensure date is string YYYY-MM-DD
      const cost = parseFloat(row.lineItemUnblendedCost) || 0;
      const service = row.productProductFamily || row.productServiceCode || 'Unknown Service';
      const resourceId = row.lineItemResourceId || 'N/A';

      if (dateStr && cost > 0) {
        if (!dailyCosts[dateStr]) {
          dailyCosts[dateStr] = { totalCost: 0, services: {}, resources: {} };
        }
        dailyCosts[dateStr].totalCost += cost;
        dailyCosts[dateStr].services[service] = (dailyCosts[dateStr].services[service] || 0) + cost;
        dailyCosts[dateStr].resources[resourceId] = (dailyCosts[dateStr].resources[resourceId] || 0) + cost;
      }
    });

    const sortedDailyCosts = Object.entries(dailyCosts)
      .map(([date, data]) => ({ date, totalCost: data.totalCost, services: data.services, resources: data.resources }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const detected = [];

    for (let i = lookback; i < sortedDailyCosts.length; i++) {
      const currentDay = sortedDailyCosts[i];
      const previousDays = sortedDailyCosts.slice(Math.max(0, i - lookback), i);

      if (previousDays.length === 0) continue; // Not enough history

      const sumPreviousCosts = previousDays.reduce((sum, day) => sum + day.totalCost, 0);
      const averagePreviousCosts = sumPreviousCosts / previousDays.length;

      // Only consider if previous average is meaningful (not zero or very small)
      if (averagePreviousCosts > 0.1) { // Small threshold to avoid division by zero or tiny averages
        const percentageIncrease = ((currentDay.totalCost - averagePreviousCosts) / averagePreviousCosts) * 100;

        if (percentageIncrease > threshold) {
          // Identify top contributors for the anomaly day
          const topContributors = Object.entries(currentDay.services)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3) // Top 3 services contributing to the spike
            .map(([service, cost]) => `${service}: $${cost.toFixed(2)}`);

          detected.push({
            date: currentDay.date,
            cost: currentDay.totalCost.toFixed(2),
            average: averagePreviousCosts.toFixed(2),
            increase: percentageIncrease.toFixed(2),
            topContributors: topContributors,
          });
        }
      }
    }
    setAnomalies(detected);
    setIsLoading(false);
  };

  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Cost Anomaly Detection</h2>
        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No CSV Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline">Upload CSV page</Link> to detect cost anomalies.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Cost Anomaly Detection</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Identify unusual spikes in your daily AWS spending. Adjust the threshold and lookback period to fine-tune detection.
      </p>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <label htmlFor="threshold" className="text-gray-700 dark:text-gray-300">
          Increase Threshold (%):
          <input
            type="number"
            id="threshold"
            value={thresholdPercent}
            onChange={(e) => setThresholdPercent(parseFloat(e.target.value) || 0)}
            min="0"
            max="500"
            className="ml-2 p-2 w-20 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </label>
        <label htmlFor="lookback" className="text-gray-700 dark:text-gray-300">
          Lookback Days (for average):
          <input
            type="number"
            id="lookback"
            value={lookbackDays}
            onChange={(e) => setLookbackDays(parseInt(e.target.value) || 1)}
            min="1"
            max="30"
            className="ml-2 p-2 w-20 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </label>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-6 text-blue-500 dark:text-blue-400">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4">Detecting anomalies...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {!isLoading && !error && (
        anomalies.length > 0 ? (
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 text-red-800 dark:text-red-200 p-4 rounded-md shadow-sm">
                <p className="font-bold text-lg mb-1">Anomaly Detected on {anomaly.date}</p>
                <p>
                  Cost: <span className="font-semibold">${anomaly.cost}</span> (vs. Average: ${anomaly.average} over {lookbackDays} days)
                </p>
                <p>
                  Increase: <span className="font-semibold">{anomaly.increase}%</span>
                </p>
                {anomaly.topContributors.length > 0 && (
                  <p className="mt-2 text-sm">
                    Top Contributors: {anomaly.topContributors.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">No Anomalies Detected!</strong>
            <span className="block sm:inline ml-2">Based on your current settings, no significant cost anomalies were found.</span>
          </div>
        )
      )}
    </div>
  );
};

export default AnomalyDetection;
