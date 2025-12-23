"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2 } from "lucide-react";

interface DownloadTimerProps {
  isVisible: boolean;
  timeRemaining: number; // in seconds
  initialTime?: number; // initial time in seconds
  onComplete: () => void;
}

export function DownloadTimer({ isVisible, timeRemaining, initialTime = 30, onComplete }: DownloadTimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Calculate progress percentage (0 to 100)
  const progress = Math.max(0, Math.min(100, ((initialTime - timeRemaining) / initialTime) * 100));

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Small Timer Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4"
          >
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full pointer-events-auto border border-gray-200">
              {/* Small Watch */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-6">
                  {/* Outer Circle */}
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                  
                  {/* Progress Circle */}
                  <div className="absolute inset-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="3"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                  </div>

                  {/* Clock Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>

                  {/* Time Display */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full">
                    <div className="text-2xl font-bold text-gray-900 text-center">
                      {displayTime}
                    </div>
                  </div>
                </div>

                {/* Minimal Message */}
                <p className="text-sm text-gray-600 text-center mt-2">
                  Downloading...
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ThankYouMessageProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ThankYouMessage({ isVisible, onClose }: ThankYouMessageProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Thank You Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4"
          >
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full pointer-events-auto border border-gray-200">
              <div className="flex flex-col items-center">
                {/* Checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </motion.div>
                
                {/* Heading */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Thank You!
                </h3>
                
                {/* Message */}
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Download completed successfully.
                </p>

                {/* Button */}
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
















