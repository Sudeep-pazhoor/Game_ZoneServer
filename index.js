require('events').EventEmitter.defaultMaxListeners = 15;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Import Routes
const authRoutes = require('./routes/authRoutes.js');
const gameRoutes = require('./routes/gameRoutes.js');
const userRoutes = require('./routes/userRoutes.js');

// Import Middleware
const { userAuthMiddleware } = require('./middlewares/userAuthMiddleware.js');

// Initialize Express App
const server = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Uploads directory created');
}

// Set folder permissions (Windows and Unix-compatible)
try {
    if (process.platform === 'win32') {
        execSync(`icacls "${uploadDir}" /grant Everyone:F`);
        console.log('Uploads directory permissions set for Windows');
    } else {
        fs.chmodSync(uploadDir, '777');
        console.log('Uploads directory permissions set for Unix');
    }
} catch (error) {
    console.error('Error setting uploads permissions:', error.message);
}

// Middleware
server.use(cors());
server.use(express.json()); // Parse JSON request bodies
server.use('/Uploads', express.static(uploadDir)); // Serve uploaded files

// Debug logging for all requests
server.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Port Configuration
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.DATABASE;

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((err) => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1); // Exit if connection fails
    });

// Routes
server.use('/api/auth', authRoutes);
server.use('/api/games', gameRoutes);
server.use('/api/user', userRoutes);

// Test Route
server.get('/', (req, res) => {
    res.status(200).send("<h1>Game Cart Backend Server is Active</h1>");
});

// Error Handling Middleware
server.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong on the server!' });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});