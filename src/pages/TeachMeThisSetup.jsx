// src/pages/TeachMeThisSetup.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const TeachMeThisSetup = ({ isDarkMode }) => {
  const [messages, setMessages] = useState([]);
  const [userTopic, setUserTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling chat

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userTopic.trim()) return;

    const newUserMessage = { sender: 'user', text: userTopic.trim() };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserTopic('');
    setLoading(true);

    try {
      const promptContext = `As an expert AI Cloud Tutor, provide a comprehensive and structured explanation for the following AWS cloud service or concept: "${newUserMessage.text}".
      Your explanation should cover the following sections clearly:
      1.  **What it is:** A concise definition and purpose.
      2.  **How it works:** A simplified explanation of its core mechanics and typical usage.
      3.  **Why it might be configured this way:** Common use cases, advantages of specific configurations, and design patterns.
      4.  **What could go wrong:** Common pitfalls, misconfigurations, or potential issues (e.g., security, performance, cost).
      
      Format your response with bolded headings for each section and use bullet points for lists. Aim for clarity and detail suitable for someone learning about the topic. Start directly with the explanation.`;

      const response = await fetch('https://backend-project-190.onrender.com/api/ai/teach-me-setup', {
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
      setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: data.learningContent || "Sorry, I couldn't provide learning content for that topic." }]);

    } catch (error) {
      console.error("Error getting AI learning content:", error);
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
        CloudCoach: Teach Me This Setup
      </h1>

      <div className={`flex-grow flex flex-col ${chatContainerBgClass} rounded-lg shadow-lg border border-gray-700 overflow-hidden`}>
        <div className="p-4 border-b border-gray-700 text-lg font-semibold text-center text-blue-300">
          Tell me which cloud service or concept you want to learn about!
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`p-3 rounded-lg max-w-[80%] self-start ${chatBubbleAIBgClass}`}
            >
              Hello! I'm your AI Cloud Tutor. What AWS service or concept do you want to master today?
              <p className="text-xs mt-1 opacity-80">
                (e.g., "What is S3?", "Explain Lambda functions?", "How does a VPC work?")
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
                Generating learning content...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex">
          <textarea
            value={userTopic}
            onChange={(e) => setUserTopic(e.target.value)}
            placeholder="e.g., 'DynamoDB', 'VPC Peering', 'CloudFront CDN'"
            className={`flex-grow p-3 rounded-l-md focus:outline-none focus:ring-2 ${inputBgClass} ${inputBorderClass} h-24 resize-y`}
            disabled={loading}
          />
          <button
            type="submit"
            className={`px-6 py-3 rounded-r-md text-white font-semibold transition-colors duration-200 ${buttonBgClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            Teach Me!
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default TeachMeThisSetup;
