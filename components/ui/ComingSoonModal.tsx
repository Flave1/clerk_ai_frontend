import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { XMarkIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string | React.ReactNode;
  featureName?: string;
  image?: string;
  onNavigateToIntegrations?: () => void;
  showIntegrationsButton?: boolean;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ 
  isOpen, 
  onClose, 
  title,
  message,
  featureName,
  image,
  onNavigateToIntegrations,
  showIntegrationsButton = false
}) => {
  const defaultTitle = featureName ? `${featureName}` : 'Coming Soon';
  const defaultMessage = message || "We're working hard to bring you this feature. Stay tuned for updates!";
  const displayMessage = typeof message === 'string' ? message : (message || defaultMessage);
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (typeof window === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-[10000] w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-lg border border-primary-500/20 dark:border-primary-500/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-primary-500/20 dark:border-primary-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                    {title || 'Coming Soon'}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center overflow-hidden"
                  >
                    {image ? (
                      <div className="w-full h-full flex items-center justify-center bg-white/80 dark:bg-white/10 p-3">
                        <Image
                          src={image}
                          alt={title || 'Feature'}
                          width={64}
                          height={64}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <SparklesIcon className="w-10 h-10 text-primary-400" />
                    )}
                  </motion.div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {defaultTitle}
                  </h4>
                  <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {displayMessage}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`flex ${showIntegrationsButton ? 'justify-between' : 'justify-end'} p-6 border-t border-primary-500/20 dark:border-primary-500/20`}>
                {showIntegrationsButton && onNavigateToIntegrations && (
                  <button
                    onClick={() => {
                      onNavigateToIntegrations();
                      onClose();
                    }}
                    className="px-6 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300"
                  >
                    Go to Integrations
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-300"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ComingSoonModal;

