// cloud-cost-dashboard-frontend/src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { SunIcon, MoonIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Header = ({ currentUser, handleLogout, isDarkMode, toggleDarkMode }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (user) => {
    if (user.displayName) {
      const names = user.displayName.split(' ');
      if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U'; // Default for unknown user
  };

  return (
    <header className="flex items-center justify-end p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg mb-8 relative">
      {/* User Info and Logout Button */}
      {currentUser && (
        <div className="relative flex items-center space-x-4">
          {/* User Avatar/Initials */}
          <button
            ref={buttonRef}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white dark:bg-blue-600 dark:text-gray-100 text-lg font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            aria-label="User menu"
          >
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(currentUser)
            )}
          </button>

          {/* User Menu Popover */}
          {showUserMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-3 z-10 border border-gray-200 dark:border-gray-600"
            >
              <div className="px-4 py-2 text-gray-800 dark:text-gray-100 text-sm">
                <p className="font-semibold text-base mb-1">Hi, {currentUser.displayName || 'User'}!</p>
                <p className="text-gray-600 dark:text-gray-300 truncate">{currentUser.email}</p>
              </div>
              <hr className="my-2 border-gray-200 dark:border-gray-600" />
              <button
                onClick={() => { handleLogout(); setShowUserMenu(false); }}
                className="w-full flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" /> Sign out
              </button>
              {/* Optional: Add a "Manage your Google Account" link if desired */}
              {/*
              <a
                href="https://myaccount.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Manage your Google Account
              </a>
              */}
            </div>
          )}
        </div>
      )}

      {/* Dark Mode Toggle */}
      <div className="ml-6 flex items-center">
        <span className="text-gray-700 dark:text-gray-300 mr-2">Dark Mode</span>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isDarkMode ? (
            <SunIcon className="h-6 w-6" />
          ) : (
            <MoonIcon className="h-6 w-6" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
