// src/pages/CloudCareerGuide.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const CloudCareerGuide = ({ isDarkMode }) => {
  const [messages, setMessages] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling chat

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGenerateGuide = async (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const newUserMessage = { sender: 'user', text: userQuery.trim() };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserQuery('');
    setLoading(true);

    try {
      const promptContext = `As an expert AI Cloud Career Advisor, provide guidance for the user's cloud career goals. Based on their input, suggest relevant cloud roles, essential skills, recommended certifications, and a general roadmap to achieve their aspirations.
      
      User's Background/Goal: "${newUserMessage.text}"
      
      Structure your response clearly with bolded headings for each section:
      1.  **Suggested Cloud Roles:** (list 1-3 roles with brief descriptions)
      2.  **Key Skills Required:** (list 5-7 technical and soft skills)
      3.  **Recommended Certifications:** (list 1-3 relevant cloud certifications, e.g., AWS Certified Solutions Architect - Associate)
      4.  **Learning Roadmap:** (provide a step-by-step general guide, e.g., "Learn fundamentals...", "Gain hands-on experience...", "Network with professionals...")
      
      Ensure the advice is practical and actionable. If the input is too vague, ask for more details on current experience or specific interests.`;

      const response = await fetch('https://backend-project-190.onrender.com/api/ai/cloud-career-guide', {
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
      setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: data.careerGuideContent || "Sorry, I couldn't generate a career guide for that query." }]);

    } catch (error) {
      console.error("Error generating AI career guide:", error);
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
        CloudCoach: Cloud Career Guide AI
      </h1>

      <div className={`flex-grow flex flex-col ${chatContainerBgClass} rounded-lg shadow-lg border border-gray-700 overflow-hidden`}>
        <div className="p-4 border-b border-gray-700 text-lg font-semibold text-center text-blue-300">
          Tell me about your career goals or background, and I'll suggest cloud roles, skills, and a roadmap!
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`p-3 rounded-lg max-w-[80%] self-start ${chatBubbleAIBgClass}`}
            >
              Hello! I'm your AI Cloud Career Advisor. What are your cloud career aspirations, or what's your current experience level?
              <p className="text-xs mt-1 opacity-80">
                (e.g., "I'm a software developer interested in DevOps.", "I want to become a Solutions Architect with no prior cloud experience.", "I'm an IT admin looking to specialize in cloud security.")
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
                Generating career guide...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleGenerateGuide} className="p-4 border-t border-gray-700 flex">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="e.g., 'I want to be a Cloud Architect', 'I have 5 years in IT support and want to move into cloud operations', 'What's the best path for a cloud developer?'"
            className={`flex-grow p-3 rounded-l-md focus:outline-none focus:ring-2 ${inputBgClass} ${inputBorderClass} h-24 resize-y`}
            disabled={loading}
          />
          <button
            type="submit"
            className={`px-6 py-3 rounded-r-md text-white font-semibold transition-colors duration-200 ${buttonBgClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            Get Guide
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default CloudCareerGuide;
