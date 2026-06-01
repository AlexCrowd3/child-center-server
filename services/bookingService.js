const db = require('../database/db');;

/* ===============================
   HELPERS
================================ */

async function validateSubscription(trx, subscriptionId, activityLevel) {

    const sub = await trx('user_subscriptions as us')
        .join('subscription_types as st', 'st.id', 'us.subscription_type_id')
        .where('us.id', subscriptionId)
        .where('us.is_active', 1)
        .first();

    if (!sub) throw new Error('Subscription not found');

    if (sub.lessons_left <= 0)
        throw new Error('No lessons left');

    if (sub.end_date < trx.raw("date('now')"))
        throw new Error('Subscription expired');

    if (activityLevel && sub.level_value < activityLevel)
        throw new Error('Subscription level too low');

    return sub;
}

/* ===============================
   GROUP BOOKING
================================ */

async function bookGroupLesson({
    scheduleId,
    childId,
    userId,
    subscriptionId
}) {

    return db.transaction(async trx => {

        const schedule = await trx('group_schedules as gs')
            .join('activity_types as at', 'at.id', 'gs.activity_type_id')
            .where('gs.id', scheduleId)
            .select('gs.*', 'at.level_value', 'at.max_places')
            .first();

        if (!schedule)
            throw new Error('Schedule not found');

        if (schedule.status !== 'scheduled')
            throw new Error('Lesson unavailable');

        if (schedule.current_participants >= schedule.max_places)
            throw new Error('No places left');

        const sub = await validateSubscription(
            trx,
            subscriptionId,
            schedule.level_value
        );

        const existing = await trx('group_bookings')
            .where({
                schedule_id: scheduleId,
                child_id: childId,
                status: 'booked'
            })
            .first();

        if (existing)
            throw new Error('Already booked');

        await trx('group_bookings').insert({
            schedule_id: scheduleId,
            child_id: childId,
            user_id: userId,
            subscription_id: subscriptionId,
            teacher_payout: sub.teacher_payout_per_lesson
        });

        await trx('user_subscriptions')
            .where({ id: subscriptionId })
            .decrement('lessons_left', 1);

        await trx('group_schedules')
            .where({ id: scheduleId })
            .increment('current_participants', 1);

        return { success: true };
    });
}

/* ===============================
   CANCEL BOOKING
================================ */

async function cancelGroupBooking(bookingId) {

    return db.transaction(async trx => {

        const booking = await trx('group_bookings')
            .where({ id: bookingId })
            .first();

        if (!booking)
            throw new Error('Booking not found');

        if (booking.status !== 'booked')
            return { success: true };

        await trx('group_bookings')
            .where({ id: bookingId })
            .update({ status: 'cancelled' });

        await trx('user_subscriptions')
            .where({ id: booking.subscription_id })
            .increment('lessons_left', 1);

        await trx('group_schedules')
            .where({ id: booking.schedule_id })
            .decrement('current_participants', 1);

        return { success: true };
    });
}

module.exports = {
    bookGroupLesson,
    cancelGroupBooking
};