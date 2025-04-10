import React from 'react';

interface ActiveBuzzesToggleProps {
  isActive: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
}

export default function ActiveBuzzesToggle({
  isActive,
  onToggle,
  label = "Show Active Only",
  className = ""
}: ActiveBuzzesToggleProps) {
  return (
    <div className={`inline-flex items-center justify-between gap-3 bg-white rounded-2xl px-3 py-2 md:py-[10px] shadow-sm border border-gray-200 w-auto sm:w-auto ${className}`}>
      <span className="text-base sm:text-lg text-gray-700 font-medium">
        {label}
      </span>
      <button
        role="switch"
        aria-checked={isActive}
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isActive ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
            isActive ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
