// Test Healthcheck Endpoints
const http = require('http');

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

function testHealthcheck() {
  console.log('🔍 Testing healthcheck endpoints...');
  
  const options = {
    hostname: HOST,
    port: PORT,
    path: '/',
    method: 'GET',
    timeout: 5000
  };
  
  const req = http.request(options, (res) => {
    console.log(`✅ Healthcheck response: ${res.statusCode}`);
    console.log(`✅ Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Response body:', data);
      if (res.statusCode === 200) {
        console.log('🎉 Healthcheck test passed!');
        process.exit(0);
      } else {
        console.log('❌ Healthcheck test failed!');
        process.exit(1);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Healthcheck test error:', error.message);
    process.exit(1);
  });
  
  req.on('timeout', () => {
    console.error('❌ Healthcheck test timeout');
    req.destroy();
    process.exit(1);
  });
  
  req.end();
}

// Wait a bit for server to start
setTimeout(testHealthcheck, 2000);
