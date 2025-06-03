// cloud-cost-dashboard-frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // <--- THIS LINE IS CRUCIAL FOR GLOBAL CSS

// --- Firebase Imports and Initialization ---
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Import getAuth for authentication service

// Paste your Firebase config object here from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCBUjPchCCHhHnCsUDH5l5g1ruPgg940N0",
  authDomain: "cloudcostai-b2c9b.firebaseapp.com",
  projectId: "cloudcostai-b2c9b",
  storageBucket: "cloudcostai-b2c9b.firebasestorage.app",
  messagingSenderId: "1061077303509",
  appId: "1:1061077303509:web:3550061329dea78aa4a25c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Get the Auth service instance
export const auth = getAuth(app); // Export auth so it can be used in other components
// --- End Firebase Initialization ---

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
