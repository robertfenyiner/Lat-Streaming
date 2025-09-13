const https = require('https');
const querystring = require('querystring');

const botToken = '8378067144:AAFeP7zGV-6HZMXRXe2tXGE8euP7kBLeUak';
const channelId = '-1003001236281';

function testDirectHTTPS() {
    const data = querystring.stringify({
        chat_id: channelId,
        text: '🔧 Direct HTTPS test - ' + new Date().toISOString()
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        },
        timeout: 10000,
        family: 4  // Force IPv4
    };

    console.log('Testing direct HTTPS request...');
    
    const req = https.request(options, (res) => {
        console.log(`✅ Response status: ${res.statusCode}`);
        let responseData = '';
        
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            console.log('✅ Response:', responseData);
            process.exit(0);
        });
    });

    req.on('error', (error) => {
        console.log('❌ Request error:', error.message);
        process.exit(1);
    });

    req.on('timeout', () => {
        console.log('❌ Request timeout');
        req.destroy();
        process.exit(1);
    });

    req.write(data);
    req.end();
}

testDirectHTTPS();
