const TelegramBot = require('node-telegram-bot-api');

const botToken = '8378067144:AAFeP7zGV-6HZMXRXe2tXGE8euP7kBLeUak';
const channelId = '-1003001236281';

const bot = new TelegramBot(botToken, { 
    polling: false,
    request: {
        agentOptions: {
            family: 4  // Force IPv4
        }
    }
});

async function debugTelegram() {
    try {
        console.log('1. Testing basic bot info...');
        const botInfo = await bot.getMe();
        console.log('✅ Bot:', botInfo.username, botInfo.id);
        
        console.log('2. Testing simple message send...');
        try {
            const message = await bot.sendMessage(channelId, '🔧 Debug test - ' + new Date().toISOString());
            console.log('✅ Message sent successfully! ID:', message.message_id);
            console.log('✅ Chat ID confirmed:', message.chat.id);
            console.log('✅ Chat title:', message.chat.title);
            
            // Now test document upload
            console.log('3. Testing document upload...');
            const fs = require('fs');
            fs.writeFileSync('debug_test.txt', 'Debug test file content - ' + new Date().toISOString());
            
            const document = await bot.sendDocument(channelId, 'debug_test.txt', {
                caption: '🧪 Debug file upload test'
            });
            console.log('✅ Document uploaded successfully! File ID:', document.document.file_id);
            
        } catch (error) {
            console.log('❌ Send message error:', error.message);
            console.log('Full error response:', error.response?.body);
        }
        
    } catch (error) {
        console.error('❌ Critical error:', error.message);
        console.error('Full error:', error);
    }
    
    process.exit(0);
}

debugTelegram();
