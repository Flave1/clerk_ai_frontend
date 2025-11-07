import React from 'react';

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconColor?: string;
}

export default function ComingSoon({ 
  title = "Working on it",
  description = "We're building something amazing! This page is under development and will be available soon.",
  icon: Icon,
  iconBgColor = "bg-primary-100 dark:bg-primary-900",
  iconColor = "text-primary-600 dark:text-primary-400"
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-16">
      {Icon && (
        <div className={`p-6 ${iconBgColor} rounded-full mb-6`}>
          <Icon className={`h-16 w-16 ${iconColor}`} />
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span>Coming soon</span>
      </div>
    </div>
  );
}

