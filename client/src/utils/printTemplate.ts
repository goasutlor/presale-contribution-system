export const generateEarthToneReport = (data: any, reportType: string, user: any, filters: any, printFields: any = null) => {
  console.log('🔍 generateEarthToneReport called with:');
  console.log('🔍 data:', data);
  console.log('🔍 reportType:', reportType);
  console.log('🔍 user:', user);
  console.log('🔍 filters:', filters);
  console.log('🔍 printFields:', printFields);
  
  const currentDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Use the already filtered data from the component
  const filteredContributions = data.contributions || [];
  console.log('🔍 filteredContributions:', filteredContributions);
  console.log('🔍 filteredContributions.length:', filteredContributions.length);

  // Calculate filtered summary data
  const filteredSummary = {
    totalContributions: filteredContributions.length,
    totalUsers: new Set(filteredContributions.map((c: any) => c.userId)).size,
    totalAccounts: new Set(filteredContributions.map((c: any) => c.accountName)).size,
    highImpact: filteredContributions.filter((c: any) => c.impact === 'high').length,
    mediumImpact: filteredContributions.filter((c: any) => c.impact === 'medium').length,
    lowImpact: filteredContributions.filter((c: any) => c.impact === 'low').length,
    criticalImpact: 0
  };

  // Determine unique names for conditional sign-off
  const uniqueSales = Array.from(new Set(filteredContributions.map((c: any) => c.saleName).filter(Boolean)));
  const uniquePresales = Array.from(new Set(filteredContributions.map((c: any) => c.userName).filter(Boolean)));

  // Prefer explicitly selected filters; fall back to unique-single detection
  const selectedSale = (filters?.saleName || '').trim();
  const selectedPresale = (filters?.presaleName || '').trim();
  const pickedSale = selectedSale || (uniqueSales.length === 1 ? uniqueSales[0] : '');
  const pickedPresale = selectedPresale || (uniquePresales.length === 1 ? uniquePresales[0] : '');
  const showSpecific = Boolean(pickedSale && pickedPresale);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ASC3 Contribution Report</title>
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --brand-navy: #0f172a; /* slate-900 */
          --brand-steel: #1e293b; /* slate-800 */
          --brand-line: #e2e8f0; /* slate-200 */
          --brand-muted: #475569; /* slate-600 */
          --brand-text: #111827; /* gray-900 */
          --brand-accent: #2563eb; /* blue-600 */
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 0.3in;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
        }
        
        body {
          font-family: 'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.4;
          color: #2d3748;
          background: white;
          font-size: 11px;
        }
        
        .report-container {
          max-width: 100%;
          margin: 0;
          background: white;
          box-shadow: none;
          border-radius: 0;
          overflow: visible;
        }
        
        .report-header {
          background: linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-steel) 100%);
          color: white;
          padding: 1.6rem 1.2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-radius: 12px 12px 0 0;
        }
        
        .report-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%);
          opacity: 0.8;
        }
        
        .report-header::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        .report-logo {
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
          width: 250px;
          height: 90px;
        }
        
        .report-title {
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 2;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        
        .report-subtitle {
          font-size: 1.1rem;
          opacity: 0.95;
          margin-bottom: 1rem;
          font-weight: 600;
          position: relative;
          z-index: 2;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .report-date {
          font-size: 0.85rem;
          opacity: 0.85;
          position: relative;
          z-index: 1;
        }
        
        .report-content {
          padding: 1rem;
        }
        
        .summary-section {
          margin-bottom: 1.5rem;
        }
        
        .summary-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #365486;
          margin-bottom: 0.6rem;
          border-bottom: 2px solid #7FC7D9;
          padding-bottom: 0.3rem;
          position: relative;
        }
        
        .summary-title::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 60px;
          height: 3px;
          background: #365486;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 1.2rem 1rem;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .summary-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #06b6d4, #10b981);
        }
        
        .summary-card:nth-child(1)::before {
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        }
        
        .summary-card:nth-child(2)::before {
          background: linear-gradient(90deg, #10b981, #059669);
        }
        
        .summary-card:nth-child(3)::before {
          background: linear-gradient(90deg, #8b5cf6, #7c3aed);
        }
        
        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .summary-number {
          font-size: 2rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .summary-card:nth-child(1) .summary-number {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .summary-card:nth-child(2) .summary-number {
          background: linear-gradient(135deg, #059669, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .summary-card:nth-child(3) .summary-number {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .summary-label {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .impact-distribution-section {
          margin-bottom: 2rem;
        }
        
        .impact-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 1rem;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 0.5rem;
          position: relative;
        }
        
        .impact-title::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 60px;
          height: 3px;
          background: #1e40af;
        }
        
        .impact-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .impact-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 1.2rem 1rem;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .impact-card.critical {
          border-color: #dc2626;
        }
        
        .impact-card.critical::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #dc2626, #ef4444);
        }
        
        .impact-card.high {
          border-color: #ea580c;
        }
        
        .impact-card.high::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #ea580c, #f97316);
        }
        
        .impact-card.medium {
          border-color: #d97706;
        }
        
        .impact-card.medium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #d97706, #f59e0b);
        }
        
        .impact-card.low {
          border-color: #16a34a;
        }
        
        .impact-card.low::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #16a34a, #22c55e);
        }
        
        .impact-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .impact-number {
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .impact-card.critical .impact-number {
          color: #dc2626;
        }
        
        .impact-card.high .impact-number {
          color: #ea580c;
        }
        
        .impact-card.medium .impact-number {
          color: #d97706;
        }
        
        .impact-card.low .impact-number {
          color: #16a34a;
        }
        
        .impact-label {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .contributions-section {
          margin-bottom: 2.5rem;
        }
        
        .contributions-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #365486;
          margin-bottom: 1.5rem;
          border-bottom: 3px solid #7FC7D9;
          padding-bottom: 0.75rem;
          position: relative;
        }
        
        .contributions-title::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 60px;
          height: 3px;
          background: #365486;
        }
        
        .contributions-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          font-size: 10px;
        }
        
        .contributions-table th {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
          color: white;
          padding: 0.8rem 0.6rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 3px solid #1e40af;
          position: relative;
        }
        
        .contributions-table th::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        }
        
        .contributions-table td {
          padding: 0.8rem 0.6rem;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.8rem;
          vertical-align: top;
          word-wrap: break-word;
        }

        .contributions-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        .contributions-table tbody tr:nth-child(odd) {
          background: #ffffff;
        }

        .status-badge, .impact-badge, .effort-badge {
          display: inline-block;
          padding: 0.15rem 0.45rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.7rem;
          letter-spacing: .02em;
          text-transform: uppercase;
          border: 1px solid rgba(0,0,0,.05);
        }
        .status-approved { background:#dcfce7; color:#166534; }
        .status-submitted { background:#dbeafe; color:#1e40af; }
        .status-draft { background:#fef9c3; color:#854d0e; }
        .status-rejected { background:#fee2e2; color:#991b1b; }

        .impact-critical { background:#ede9fe; color:#5b21b6; }
        .impact-high { background:#ffe4e6; color:#9f1239; }
        .impact-medium { background:#fef3c7; color:#92400e; }
        .impact-low { background:#dcfce7; color:#065f46; }
        
        .contributions-table tr:hover {
          background: #f7fafc;
        }
        
        .contributions-table tr:last-child td {
          border-bottom: none;
        }
        
        .impact-badge {
          display: inline-block;
          padding: 0.2rem 0.4rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }
        
        .impact-high {
          background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
          color: #c53030;
          border-color: #fc8181;
        }
        
        .impact-medium {
          background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%);
          color: #dd6b20;
          border-color: #f6ad55;
        }
        
        .impact-low {
          background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
          color: #2f855a;
          border-color: #68d391;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 2px solid transparent;
        }
        
        .status-submitted {
          background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
          color: #2b6cb0;
          border-color: #63b3ed;
        }
        
        .status-approved {
          background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
          color: #2f855a;
          border-color: #68d391;
        }
        
        .status-draft {
          background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%);
          color: #dd6b20;
          border-color: #f6ad55;
        }
        
        .effort-badge {
          display: inline-block;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 2px solid transparent;
        }
        
        .effort-high {
          background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
          color: #c53030;
          border-color: #fc8181;
        }
        
        .effort-medium {
          background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%);
          color: #dd6b20;
          border-color: #f6ad55;
        }
        
        .effort-low {
          background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
          color: #2f855a;
          border-color: #68d391;
        }
        
        .signatures-section {
          margin-top: 1.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        
        .signatures-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #365486, #7FC7D9);
        }
        
        .signatures-title {
          font-size: 1rem;
          font-weight: 700;
          color: #365486;
          margin-bottom: 0.6rem;
          text-align: center;
          position: relative;
        }
        
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        .signature-box {
          text-align: center;
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          position: relative;
        }
        
        .signature-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #365486, #7FC7D9);
          border-radius: 12px 12px 0 0;
        }
        
        .signature-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #365486;
          margin-bottom: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .signature-line {
          border-bottom: 1px solid #4a5568;
          margin-bottom: 0.5rem;
          height: 2.5rem;
          position: relative;
        }
        
        .signature-line::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: #a0aec0;
        }
        
        .signature-name {
          font-size: 0.8rem;
          color: #4a5568;
          margin-bottom: 0.8rem;
          font-weight: 600;
        }
        
        .signature-date {
          font-size: 0.75rem;
          color: #718096;
          margin-bottom: 0.3rem;
          font-weight: 600;
        }
        
        .date-line {
          border-bottom: 1px solid #a0aec0;
          margin-top: 0.3rem;
          height: 1rem;
        }
        
        .no-data {
          text-align: center;
          padding: 3rem;
          color: #718096;
          font-style: italic;
        }
        
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            font-family: 'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          .report-container { 
            box-shadow: none; 
            border-radius: 0;
          }
          .summary-card:hover { 
            transform: none; 
          }
          .summary-title { font-size: 0.95rem !important; margin-bottom: 0.4rem !important; }
          .summary-cards { gap: 0.4rem !important; margin-bottom: 0.5rem !important; }
          .summary-card { padding: 0.5rem 0.4rem !important; }
          .summary-number { font-size: 1.2rem !important; margin-bottom: 0.25rem !important; }
          .contributions-table tr:hover {
            background: transparent;
          }
          .report-logo {
            width: 200px !important;
            height: 70px !important;
          }
          .report-title {
            font-size: 1.3rem !important;
            margin-bottom: 0.3rem !important;
          }
          .report-subtitle {
            font-size: 0.9rem !important;
            margin-bottom: 0.6rem !important;
          }
          .report-date {
            font-size: 0.8rem !important;
          }
          .signatures-section {
            margin-top: 0.5rem !important;
            padding: 0.5rem !important;
          }
          .signatures-title {
            font-size: 1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .signatures-grid {
            gap: 1rem !important;
          }
          .signature-box {
            padding: 0.5rem !important;
          }
          .signature-label {
            font-size: 0.7rem !important;
            margin-bottom: 0.4rem !important;
          }
          .signature-line {
            height: 2rem !important;
            margin-bottom: 0.3rem !important;
          }
          .signature-name {
            font-size: 0.7rem !important;
            margin-bottom: 0.5rem !important;
          }
          .signature-date {
            font-size: 0.65rem !important;
            margin-bottom: 0.2rem !important;
          }
          .date-line {
            height: 0.8rem !important;
            margin-top: 0.2rem !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <svg width="250" height="90" viewBox="0 0 300 140" class="report-logo">
            <defs>
              <linearGradient id="logoBlueLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#365486" />
                <stop offset="100%" stop-color="#7FC7D9" />
              </linearGradient>
              <linearGradient id="logoOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF7A1A" />
                <stop offset="100%" stop-color="#F7931E" />
              </linearGradient>
            </defs>
            <line x1="30" y1="116" x2="270" y2="116" stroke="url(#logoBlueLine)" stroke-width="2" opacity="0.35" />
            <polygon points="116,40 146,16 174,40 164,40 146,26 128,40" fill="url(#logoOrange)" />
            <polygon points="156,44 180,28 200,44 192,44 180,34 168,44" fill="url(#logoOrange)" opacity="0.85" />
            <line x1="52" y1="76" x2="96" y2="76" stroke="url(#logoOrange)" stroke-width="6" stroke-linecap="round" />
            <polygon points="96,76 86,72 86,80" fill="#FF7A1A" />
            <line x1="248" y1="76" x2="204" y2="76" stroke="url(#logoOrange)" stroke-width="6" stroke-linecap="round" />
            <polygon points="204,76 214,72 214,80" fill="#FF7A1A" />
            <text x="150" y="92" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="900" font-size="50" fill="white">ASC3</text>
            <text x="150" y="110" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="14" fill="white" opacity="0.9" letter-spacing="1.5">ACCOUNT CONTRIBUTION</text>
          </svg>
          <h1 class="report-title">${reportType === 'dashboard' ? 'Dashboard Overview' : 'Comprehensive Report'}</h1>
          <p class="report-subtitle">ASC3 Contribution Management System</p>
          <p class="report-date">Generated on ${currentDate}</p>
        </div>
        
        <div class="report-content">
          <div class="summary-section">
            <h2 class="summary-title">Summary Overview</h2>
            <div class="summary-cards">
              <div class="summary-card">
                <div class="summary-number">${filteredSummary.totalContributions}</div>
                <div class="summary-label">Total Contributions</div>
              </div>
              <div class="summary-card">
                <div class="summary-number">${filteredSummary.totalUsers}</div>
                <div class="summary-label">Total Users</div>
              </div>
              <div class="summary-card">
                <div class="summary-number">${filteredSummary.totalAccounts}</div>
                <div class="summary-label">Total Accounts</div>
              </div>
            </div>
          </div>
          
          <div class="impact-distribution-section">
            <h2 class="impact-title">Impact Distribution</h2>
            <div class="impact-cards">
              <div class="impact-card critical">
                <div class="impact-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9l6-6 6 6-6 12-6-12z"/>
                  </svg>
                </div>
                <div class="impact-number">${filteredSummary.criticalImpact}</div>
                <div class="impact-label">Critical Impact</div>
              </div>
              <div class="impact-card high">
                <div class="impact-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2s4 4 4 8-4 8-4 8-4-4-4-8 4-8 4-8z"/>
                  </svg>
                </div>
                <div class="impact-number">${filteredSummary.highImpact}</div>
                <div class="impact-label">High Impact</div>
              </div>
              <div class="impact-card medium">
                <div class="impact-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/>
                  </svg>
                </div>
                <div class="impact-number">${filteredSummary.mediumImpact}</div>
                <div class="impact-label">Medium Impact</div>
              </div>
              <div class="impact-card low">
                <div class="impact-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20V10"/>
                    <path d="M12 10c0-4 3-7 7-7 0 4-3 7-7 7z"/>
                    <path d="M12 10C12 6 9 3 5 3c0 4 3 7 7 7z"/>
                  </svg>
                </div>
                <div class="impact-number">${filteredSummary.lowImpact}</div>
                <div class="impact-label">Low Impact</div>
              </div>
            </div>
          </div>
          
          <div class="contributions-section">
            <h2 class="contributions-title">Detailed Contributions</h2>
            ${filteredContributions.length > 0 ? `
              <table class="contributions-table">
                <thead>
                  <tr>
                    ${printFields?.account !== false ? '<th>Account</th>' : ''}
                    ${printFields?.title !== false ? '<th>Title</th>' : ''}
                    ${printFields?.description !== false ? '<th>Description</th>' : ''}
                    ${printFields?.type !== false ? '<th>Type</th>' : ''}
                    ${printFields?.impact !== false ? '<th>Impact</th>' : ''}
                    ${printFields?.effort !== false ? '<th>Effort</th>' : ''}
                    ${printFields?.status !== false ? '<th>Status</th>' : ''}
                    ${printFields?.month !== false ? '<th>Month</th>' : ''}
                    ${printFields?.saleName !== false ? '<th>Sale Name</th>' : ''}
                    ${printFields?.presaleName !== false ? '<th>Presale Name</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${filteredContributions.map((contrib: any) => `
                    <tr>
                      ${printFields?.account !== false ? `<td>${contrib.accountName || 'N/A'}</td>` : ''}
                      ${printFields?.title !== false ? `<td>${contrib.title || 'N/A'}</td>` : ''}
                      ${printFields?.description !== false ? `<td>${contrib.description || 'N/A'}</td>` : ''}
                      ${printFields?.type !== false ? `<td>${contrib.contributionType || 'N/A'}</td>` : ''}
                      ${printFields?.impact !== false ? `<td><span class="impact-badge impact-${contrib.impact}">${contrib.impact}</span></td>` : ''}
                      ${printFields?.effort !== false ? `<td><span class="effort-badge effort-${contrib.effort}">${contrib.effort}</span></td>` : ''}
                      ${printFields?.status !== false ? `<td><span class="status-badge status-${contrib.status}">${contrib.status}</span></td>` : ''}
                      ${printFields?.month !== false ? `<td>${contrib.contributionMonth || 'N/A'}</td>` : ''}
                      ${printFields?.saleName !== false ? `<td>${contrib.saleName || 'N/A'}</td>` : ''}
                      ${printFields?.presaleName !== false ? `<td>${contrib.userName || 'N/A'}</td>` : ''}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div class="no-data">
                <p>No contributions found matching the selected filters.</p>
              </div>
            `}
          </div>
          
          <div class="signatures-section">
            <h2 class="signatures-title">Approval Signatures</h2>
            <div class="signatures-grid">
              <div class="signature-box">
                <div class="signature-label">${showSpecific ? 'PRESALE' : 'ADMIN'}</div>
                <div class="signature-line"></div>
                <div class="signature-name">${showSpecific ? pickedPresale : ''}</div>
                <div class="signature-date">Date:</div>
                <div class="date-line"></div>
              </div>
              <div class="signature-box">
                <div class="signature-label">SALE</div>
                <div class="signature-line"></div>
                <div class="signature-name">${showSpecific ? pickedSale : ''}</div>
                <div class="signature-date">Date:</div>
                <div class="date-line"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
