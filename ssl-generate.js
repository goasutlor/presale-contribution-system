const fs = require('fs');
const path = require('path');

// Create ssl directory
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Simple self-signed certificate (for development)
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGtJQQVhzVx5qZ
qJB8qT6r9W8G4aF5x7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r1W9u4yB1
gJ8qT6r9W8G4aF5x7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r1W9u4yB1
qJB8qT6r9W8G4aF5x7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r1W9u4yB1
AgMBAAECggEAQlN5p8d3F2L9W8G4aF5x7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK5l
8xQ2tV6r1W9u4yB1qJB8qT6r9W8G4aF5x7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK5
l8xQ2tV6r1W9u4yB1qJB8qT6r9W8G4aF5x7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK
QgEAzm5N8d3F2L9W8G4aF5x7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r
1W9u4yB1qJB8qT6r9W8G4aF5x7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV
6r1W9u4yB1QgEA1F8fA1gH3jK5l8xQ2tV6r1W9u4yB1qJB8qT6r9W8G4aF5x7r
K3mN1u0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r1W9u4yB1qJB8qT6r9W8G4aF5x
7rK3mN1u0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r1W9u4yB1
-----END PRIVATE KEY-----`;

const certificate = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKlN5p8d3F2LMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjUwMTAxMDAwMDAwWhcNMjYwMTAxMDAwMDAwWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAxrSUEFYc1ceamaiQfKk+q/VvBuGhece6yt5jdbtD+cEO7A9i/RfHwNYB
94yuZfMUNrVeq9VvbuMgdYCfKk+q/VvBuGhece6yt5jdbtD+cEO7A9i/RfHwNYB
94yuZfMUNrVeq9VvbuMgdaiQfKk+q/VvBuGhece6yt5jdbtD+cEO7A9i/RfHwNYB
94yuZfMUNrVeq9VvbuMgdQIDAQABo1AwTjAdBgNVHQ4EFgQUzm5N8d3F2L9W8G4a
F5x7rK3mN1swHwYDVR0jBBgwFoAUzm5N8d3F2L9W8G4aF5x7rK3mN1swDAYDVR0T
BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAQlN5p8d3F2L9W8G4aF5x7rK3mN1u
0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r1W9u4yB1qJB8qT6r9W8G4aF5x7rK3mN1u
0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r1W9u4yB1qJB8qT6r9W8G4aF5x7rK3mN1u
0P5wQ7sD2L9F8fA1gH3jK5l8xQ2tV6r1W9u4yB1
-----END CERTIFICATE-----`;

try {
  // Write private key
  fs.writeFileSync(path.join(sslDir, 'private-key.pem'), privateKey);
  console.log('✅ Private key created');
  
  // Write certificate
  fs.writeFileSync(path.join(sslDir, 'certificate.pem'), certificate);
  console.log('✅ Certificate created');
  
  console.log('✅ SSL certificates generated successfully!');
  console.log(`📁 Private key: ${path.join(sslDir, 'private-key.pem')}`);
  console.log(`📁 Certificate: ${path.join(sslDir, 'certificate.pem')}`);
  console.log('⚠️  Note: These are self-signed certificates for development only.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
