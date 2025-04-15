const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    link: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: false, default: 5 } // Default price of $5 (or your currency)
});

module.exports = mongoose.model('Game', gameSchema);