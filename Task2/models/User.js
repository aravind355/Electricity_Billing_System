const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    address: String,
    pincode: String,
    serviceNo: { type: String, unique: true },
    type: { type: String, enum: ['household', 'commercial', 'industrial'] },
    password: { type: String, default: '123' },
    role: { type: String, enum: ['admin', 'employee', 'user'], default: 'user' },
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
