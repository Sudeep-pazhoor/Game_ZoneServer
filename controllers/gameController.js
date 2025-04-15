const Game = require('../models/gameModel');

exports.getAllGames = async (req, res) => {
    try {
        const games = await Game.find();
        res.status(200).json(games);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addGame = async (req, res) => {
    try {
        const { title, link, image, price } = req.body;
        const game = new Game({ title, link, image, price: price || 5 }); // Use provided price or default
        await game.save();
        res.status(201).json({ message: 'Game added successfully', game });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.editGame = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, link, image, price } = req.body;
        const game = await Game.findByIdAndUpdate(
            id,
            { title, link, image, price: price || 5 }, // Use provided price or default
            { new: true }
        );
        if (!game) return res.status(404).json({ message: 'Game not found' });
        res.status(200).json({ message: 'Game updated successfully', game });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteGame = async (req, res) => {
    try {
        const { id } = req.params;
        const game = await Game.findByIdAndDelete(id);
        if (!game) return res.status(404).json({ message: 'Game not found' });
        res.status(200).json({ message: 'Game deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};