// cloud-cost-dashboard-frontend/src/pages/CostChat.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Import useMemo
import { Link } from 'react-router-dom';

const CostChat = ({ parsedCsvData }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // FIX: Changed useEffect to useMemo for calculating summarizedDataForAI
  const summarizedDataForAI = useMemo(() => {
    if (!parsedCsvData || parsedCsvData.length === 0) return null;

    const serviceCosts = {};
    let totalOverallCost = 0;

    // Limit the data processed for chat context to avoid very large prompts
    const processedData = parsedCsvData.slice(0, 5000); // Process first 5000 rows for chat context

    processedData.forEach(row => {
      const cost = parseFloat(row.lineItemUnblendedCost) || 0;
      const service = row.productProductFamily || row.productServiceCode || 'Unknown Service';
      if (cost > 0) {
        totalOverallCost += cost;
        serviceCosts[service] = (serviceCosts[service] || 0) + cost;
      }
    });

    const topServices = Object.entries(serviceCosts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([service, cost]) => `${service}: $${cost.toFixed(2)}`)
      .join(', ');

    return {
      totalOverallCost: totalOverallCost.toFixed(2),
      topServices: topServices,
      numRowsProcessed: processedData.length,
      dataTruncated: parsedCsvData.length > 5000,
    };
  }, [parsedCsvData]); // Dependency array for useMemo

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMessage = { sender: 'user', text: currentMessage };
    setChatHistory((prev) => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    setError(null);

    if (!parsedCsvData || parsedCsvData.length === 0) {
      setError("Please upload a CSV file first to provide context for the AI.");
      setIsLoading(false);
      return;
    }

    // Ensure summarizedDataForAI is not null before sending
    if (!summarizedDataForAI) {
      setError("Data not yet summarized. Please upload a CSV.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        userQuestion: userMessage.text,
        csvContext: summarizedDataForAI, // Send the summarized context to the backend
      };

      const response = await fetch('https://backend-project-190.onrender.com/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || 'Server error'}`);
      }

      const result = await response.json();
      setChatHistory((prev) => [...prev, { sender: 'ai', text: result.answer }]); // Assuming backend returns { answer: "AI text" }
    } catch (err) {
      console.error("Error fetching AI chat response:", err);
      setError(`Failed to get AI response: ${err.message}. Ensure backend is running.`);
      setChatHistory((prev) => [...prev, { sender: 'ai', text: `Error: ${err.message}` }]); // Show error in chat
    } finally {
      setIsLoading(false);
    }
  };

  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Ask the Cost AI</h2>
        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No CSV Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline">Upload CSV page</Link> to enable the AI chat.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-[70vh]"> {/* Set a fixed height for chat container */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Ask the Cost AI</h2>

      {/* Chat History Display */}
      <div className="flex-1 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700">
        {chatHistory.length === 0 && !isLoading && (
          <p className="text-gray-500 dark:text-gray-400 text-center italic">
            Ask me anything about your AWS costs! (e.g., "What was my highest cost service last month?", "Why is EC2 so expensive?")
          </p>
        )}
        {chatHistory.map((msg, index) => (
          <div key={index} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[80%] ${
              msg.sender === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center items-center">
            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600 dark:text-gray-300">AI is thinking...</span>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center mt-2">Error: {error}</div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Ask a question about your AWS costs..."
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default CostChat;
