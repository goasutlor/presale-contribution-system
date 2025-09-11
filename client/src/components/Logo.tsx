import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
    xl: 'h-24 w-24'
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* ASC3 Logo Image */}
      <div className={`${sizeClasses[size]} relative`}>
        <img 
          src="/ASC3_Contribution.png" 
          alt="ASC3 Logo" 
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>

      {/* ASC3 Text */}
      {showText && (
        <div className="flex flex-col space-y-1">
          <span className={`font-bold text-gray-900 dark:text-white ${textSizeClasses[size]} drop-shadow-sm`}>
            ASC3
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Contribution System
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
