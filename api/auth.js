const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');;
const { sendVerificationCode, verifyCode } = require('../services/smsService');

const router = express.Router();

// РЕГИСТРАЦИЯ РОДИТЕЛЯ
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    try {
        await db.run(`
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, 'parent')
        `, [name, email, hashed]);

        res.json({ message: 'Registered' });
    } catch (err) {
        res.status(400).json({ error: 'User exists' });
    }
});

// ЛОГИН
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Wrong password' });

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({ token });
});

router.post('/send-code', async (req, res) => {
    const { phone } = req.body;

    await sendVerificationCode(phone);

    res.json({ message: 'Code sent' });
});

router.post('/verify-phone', async (req, res) => {
    const { phone, code } = req.body;

    const valid = verifyCode(phone, code);

    if (!valid) return res.status(400).json({ error: 'Invalid code' });

    await db.run(`
        UPDATE users SET phone_verified = 1
        WHERE phone = ?
    `, [phone]);

    res.json({ message: 'Phone verified' });
});

module.exports = router;