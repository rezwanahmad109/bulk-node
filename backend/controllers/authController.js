const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Helper: Generate a signed JWT for a given user ID.
 * @param {string} id - MongoDB user ObjectId
 * @returns {string} Signed JWT
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new BulkNode user
 * @access  Public
 */
const register = async (req, res) => {
    const { fullName, email, businessName, businessType, country, password } = req.body;

    try {
        // Check if a user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'An account with this email already exists. Please log in instead.',
            });
        }

        // Create the user (password is hashed via the pre-save hook in the User model)
        const user = await User.create({
            fullName,
            email,
            businessName,
            businessType,
            country,
            password,
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                businessName: user.businessName,
                businessType: user.businessType,
                country: user.country,
            },
        });
    } catch (err) {
        // Handle Mongoose validation errors cleanly for the frontend
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, error: messages.join('. ') });
        }
        console.error('Register Error:', err);
        res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Log in an existing user
 * @access  Public
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Please provide your email and password.',
        });
    }

    try {
        // Find user and explicitly select the password field (it's excluded by default)
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                success: false,
                error: 'Incorrect email or password. Please try again.',
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                businessName: user.businessName,
                businessType: user.businessType,
                country: user.country,
            },
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get the currently logged-in user's profile
 * @access  Private (requires JWT)
 */
const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            businessName: req.user.businessName,
            businessType: req.user.businessType,
            country: req.user.country,
        },
    });
};

module.exports = { register, login, getMe };
