// cloud-cost-dashboard-frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../main.jsx'; // Import the auth instance from main.jsx
import { motion } from 'framer-motion'; // Import motion from framer-motion

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation variants for the login card entry
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut", delay: 0.2 } },
  };

  // Animation variants for text elements (staggered fade-in)
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  // Animation variants for the Google button (initial pulse, hover, tap)
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.8, // Delay after card and text
      },
      // Initial pulse animation
      pulse: {
        scale: [1, 1.02, 1], // Scale up slightly and back
        boxShadow: ["0 0 0px rgba(0, 0, 0, 0)", "0 0 20px rgba(59, 130, 246, 0.7)", "0 0 0px rgba(0, 0, 0, 0)"], // Blue shadow pulse
        transition: {
          duration: 2,
          repeat: Infinity, // Keep pulsing
          ease: "easeInOut",
          delay: 1.5, // Start pulsing after initial entry animation
        },
      },
    },
    hover: {
      scale: 1.05, // More pronounced scale on hover
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)", // More pronounced shadow
      backgroundPosition: "100% 0%", // Shift gradient on hover
      transition: { duration: 0.3, ease: "easeOut" },
    },
    tap: {
      scale: 0.95, // More pronounced scale on tap
      transition: { duration: 0.1 },
    },
  };

  // Animation variants for error message shake
  const errorShakeVariants = {
    hidden: { opacity: 0, x: 0 },
    shake: {
      opacity: 1,
      x: [-8, 8, -8, 8, 0], // Shake left and right
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in process cancelled. Please try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Failed to sign in with Google: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Outer container with solid dark background color matching screenshot
    // Removed dark:bg-gray-800 and transition-colors to set a fixed dark background
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      {/* Removed the motion.div for animated background gradients as per screenshot */}
      {/* The background is now a solid dark gray as per the parent div */}

      <motion.div
        // Changed background to dark gray to match screenshot
        className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md text-center z-10"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <motion.h2
          // Adjusted text color for visibility on dark background
          className="text-3xl font-bold mb-4 text-blue-400" // Explicit text color for dark background
          variants={textVariants}
        >
          Welcome to Cloud Cost AI
        </motion.h2>
        <motion.p
          // Adjusted text color for visibility on dark background
          className="mb-8 text-gray-300 text-sm" // Explicit text color for dark background
          variants={textVariants}
        >
          Sign in to access your cost optimization tools.
        </motion.p>

        <motion.button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-6 py-3 rounded-md shadow-lg text-lg font-medium text-white
                     bg-gradient-to-r from-blue-500 to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundSize: '200% 100%' }} // Ensure background is larger for panning effect on hover
          variants={buttonVariants}
          initial="hidden"
          animate={isLoading ? "visible" : ["visible", "pulse"]} // Animate to visible, then pulse
          whileHover="hover"
          whileTap="tap"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="h-6 w-6 mr-3 bg-white p-1 rounded-full" />
              Continue with Google
            </>
          )}
        </motion.button>

        {error && (
          <motion.div
            id="error-message"
            className="mt-6 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative"
            initial="hidden"
            animate="shake" // Trigger shake animation when error is present
            variants={errorShakeVariants}
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
