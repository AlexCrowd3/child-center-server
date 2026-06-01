const express = require('express');
const router = express.Router();

const { requireRole } = require('../middleware/auth');
const bookingService = require('../services/bookingService');
const lessonService = require('../services/lessonService');

router.use(requireRole('parent'));

/* =========================
   BOOK GROUP LESSON
========================= */

router.post('/group-book/:scheduleId', async (req, res) => {
    try {

        const result = await bookingService.bookGroupLesson({
            scheduleId: Number(req.params.scheduleId),
            childId: req.body.child_id,
            subscriptionId: req.body.subscription_id,
            userId: req.user.id
        });

        res.json(result);

    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

/* =========================
   CANCEL BOOKING
========================= */

router.post('/booking/:id/cancel', async (req, res) => {
    try {

        const result =
            await bookingService.cancelGroupBooking(req.params.id);

        res.json(result);

    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

/* =========================
   MY UPCOMING LESSONS
========================= */

router.get('/my-lessons', async (req, res) => {
    try {

        const lessons =
            await lessonService.getUpcomingLessons(req.user.id);

        res.json(lessons);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* =========================
   AVAILABLE SCHEDULE
========================= */

router.get('/schedule', async (req, res) => {
    try {

        const data =
            await lessonService.getAvailableSchedule();

        res.json(data);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;