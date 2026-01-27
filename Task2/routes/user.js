const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bill = require('../models/Bill');
const { requireAuth } = require('../middleware/auth');
const { calculateFine } = require('../utils/billing');

router.get('/info/:serviceNo', requireAuth(['user', 'employee', 'admin']), async (req, res) => {
    const user = await User.findOne({ serviceNo: req.params.serviceNo });
    const bills = await Bill.find({ serviceNo: req.params.serviceNo }).sort({ timestamp: -1 });
    const now = new Date();

    const billsWithFine = bills.map(bill => {
        const fine = bill.status === 'pending' ? calculateFine(bill.dueDate, now) : 0;
        const isOverdue = bill.status === 'pending' && new Date(bill.dueDate) < now;
        return { ...bill._doc, fine, isOverdue };
    });

    res.json({ user, bills: billsWithFine });
});

router.post('/payment', requireAuth(['user']), async (req, res) => {
    const { billId, amount, paymentMethod } = req.body;

    const bill = await Bill.findById(billId);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    if (bill.status === 'paid') return res.status(400).json({ message: "Bill already paid" });

    const user = await User.findOne({ serviceNo: bill.serviceNo });
    if (!user || user.serviceNo !== req.session.user.serviceNo) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);

    await Bill.findByIdAndUpdate(billId, {
        status: 'paid',
        fine: 0,
        paidAmount: amount,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        paidAt: new Date()
    });

    res.json({
        success: true,
        message: "Payment Successful!",
        transactionId: transactionId,
        amount: amount
    });
});

module.exports = router;
