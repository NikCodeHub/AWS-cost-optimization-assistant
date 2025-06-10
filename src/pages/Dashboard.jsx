import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Custom Tooltip for Recharts to handle dark mode styling
const CustomTooltip = ({ active, payload, label, isDarkMode }) => {
  if (active && payload && payload.length) {
    const tooltipBgColor = isDarkMode ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)';
    const tooltipLabelColor = isDarkMode ? '#e5e7eb' : '#333';
    const tooltipItemColor = isDarkMode ? '#a78bfa' : '#555'; // Example item color

    return (
      <div
        className="p-3 border rounded-md shadow-lg"
        style={{ backgroundColor: tooltipBgColor, borderColor: isDarkMode ? '#6b7280' : '#ccc' }}
      >
        <p className="font-bold mb-1" style={{ color: tooltipLabelColor }}>{label}</p>
        {payload.map((p, index) => (
          <p key={index} style={{ color: p.color || tooltipItemColor }}>
            {`${p.name || p.dataKey}: $${p.value.toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const Dashboard = ({ parsedCsvData, isDarkMode }) => {
  // States for different chart data and summary
  const [totalCost, setTotalCost] = useState(0);
  const [dailyCosts, setDailyCosts] = useState([]);
  const [monthlyCosts, setMonthlyCosts] = useState([]); // For monthly comparison
  const [topServices, setTopServices] = useState([]);
  const [regionCosts, setRegionCosts] = useState([]);
  const [loading, setLoading] = useState(true); // Manages loading state for data processing

  // Determine chart element colors based on dark mode prop
  const chartAxisStrokeColor = isDarkMode ? '#9ca3af' : '#666'; // For axis text and lines
  const chartLineColor = isDarkMode ? '#3b82f6' : '#8884d8'; // Primary line/bar color
  const chartBarColor = isDarkMode ? '#60a5fa' : '#82ca9d'; // Secondary bar color
  const chartRegionColor = isDarkMode ? '#facc15' : '#f59e0b'; // Region chart color
  const chartMonthlyCurrentColor = isDarkMode ? '#3b82f6' : '#8884d8';
  const chartMonthlyPreviousColor = isDarkMode ? '#8b5cf6' : '#82ca9d';

  // Animation variants for sections
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const chartContainerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut", delay: 0.2 } },
  };


  useEffect(() => {
    setLoading(true); // Start loading state
    if (parsedCsvData && parsedCsvData.length > 0) {
      let calculatedTotalCost = 0;
      const costsByDate = {}; // YYYY-MM-DD
      const costsByMonth = {}; // YYYY-MM
      const costsByService = {};
      const costsByRegion = {};

      parsedCsvData.forEach(item => {
        const cost = parseFloat(item.lineItemUnblendedCost);
        // Ensure cost is a valid positive number
        if (isNaN(cost) || cost <= 0) return; // Skip if cost is invalid or zero/negative

        calculatedTotalCost += cost;

        // Safely get and format date
        let usageDate = item.lineItemUsageStartDate;
        if (!usageDate) return; // Skip if no usage date

        // Attempt to create a Date object, handling if it's already a Date or a string
        const dateObj = new Date(usageDate);

        // Check if dateObj is a valid date
        if (isNaN(dateObj.getTime())) {
          console.warn('Invalid date detected for item:', item);
          return; // Skip if date is invalid
        }

        // Aggregate by date (YYYY-MM-DD)
        const dateStr = dateObj.toISOString().substring(0, 10);
        costsByDate[dateStr] = (costsByDate[dateStr] || 0) + cost;

        // Aggregate by month for monthly comparison (YYYY-MM)
        const monthStr = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
        costsByMonth[monthStr] = (costsByMonth[monthStr] || 0) + cost;

        // Aggregate by service
        // Prioritize productProductName, then productProductFamily, then serviceProductCode
        const serviceName = item.productProductName || item.productProductFamily || item.serviceProductCode || 'Unknown Service';
        costsByService[serviceName] = (costsByService[serviceName] || 0) + cost;

        // Aggregate by region
        const regionName = item.productRegion || 'Unknown Region';
        costsByRegion[regionName] = (costsByRegion[regionName] || 0) + cost;
      });

      setTotalCost(calculatedTotalCost.toFixed(2));

      // Format daily costs for LineChart
      const formattedDailyCosts = Object.keys(costsByDate)
        .sort()
        .map(date => ({ date, cost: parseFloat(costsByDate[date].toFixed(2)) }));
      setDailyCosts(formattedDailyCosts);

      // Format top services for BarChart (top 8)
      const sortedServices = Object.entries(costsByService)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(2)) }));
      setTopServices(sortedServices);

      // Format region costs for BarChart
      const sortedRegions = Object.entries(costsByRegion)
        .sort(([, a], [, b]) => b - a)
        .map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(2)) }));
      setRegionCosts(sortedRegions);

      // Prepare data for Monthly Cost Comparison (Last two months)
      const sortedMonthsKeys = Object.keys(costsByMonth).sort();
      const monthlyComparisonData = [];
      if (sortedMonthsKeys.length >= 2) {
          const lastMonthKey = sortedMonthsKeys[sortedMonthsKeys.length - 1];
          const secondLastMonthKey = sortedMonthsKeys[sortedMonthsKeys.length - 2];
          monthlyComparisonData.push({
              month: secondLastMonthKey,
              'Total Cost': parseFloat(costsByMonth[secondLastMonthKey].toFixed(2))
          });
          monthlyComparisonData.push({
              month: lastMonthKey,
              'Total Cost': parseFloat(costsByMonth[lastMonthKey].toFixed(2))
          });
      } else if (sortedMonthsKeys.length === 1) {
          // If only one month of data, show just that month
          monthlyComparisonData.push({
              month: sortedMonthsKeys[0],
              'Total Cost': parseFloat(costsByMonth[sortedMonthsKeys[0]].toFixed(2))
          });
      }
      setMonthlyCosts(monthlyComparisonData);

      setLoading(false);
    } else {
      // No data or empty data, reset states and finish loading
      setTotalCost(0);
      setDailyCosts([]);
      setMonthlyCosts([]);
      setTopServices([]);
      setRegionCosts([]);
      setLoading(false);
    }
  }, [parsedCsvData]); // Dependency: re-run effect when parsedCsvData changes


  // Display loading spinner while data is being processed
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-dashboard bg-gray-900 text-blue-400">
        <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-xl">Analyzing cloud costs...</p>
      </div>
    );
  }

  // Display message if no data is available after loading
  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-dashboard p-8 bg-gray-900 text-gray-400">
        <div className="bg-blue-900 border border-blue-400 text-blue-200 px-4 py-3 rounded relative text-center">
          <strong className="font-bold">No Cloud Cost Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline hover:text-blue-100">Upload CSV page</Link> to view the dashboard.</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      // Stagger children animations for a nicer entry effect
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen-dashboard bg-gray-900 text-gray-100"
    >
      <motion.h1
        variants={sectionVariants}
        className="text-3xl sm:text-4xl font-bold text-blue-400 mb-8"
      >
        Cloud Cost Dashboard
      </motion.h1>

      {/* Total Cloud Spend Summary Card */}
      <motion.div
        variants={sectionVariants}
        className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center justify-center border border-blue-600"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-gray-300">Total Cloud Spend (Overall)</h2>
        <p className="text-4xl sm:text-5xl font-extrabold text-blue-400 mt-2">${totalCost}</p>
        <p className="text-sm text-gray-400 mt-1">Based on uploaded AWS CUR data</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Trend Over Time (Line Chart) */}
        <motion.div
          variants={chartContainerVariants}
          className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-200">Cost Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyCosts} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis
                dataKey="date"
                stroke={chartAxisStrokeColor} // Dynamic axis color
                tickFormatter={(tick) => {
                  const date = new Date(tick);
                  // Format for daily (e.g., May 1) or monthly (e.g., May 2024)
                  // This heuristic helps format dynamically based on data density
                  if (dailyCosts.length > 31 * 3) { // If data spans more than 3 months, show month/year
                    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                  } else if (dailyCosts.length > 7) { // If more than a week, show month/day
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // Default to short date
                }}
              />
              <YAxis stroke={chartAxisStrokeColor} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
              <Line type="monotone" dataKey="cost" stroke={chartLineColor} strokeWidth={2} dot={false} name="Daily Cost" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cost Breakdown by Top Services (Bar Chart) */}
        <motion.div
          variants={chartContainerVariants}
          className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-200">Top Services by Cost</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topServices} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <YAxis type="category" dataKey="name" stroke={chartAxisStrokeColor} width={120} />
              <XAxis type="number" stroke={chartAxisStrokeColor} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
              <Bar dataKey="cost" fill={chartBarColor} name="Service Cost" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Breakdown by Region (Bar Chart) */}
        <motion.div
          variants={chartContainerVariants}
          className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-200">Cost by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionCosts} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" stroke={chartAxisStrokeColor} />
              <YAxis stroke={chartAxisStrokeColor} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
              <Bar dataKey="cost" fill={chartRegionColor} name="Region Cost" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Cost Comparison (Bar Chart) */}
        <motion.div
          variants={chartContainerVariants}
          className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-200">Monthly Cost Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyCosts} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="month" stroke={chartAxisStrokeColor} />
              <YAxis stroke={chartAxisStrokeColor} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
              <Legend />
              <Bar dataKey="Total Cost" fill={chartMonthlyCurrentColor} name="Total Cost" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
