import React from 'react';

type ASC3LogoProps = {
  width?: number;
  height?: number;
  title?: string;
  simpleMark?: boolean; // when true, render orange chevron mark only
};

// Blue-gray + orange vector logo used across the app
const ASC3Logo: React.FC<ASC3LogoProps> = ({ width = 180, height = 84, title = 'ASC3 Account Contribution', simpleMark = false }) => {
  if (simpleMark) {
    // Minimal orange chevron mark (like the sample)
    return (
      <svg width={width} height={height} viewBox="0 0 225 225" aria-label={title} role="img">
        <rect width="225" height="225" rx="16" fill="#F7931E" />
        <polygon points="112.5,63 153,144 112.5,127 72,144" fill="#ffffff" />
      </svg>
    );
  }
  return (
    <svg width={width} height={height} viewBox="0 0 300 140" aria-label={title} role="img">
      <defs>
        <linearGradient id="logoBlueLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#365486" />
          <stop offset="100%" stopColor="#7FC7D9" />
        </linearGradient>
        <linearGradient id="logoOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A1A" />
          <stop offset="100%" stopColor="#F7931E" />
        </linearGradient>
      </defs>

      {/* baseline */}
      <line x1="30" y1="116" x2="270" y2="116" stroke="url(#logoBlueLine)" strokeWidth="2" opacity="0.35" />

      {/* peak motif */}
      <polygon points="116,40 146,16 174,40 164,40 146,26 128,40" fill="url(#logoOrange)" />
      <polygon points="156,44 180,28 200,44 192,44 180,34 168,44" fill="url(#logoOrange)" opacity="0.85" />

      {/* inward contribution chevrons */}
      <line x1="52" y1="76" x2="96" y2="76" stroke="url(#logoOrange)" strokeWidth="6" strokeLinecap="round" />
      <polygon points="96,76 86,72 86,80" fill="#FF7A1A" />
      <line x1="248" y1="76" x2="204" y2="76" stroke="url(#logoOrange)" strokeWidth="6" strokeLinecap="round" />
      <polygon points="204,76 214,72 214,80" fill="#FF7A1A" />

      {/* wordmark */}
      <text x="150" y="92" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="50" fill="#1f2937">ASC3</text>
      <text x="150" y="110" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight="700" fontSize="14" fill="#475569" letterSpacing="1.5">ACCOUNT CONTRIBUTION</text>
    </svg>
  );
};

export default ASC3Logo;


