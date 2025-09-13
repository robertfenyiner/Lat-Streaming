const TelegramBot = require('node-telegram-bot-api');

const botToken = '8378067144:AAFeP7zGV-6HZMXRXe2tXGE8euP7kBLeUak';

const bot = new TelegramBot(botToken, { 
    polling: false,
    request: {
        agentOptions: {
            family: 4  // Force IPv4
        }
    }
});

async function testBot() {
    try {
        console.log('Testing bot connection...');
        const botInfo = await bot.getMe();
        console.log('✅ Bot connection successful:', botInfo.username);
        
        // Try to get chat info with timeout
        console.log('Testing channel access with timeout...');
        const channelId = '-1003001236281';
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
        );
        
        const chatPromise = bot.getChat(channelId);
        
        try {
            const chatInfo = await Promise.race([chatPromise, timeoutPromise]);
            console.log('✅ Channel access successful:', chatInfo.title);
        } catch (error) {
            if (error.message === 'Timeout after 10 seconds') {
                console.log('❌ Channel access timed out - likely no permissions');
            } else {
                console.log('❌ Channel access error:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Bot connection error:', error.message);
    }
    
    process.exit(0);
}

testBot();
