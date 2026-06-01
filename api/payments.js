const express = require('express');
const db = require('../database/db');;
const { createPayment, handleSuccessfulPayment } = require('../services/paymentService');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('parent'));

router.post('/create-purchase', async (req, res) => {

    const { subscription_type_id, lessons } = req.body;

    const subType = await db.get(`
        SELECT * FROM subscription_types WHERE id = ?
    `, [subscription_type_id]);

    if (!subType) return res.status(404).json({ error: 'Not found' });

    const totalPrice = subType.base_price_per_lesson * lessons;

    const result = await db.run(`
        INSERT INTO purchase_requests
        (user_id, subscription_type_id, lessons_requested, calculated_price)
        VALUES (?, ?, ?, ?)
    `, [req.user.id, subscription_type_id, lessons, totalPrice]);

    const payment = await createPayment(req.user.id, result.lastID, totalPrice);

    res.json(payment);
});

router.post('/webhook', async (req, res) => {

    const { provider_payment_id } = req.body;

    await handleSuccessfulPayment(provider_payment_id);

    res.json({ received: true });
});

module.exports = router;