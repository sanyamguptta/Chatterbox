/**
 * Admin-only middleware.
 * Must be used AFTER authMiddleware — it assumes req.user is set.
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = adminMiddleware;
