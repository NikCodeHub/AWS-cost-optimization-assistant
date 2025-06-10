import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CostSavingsPanel = ({ parsedCsvData, isDarkMode }) => {
  const [optimizationOpportunities, setOptimizationOpportunities] = useState([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [aiTipsLoading, setAiTipsLoading] = useState({}); // State to track loading for individual AI tips

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
      const findings = analyzeForSavings(parsedCsvData);
      setOptimizationOpportunities(findings);
      setLoadingAnalysis(false);
    } else {
      setOptimizationOpportunities([]);
      setLoadingAnalysis(false);
    }
  }, [parsedCsvData]); // Re-run analysis when parsed data changes

  // Client-side heuristic analysis for potential savings opportunities
  // This is a simplified example. In a real-world scenario, you'd need CloudWatch metrics
  // or more sophisticated parsing of CUR for truly accurate idle/right-sizing.
  const analyzeForSavings = (data) => {
    const opportunities = [];
    const serviceCosts = {}; // Track total costs per service
    const ec2Instances = {}; // Track EC2 instances and their costs

    data.forEach(item => {
      const cost = parseFloat(item.lineItemUnblendedCost);
      if (isNaN(cost) || cost <= 0) return;

      const serviceName = item.productProductName || item.productProductFamily || item.serviceProductCode || 'Unknown Service';
      const resourceId = item.lineItemResourceId;
      const usageType = item.lineItemUsageType;
      const region = item.productRegion;

      // Aggregate total service costs
      serviceCosts[serviceName] = (serviceCosts[serviceName] || 0) + cost;

      // Heuristic 1: Identify "potentially high cost" EC2 instances for review
      if (serviceName.includes('EC2') && resourceId) {
        if (!ec2Instances[resourceId]) {
          ec2Instances[resourceId] = {
            totalCost: 0,
            type: item.instanceType || 'N/A',
            region: region,
            description: item.lineItemLineItemDescription || '',
          };
        }
        ec2Instances[resourceId].totalCost += cost;
      }

      // Heuristic 2: High Data Transfer Out (common hidden cost)
      if (usageType && usageType.includes('DataTransfer-Out') && cost > 50) { // Threshold for "high" transfer cost
        opportunities.push({
          id: `DT-${Date.now()}-${Math.random()}`, // Unique ID for this finding
          type: 'High Data Transfer Out',
          resourceId: resourceId || 'N/A', // May not always have a direct resource ID
          cost: cost.toFixed(2),
          issue: `Unexpectedly high data transfer out cost detected in ${region}.`,
          initialSuggestion: 'Review network logs for unexpected egress. Check for unoptimized traffic patterns or large file transfers.',
          aiRecommendation: null,
          status: 'Identified'
        });
      }

      // Heuristic 3: Identify potentially idle EBS Volumes (very simplified, based on cost only)
      // This is very difficult to do accurately with just CUR data without CloudWatch metrics.
      // A simplified approach might be to flag large EBS costs without associated running EC2 instances over time.
      // For a demo, we can just highlight high EBS storage cost if it's not a common pattern for the user.
      if (serviceName.includes('Amazon Elastic Block Store') && cost > 100) { // Arbitrary high EBS cost threshold
        opportunities.push({
          id: `EBS-${Date.now()}-${Math.random()}`,
          type: 'High EBS Storage Cost',
          resourceId: resourceId || 'N/A',
          cost: cost.toFixed(2),
          issue: `High EBS storage cost detected in ${region}.`,
          initialSuggestion: 'Verify if the volume is attached to an active instance. Delete unattached or old snapshots.',
          aiRecommendation: null,
          status: 'Identified'
        });
      }
    });

    // Post-process EC2 instances after iterating through all data
    for (const id in ec2Instances) {
      if (ec2Instances[id].totalCost > 500) { // Arbitrary threshold for "high cost" EC2 to review
        opportunities.unshift({ // Add to the beginning as high priority
          id: id,
          type: 'High Cost EC2 Instance',
          resourceId: id,
          cost: ec2Instances[id].totalCost.toFixed(2),
          issue: `EC2 instance '${id}' (${ec2Instances[id].type}, ${ec2Instances[id].region}) has accumulated a high cost.`,
          initialSuggestion: 'Review its utilization (CPU, memory, network). Consider right-sizing to a smaller instance type if underutilized, or investigate workload.',
          aiRecommendation: null,
          status: 'Identified'
        });
      }
    }

    return opportunities;
  };

  // Function to call AI for detailed recommendation
  const handleGetAiRecommendation = async (opportunity, index) => {
    setAiTipsLoading(prev => ({ ...prev, [index]: true })); // Set loading for this specific item
    try {
      const promptContext = `Analyze this cloud cost optimization opportunity and provide actionable steps for an AWS user:\n` +
                            `Type: ${opportunity.type}\n` +
                            `Resource ID: ${opportunity.resourceId}\n` +
                            `Identified Issue: ${opportunity.issue}\n` +
                            `Current Cost: $${opportunity.cost}\n` +
                            `Initial Suggestion: ${opportunity.initialSuggestion}\n\n` +
                            `Please provide a concise, actionable recommendation.`;

      // --- CRUCIAL FIX: Use ABSOLUTE URL for local backend ---
      const response = await fetch('https://backend-project-190.onrender.com/api/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptContext }),
      });

      const data = await response.json(); // This is where the JSON parsing happens

      if (response.ok) { // Check if the HTTP status is 2xx
        setOptimizationOpportunities(prev =>
          prev.map((item, i) =>
            i === index ? { ...item, aiRecommendation: data.recommendation || "No specific recommendation available." } : item
          )
        );
      } else {
        // If response is not ok (e.g., 400, 500), throw an error with backend message
        throw new Error(data.error || 'Failed to get AI recommendation from backend.');
      }
    } catch (error) {
      console.error("Error getting AI tip:", error);
      setOptimizationOpportunities(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, aiRecommendation: `Error: ${error.message}` } : item
        )
      );
    } finally {
      setAiTipsLoading(prev => ({ ...prev, [index]: false }));
    }
  };


  if (loadingAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-dashboard bg-gray-900 text-blue-400">
        <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-xl">Analyzing for cost savings opportunities...</p>
      </div>
    );
  }

  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-dashboard p-8 bg-gray-900 text-gray-400">
        <div className="bg-blue-900 border border-blue-400 text-blue-200 px-4 py-3 rounded relative text-center">
          <strong className="font-bold">No Cloud Cost Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline hover:text-blue-100">Upload CSV page</Link> to analyze for savings.</span>
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
        Cost Savings Advisor
      </motion.h1>

      {optimizationOpportunities.length === 0 ? (
        <motion.div variants={sectionVariants} className="bg-gray-800 rounded-lg shadow-lg p-6 text-center border border-green-600">
          <p className="text-xl font-semibold text-green-400">Great job!</p>
          <p className="mt-2 text-gray-300">Based on the uploaded data, we found no obvious immediate cost savings opportunities using our current heuristics.</p>
          <p className="mt-2 text-sm text-gray-400">Keep monitoring your spend and check for advanced AI insights!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {optimizationOpportunities.map((opportunity, index) => (
            <motion.div key={opportunity.id} variants={cardVariants} className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-blue-300 mb-2">{opportunity.type}</h3>
                {opportunity.resourceId && <p className="text-sm text-gray-400">Resource: {opportunity.resourceId}</p>}
                <p className="text-lg text-gray-300">Cost: <span className="font-bold text-red-400">${opportunity.cost}</span> (for this period)</p>
                <p className="text-gray-300 mt-2">{opportunity.issue}</p>
                <p className="text-sm text-gray-400 italic mt-2">Initial thought: {opportunity.initialSuggestion}</p>
              </div>
              <div className="mt-4">
                {!opportunity.aiRecommendation ? (
                  <button
                    onClick={() => handleGetAiRecommendation(opportunity, index)}
                    disabled={aiTipsLoading[index]}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200"
                  >
                    {aiTipsLoading[index] ? (
                      <svg className="animate-spin h-5 w-5 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Get AI Recommendation'}
                  </button>
                ) : (
                  <div className="mt-2 p-3 bg-gray-700 rounded-md border border-purple-500">
                    <p className="font-semibold text-purple-300">AI Recommendation:</p>
                    <p className="text-sm text-gray-200 mt-1">{opportunity.aiRecommendation}</p>
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

export default CostSavingsPanel;
