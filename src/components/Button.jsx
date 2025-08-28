import React from 'react';

function Button({ onClick, children, className = '', disabled = false }) {
  const baseClasses = "px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
  const themeClasses = "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-300";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${themeClasses} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;