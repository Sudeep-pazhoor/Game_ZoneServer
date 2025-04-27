const User = require('../models/userModel');
const Game = require('../models/gameModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

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

        const user = await User.findById(req.userId).populate('paidGames', 'title image price link');
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
            user.lastPurchase = new Date();
            await user.save();
            console.log(`User ${user.username} paid for game ${gameId}`);
        }
        res.status(200).json({ message: 'Paid successfully' });
    } catch (error) {
        console.error('Payment error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getPurchaseHistory = async (req, res) => {
    try {
        const users = await User.find()
            .populate('paidGames', 'title price _id')
            .select('username email paidGames lastPurchase updatedAt createdAt _id');

        const purchaseHistory = [];
        users.forEach(user => {
            user.paidGames.forEach(game => {
                purchaseHistory.push({
                    userId: user._id,
                    gameId: game._id,
                    username: user.username,
                    email: user.email,
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
        const { userId, gameId } = req.body;
        if (!userId || !gameId) {
            return res.status(400).json({ error: 'userId and gameId are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const initialLength = user.paidGames.length;
        user.paidGames = user.paidGames.filter(id => id.toString() !== gameId);
        if (user.paidGames.length < initialLength) {
            await user.save();
            res.status(200).json({ message: 'Purchase removed successfully' });
        } else {
            return res.status(404).json({ error: 'Purchase not found for this user' });
        }
    } catch (error) {
        console.error('Remove purchase error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.uploadProfileImage = async (req, res) => {
    try {
        console.log('Upload attempt:', { file: req.file, userId: req.userId });
        if (!req.file) {
            console.log('No file received in uploadProfileImage');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.profileImage = `/Uploads/${req.file.filename}`;
        await user.save();

        res.status(200).json({ message: 'Profile image uploaded successfully', profileImage: user.profileImage });
    } catch (error) {
        console.error('Upload profile image error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.profileImage) {
            return res.status(400).json({ error: 'No profile image to delete' });
        }

        const filePath = path.join(__dirname, '..', user.profileImage);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            }
        } catch (fileError) {
            console.error('Error deleting file:', fileError.message);
            // Continue with database update even if file deletion fails
        }

        user.profileImage = '';
        await user.save();

        res.status(200).json({ message: 'Profile image deleted successfully', profileImage: user.profileImage });
    } catch (error) {
        console.error('Delete profile image error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await User.findById(req.userId).select('username email profileImage');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            username: user.username,
            email: user.email,
            profileImage: user.profileImage || ''
        });
    } catch (error) {
        console.error('Get profile error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};