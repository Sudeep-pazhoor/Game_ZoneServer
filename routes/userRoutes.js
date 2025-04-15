const express = require('express');
const router = express.Router();
const { getPaidGames, payForGame, verifyPayment, getPurchaseHistory, removePurchase } = require('../controllers/userController');

router.get('/paid-games', getPaidGames);
router.post('/pay', payForGame);
router.post('/verify-payment', verifyPayment);
router.get('/purchase-history', getPurchaseHistory);
router.post('/remove-purchase', removePurchase); // Add this line

module.exports = router;