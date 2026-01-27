const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bill = require('../models/Bill');
const Log = require('../models/Log');
const { requireAuth } = require('../middleware/auth');

router.get('/data', requireAuth(['admin']), async (req, res) => {
    try {
        const pending = await User.find({ role: 'user', isApproved: false });
        const usersData = await Promise.all((await User.find({ role: 'user', isApproved: true })).map(async (u) => {
            const billCount = await Bill.countDocuments({ serviceNo: u.serviceNo });
            const totalBill = await Bill.aggregate([
                { $match: { serviceNo: u.serviceNo } },
                { $group: { _id: null, total: { $sum: "$totalBill" } } }
            ]);
            return { ...u._doc, billCount, totalAmount: totalBill[0]?.total || 0 };
        }));

        const empLogs = await Log.find({ role: 'employee' }).sort({ loginTime: -1 }).limit(20);

        const allRawBills = await Bill.find().sort({ timestamp: -1 });
        const allBills = await Promise.all(allRawBills.map(async (b) => {
            const u = await User.findOne({ serviceNo: b.serviceNo });
            return { ...b._doc, userName: u ? u.name : 'Unknown', userType: u ? u.type : '' };
        }));

        res.json({ pending, usersData, empLogs, allBills });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

router.post('/approve', requireAuth(['admin']), async (req, res) => {
    const user = await User.findByIdAndUpdate(req.body.id, { isApproved: true }, { new: true });
    res.json({ message: "User Approved", serviceNo: user.serviceNo });
});

router.post('/delete-user', requireAuth(['admin']), async (req, res) => {
    const user = await User.findById(req.body.id);
    if (user) {
        await User.findByIdAndDelete(req.body.id);
        await Bill.deleteMany({ serviceNo: user.serviceNo });
        res.json({ message: "User and their bills deleted" });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

module.exports = router;
