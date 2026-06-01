// api/admin.js
const express = require('express');
const db = require('../database/connection');

const router = express.Router();

// ======================
// Статистика
// ======================
router.get('/stats', async (req, res) => {
  try {
    const users = await db('users').count({ count: '*' }).first();
    const activeSubscriptions = await db('user_subscriptions')
      .where('lessons_left', '>', 0)
      .count({ count: '*' })
      .first();
    const paymentsToday = await db('payments')
      .whereRaw("date(created_at) = date('now')")
      .count({ count: '*' })
      .first();

    res.json({
      users: users.count,
      activeSubscriptions: activeSubscriptions.count,
      paymentsToday: paymentsToday.count,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ======================
// Пользователи
// ======================
router.get('/users', async (req, res) => {
  try {
    const users = await db('users').select('id', 'first_name', 'last_name', 'email');
    res.json(users);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ======================
// Учителя
// ======================
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await db('teachers').select('id', 'first_name', 'last_name', 'email');
    res.json(teachers);
  } catch (err) {
    console.error('Admin teachers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ======================
// Направления
// ======================
router.get('/directions', async (req, res) => {
  try {
    const directions = await db('directions').select('*');
    res.json(directions);
  } catch (err) {
    console.error('Admin directions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/directions', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const [id] = await db('directions').insert({ name });
    res.json({ id, name });
  } catch (err) {
    console.error('Admin add direction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/teachers', async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const [id] = await db('teachers').insert({
      first_name,
      last_name,
      email
    });

    res.json({
      id,
      first_name,
      last_name,
      email
    });

  } catch (err) {
    console.error('Admin add teacher error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;