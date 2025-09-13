const TelegramBot = require('node-telegram-bot-api');

const botToken = '8378067144:AAFeP7zGV-6HZMXRXe2tXGE8euP7kBLeUak';
const channelId = '-1003001236281';

const bot = new TelegramBot(botToken, { 
    polling: false,
    request: {
        agentOptions: {
            family: 4,  // Force IPv4
            timeout: 30000  // 30 second timeout
        },
        timeout: 30000,  // 30 second request timeout
        forever: true,   // Keep connections alive
        pool: {
            maxSockets: 10
        }
    },
    onlyFirstMatch: true
});

async function testNewConfig() {
    try {
        console.log('Testing bot with new configuration...');
        
        const message = await bot.sendMessage(channelId, '✅ New config test - ' + new Date().toISOString());
        console.log('✅ Message sent successfully!');
        console.log('✅ Message ID:', message.message_id);
        
        // Test file upload
        console.log('Testing file upload...');
        const fs = require('fs');
        fs.writeFileSync('config_test.txt', 'New config test file - ' + new Date().toISOString());
        
        const document = await bot.sendDocument(channelId, 'config_test.txt', {
            caption: '🔧 New config file upload test'
        });
        console.log('✅ Document uploaded successfully!');
        console.log('✅ File ID:', document.document.file_id);
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('Full error:', error);
    }
    
    process.exit(0);
}

testNewConfig();
