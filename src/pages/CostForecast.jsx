// cloud-cost-dashboard-frontend/src/pages/CostForecast.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CostForecast = ({ parsedCsvData, isDarkMode }) => {
  const [forecastMonths, setForecastMonths] = useState(3); // Default forecast for 3 months
  const [forecastData, setForecastData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine chart element colors based on dark mode
  const chartStrokeColor = isDarkMode ? '#ccc' : '#666';
  const gridStrokeColor = isDarkMode ? '#4a4a4a' : '#e0e0e0';
  const tooltipBgColor = isDarkMode ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)';
  const tooltipItemColor = isDarkMode ? '#eee' : '#333';

  useEffect(() => {
    if (parsedCsvData && parsedCsvData.length > 0) {
      setIsLoading(true);
      setError(null);
      try {
        const historicalMonthlyCosts = aggregateMonthlyCosts(parsedCsvData);
        // --- DEBUG LOG START ---
        console.log("CostForecast: Historical Monthly Costs:", historicalMonthlyCosts);
        // --- DEBUG LOG END ---
        const forecasted = generateForecast(historicalMonthlyCosts, forecastMonths);
        setForecastData(forecasted);
      } catch (err) {
        console.error("Error generating forecast:", err);
        setError("Failed to generate forecast. Ensure your CSV data is valid.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setForecastData([]);
      setError("Please upload a CSV file to generate a cost forecast.");
    }
  }, [parsedCsvData, forecastMonths]);

  // Helper to aggregate costs by month
  const aggregateMonthlyCosts = (data) => {
    const monthlyAggregated = {};
    data.forEach(row => {
      const date = row.lineItemUsageStartDate instanceof Date
        ? row.lineItemUsageStartDate
        : new Date(row.lineItemUsageStartDate); // Ensure it's a Date object
      const cost = parseFloat(row.lineItemUnblendedCost) || 0;

      if (date && !isNaN(date.getTime()) && cost > 0) {
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyAggregated[yearMonth] = (monthlyAggregated[yearMonth] || 0) + cost;
      }
    });

    // Convert to sorted array of objects
    return Object.entries(monthlyAggregated)
      .map(([month, cost]) => ({ date: month, cost: parseFloat(cost.toFixed(2)) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Simple forecasting logic (e.g., average of last 3 months)
  const generateForecast = (historicalData, monthsToForecast) => {
    if (historicalData.length === 0) return [];

    const combinedData = [...historicalData];
    const numHistoricalMonths = historicalData.length;

    // Use the average of the last 3 available months for forecasting
    const lookbackForAverage = Math.min(3, numHistoricalMonths);
    if (lookbackForAverage === 0) return combinedData; // Not enough data to forecast

    const lastMonthsCosts = historicalData.slice(-lookbackForAverage).map(d => d.cost);
    const averageCost = lastMonthsCosts.reduce((sum, cost) => sum + cost, 0) / lookbackForAverage;

    let lastDate = new Date(historicalData[numHistoricalMonths - 1].date);

    for (let i = 0; i < monthsToForecast; i++) {
      lastDate.setMonth(lastDate.getMonth() + 1); // Move to next month
      const nextMonth = `${lastDate.getFullYear()}-${(lastDate.getMonth() + 1).toString().padStart(2, '0')}`;
      combinedData.push({
        date: nextMonth,
        cost: parseFloat(averageCost.toFixed(2)), // Forecasted cost
        isForecast: true // Mark as forecasted
      });
    }
    return combinedData;
  };


  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Cost Forecasting</h2>
        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No CSV Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline">Upload CSV page</Link> to generate a cost forecast.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Cost Forecasting</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Predict your future AWS costs based on historical trends.
      </p>

      <div className="mb-4">
        <label htmlFor="forecast-months" className="mr-2 text-gray-700 dark:text-gray-300">Forecast for next:</label>
        <select
          id="forecast-months"
          value={forecastMonths}
          onChange={(e) => setForecastMonths(parseInt(e.target.value))}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value={1}>1 Month</option>
          <option value={3}>3 Months</option>
          <option value={6}>6 Months</option>
          <option value={12}>12 Months</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-6 text-blue-500 dark:text-blue-400">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4">Generating forecast...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {!isLoading && !error && forecastData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={forecastData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
            <XAxis dataKey="date" stroke={chartStrokeColor} />
            <YAxis
              stroke={chartStrokeColor}
              label={{
                value: 'Cost ($)',
                angle: -90,
                position: 'insideLeft',
                stroke: chartStrokeColor
              }}
            />
            <Tooltip
              formatter={(value) => `$${value.toFixed(2)}`}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{ backgroundColor: tooltipBgColor, border: '1px solid #ccc', borderRadius: '4px' }}
              itemStyle={{ color: tooltipItemColor }}
            />
            <Legend />
            {/* Historical data line */}
            <Line
              key="historical-line" // Added unique key
              type="monotone"
              dataKey="cost"
              stroke="#8884d8"
              strokeWidth={2}
              name="Historical Cost"
              dot={false}
              // Use a custom dot function to only show dots for historical data
              dot={(props) => {
                const { cx, cy, stroke, payload } = props;
                return payload.isForecast ? null : <circle cx={cx} cy={cy} r={3} fill={stroke} />;
              }}
            />
            {/* Forecasted data line (dashed) */}
            <Line
              key="forecasted-line" // Added unique key
              type="monotone"
              dataKey="cost"
              stroke="#ff7300"
              strokeWidth={2}
              name="Forecasted Cost"
              dot={false}
              strokeDasharray="5 5" // Dashed line for forecast
              // Use a custom dot function to only show dots for historical data
              dot={(props) => {
                const { cx, cy, stroke, payload } = props;
                return payload.isForecast ? <circle cx={cx} cy={cy} r={3} fill={stroke} /> : null;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        !isLoading && !error && (
          <div className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded relative" role="alert">
            <p>No historical data available to generate a forecast.</p>
            <p className="text-sm mt-1">Ensure your CSV contains `lineItem/UsageStartDate` and `lineItem/UnblendedCost` for multiple months.</p>
          </div>
        )
      )}
    </div>
  );
};

export default CostForecast;
