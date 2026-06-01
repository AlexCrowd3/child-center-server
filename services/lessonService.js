const db = require('../database/db');;

/* =================================
   AVAILABLE SCHEDULE
================================= */

async function getAvailableSchedule() {

    return db('group_schedules as gs')
        .join('activity_types as at', 'at.id', 'gs.activity_type_id')
        .where('gs.status', 'scheduled')
        .select(
            'gs.id',
            'gs.date',
            'gs.start_time',
            'gs.end_time',
            'gs.current_participants',
            'gs.max_places',
            'at.name as activity'
        )
        .orderBy(['date', 'start_time']);
}

/* =================================
   USER UPCOMING LESSONS
================================= */

async function getUpcomingLessons(userId) {

    return db('group_bookings as gb')
        .join('group_schedules as gs', 'gs.id', 'gb.schedule_id')
        .where('gb.user_id', userId)
        .where('gb.status', 'booked')
        .select(
            'gs.date',
            'gs.start_time',
            'gs.end_time',
            'gs.id as schedule_id'
        );
}

/* =================================
   CRON: FINISH LESSONS
================================= */

async function processFinishedLessons() {

    const lessons = await db('group_schedules')
        .where('status', 'scheduled')
        .whereRaw(
            "datetime(date || ' ' || end_time) <= datetime('now')"
        );

    for (const lesson of lessons) {

        const bookings = await db('group_bookings')
            .where({
                schedule_id: lesson.id,
                status: 'booked'
            });

        for (const booking of bookings) {

            await db('teachers')
                .where({ id: lesson.teacher_id })
                .increment('balance', booking.teacher_payout);

            await db('group_bookings')
                .where({ id: booking.id })
                .update({ status: 'visited' });
        }

        await db('group_schedules')
            .where({ id: lesson.id })
            .update({ status: 'completed' });
    }
}

module.exports = {
    getAvailableSchedule,
    getUpcomingLessons,
    processFinishedLessons
};