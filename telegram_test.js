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

async function testTelegram() {
    try {
        console.log('Testing bot connection...');
        const botInfo = await bot.getMe();
        console.log('Bot info:', botInfo);
        
        console.log('Testing channel access...');
        const chatInfo = await bot.getChat(channelId);
        console.log('Chat info:', chatInfo);
        
        console.log('Testing message send...');
        const message = await bot.sendMessage(channelId, '🧪 Test message from upload system');
        console.log('Message sent:', message.message_id);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
    }
}

testTelegram();
