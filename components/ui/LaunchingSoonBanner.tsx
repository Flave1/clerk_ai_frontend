import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface LaunchingSoonBannerProps {
  onJoinWaitlist: () => void;
  className?: string;
}

const LaunchingSoonBanner: React.FC<LaunchingSoonBannerProps> = ({ onJoinWaitlist, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-4 rounded-xl bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 dark:border-primary-500/30 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">We're Launching Soon! 🚀</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            Be among the first to experience Aurray. Join our early access program and get notified when we launch.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onJoinWaitlist}
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold text-sm hover:from-primary-600 hover:to-accent-600 transition-all duration-300 shadow-lg shadow-primary-500/30"
          >
            Join the Waitlist
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default LaunchingSoonBanner;

