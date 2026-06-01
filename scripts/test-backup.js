require('dotenv').config();
const backupService = require('../services/backup');

async function testBackup() {
    console.log('\nТЕСТОВЫЙ ЗАПУСК БЕКАПА\n');
    
    try {
        const result = await backupService.manualBackup();
        
        if (result.success) {
            console.log('\n✅ БЕКАП УСПЕШНО ВЫПОЛНЕН!');
            console.log(`📊 URL таблицы: ${result.url}`);
        } else {
            console.log('\n❌ ОШИБКА БЕКАПА:', result.error);
        }
    } catch (error) {
        console.error('\n❌ Ошибка:', error);
    }
}

testBackup();