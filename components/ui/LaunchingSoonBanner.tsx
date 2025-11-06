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
      className={`p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5f5fff] to-[#a855f7] flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">We're Launching Soon! 🚀</h4>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">
            Be among the first to experience Auray. Join our early access program and get notified when we launch.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onJoinWaitlist}
            className="px-4 py-2 bg-gradient-to-r from-[#5f5fff] to-[#a855f7] rounded-lg font-semibold text-sm hover:from-[#6f6fff] hover:to-[#b865ff] transition-all duration-300 shadow-lg shadow-purple-500/30"
          >
            Join the Waitlist
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default LaunchingSoonBanner;

