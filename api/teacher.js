const express = require('express');
const db = require('../database/db');;
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('teacher'));


// 🔹 МОИ ЗАНЯТИЯ
router.get('/lessons', async (req, res) => {
    const lessons = await db.all(`
        SELECT * FROM lessons
        WHERE teacher_id = ?
    `, [req.user.id]);

    res.json(lessons);
});


// 🔹 МОЙ БАЛАНС
router.get('/balance', async (req, res) => {
    const teacher = await db.get(`
        SELECT balance FROM teachers
        WHERE id = ?
    `, [req.user.id]);

    res.json(teacher);
});

// 🔹 МОИ KPI
router.get('/kpi', async (req, res) => {
    const stats = await db.get(`
        SELECT COUNT(*) as lessons
        FROM lessons
        WHERE teacher_id = ?
        AND status = 'completed'
    `, [req.user.id]);

    res.json(stats);
});

module.exports = router;