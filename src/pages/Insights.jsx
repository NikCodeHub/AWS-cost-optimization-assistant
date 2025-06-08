// cloud-cost-dashboard-frontend/src/pages/Insights.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Insights = ({ parsedCsvData }) => {
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Clear previous insights and errors when data changes or component mounts
    setAiInsights(null);
    setError(null);

    if (parsedCsvData && parsedCsvData.length > 0) {
      // Only trigger analysis if data exists
      fetchAiInsights(parsedCsvData);
    } else {
      // If no data, show a message
      setError("Please upload a CSV file on the 'Upload CSV' page to get insights.");
    }
  }, [parsedCsvData]); // Re-run when parsedCsvData changes

  const fetchAiInsights = async (data) => {
    setIsLoading(true);
    setError(null);
    setAiInsights(null); // Clear previous insights

    try {
      // --- IMPORTANT: Summarize data BEFORE sending to AI ---
      // AWS CUR files can be very large. Sending raw, multi-MB CSVs directly
      // to AI via prompt is not efficient and can hit token limits.
      // The summarizeCsvData function below helps with this.
      // For extremely large files (e.g., > 100,000 rows), consider
      // processing the full data on the backend to avoid browser freezes.

      const summaryData = summarizeCsvData(data);
      console.log("Summarized data for AI:", summaryData);

      // Make sure your backend server is running on http://localhost:3001
      const response = await fetch('https://backend-project-190.onrender.com/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvSummary: summaryData }), // Send summarized data
      });

      if (!response.ok) {
        // Attempt to read error message from backend if available
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || 'Server error'}`);
      }

      const result = await response.json();
      // Assuming the backend returns an object with 'insights' (text), 'topExpensiveResources', 'idleResources'
      setAiInsights(result); // Set the entire result object as insights
    } catch (err) {
      console.error("Error fetching AI insights:", err);
      setError(`Failed to get AI insights: ${err.message}. Please ensure your backend server is running and accessible.`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper function to summarize CSV data for AI.
   * This is crucial for large files to avoid hitting AI token limits and browser freezes.
   * It extracts key metrics and top resources.
   * @param {Array<Object>} data - The raw parsed CSV data.
   * @returns {Object} A summarized object suitable for AI prompting.
   */
  const summarizeCsvData = (data) => {
    const MAX_ROWS_FOR_BROWSER_SUMMARY = 50000; // Limit rows processed directly in browser for AI summary
    const processedData = data.slice(0, MAX_ROWS_FOR_BROWSER_SUMMARY); // Process only a sample if too large

    const serviceCosts = {};
    const resourceUsage = {}; // To detect potential idle resources
    let totalOverallCost = 0;

    // Iterate over the (potentially sliced) data
    processedData.forEach(row => {
      // Safely get cost, defaulting to 0 if not a valid number
      // Use sanitized headers from parseBillingCsv.js: lineItemUnblendedCost, productProductFamily, etc.
      const cost = parseFloat(row.lineItemUnblendedCost) || 0;
      // Safely get service name
      const service = row.productProductFamily || row.productServiceCode || 'Unknown Service';
      // Safely get resource ID
      const resourceId = row.lineItemResourceId || null;
      // Safely get usage type
      const usageType = row.lineItemUsageType || 'Unknown UsageType';
      // Safely get usage start date
      const usageStartDate = row.lineItemUsageStartDate;

      if (cost > 0) { // Only consider positive costs
        totalOverallCost += cost;

        // Sum costs by service
        serviceCosts[service] = (serviceCosts[service] || 0) + cost;

        // Track resource usage for potential idle/expensive detection
        if (resourceId) {
          if (!resourceUsage[resourceId]) {
            resourceUsage[resourceId] = {
              totalCost: 0,
              service: service,
              usageTypes: new Set(),
              firstSeen: usageStartDate ? new Date(usageStartDate) : null,
              lastSeen: usageStartDate ? new Date(usageStartDate) : null,
              occurrences: 0
            };
          }
          resourceUsage[resourceId].totalCost += cost;
          resourceUsage[resourceId].usageTypes.add(usageType);
          resourceUsage[resourceId].occurrences++;

          // Update firstSeen and lastSeen dates
          if (usageStartDate) {
            const currentDate = new Date(usageStartDate);
            if (resourceUsage[resourceId].firstSeen === null || currentDate < resourceUsage[resourceId].firstSeen) {
                resourceUsage[resourceId].firstSeen = currentDate;
            }
            if (resourceUsage[resourceId].lastSeen === null || currentDate > resourceUsage[resourceId].lastSeen) {
                resourceUsage[resourceId].lastSeen = currentDate;
            }
          }
        }
      }
    });

    // Convert service costs to an array and sort
    const sortedServiceCosts = Object.entries(serviceCosts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 services

    // Process resources for top expensive and potential idle
    const resourcesArray = Object.entries(resourceUsage).map(([id, details]) => {
      const durationDays = (details.firstSeen && details.lastSeen)
        ? Math.ceil(Math.abs(details.lastSeen - details.firstSeen) / (1000 * 60 * 60 * 24)) + 1
        : 0; // +1 to include both start and end day, or 0 if dates are missing

      return {
        resourceId: id,
        service: details.service,
        totalCost: details.totalCost,
        usageTypes: Array.from(details.usageTypes).join(', '),
        occurrences: details.occurrences,
        durationDays: durationDays
      };
    }).filter(r => r.totalCost > 0); // Only include resources with positive cost

    // Sort by cost for top expensive
    resourcesArray.sort((a, b) => b.totalCost - a.totalCost);
    const topExpensiveResources = resourcesArray.slice(0, 5);

    // Identify potentially idle resources (simplified logic for AI)
    // Criteria: Very low cost, few occurrences, and seen over a period (e.g., > 10 days)
    const idleResources = resourcesArray.filter(r =>
      r.totalCost < 5 && r.occurrences < 5 && r.durationDays > 10
    ).slice(0, 3); // Top 3 potential idle resources

    return {
      totalOverallCost: totalOverallCost.toFixed(2),
      serviceCosts: sortedServiceCosts,
      topExpensiveResources: topExpensiveResources,
      idleResources: idleResources,
      // Add a flag if data was truncated
      dataTruncated: data.length > MAX_ROWS_FOR_BROWSER_SUMMARY
    };
  };


  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">AI-Enhanced Cost Insights</h2>

      {!parsedCsvData || parsedCsvData.length === 0 ? (
        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No CSV Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline">Upload CSV page</Link> to generate insights.</span>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-6 text-blue-500 dark:text-blue-400">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4">Generating AI insights from your billing data...</p>
              {parsedCsvData.length > 50000 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Processing a large file. Summarizing a sample of {50000} rows for AI analysis to prevent browser unresponsiveness.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}

          {aiInsights && !isLoading && (
            <div className="mt-6">
              {aiInsights.dataTruncated && (
                <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200 p-4 mb-6" role="alert">
                  <p className="font-bold">Note:</p>
                  <p>Your CSV file was very large. AI insights were generated based on a sample of the first 50,000 rows to ensure performance. For comprehensive analysis of very large files, consider processing on a dedicated backend.</p>
                </div>
              )}

              <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">AI Summary:</h3>
              <div className="prose dark:prose-invert max-w-none">
                {/* Render AI insights. Assuming AI returns Markdown or simple paragraphs */}
                {aiInsights.insights && aiInsights.insights.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">{paragraph}</p>
                ))}
              </div>

              <h3 className="text-xl font-semibold mt-8 mb-3 text-gray-700 dark:text-gray-300">Top 5 Expensive Services:</h3>
              {aiInsights.serviceCosts && aiInsights.serviceCosts.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {aiInsights.serviceCosts.map(([service, cost], index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{service}</span>: <span className="font-bold">${cost.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No specific expensive services identified (or data is insufficient).</p>
              )}

              <h3 className="text-xl font-semibold mt-8 mb-3 text-gray-700 dark:text-gray-300">Top 5 Expensive Resources:</h3>
              {aiInsights.topExpensiveResources && aiInsights.topExpensiveResources.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {aiInsights.topExpensiveResources.map((res, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{res.resourceId || 'N/A'}</span> ({res.service}) - <span className="font-bold">${res.totalCost.toFixed(2)}</span>. Usage Types: {res.usageTypes}. Occurrences: {res.occurrences}. Duration: {res.durationDays} days.
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No specific expensive resources identified (or data is insufficient).</p>
              )}

              <h3 className="text-xl font-semibold mt-8 mb-3 text-gray-700 dark:text-gray-300">Potential Idle/Underutilized Resources:</h3>
              {aiInsights.idleResources && aiInsights.idleResources.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {aiInsights.idleResources.map((res, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{res.resourceId || 'N/A'}</span> ({res.service}) - <span className="font-bold">${res.totalCost.toFixed(2)}</span>. Occurrences: {res.occurrences}. Duration: {res.durationDays} days.
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(Low cost and usage count. Consider review or termination.)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No immediate idle resources detected based on current data.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Insights;
