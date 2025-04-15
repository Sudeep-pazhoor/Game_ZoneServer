const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');

// User routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Admin routes
router.post('/admin/login', adminController.login);

module.exports = router;