// src/pages/ResourceOptimization.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ResourceOptimization = ({ parsedCsvData, isDarkMode }) => {
  const [optimizationOpportunities, setOptimizationOpportunities] = useState([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [aiPlanLoading, setAiPlanLoading] = useState({}); // State to track loading for individual AI plans

  // Animation variants
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
      const detectedOpportunities = analyzeForResourceOptimization(parsedCsvData);
      setOptimizationOpportunities(detectedOpportunities);
      setLoadingAnalysis(false);
    } else {
      setOptimizationOpportunities([]);
      setLoadingAnalysis(false);
    }
  }, [parsedCsvData]);

  // Client-side heuristic analysis for resource optimization
  const analyzeForResourceOptimization = (data) => {
    const opportunities = [];
    const ec2Instances = {}; // Track EC2 instances and their costs/types for potential right-sizing
    const ebsVolumes = {}; // Track EBS volumes

    data.forEach(item => {
      const cost = parseFloat(item.lineItemUnblendedCost);
      if (isNaN(cost) || cost <= 0) return;

      const serviceName = item.productProductName || item.productProductFamily || item.serviceProductCode || 'Unknown Service';
      const resourceId = item.lineItemResourceId;
      const usageType = item.lineItemUsageType;
      const instanceType = item.instanceType;
      const region = item.productRegion;

      // Heuristic 1: Potential EC2 Right-sizing (based on instance type cost - very simplified)
      // In a real app, this would require CloudWatch utilization metrics.
      // For demo purposes, we can flag common "oversized" types or instances with significant costs.
      if (serviceName.includes('EC2') && resourceId && instanceType && cost > 100) { // Arbitrary cost threshold
        if (!ec2Instances[resourceId]) {
          ec2Instances[resourceId] = {
            totalCost: 0,
            type: instanceType,
            region: region,
            usage: [], // Could track usage patterns if more data was available
          };
        }
        ec2Instances[resourceId].totalCost += cost;
        ec2Instances[resourceId].usage.push({ date: item.lineItemUsageStartDate, cost: cost });
      }

      // Heuristic 2: Unattached / High Cost EBS Volumes (if resourceId points to a volume and no associated EC2 usage)
      // This is still tricky with just CUR. We'll simulate flagging if cost is high.
      if (serviceName.includes('Amazon Elastic Block Store') && resourceId && resourceId.startsWith('vol-') && cost > 50) { // Arbitrary cost threshold
          // Add to a temporary map to check uniqueness later
          ebsVolumes[resourceId] = {
              totalCost: (ebsVolumes[resourceId]?.totalCost || 0) + cost,
              region: region,
              type: 'EBS Volume'
          };
      }

      // Heuristic 3: Large S3 Standard Storage (could suggest tiering)
      if (serviceName.includes('Amazon S3') && usageType && usageType.includes('Storage') && usageType.includes('Standard') && cost > 20) { // Arbitrary cost threshold for "large"
          opportunities.push({
            id: `S3-TIER-${Date.now()}-${Math.random()}`,
            type: 'S3 Storage Tiering Opportunity',
            resourceId: resourceId || 'N/A',
            cost: cost.toFixed(2),
            issue: `Significant S3 Standard storage cost detected in ${region}.`,
            initialSuggestion: 'Review S3 access patterns. Consider moving infrequently accessed data to S3 Standard-IA or S3 Glacier.',
            aiPlan: null,
            status: 'Detected'
          });
      }
    });

    // Post-process EC2 instances: Flag large/expensive general-purpose instances for review
    for (const id in ec2Instances) {
      if (ec2Instances[id].totalCost > 200 && (ec2Instances[id].type.startsWith('m5') || ec2Instances[id].type.startsWith('t3'))) { // Flag if general purpose and high cost
        opportunities.push({
          id: `EC2-RIGHTSIZE-${id}`,
          type: 'EC2 Right-sizing Candidate',
          resourceId: id,
          cost: ec2Instances[id].totalCost.toFixed(2),
          issue: `EC2 instance '${id}' (${ec2Instances[id].type}, ${ec2Instances[id].region}) has a high cost and might be over-provisioned.`,
          initialSuggestion: 'Analyze CPU, memory, and network utilization via CloudWatch. Consider switching to a smaller instance type or burstable instance (T-series) if utilization is low.',
          aiPlan: null,
          status: 'Detected'
        });
      }
    }

    // Post-process EBS volumes: Add unique EBS opportunities
    for (const id in ebsVolumes) {
        if (ebsVolumes[id].totalCost > 50) { // Re-check threshold after aggregation
            opportunities.push({
                id: `EBS-OPTIMIZE-${id}`,
                type: 'EBS Volume Optimization',
                resourceId: id,
                cost: ebsVolumes[id].totalCost.toFixed(2),
                issue: `High cost detected for EBS volume '${id}' in ${ebsVolumes[id].region}.`,
                initialSuggestion: 'Verify if the volume is attached and actively used. Consider deleting unattached volumes, old snapshots, or optimizing snapshot frequency.',
                aiPlan: null,
                status: 'Detected'
            });
        }
    }

    return opportunities;
  };

  // Function to call AI for detailed optimization plan
  const handleGetAiOptimizationPlan = async (opportunity, index) => {
    setAiPlanLoading(prev => ({ ...prev, [index]: true }));
    try {
      const promptContext = `Provide a detailed, actionable plan for optimizing the following AWS resource:
Type: ${opportunity.type}
Resource ID: ${opportunity.resourceId}
Issue: ${opportunity.issue}
Current Cost: $${opportunity.cost}
Initial Suggestion: ${opportunity.initialSuggestion}

Please provide 3-5 specific, step-by-step actions a user can take to address this.`;

      // --- CRUCIAL: Use ABSOLUTE URL for local backend ---
      const response = await fetch('https://backend-project-190.onrender.com/api/ai/resource-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptContext }),
      });

      if (!response.ok) {
        let errorBody = await response.text();
        try {
          const errorJson = JSON.parse(errorBody);
          errorBody = errorJson.error || errorBody;
        } catch (e) { /* not JSON */ }
        throw new Error(`Backend responded with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json();

      setOptimizationOpportunities(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, aiPlan: data.optimizationPlan || "No specific optimization plan available." } : item
        )
      );
    } catch (error) {
      console.error("Error getting AI optimization plan:", error);
      setOptimizationOpportunities(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, aiPlan: `Error: ${error.message}` } : item
        )
      );
    } finally {
      setAiPlanLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  if (loadingAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-dashboard bg-gray-900 text-blue-400">
        <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-xl">Analyzing resources for optimization opportunities...</p>
      </div>
    );
  }

  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-dashboard p-8 bg-gray-900 text-gray-400">
        <div className="bg-blue-900 border border-blue-400 text-blue-200 px-4 py-3 rounded relative text-center">
          <strong className="font-bold">No Cloud Cost Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline hover:text-blue-100">Upload Data page</Link> to analyze resources.</span>
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
        AI Operations: Resource Optimization
      </motion.h1>

      {optimizationOpportunities.length === 0 ? (
        <motion.div variants={sectionVariants} className="bg-gray-800 rounded-lg shadow-lg p-6 text-center border border-green-600">
          <p className="text-xl font-semibold text-green-400">No immediate resource optimization opportunities found!</p>
          <p className="mt-2 text-gray-300">Your resources appear to be efficiently utilized based on current analysis.</p>
          <p className="mt-2 text-sm text-gray-400">Keep monitoring and check for new AI insights regularly.</p>
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
                {!opportunity.aiPlan ? (
                  <button
                    onClick={() => handleGetAiOptimizationPlan(opportunity, index)}
                    disabled={aiPlanLoading[index]}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200"
                  >
                    {aiPlanLoading[index] ? (
                      <svg className="animate-spin h-5 w-5 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Get AI Optimization Plan'}
                  </button>
                ) : (
                  <div className="mt-2 p-3 bg-gray-700 rounded-md border border-purple-500">
                    <p className="font-semibold text-purple-300">AI Optimization Plan:</p>
                    <p className="text-sm text-gray-200 mt-1">{opportunity.aiPlan}</p>
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

export default ResourceOptimization;
