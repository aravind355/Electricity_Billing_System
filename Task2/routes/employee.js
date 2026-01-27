const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bill = require('../models/Bill');
const { requireAuth } = require('../middleware/auth');
const { calculateBill } = require('../utils/billing');

router.get('/data', requireAuth(['employee', 'admin']), async (req, res) => {
    try {
        const toInstall = await User.find({ role: 'user', isApproved: true });

        const allBills = await Bill.find().sort({ timestamp: -1 });
        const billsWithUser = await Promise.all(allBills.map(async (b) => {
            const u = await User.findOne({ serviceNo: b.serviceNo });
            return { ...b._doc, userName: u ? u.name : 'Unknown', userType: u ? u.type : '' };
        }));

        const users = await User.find({ role: 'user', isApproved: true });

        res.json({ toInstall: users, bills: billsWithUser, users });
    } catch (err) {
        res.status(500).json({ message: "Error fetching data" });
    }
});

router.post('/install', requireAuth(['employee', 'admin']), async (req, res) => {
    res.json({ message: "Installation Confirmed" });
});

router.post('/add-usage', requireAuth(['employee', 'admin']), async (req, res) => {
    const { serviceNo, units, month, readingDate } = req.body;

    const user = await User.findOne({ serviceNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalBill = calculateBill(Number(units), user.type);

    const pendingBills = await Bill.find({ serviceNo, status: 'pending' });
    const previousPending = pendingBills.reduce((acc, curr) => acc + curr.totalBill + (curr.fine || 0), 0);

    const newBill = new Bill({
        serviceNo,
        month,
        units: Number(units),
        totalBill,
        previousPending,
        readingDate: readingDate || new Date(),
        dueDate: new Date(new Date(readingDate || new Date()).getTime() + 15 * 24 * 60 * 60 * 1000)
    });

    await newBill.save();
    res.json({ message: "Bill Generated", bill: newBill });
});

module.exports = router;
