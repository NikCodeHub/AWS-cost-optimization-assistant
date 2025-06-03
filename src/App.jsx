// cloud-cost-dashboard-frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Estimator from './pages/Estimator';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import UsageTable from './pages/UsageTable';
import ResourceAdvisor from './pages/ResourceAdvisor';
import CostChat from './pages/CostChat';
import AnomalyDetection from './pages/AnomalyDetection';
import CostForecast from './pages/CostForecast';
import Login from './pages/Login';
import Header from './components/Header'; // Assuming Header is still used for authenticated routes

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './main.jsx'; // Import the auth instance

function App() {
  const [parsedCsvData, setParsedCsvData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Set to TRUE for fixed dark mode
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Effect to ALWAYS apply 'dark' class to the document HTML element
  // as dark mode is now fixed for the entire app.
  useEffect(() => {
    document.documentElement.classList.add('dark');
    // No need for else { remove } as it's always dark
  }, []); // Empty dependency array means this runs once on mount

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Removed toggleDarkMode as dark mode is fixed

  const handleCsvParsed = (data) => {
    setParsedCsvData(data);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setParsedCsvData(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const navLinks = [
    { name: 'Upload CSV', path: '/upload', requiresAuth: true },
    { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
    { name: 'Detailed Usage', path: '/usage', requiresAuth: true },
    { name: 'Resource Advisor', path: '/resources', requiresAuth: true },
    { name: 'Cost Estimator', path: '/estimator', requiresAuth: true },
    { name: 'AI Insights', path: '/insights', requiresAuth: true },
    { name: 'Ask the Cost AI', path: '/chat', requiresAuth: true },
    { name: 'Anomaly Detection', path: '/anomalies', requiresAuth: true },
    { name: 'Cost Forecast', path: '/forecast', requiresAuth: true },
    { name: 'Settings', path: '/settings', requiresAuth: true },
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
      {/* Set main app background to dark gray consistently */}
      <div className="flex min-h-screen bg-gray-900 transition-none"> {/* bg-gray-900 fixed, no transition */}
        {/* Sidebar content */}
        <aside className="w-64 bg-gray-800 shadow-lg p-6 flex flex-col justify-between"> {/* Fixed dark sidebar */}
          <div>
            <div className="text-2xl font-bold mb-8 text-blue-400"> {/* Adjusted text color for dark mode */}
              Cloud Cost AI
            </div>
            <nav>
              <ul>
                {currentUser ? (
                  navLinks.map((link) => (
                    <li key={link.name} className="mb-4">
                      <NavLink
                        to={link.path}
                        className={({ isActive }) =>
                          `flex items-center p-3 rounded-lg transition-colors duration-200
                          ${isActive
                            ? 'bg-blue-700 text-blue-100 font-semibold' // Dark mode active link
                            : 'text-gray-300 hover:bg-gray-700' // Dark mode default/hover
                          }`
                        }
                      >
                        {link.name}
                      </NavLink>
                    </li>
                  ))
                ) : (
                  <li className="mb-4">
                    <NavLink
                      to="/login"
                      className={({ isActive }) =>
                        `flex items-center p-3 rounded-lg transition-colors duration-200
                        ${isActive
                          ? 'bg-blue-700 text-blue-100 font-semibold' // Dark mode active link
                          : 'text-gray-300 hover:bg-gray-700' // Dark mode default/hover
                        }`
                      }
                    >
                      Login
                    </NavLink>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          {/* User Info at the bottom (no dark mode toggle here) */}
          <div className="mt-8">
            {currentUser && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg text-gray-200 text-sm"> {/* Dark mode user info bg/text */}
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
            {/* Removed Dark Mode Toggle from sidebar as per request */}
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-grow p-8">
          {/* Header component only rendered when authenticated */}
          {!authLoading && currentUser && (
            <Header
              currentUser={currentUser}
              handleLogout={handleLogout}
              isDarkMode={isDarkMode} // Pass isDarkMode for Header's internal styling
              // Removed toggleDarkMode prop as it's no longer functional
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
            <Route path="/upload" element={<PrivateRoute><Upload onCsvParsed={handleCsvParsed} /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard parsedCsvData={parsedCsvData} isDarkMode={isDarkMode} /></PrivateRoute>} />
            <Route path="/estimator" element={<PrivateRoute><Estimator /></PrivateRoute>} />
            <Route path="/insights" element={<PrivateRoute><Insights parsedCsvData={parsedCsvData} /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/usage" element={<PrivateRoute><UsageTable parsedCsvData={parsedCsvData} /></PrivateRoute>} />
            <Route path="/resources" element={<PrivateRoute><ResourceAdvisor parsedCsvData={parsedCsvData} /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><CostChat parsedCsvData={parsedCsvData} /></PrivateRoute>} />
            <Route path="/anomalies" element={<PrivateRoute><AnomalyDetection parsedCsvData={parsedCsvData} /></PrivateRoute>} />
            <Route path="/forecast" element={<PrivateRoute><CostForecast parsedCsvData={parsedCsvData} isDarkMode={isDarkMode} /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
