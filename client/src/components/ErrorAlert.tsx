import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ErrorAlertProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  type,
  title,
  message,
  details,
  onClose,
  showCloseButton = true
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error':
        return 'border-red-200 dark:border-red-800';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'border-blue-200 dark:border-blue-800';
      case 'success':
        return 'border-green-200 dark:border-green-800';
      default:
        return 'border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      case 'success':
        return 'text-green-800 dark:text-green-200';
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className={`rounded-lg p-3 ${getBackgroundColor()} border ${getBorderColor()} shadow-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${getTextColor()}`}>
            {title}
          </h3>
          <div className={`mt-1 text-sm ${getTextColor()}`}>
            <p className="break-words">{message}</p>
            {details && (
              <div className="mt-2">
                <details className="cursor-pointer">
                  <summary className="font-medium text-xs">รายละเอียดเพิ่มเติม</summary>
                  <div className="mt-1 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
                    <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {details}
                    </p>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
        {showCloseButton && onClose && (
          <div className="ml-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-1 ${getTextColor()} hover:opacity-75 transition-opacity`}
            >
              <span className="sr-only">ปิด</span>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
