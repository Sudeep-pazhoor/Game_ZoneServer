const jwt = require('jsonwebtoken');

const adminAuthMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.adminId) {
            return res.status(401).json({ message: 'Invalid token for admin' });
        }
        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = adminAuthMiddleware;