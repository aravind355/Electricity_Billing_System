const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/electricityBilling');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Database Connection Error:', err);
        process.exit(1);
    }
};

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

const billSchema = new mongoose.Schema({
    serviceNo: String,
    month: String,
    units: Number,
    totalBill: Number,
    readingDate: { type: Date, default: Date.now },
    dueDate: Date,
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    fine: { type: Number, default: 0 },
    previousPending: { type: Number, default: 0 },
    paidAmount: Number,
    paymentMethod: String,
    transactionId: String,
    paidAt: Date,
    timestamp: { type: Date, default: Date.now }
});

const logSchema = new mongoose.Schema({
    serviceNo: String,
    role: String,
    loginTime: { type: Date, default: Date.now },
    logoutTime: Date
});

const User = mongoose.model('User', userSchema);
const Bill = mongoose.model('Bill', billSchema);
const Log = mongoose.model('Log', logSchema);

const seedData = async () => {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
        await User.create({ name: 'Admin', serviceNo: '11111', password: '111', role: 'admin', type: 'commercial', phone: '9999999999', isApproved: true });
        console.log('Admin seeded');
    }
    const empExists = await User.findOne({ role: 'employee' });
    if (!empExists) {
        await User.create({ name: 'Employee 1', serviceNo: '22222', password: '222', role: 'employee', type: 'household', phone: '8888888888', isApproved: true });
        console.log('Employee seeded');
    }
};

module.exports = { connectDB, User, Bill, Log, seedData };