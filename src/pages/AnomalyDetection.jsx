import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const AnomalyDetection = ({ parsedCsvData, isDarkMode }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [aiExplanationLoading, setAiExplanationLoading] = useState({}); // Tracks loading for individual AI explanations

  // Animation variants for sections
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut", delay: 0.1 } },
  };

  useEffect(() => {
    setLoadingAnalysis(true);
    if (parsedCsvData && parsedCsvData.length > 0) {
      const detectedAnomalies = detectCostAnomalies(parsedCsvData);
      setAnomalies(detectedAnomalies);
      setLoadingAnalysis(false);
    } else {
      setAnomalies([]);
      setLoadingAnalysis(false);
    }
  }, [parsedCsvData]);

  // Custom Tooltip for Recharts to handle dark mode styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const tooltipBgColor = isDarkMode ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)';
      const tooltipLabelColor = isDarkMode ? '#e5e7eb' : '#333';
      const tooltipItemColor = isDarkMode ? '#a78bfa' : '#555';

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

  // Client-side anomaly detection logic
  const detectCostAnomalies = (data) => {
    const dailyCosts = {};
    const anomaliesFound = [];

    // Aggregate daily costs
    data.forEach(item => {
      const cost = parseFloat(item.lineItemUnblendedCost);
      if (isNaN(cost) || cost <= 0) return; // Skip if cost is invalid or zero/negative

      let usageDate = item.lineItemUsageStartDate;
      if (!usageDate) return; // Skip if no usage date

      // Safely create a Date object and validate it
      const dateObj = new Date(usageDate);
      if (isNaN(dateObj.getTime())) {
        console.warn('AnomalyDetection: Invalid date detected for item:', item);
        return; // Skip if date is invalid
      }

      // Format date to YYYY-MM-DD
      const dateStr = dateObj.toISOString().substring(0, 10);

      dailyCosts[dateStr] = (dailyCosts[dateStr] || 0) + cost;
    });

    const sortedDates = Object.keys(dailyCosts).sort();
    if (sortedDates.length < 7) { // Need at least a week of data for basic anomaly detection
        // console.log("Not enough data points for anomaly detection (need at least 7 days).");
        return [];
    }

    // Prepare data for line chart (all historical daily costs)
    const chartDataForPlot = sortedDates.map(date => ({
        date: date,
        cost: dailyCosts[date],
    }));


    // Calculate moving average and standard deviation (simple approach)
    const windowSize = 7; // Look at the last 7 days to calculate average/stddev
    const anomalyThresholdStdDev = 2; // Cost is an anomaly if > 2 standard deviations from average

    for (let i = windowSize; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      const currentCost = dailyCosts[currentDate];

      const historicalCosts = [];
      for (let j = 1; j <= windowSize; j++) {
        const pastDate = sortedDates[i - j];
        if (pastDate) {
          historicalCosts.push(dailyCosts[pastDate]);
        }
      }

      if (historicalCosts.length === 0) continue;

      const sum = historicalCosts.reduce((a, b) => a + b, 0);
      const mean = sum / historicalCosts.length;
      const squaredDifferences = historicalCosts.map(cost => (cost - mean) ** 2);
      const variance = squaredDifferences.reduce((a, b) => a + b, 0) / historicalCosts.length;
      const stdDev = Math.sqrt(variance);

      // Check for anomaly
      if (stdDev > 0 && Math.abs(currentCost - mean) > anomalyThresholdStdDev * stdDev) {
        // Also get top services for that anomalous day to provide context to AI
        const topServicesForDay = {};
        data.filter(item => {
            let itemDate = item.lineItemUsageStartDate;
            if (!itemDate) return false;
            // FIX HERE: Ensure itemDate is processed safely.
            const itemDateObj = new Date(itemDate);
            return !isNaN(itemDateObj.getTime()) && itemDateObj.toISOString().substring(0, 10) === currentDate;
        })
            .forEach(item => {
                const serviceName = item.productProductName || item.productProductFamily || 'Unknown Service';
                const cost = parseFloat(item.lineItemUnblendedCost);
                if (!isNaN(cost) && cost > 0) {
                    topServicesForDay[serviceName] = (topServicesForDay[serviceName] || 0) + cost;
                }
            });
        const sortedTopServices = Object.entries(topServicesForDay)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3) // Top 3 services for context
            .map(([name, cost]) => `${name}: $${cost.toFixed(2)}`);

        anomaliesFound.push({
          id: currentDate, // Use date as ID for simplicity
          date: currentDate,
          cost: currentCost.toFixed(2),
          mean: mean.toFixed(2),
          deviation: Math.abs(currentCost - mean).toFixed(2),
          type: currentCost > mean ? 'Cost Spike' : 'Cost Drop',
          topServices: sortedTopServices.join(', ') || 'N/A',
          aiExplanation: null, // Placeholder for AI response
          status: 'Detected'
        });
      }
    }
    return anomaliesFound;
  };

  // Function to call AI for anomaly explanation
  const handleGetAiExplanation = async (anomaly, index) => {
    setAiExplanationLoading(prev => ({ ...prev, [index]: true })); // Set loading for this specific item
    try {
      const promptContext = `Explain the likely root cause for this AWS cost anomaly and suggest immediate investigation steps:
Type: ${anomaly.type}
Date: ${anomaly.date}
Cost: $${anomaly.cost} (compared to average of $${anomaly.mean})
Top services on this day: ${anomaly.topServices}`;

      // --- CRUCIAL: Use ABSOLUTE URL for local backend ---
      // This is the correct URL for your backend server.
      const response = await fetch('https://backend-project-190.onrender.com/api/ai/explain-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptContext }),
      });

      // CHECK HTTP STATUS BEFORE TRYING TO PARSE JSON
      if (!response.ok) {
        let errorBody = await response.text(); // Get raw text if not OK
        try {
          const errorJson = JSON.parse(errorBody);
          errorBody = errorJson.error || errorBody; // Use backend's error message if available
        } catch (e) {
          // If it's not JSON, stick to raw text
        }
        throw new Error(`Backend responded with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json(); // This is where the JSON parsing happens

      setAnomalies(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, aiExplanation: data.explanation || "No explanation available." } : item
        )
      );

    } catch (error) {
      console.error("Error getting AI explanation:", error);
      setAnomalies(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, aiExplanation: `Error: ${error.message}` } : item
        )
      );
    } finally {
      setAiExplanationLoading(prev => ({ ...prev, [index]: false }));
    }
  };


  if (loadingAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-dashboard bg-gray-900 text-blue-400">
        <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-xl">Detecting cost anomalies...</p>
      </div>
    );
  }

  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-dashboard p-8 bg-gray-900 text-gray-400">
        <div className="bg-blue-900 border border-blue-400 text-blue-200 px-4 py-3 rounded relative text-center">
          <strong className="font-bold">No Cloud Cost Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline hover:text-blue-100">Upload CSV page</Link> to detect anomalies.</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen-dashboard bg-gray-900 text-gray-100"
    >
      <motion.h1
        variants={sectionVariants}
        className="text-3xl sm:text-4xl font-bold text-blue-400 mb-8"
      >
        Cloud Cost Anomaly Detection
      </motion.h1>

      {anomalies.length === 0 ? (
        <motion.div variants={sectionVariants} className="bg-gray-800 rounded-lg shadow-lg p-6 text-center border border-green-600">
          <p className="text-xl font-semibold text-green-400">No significant anomalies detected!</p>
          <p className="mt-2 text-gray-300">Your cloud spending is stable based on the analyzed data.</p>
          <p className="mt-2 text-sm text-gray-400">Keep monitoring your spend regularly.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {anomalies.map((anomaly, index) => (
            <motion.div key={anomaly.id} variants={cardVariants} className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-blue-300 mb-2">{anomaly.type} on {anomaly.date}</h3>
                <p className="text-lg text-gray-300">Cost: <span className="font-bold text-red-400">${anomaly.cost}</span></p>
                <p className="text-sm text-gray-400 mt-1">Compared to average: ${anomaly.mean}</p>
                <p className="text-sm text-gray-400 mt-1">Top services: {anomaly.topServices}</p>
              </div>
              <div className="mt-4">
                {!anomaly.aiExplanation ? (
                  <button
                    onClick={() => handleGetAiExplanation(anomaly, index)}
                    disabled={aiExplanationLoading[index]}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200"
                  >
                    {aiExplanationLoading[index] ? (
                      <svg className="animate-spin h-5 w-5 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Get AI Explanation'}
                  </button>
                ) : (
                  <div className="mt-2 p-3 bg-gray-700 rounded-md border border-purple-500">
                    <p className="font-semibold text-purple-300">AI Explanation:</p>
                    <p className="text-sm text-gray-200 mt-1">{anomaly.aiExplanation}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AnomalyDetection;
