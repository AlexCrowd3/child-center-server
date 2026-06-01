require('dotenv').config();
const db = require('../database/db');;
const bcrypt = require('bcrypt');

async function seed() {
    console.log('Старт сида');

    const hash = await bcrypt.hash('123456', 10);

    await db('bookings').del();
    await db('schedules').del();
    await db('purchase_requests').del();
    await db('user_subscriptions').del();
    await db('activity_types').del();
    await db('subscription_types').del();
    await db('children').del();
    await db('teachers').del();
    await db('users').del();

    const [teacherId] = await db('teachers').insert({
        login: 'Иван Педагогов',
        password_hash: hash,
        first_name: 'Иван',
        last_name: 'Педагогов',
        phone: '79001110001',
        payout_day_1: 1,
        payout_day_2: 15
    });

    const [parentId] = await db('users').insert({
        login: 'parent_test',
        password_hash: hash,
        first_name: 'Анна',
        last_name: 'Иванова',
        phone: '79002220002'
    });

    const [childId] = await db('children').insert({
        parent_id: parentId,
        first_name: 'Дмитрий',
        birth_date: '2017-03-15',
        gender: 'male'
    });

    await db('subscription_types').insert([
        {
            name: 'Старт',
            level_value: 1,
            base_price_per_lesson: 1000,
            teacher_payout_per_lesson: 300
        },
        {
            name: 'Стандарт',
            level_value: 2,
            base_price_per_lesson: 900,
            teacher_payout_per_lesson: 300
        },
        {
            name: 'Премиум',
            level_value: 3,
            base_price_per_lesson: 800,
            teacher_payout_per_lesson: 300
        }
    ]);

    await db('activity_types').insert({
        name: 'Робототехника',
        teacher_id: teacherId,
        format: 'group',
        level_value: 2,
        duration_minutes: 45,
        max_places: 8
    });

    await db('activity_types').insert({
        name: 'Гитара',
        teacher_id: teacherId,
        format: 'individual',
        duration_minutes: 45,
        individual_price: 1500,
        teacher_payout_individual: 500
    });

    console.log('✅ Сид завершён');
    process.exit();
}

seed();