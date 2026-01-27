const mongoose = require('mongoose');

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

module.exports = mongoose.model('Bill', billSchema);
