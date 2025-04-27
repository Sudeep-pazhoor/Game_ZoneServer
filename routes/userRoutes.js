const express = require('express');
const router = express.Router();
const { getPaidGames, payForGame, getPurchaseHistory, removePurchase, uploadProfileImage, getProfile, deleteProfileImage } = require('../controllers/userController');
const { userAuthMiddleware } = require('../middlewares/userAuthMiddleware');
const multer = require('multer');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('Multer destination: Uploads');
        cb(null, 'Uploads/');
    },
    filename: (req, file, cb) => {
        console.log('Multer filename:', file.originalname);
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedFormats.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file format. Only JPEG, JPG, or PNG allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes with userAuthMiddleware
router.get('/paid-games', userAuthMiddleware, getPaidGames);
router.post('/pay', userAuthMiddleware, payForGame);
router.get('/purchase-history', userAuthMiddleware, getPurchaseHistory);
router.post('/remove-purchase', userAuthMiddleware, removePurchase);
router.get('/profile', userAuthMiddleware, getProfile);

// Delete profile image route
router.delete('/delete-profile-image', userAuthMiddleware, deleteProfileImage);

// Upload route with debug logging
router.post('/upload-profile-image', (req, res, next) => {
    console.log('Upload middleware reached');
    console.log('Request headers:', req.headers);
    console.log('Request body before Multer:', req.body);
    upload.single('profileImage')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.log('Multer error:', err.message, err.code);
            return res.status(400).json({ error: `Multer error: ${err.message}` });
        }
        if (err) {
            console.log('Multer error:', err.message);
            return res.status(400).json({ error: err.message });
        }
        console.log('Multer processed file:', req.file);
        console.log('FormData fields:', req.body);
        next();
    });
}, userAuthMiddleware, uploadProfileImage);

module.exports = router;