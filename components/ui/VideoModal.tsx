import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, videoUrl }) => {
  console.log('VideoModal render - isOpen:', isOpen, 'videoUrl:', videoUrl);

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    console.log('getEmbedUrl called with:', url);
    const videoId = url.includes('youtube.com/watch?v=')
      ? url.split('v=')[1]?.split('&')[0]
      : url.includes('youtu.be/')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : null;
    
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    console.log('getEmbedUrl result:', embedUrl);
    return embedUrl;
  };

  const embedUrl = getEmbedUrl(videoUrl);
  console.log('Final embedUrl:', embedUrl);

  // Prevent body scroll when modal is open
  useEffect(() => {
    console.log('VideoModal useEffect - isOpen changed to:', isOpen);
    if (isOpen) {
      console.log('Setting body overflow to hidden');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('Setting body overflow to unset');
      document.body.style.overflow = 'unset';
    }
    return () => {
      console.log('VideoModal cleanup - restoring body overflow');
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    console.log('Setting up ESC key handler, isOpen:', isOpen);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('ESC key pressed, closing modal');
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      console.log('Removing ESC key handler');
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (typeof window === 'undefined') {
    console.log('Window is undefined, returning null (SSR)');
    return null;
  }

  console.log('About to create portal, isOpen:', isOpen, 'document.body exists:', !!document.body);

  console.log('Creating modalContent, isOpen:', isOpen);
  
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              console.log('Backdrop clicked, closing modal');
              onClose();
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-[10000] w-full max-w-5xl"
            onClick={(e) => {
              console.log('Modal content clicked, stopping propagation');
              e.stopPropagation();
            }}
          >
            <div className="relative bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-lg border border-primary-500/20 dark:border-primary-500/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-primary-500/20 dark:border-primary-500/20">
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Watch Demo
                </h3>
                <button
                  onClick={() => {
                    console.log('Close button clicked');
                    onClose();
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Video Container */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Demo Video"
                />
              </div>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );

  console.log('Creating portal to document.body');
  const portal = createPortal(modalContent, document.body);
  console.log('Portal created:', portal);
  return portal;
};

export default VideoModal;

