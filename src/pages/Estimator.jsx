// cloud-cost-dashboard-frontend/src/pages/Estimator.jsx
import React, { useState } from 'react';

const Estimator = () => {
  const [resourceType, setResourceType] = useState('');
  const [size, setSize] = useState('');
  const [region, setRegion] = useState('');
  const [duration, setDuration] = useState('');
  const [estimateResult, setEstimateResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setEstimateResult(null);

    try {
      const response = await fetch('https://backend-project-190.onrender.com/api/ai/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceType, size, region, duration: parseFloat(duration) || 0 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || 'Server error'}`);
      }

      const result = await response.json();
      setEstimateResult(result.estimate); // Assuming backend returns { estimate: "AI text" }
    } catch (err) {
      console.error("Error fetching estimate:", err);
      setError(`Failed to get estimate: ${err.message}. Please ensure your backend is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">AI Cost Estimator</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Get an estimated monthly cost for AWS resources using AI.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource Type (e.g., EC2, RDS, S3)</label>
          <input
            type="text"
            id="resourceType"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., EC2"
            required
          />
        </div>
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size/Configuration (e.g., t3.medium, gp2 100GB)</label>
          <input
            type="text"
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., t3.medium"
            required
          />
        </div>
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Region (e.g., us-east-1, eu-west-2)</label>
          <input
            type="text"
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., us-east-1"
            required
          />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Approx. Monthly Usage (hours/GB)</label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 730 (for full month)"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Get Estimate'}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {estimateResult && !isLoading && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md text-green-800 dark:text-green-200">
          <h3 className="font-semibold text-lg mb-2">AI Cost Estimate:</h3>
          <div className="prose dark:prose-invert max-w-none">
            {estimateResult.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2">{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Estimator;
