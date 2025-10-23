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
          margin: 0.5in;
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
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #06b6d4 75%, #10b981 100%);
          color: white;
          padding: 1.2rem 1.0rem;
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
          opacity: 0.15;
        }
        
        /* Remove shimmer/animation for professional tone */
        
        .report-logo {
          margin-bottom: 0.6rem;
          position: relative;
          z-index: 1;
          width: 160px;
          height: 60px;
        }
        
        .report-title {
          font-size: 1.45rem;
          font-weight: 900;
          margin-bottom: 0.25rem;
          text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 2;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        
        .report-subtitle {
          font-size: 0.95rem;
          opacity: 0.9;
          margin-bottom: 0.6rem;
          font-weight: 500;
          position: relative;
          z-index: 2;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
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

        /* Simple Attractive Sheet */
        .sheet {
          background: #f5f7f9; /* light neutral */
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 14px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          align-items: end;
        }
        .metrics-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }

        .metric {
          text-align: center;
        }
        .metric-icon { height: 26px; margin-bottom: 6px; display:flex; align-items:center; justify-content:center; }
        .metric-icon svg { stroke: #334155; }
        .metric-number { font-size: 1.7rem; font-weight: 800; color: #0f172a; }
        .metric-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; margin-top: 2px; }

        .sheet-divider { border-top: 1px solid #e5e7eb; margin: 12px 0; }
        
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
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .summary-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 0.8rem 0.75rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: none;
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
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 0.3rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          color: var(--brand-text);
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
          font-size: 0.75rem;
          color: #64748b;
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
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .impact-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 0.8rem 0.75rem;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: none;
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
          margin-bottom: 0.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .impact-number {
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 0.2rem;
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
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .contributions-section {
          margin-bottom: 2.5rem;
        }
        
        .contributions-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--brand-steel);
          margin-bottom: 0.8rem;
          border-bottom: 1px solid var(--brand-line);
          padding-bottom: 0.5rem;
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
          background: #f8fafc;
          color: #334155;
          padding: 0.6rem 0.6rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #e5e7eb;
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
          <div style="font-size: .7rem; letter-spacing: .22em; text-transform: uppercase; opacity:.9; color:#e5f0ff; margin-bottom:.25rem;">ASC3</div>
          <h1 class="report-title">${reportType === 'dashboard' ? 'Dashboard Overview' : 'Comprehensive Report'}</h1>
          <p class="report-subtitle">ASC3 Contribution Management System</p>
          <p class="report-date">Generated on ${currentDate}</p>
        </div>
        
        <div class="report-content">
          <div class="sheet">
            <div class="metrics-grid">
              <div class="metric">
                <div class="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 3h18v4H3zM5 7v14h4V7M10 7h4v14h-4M15 7h4v14h-4"/>
                  </svg>
                </div>
                <div class="metric-number">${filteredSummary.totalContributions}</div>
                <div class="metric-label">Total Contributions</div>
              </div>
              <div class="metric">
                <div class="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 12a5 5 0 100-10 5 5 0 000 10z"/>
                    <path d="M20 21a8 8 0 10-16 0"/>
                  </svg>
                </div>
                <div class="metric-number">${filteredSummary.totalUsers}</div>
                <div class="metric-label">Total Users</div>
              </div>
              <div class="metric">
                <div class="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 7h18M3 12h18M3 17h18"/>
                  </svg>
                </div>
                <div class="metric-number">${filteredSummary.totalAccounts}</div>
                <div class="metric-label">Total Accounts</div>
              </div>
            </div>
            <div class="sheet-divider"></div>
            <div class="metrics-grid cols-4">
              <div class="metric">
                <div class="metric-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9l6-6 6 6-6 12-6-12z"/>
                  </svg>
                </div>
                <div class="metric-number">${filteredSummary.criticalImpact}</div>
                <div class="metric-label">Critical</div>
              </div>
              <div class="metric">
                <div class="metric-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2s4 4 4 8-4 8-4 8-4-4-4-8 4-8 4-8z"/>
                  </svg>
                </div>
                <div class="metric-number">${filteredSummary.highImpact}</div>
                <div class="metric-label">High</div>
              </div>
              <div class="metric">
                <div class="metric-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/>
                  </svg>
                </div>
                <div class="metric-number">${filteredSummary.mediumImpact}</div>
                <div class="metric-label">Medium</div>
              </div>
              <div class="metric">
                <div class="metric-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20V10"/>
                    <path d="M12 10c0-4 3-7 7-7 0 4-3 7-7 7z"/>
                    <path d="M12 10C12 6 9 3 5 3c0 4 3 7 7 7z"/>
                  </svg>
                </div>
                <div class="metric-number">${filteredSummary.lowImpact}</div>
                <div class="metric-label">Low</div>
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
