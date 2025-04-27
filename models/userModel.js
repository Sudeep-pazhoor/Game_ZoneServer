const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    paidGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
    lastPurchase: { type: Date, default: Date.now },
    profileImage: { type: String, default: '' }
});

module.exports = mongoose.model('User', userSchema);