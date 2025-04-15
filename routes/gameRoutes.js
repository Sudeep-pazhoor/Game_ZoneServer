const express = require('express');
const { addGame, editGame, deleteGame, getAllGames } = require('../controllers/gameController');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

const router = express.Router();

// Fetch all games (public)
// Changed from '/games' to '/' so the full path is '/api/games'
router.get('/', getAllGames);

// Add a new game (protected route)
router.post('/', adminAuthMiddleware, addGame);

// Edit a game (protected route)
router.put('/:id', adminAuthMiddleware, editGame);

// Delete a game (protected route)
router.delete('/:id', adminAuthMiddleware, deleteGame);

module.exports = router;