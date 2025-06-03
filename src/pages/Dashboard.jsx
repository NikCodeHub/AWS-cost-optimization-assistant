// cloud-cost-dashboard-frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CostSummary from '../components/CostSummary';
import { Link } from 'react-router-dom';

const Dashboard = ({ parsedCsvData, isDarkMode }) => {
  const [chartData, setChartData] = useState([]);
  const [groupBy, setGroupBy] = useState('daily'); // 'daily', 'monthly'
  const [costByService, setCostByService] = useState({});

  // Determine chart element colors based on dark mode
  const chartStrokeColor = isDarkMode ? '#ccc' : '#666'; // For axis text and lines
  const gridStrokeColor = isDarkMode ? '#4a4a4a' : '#e0e0e0'; // For grid lines
  const tooltipBgColor = isDarkMode ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)'; // For tooltip background
  const tooltipItemColor = isDarkMode ? '#eee' : '#333'; // For tooltip text color


  useEffect(() => {
    // --- DEBUG LOGS START ---
    console.log("Dashboard: useEffect triggered. parsedCsvData:", parsedCsvData);
    // --- DEBUG LOGS END ---

    if (parsedCsvData && parsedCsvData.length > 0) {
      processDataForDashboard(parsedCsvData, groupBy);
      calculateServiceCosts(parsedCsvData);
    } else {
      setChartData([]);
      setCostByService({});
    }
  }, [parsedCsvData, groupBy]);

  const processDataForDashboard = (data, interval) => {
    const aggregatedData = {};

    data.forEach(row => {
      // Use sanitized headers from parseBillingCsv.js
      const date = row.lineItemUsageStartDate; // Assuming this is the start date
      const cost = parseFloat(row.lineItemUnblendedCost) || 0;

      // --- DEBUG LOGS START (inside loop) ---
      // console.log(`Dashboard: Processing row - Date: ${date}, Cost: ${cost}, Raw Cost: ${row.lineItemUnblendedCost}`);
      // --- DEBUG LOGS END ---

      if (date && cost > 0) {
        let key;
        const d = new Date(date);

        if (interval === 'daily') {
          key = d.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (interval === 'monthly') {
          key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
        }

        if (key) {
          aggregatedData[key] = (aggregatedData[key] || 0) + cost;
        }
      }
    });

    // --- DEBUG LOGS START ---
    console.log("Dashboard: Aggregated Data for Chart:", aggregatedData);
    // --- DEBUG LOGS END ---

    const sortedData = Object.entries(aggregatedData)
      .map(([date, cost]) => ({ date, cost: parseFloat(cost.toFixed(2)) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setChartData(sortedData);
  };

  const calculateServiceCosts = (data) => {
    const serviceCosts = {};
    data.forEach(row => {
      const service = row.productProductFamily || row.productServiceCode || 'Unknown Service';
      const cost = parseFloat(row.lineItemUnblendedCost) || 0;
      
      // --- DEBUG LOGS START (inside loop) ---
      // console.log(`Dashboard: Calculating service costs - Service: ${service}, Cost: ${cost}, Raw Service: ${row.productProductFamily || row.productServiceCode}`);
      // --- DEBUG LOGS END ---

      if (cost > 0) {
        serviceCosts[service] = (serviceCosts[service] || 0) + cost;
      }
    });
    // --- DEBUG LOGS START ---
    console.log("Dashboard: Calculated Service Costs:", serviceCosts);
    // --- DEBUG LOGS END ---
    setCostByService(serviceCosts);
  };

  // Prepare data for "Cost by Service" Pie Chart/Table
  const servicePieChartData = Object.entries(costByService)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));


  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Cost Dashboard</h2>

      {!parsedCsvData || parsedCsvData.length === 0 ? (
        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No CSV Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline">Upload CSV page</Link> to view the dashboard.</span>
        </div>
      ) : (
        <>
          <CostSummary parsedCsvData={parsedCsvData} />

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Cost Trend Over Time</h3>
            <div className="mb-4">
              <label htmlFor="group-by" className="mr-2 text-gray-700 dark:text-gray-300">Group by:</label>
              <select
                id="group-by"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
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
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ backgroundColor: tooltipBgColor, border: '1px solid #ccc', borderRadius: '4px' }}
                  itemStyle={{ color: tooltipItemColor }}
                />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="#8884d8" activeDot={{ r: 8 }} name="Total Cost" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Cost Breakdown by Service</h3>
            {servicePieChartData.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {servicePieChartData.map((item, index) => (
                  <li key={item.name} className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{item.name}</span>: <span className="font-bold">${item.value.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No service cost breakdown available (or all costs are zero).</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
