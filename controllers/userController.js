const User = require('../models/userModel');
const Game = require('../models/gameModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign(
            { userId: user._id, role: 'user', username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPaidGames = async (req, res) => {
    try {
        console.log('User ID:', req.userId);
        if (!req.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await User.findById(req.userId).populate('paidGames', 'title image price');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user.paidGames);
    } catch (error) {
        console.error('Get paid games error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.payForGame = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('User ID from middleware:', req.userId);

        const { gameId, price } = req.body;
        if (!gameId) {
            return res.status(400).json({ error: 'gameId is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (price !== undefined && game.price !== Number(price)) {
            return res.status(400).json({ error: 'Price mismatch' });
        }

        if (!user.paidGames.some(id => id.toString() === gameId)) {
            user.paidGames.push(gameId);
            user.lastPurchase = new Date(); // Explicitly set lastPurchase
            await user.save();
            console.log(`User ${user.username} paid for game ${gameId}`);
        }
        res.status(200).json({ message: 'Paid successfully' });
    } catch (error) {
        console.error('Payment error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const user = await User.findById(req.userId);
        const gameId = req.body.gameId;

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {
            if (!user.paidGames.some(id => id.toString() === gameId)) {
                user.paidGames.push(gameId);
                await user.save();
            }
            res.status(200).json({ message: 'Payment verified and game unlocked' });
        } else {
            res.status(400).json({ error: 'Payment verification failed' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPurchaseHistory = async (req, res) => {
    try {
        const users = await User.find()
            .populate('paidGames', 'title price _id') // Include game _id
            .select('username email paidGames lastPurchase updatedAt createdAt _id'); // Adds email

        const purchaseHistory = [];
        users.forEach(user => {
            user.paidGames.forEach(game => {
                purchaseHistory.push({
                    userId: user._id,
                    gameId: game._id,
                    username: user.username,
                    email: user.email, // Add email
                    gameTitle: game.title,
                    gameAmount: game.price,
                    purchaseTime: user.lastPurchase || user.updatedAt || user.createdAt || new Date(),
      });
            });
        });

        res.status(200).json(purchaseHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.removePurchase = async (req, res) => {
    try {
        const { userId, gameId } = req.body; // Expect userId and gameId in the request body
        if (!userId || !gameId) {
            return res.status(400).json({ error: 'userId and gameId are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove the gameId from paidGames if it exists
        const initialLength = user.paidGames.length;
        user.paidGames = user.paidGames.filter(id => id.toString() !== gameId);
        if (user.paidGames.length < initialLength) {
            await user.save();
            res.status(200).json({ message: 'Purchase removed successfully' });
        } else {
            res.status(404).json({ error: 'Purchase not found for this user' });
        }
    } catch (error) {
        console.error('Remove purchase error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};