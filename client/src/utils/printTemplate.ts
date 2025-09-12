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
          background: linear-gradient(135deg, #365486 0%, #7FC7D9 100%);
          color: white;
          padding: 1.5rem 1rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .report-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .report-logo {
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
          width: 250px;
          height: 90px;
        }
        
        .report-title {
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 0.4rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 1;
        }
        
        .report-subtitle {
          font-size: 1rem;
          opacity: 0.95;
          margin-bottom: 0.8rem;
          font-weight: 500;
          position: relative;
          z-index: 1;
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
          gap: 0.5rem;
          margin-bottom: 0.6rem;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          padding: 0.6rem 0.5rem;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .summary-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #365486, #7FC7D9);
        }
        
        .summary-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(54, 84, 134, 0.15);
        }
        
        .summary-number {
          font-size: 1.4rem;
          font-weight: 900;
          color: #365486;
          margin-bottom: 0.3rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .summary-label {
          font-size: 0.9rem;
          color: #4a5568;
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
          margin-bottom: 1rem;
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          font-size: 10px;
        }
        
        .contributions-table th {
          background: linear-gradient(135deg, #365486 0%, #4a6fa5 100%);
          color: white;
          padding: 0.6rem 0.5rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #2d3748;
        }
        
        .contributions-table td {
          padding: 0.6rem 0.5rem;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.8rem;
          vertical-align: top;
          word-wrap: break-word;
        }
        
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
