// src/pages/DisasterRecoveryPlanner.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const DisasterRecoveryPlanner = ({ isDarkMode }) => {
  const [messages, setMessages] = useState([]);
  const [applicationDescription, setApplicationDescription] = useState('');
  const [rto, setRto] = useState(''); // Recovery Time Objective
  const [rpo, setRpo] = useState(''); // Recovery Point Objective
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling chat

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!applicationDescription.trim() || !rto.trim() || !rpo.trim()) {
      alert("Please fill in all fields: Application Description, RTO, and RPO.");
      return;
    }

    const userQuery = `Application: "${applicationDescription}", RTO: "${rto}", RPO: "${rpo}"`;
    setMessages(prevMessages => [...prevMessages, { sender: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const promptContext = `As an expert AWS Cloud Resilience Architect, design a Disaster Recovery (DR) strategy for the following application based on the user's Recovery Time Objective (RTO) and Recovery Point Objective (RPO):
      Application Description: "${applicationDescription}"
      Recovery Time Objective (RTO): "${rto}"
      Recovery Point Objective (RPO): "${rpo}"

      Your response should cover:
      1.  **Recommended DR Pattern(s):** Suggest 1-2 suitable AWS DR patterns (e.g., Backup & Restore, Pilot Light, Warm Standby, Multi-Region Active/Active) and briefly explain why they fit.
      2.  **Key AWS Services Involved:** List the main AWS services required for this pattern.
      3.  **Trade-offs & Considerations:** Discuss the implications regarding cost, complexity, data consistency, and operational overhead.
      4.  **High-Level Implementation Steps:** Provide a conceptual overview of the steps to implement this strategy.
      Format your response clearly with bolded headings for each section and use bullet points where appropriate. Keep the overall response comprehensive but concise.`;

      const response = await fetch('https://backend-project-190.onrender.com/api/ai/dr-planner', {
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
      setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: data.drPlan || "Sorry, I couldn't generate a DR plan for that scenario." }]);

    } catch (error) {
      console.error("Error getting AI DR plan:", error);
      setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const chatContainerBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const chatBubbleUserBgClass = isDarkMode ? 'bg-blue-700 text-blue-100' : 'bg-blue-500 text-white';
  const chatBubbleAIBgClass = isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800';
  const inputBgClass = isDarkMode ? 'bg-gray-700 text-gray-100 placeholder-gray-400' : 'bg-gray-100 text-gray-800 placeholder-gray-500';
  const inputBorderClass = isDarkMode ? 'border-gray-600 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500';
  const buttonBgClass = isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600';
  const headerColorClass = isDarkMode ? 'text-blue-400' : 'text-blue-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen-dashboard bg-gray-900 text-gray-100 flex flex-col"
    >
      <h1 className={`text-3xl sm:text-4xl font-bold mb-8 ${headerColorClass}`}>
        AI Strategic Planning: Disaster Recovery Planner
      </h1>

      <div className={`flex-grow flex flex-col ${chatContainerBgClass} rounded-lg shadow-lg border border-gray-700 overflow-hidden`}>
        <div className="p-4 border-b border-gray-700 text-lg font-semibold text-center text-blue-300">
          Describe your application, RTO, and RPO to get a tailored DR plan.
        </div>
        <div className="p-4 space-y-4">
          <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="col-span-full md:col-span-1">
              <label htmlFor="appDesc" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Application Description:
              </label>
              <textarea
                id="appDesc"
                value={applicationDescription}
                onChange={(e) => setApplicationDescription(e.target.value)}
                placeholder="e.g., 'A mission-critical e-commerce platform with a relational database and S3 for static assets.'"
                className={`w-full p-2 rounded-md focus:outline-none focus:ring-2 ${inputBgClass} ${inputBorderClass} h-24 resize-y`}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="rto" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Recovery Time Objective (RTO):
              </label>
              <input
                type="text"
                id="rto"
                value={rto}
                onChange={(e) => setRto(e.target.value)}
                placeholder="e.g., '1 hour' or '15 minutes'"
                className={`w-full p-2 rounded-md focus:outline-none focus:ring-2 ${inputBgClass} ${inputBorderClass}`}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="rpo" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Recovery Point Objective (RPO):
              </label>
              <input
                type="text"
                id="rpo"
                value={rpo}
                onChange={(e) => setRpo(e.target.value)}
                placeholder="e.g., '5 minutes' or '24 hours'"
                className={`w-full p-2 rounded-md focus:outline-none focus:ring-2 ${inputBgClass} ${inputBorderClass}`}
                disabled={loading}
                required
              />
            </div>
            <div className="col-span-full text-right">
              <button
                type="submit"
                className={`px-6 py-3 rounded-md text-white font-semibold transition-colors duration-200 ${buttonBgClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                Generate DR Plan
              </button>
            </div>
          </form>
        </div>

        <div className="flex-grow p-4 overflow-y-auto space-y-4 border-t border-gray-700">
          {messages.length === 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`p-3 rounded-lg max-w-[80%] self-start ${chatBubbleAIBgClass}`}
            >
              Hi! I'm your AI DR Planner. Tell me about your application and your desired recovery objectives, and I'll suggest a robust Disaster Recovery strategy.
            </motion.div>
          )}

          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'self-end ml-auto' : 'self-start mr-auto'} ${msg.sender === 'user' ? chatBubbleUserBgClass : chatBubbleAIBgClass}`}
            >
              {/* Render AI response using dangerouslySetInnerHTML to allow Markdown formatting */}
              {msg.sender === 'ai' ? (
                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              ) : (
                msg.text
              )}
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`p-3 rounded-lg max-w-[80%] self-start ${chatBubbleAIBgClass}`}
            >
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 text-gray-400 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Designing DR plan...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </motion.div>
  );
};

export default DisasterRecoveryPlanner;
