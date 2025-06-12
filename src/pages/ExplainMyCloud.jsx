// src/pages/ExplainMyCloud.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const ExplainMyCloud = ({ isDarkMode }) => {
  const [messages, setMessages] = useState([]);
  const [userConfig, setUserConfig] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling chat

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userConfig.trim()) return;

    const newUserMessage = { sender: 'user', text: userConfig.trim() };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserConfig('');
    setLoading(true);

    try {
      const promptContext = `As an expert Cloud Infrastructure Interpreter and Consultant, your task is to explain the following cloud infrastructure configuration or architectural description in natural, easy-to-understand language. Focus on what it does, the main components, and how they interact.
      If it's code (like Terraform, CloudFormation, YAML), interpret the intent. If it's a description, explain the conceptual setup.
      Do not include code in your explanation, only natural language.
      Structure your explanation clearly with paragraphs or bullet points for readability.
      
      User's Cloud Configuration/Description:
      "${newUserMessage.text}"`;

      const response = await fetch('https://backend-project-190.onrender.com/api/ai/explain-cloud', {
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
      setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: data.explanation || "Sorry, I couldn't explain that cloud configuration." }]);

    } catch (error) {
      console.error("Error getting AI explanation:", error);
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
        CloudCoach: Explain My Cloud
      </h1>

      <div className={`flex-grow flex flex-col ${chatContainerBgClass} rounded-lg shadow-lg border border-gray-700 overflow-hidden`}>
        <div className="p-4 border-b border-gray-700 text-lg font-semibold text-center text-blue-300">
          Paste your cloud config (Terraform, CloudFormation, YAML) or describe your architecture, and I'll explain it!
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`p-3 rounded-lg max-w-[80%] self-start ${chatBubbleAIBgClass}`}
            >
              Hello! I'm your AI Cloud Interpreter. Paste your infrastructure code or describe your cloud setup, and I'll break it down for you.
              <p className="text-xs mt-1 opacity-80">
                (e.g., "Explain this Terraform: resource aws_s3_bucket...", "Describe a microservices architecture on AWS with containers and serverless functions.")
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
              {/* Render AI response using dangerouslySetInnerHTML to allow Markdown formatting (e.g., lists, bold) */}
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
                Interpreting cloud configuration...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex">
          <textarea
            value={userConfig}
            onChange={(e) => setUserConfig(e.target.value)}
            placeholder="Paste your cloud configuration or describe your architecture here..."
            className={`flex-grow p-3 rounded-l-md focus:outline-none focus:ring-2 ${inputBgClass} ${inputBorderClass} h-32 resize-y`}
            disabled={loading}
          />
          <button
            type="submit"
            className={`px-6 py-3 rounded-r-md text-white font-semibold transition-colors duration-200 ${buttonBgClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            Explain My Cloud
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ExplainMyCloud;
