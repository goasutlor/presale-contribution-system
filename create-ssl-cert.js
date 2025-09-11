const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create ssl directory if it doesn't exist
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Generate self-signed SSL certificate
const generateSSL = () => {
  try {
    console.log('🔐 Generating SSL certificates...');
    
    // Generate private key
    execSync(`openssl genrsa -out ${path.join(sslDir, 'private-key.pem')} 2048`, { stdio: 'inherit' });
    
    // Generate certificate
    execSync(`openssl req -new -x509 -key ${path.join(sslDir, 'private-key.pem')} -out ${path.join(sslDir, 'certificate.pem')} -days 365 -subj "/C=TH/ST=Bangkok/L=Bangkok/O=ASC3/OU=Presale/CN=localhost"`, { stdio: 'inherit' });
    
    console.log('✅ SSL certificates generated successfully!');
    console.log(`📁 Private key: ${path.join(sslDir, 'private-key.pem')}`);
    console.log(`📁 Certificate: ${path.join(sslDir, 'certificate.pem')}`);
    console.log('⚠️  Note: These are self-signed certificates for development only.');
    console.log('   For production, use certificates from a trusted CA.');
    
  } catch (error) {
    console.error('❌ Error generating SSL certificates:', error.message);
    console.log('💡 Make sure OpenSSL is installed on your system.');
    process.exit(1);
  }
};

generateSSL();
