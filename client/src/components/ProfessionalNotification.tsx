import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon,
  WifiIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'network' | 'server' | 'auth';
  title: string;
  message: string;
  details?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const ProfessionalNotification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  details,
  action,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.log('🔍 Notification useEffect triggered:', { type, autoClose, duration, isVisible });
    
    // FORCE PERSISTENT for errors - NO AUTO-CLOSE AT ALL
    if (type === 'error' || type === 'auth' || type === 'warning') {
      console.log('🔴 FORCING PERSISTENT NOTIFICATION - NO AUTO-CLOSE');
      // Don't set any timers for errors
      return;
    }
    
    // Only auto-close success messages
    if (autoClose && type === 'success') {
      console.log('🟢 Setting auto-close timer for success message');
      const timer = setTimeout(() => {
        console.log('🟢 Auto-closing success message');
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, type]);

  // Add visual emphasis for errors
  useEffect(() => {
    if (type === 'error' || type === 'auth') {
      // Add a subtle shake animation
      const element = document.querySelector('.notification-error');
      if (element) {
        element.classList.add('animate-bounce');
        setTimeout(() => {
          element.classList.remove('animate-bounce');
        }, 1000);
      }
    }
  }, [type]);

  const handleClose = () => {
    console.log('🔴 Notification close button clicked!', { type, title });
    // For errors, require explicit close - no auto-close
    if (type === 'error' || type === 'auth' || type === 'warning') {
      console.log('🔴 Closing error notification manually');
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 500); // Slower close animation for errors
    } else {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      case 'network':
        return <WifiIcon className="h-6 w-6 text-orange-500" />;
      case 'server':
        return <ServerIcon className="h-6 w-6 text-purple-500" />;
      case 'auth':
        return <ShieldExclamationIcon className="h-6 w-6 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'network':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'server':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'auth':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      case 'network':
        return 'text-orange-800 dark:text-orange-200';
      case 'server':
        return 'text-purple-800 dark:text-purple-200';
      case 'auth':
        return 'text-red-800 dark:text-red-200';
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  // FORCE VISIBLE for errors - NEVER return null
  if (!isVisible && (type === 'error' || type === 'auth' || type === 'warning')) {
    console.log('🔴 FORCING ERROR NOTIFICATION TO STAY VISIBLE');
    // Force visible for errors
  }

  if (!isVisible) {
    console.log('🔴 Notification not visible, returning null');
    return null;
  }

  console.log('🔴 Rendering notification:', { type, title, isVisible });

  return (
    <div className={`mb-4 transform transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'
    }`}>
      <div className={`rounded-lg border shadow-lg ${getBackgroundColor()} ${
        type === 'error' || type === 'auth' ? 'ring-2 ring-red-200 dark:ring-red-800' : ''
      }`}>
        <div className="p-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <h3 className={`text-sm font-semibold ${getTextColor()}`}>
                {title}
              </h3>
              <div className={`mt-1 text-sm ${getTextColor()}`}>
                <p className="break-words">{message}</p>
                
                {details && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-xs font-medium underline hover:no-underline text-blue-600 dark:text-blue-400"
                    >
                      {showDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด'}
                    </button>
                    {showDetails && (
                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {details}
                      </div>
                    )}
                  </div>
                )}
                
                {(action || (type === 'error' || type === 'auth' || type === 'warning')) && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {action && (
                      <button
                        onClick={action.onClick}
                        className="text-xs font-medium bg-white dark:bg-gray-700 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        {action.label}
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                        type === 'error' || type === 'auth' 
                          ? 'bg-red-500 hover:bg-red-600 text-white border border-red-600' 
                          : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500'
                      }`}
                    >
                      ✕ ปิด
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalNotification;
