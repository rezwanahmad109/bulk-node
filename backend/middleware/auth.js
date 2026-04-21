const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect Middleware
 * Verifies the JWT from the Authorization header and attaches
 * the user object to req.user for use in downstream controllers.
 */
const protect = async (req, res, next) => {
    let token;

    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'You are not logged in. Please sign in to continue.',
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user to the request with explicit password exclusion.
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'The user belonging to this session no longer exists.',
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: 'Your session is invalid or has expired. Please log in again.',
        });
    }
};

module.exports = { protect };
