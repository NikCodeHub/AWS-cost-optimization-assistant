// src/pages/ServiceDecisionWizard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const ServiceDecisionWizard = ({ isDarkMode }) => {
  const [messages, setMessages] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling chat

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const newUserMessage = { sender: 'user', text: userQuery.trim() };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserQuery('');
    setLoading(true);

    try {
      const promptContext = `As an expert Cloud Service Advisor for AWS, analyze the following user query regarding service selection. Provide a balanced comparison (pros and cons) for each option mentioned or implied, and then offer a clear recommendation based on general best practices for modern cloud applications. If the user's input is vague, highlight assumptions.
      
      User's Query: "${newUserMessage.text}"
      
      Structure your response clearly with bolded headings for each service, followed by Pros and Cons using bullet points. Conclude with a clear "Recommendation:".`;

      const response = await fetch('https://backend-project-190.onrender.com/api/ai/service-decision', {
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
      setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: data.serviceDecision || "Sorry, I couldn't provide a service decision guide for that query." }]);

    } catch (error) {
      console.error("Error getting AI service decision:", error);
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
        CloudCoach: Service Decision Wizard
      </h1>

      <div className={`flex-grow flex flex-col ${chatContainerBgClass} rounded-lg shadow-lg border border-gray-700 overflow-hidden`}>
        <div className="p-4 border-b border-gray-700 text-lg font-semibold text-center text-blue-300">
          Ask me to compare cloud services and help you make a decision!
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`p-3 rounded-lg max-w-[80%] self-start ${chatBubbleAIBgClass}`}
            >
              Hello! I'm your Service Decision Wizard. What cloud services are you trying to choose between today?
              <p className="text-xs mt-1 opacity-80">
                (e.g., "Should I use Fargate, Lambda, or EC2 for a new web application?", "Aurora vs. RDS PostgreSQL for a high-transaction database?")
              </p>
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
                Analyzing service options...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="e.g., 'What are the trade-offs between SQS and SNS for messaging?', 'Which database should I use for a high-write IoT application?'"
            className={`flex-grow p-3 rounded-l-md focus:outline-none focus:ring-2 ${inputBgClass} ${inputBorderClass} h-24 resize-y`}
            disabled={loading}
          />
          <button
            type="submit"
            className={`px-6 py-3 rounded-r-md text-white font-semibold transition-colors duration-200 ${buttonBgClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            Get Advice
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ServiceDecisionWizard;
