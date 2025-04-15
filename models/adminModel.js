const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
});

// Pre-save hook to hash the password
adminSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);//Salt is a random string added to the password before hashing to make it more secure.
    }
    next();
});

module.exports = mongoose.model('Admin', adminSchema);