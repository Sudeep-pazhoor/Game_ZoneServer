require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/adminModel');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch((err) => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const createAdmin = async () => {
    try {
        // Check if admin already exists
        let admin = await Admin.findOne({ email: 'admin@gmail.com' });
        if (admin) {
            // Update the existing admin's password
            admin.password = await bcrypt.hash('admin123', 10);
            await admin.save();
            console.log('Admin password updated successfully:', admin);
        } else {
            // Create a new admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            admin = new Admin({
                email: 'admin@gmail.com',
                password: hashedPassword,
            });
            await admin.save();
            console.log('Admin created successfully:', admin);
        }
        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating/updating admin:', error);
        mongoose.connection.close();
    }
};

createAdmin();