module.exports = function adminAuth(req, res, next) {
  const key =
    req.headers['x-admin-key'] || req.query.admin_key || req.body.admin_key;

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};