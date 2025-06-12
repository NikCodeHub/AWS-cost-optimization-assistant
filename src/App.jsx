// cloud-cost-dashboard-frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Estimator from './pages/Estimator';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import UsageTable from './pages/UsageTable';
import CostSavingsPanel from './pages/CostSavingsPanel';
import AnomalyDetection from './pages/AnomalyDetection';
import CostForecast from './pages/CostForecast';
import Login from './pages/Login';
import Header from './components/Header'; // Assuming Header is still used for authenticated routes

// Core AI-powered components for broader vision
import CloudExpertChat from './pages/CloudExpertChat';
import ResourceOptimization from './pages/ResourceOptimization';
import TroubleshootingAssistant from './pages/TroubleshootingAssistant';
import ArchitectureAssistant from './pages/ArchitectureAssistant';
import SecurityComplianceAdvisor from './pages/SecurityComplianceAdvisor';
import OperationsPlaybookGenerator from './pages/OperationsPlaybookGenerator';
import IamAccessSimplifier from './pages/IamAccessSimplifier';
import DisasterRecoveryPlanner from './pages/DisasterRecoveryPlanner';

// CloudCoach Module Components
import ExplainMyCloud from './pages/ExplainMyCloud';
import TeachMeThisSetup from './pages/TeachMeThisSetup';
import ServiceDecisionWizard from './pages/ServiceDecisionWizard';
import SecurityPolicyExplainer from './pages/SecurityPolicyExplainer';
import CloudCourseGenerator from './pages/CloudCourseGenerator';
import InteractiveCloudLabs from './pages/InteractiveCloudLabs';
import FlashcardsQuizzes from './pages/FlashcardsQuizzes';
import CloudCareerGuide from './pages/CloudCareerGuide'; // NEW: Import CloudCareerGuide

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './main.jsx'; // Import the auth instance

function App() {
  const [parsedCsvData, setParsedCsvData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Set to TRUE for fixed dark mode
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Effect to ALWAYS apply 'dark' class to the document HTML element
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCsvParsed = (data) => {
    setParsedCsvData(data);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setParsedCsvData(null); // Clear data on logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Define the new, grouped navigation links
  const navStructure = [
    { name: 'Overall Dashboard', path: '/dashboard', icon: '📊', type: 'link' },
    { name: 'AI Cost Management', type: 'group' },
    { name: 'Upload Data', path: '/upload', icon: '⬆️', type: 'link' },
    { name: 'Detailed Usage', path: '/usage', icon: '📋', type: 'link' },
    { name: 'Cost Savings Advisor', path: '/savings', icon: '💸', type: 'link' },
    { name: 'Cost Estimator', path: '/estimator', icon: '➕', type: 'link' },
    { name: 'AI Insights', path: '/insights', icon: '💡', type: 'link' },
    { name: 'Anomaly Detection', path: '/anomalies', icon: '⚠️', type: 'link' },
    { name: 'Cost Forecast', path: '/forecast', icon: '📈', type: 'link' },
    { name: 'AI Operations & Management', type: 'group' },
    { name: 'Resource Optimization', path: '/resource-optimization', icon: '⚙️', type: 'link' },
    { name: 'Troubleshooting Assistant', path: '/troubleshooting', icon: '❓', type: 'link' },
    { name: 'Security & Compliance', path: '/security-compliance', icon: '🔒', type: 'link' },
    { name: 'Operational Playbooks', path: '/operational-playbooks', icon: ' playbook-icon', type: 'link' },
    { name: 'IAM & Access Simplifier', path: '/iam-simplifier', icon: '🔑', type: 'link' },
    { name: 'AI Strategic Planning', type: 'group' },
    { name: 'Architecture Assistant', path: '/architecture-assistant', icon: '🏗️', type: 'link' },
    { name: 'Disaster Recovery Planner', path: '/dr-planner', icon: '🌐', type: 'link' },
    { name: 'Cloud Expert Chat', path: '/chat', icon: '💬', type: 'link' },
    // CloudCoach Group
    { name: 'CloudCoach', type: 'group' },
    { name: 'Explain My Cloud', path: '/explain-my-cloud', icon: '☁️', type: 'link' },
    { name: 'Teach Me This Setup', path: '/teach-me-this-setup', icon: '📚', type: 'link' },
    { name: 'Service Decision Wizard', path: '/service-decision', icon: '✨', type: 'link' },
    { name: 'Security Policy Explainer', path: '/security-policy-explainer', icon: '🛡️', type: 'link' },
    { name: 'AI-Powered Course Generator', path: '/cloud-course-generator', icon: '🎓', type: 'link' },
    { name: 'Interactive Cloud Labs', path: '/interactive-cloud-labs', icon: '🧪', type: 'link' },
    { name: 'Flashcards & Quizzes', path: '/flashcards-quizzes', icon: '🧠', type: 'link' },
    { name: 'Cloud Career Guide AI', path: '/cloud-career-guide', icon: '🛣️', type: 'link' }, // NEW ITEM under CloudCoach
    { name: 'Settings', path: '/settings', icon: '⚙️', type: 'link' },
  ];

  const PrivateRoute = ({ children }) => {
    if (authLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-blue-500 dark:text-blue-400">
          <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-xl">Loading user session...</p>
        </div>
      );
    }
    return currentUser ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-900 transition-none">
        <aside className="w-64 bg-gray-800 shadow-lg p-6 flex flex-col justify-between">
          <div>
            <div className="text-2xl font-bold mb-8 text-blue-400">
              AI Cloud Assistant
            </div>
            <nav>
              <ul>
                {currentUser ? (
                  navStructure.map((item, index) => (
                    item.type === 'group' ? (
                      <li key={index} className="mt-6 mb-2 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                        {item.name}
                      </li>
                    ) : (
                      <li key={item.name} className="mb-2">
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center p-3 rounded-lg transition-colors duration-200
                            ${isActive
                              ? 'bg-blue-700 text-blue-100 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700'
                            }`
                          }
                        >
                          {/* Conditional rendering for custom SVG playbook icon */}
                          {item.icon === ' playbook-icon' ? (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 0 0 1 3-3h7z"></path>
                             </svg>
                          ) : (
                            <span className="mr-3 text-lg">{item.icon}</span>
                          )}
                           {item.name}
                        </NavLink>
                      </li>
                    )
                  ))
                ) : (
                  <li className="mb-4">
                    <NavLink
                      to="/login"
                      className={({ isActive }) =>
                        `flex items-center p-3 rounded-lg transition-colors duration-200
                        ${isActive
                          ? 'bg-blue-700 text-blue-100 font-semibold'
                          : 'text-gray-300 hover:bg-gray-700'
                        }`
                      }
                    >
                      <span className="mr-3 text-lg">🔑</span> Login
                    </NavLink>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          <div className="mt-8">
            {currentUser && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg text-gray-200 text-sm">
                <p className="font-semibold">Logged in as:</p>
                <p className="truncate">{currentUser.displayName || currentUser.email || 'User'}</p>
                {currentUser.photoURL && (
                  <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full mt-2" />
                )}
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-grow p-8">
          {!authLoading && currentUser && (
            <Header
              currentUser={currentUser}
              handleLogout={handleLogout}
              isDarkMode={isDarkMode}
            />
          )}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              authLoading ? (
                <div className="flex flex-col items-center justify-center min-h-screen text-blue-500 dark:text-blue-400">
                  <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-xl">Loading user session...</p>
                </div>
              ) : (
                currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
              )
            } />
            {/* AI Cost Management Routes */}
            <Route path="/upload" element={<PrivateRoute><Upload onCsvParsed={handleCsvParsed} /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard parsedCsvData={parsedCsvData} isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/usage" element={<PrivateRoute><UsageTable parsedCsvData={parsedCsvData} /></PrivateRoute>} />
            <Route path="/savings" element={<PrivateRoute><CostSavingsPanel parsedCsvData={parsedCsvData} isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/estimator" element={<PrivateRoute><Estimator parsedCsvData={parsedCsvData} /></PrivateRoute>} />
            <Route path="/insights" element={<PrivateRoute><Insights parsedCsvData={parsedCsvData} /></PrivateRoute>} />
            <Route path="/anomalies" element={<PrivateRoute><AnomalyDetection parsedCsvData={parsedCsvData} isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/forecast" element={<PrivateRoute><CostForecast parsedCsvData={parsedCsvData} isDarkMode={isDarkMode} /></PrivateRoute>} />
            {/* AI Operations & Management Routes */}
            <Route path="/resource-optimization" element={<PrivateRoute><ResourceOptimization parsedCsvData={parsedCsvData} isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/troubleshooting" element={<PrivateRoute><TroubleshootingAssistant isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/security-compliance" element={<PrivateRoute><SecurityComplianceAdvisor isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/operational-playbooks" element={<PrivateRoute><OperationsPlaybookGenerator isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/iam-simplifier" element={<PrivateRoute><IamAccessSimplifier isDarkMode={isDarkMode} /></PrivateRoute>} />
            {/* AI Strategic Planning Routes */}
            <Route path="/architecture-assistant" element={<PrivateRoute><ArchitectureAssistant isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/dr-planner" element={<PrivateRoute><DisasterRecoveryPlanner isDarkMode={isDarkMode} /></PrivateRoute>} />
            {/* CloudCoach Routes */}
            <Route path="/explain-my-cloud" element={<PrivateRoute><ExplainMyCloud isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/teach-me-this-setup" element={<PrivateRoute><TeachMeThisSetup isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/service-decision" element={<PrivateRoute><ServiceDecisionWizard isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/security-policy-explainer" element={<PrivateRoute><SecurityPolicyExplainer isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/cloud-course-generator" element={<PrivateRoute><CloudCourseGenerator isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/interactive-cloud-labs" element={<PrivateRoute><InteractiveCloudLabs isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/flashcards-quizzes" element={<PrivateRoute><FlashcardsQuizzes isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/cloud-career-guide" element={<PrivateRoute><CloudCareerGuide isDarkMode={isDarkMode} /></PrivateRoute>} /> {/* Route for Cloud Career Guide */}
            <Route path="/chat" element={<PrivateRoute><CloudExpertChat parsedCsvData={parsedCsvData} isDarkMode={isDarkMode} /></PrivateRoute>} />
            {/* General Settings */}
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
