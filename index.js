require('events').EventEmitter.defaultMaxListeners = 15;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import Routes
const authRoutes = require('./routes/authRoutes.js');
const gameRoutes = require('./routes/gameRoutes.js');
const userRoutes = require('./routes/userRoutes.js');

// Import Middleware
const { userAuthMiddleware } = require('./middlewares/userAuthMiddleware.js'); // This should work now

// Initialize Express App
const server = express();

// Middleware
server.use(cors());
server.use(express.json()); // Parse JSON request bodies

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
server.use('/api/user', userAuthMiddleware, userRoutes); // Ensure middleware is applied

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