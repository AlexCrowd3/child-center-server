const jwt = require('jsonwebtoken');

const SECRET = 'supersecretkey';

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;

    if (!header) return res.status(401).json({ error: 'No token' });

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    };
}

module.exports = {
    authMiddleware,
    requireRole
};