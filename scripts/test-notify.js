require('dotenv').config();
const notificationService = require('../services/notifications');

async function testNotifications() {
    console.log('\nТЕСТОВЫЙ ЗАПУСК УВЕДОМЛЕНИЙ\n');
    
    try {
        await notificationService.checkSubscriptions();
        await notificationService.checkPackages();
        
        console.log('\n✅ УВЕДОМЛЕНИЯ СОЗДАНЫ!');
    } catch (error) {
        console.error('\n❌ Ошибка:', error);
    }
}

testNotifications();