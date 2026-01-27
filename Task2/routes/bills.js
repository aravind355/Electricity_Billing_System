const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bill = require('../models/Bill');
const { requireAuth } = require('../middleware/auth');
const { calculateBill } = require('../utils/billing');

router.put('/:id', requireAuth(['employee', 'admin']), async (req, res) => {
    const { units, month, readingDate, status } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    const updateData = {};
    if (units !== undefined) {
        const user = await User.findOne({ serviceNo: bill.serviceNo });
        updateData.units = Number(units);
        updateData.totalBill = calculateBill(Number(units), user ? user.type : 'household');
    }
    if (month) updateData.month = month;
    if (readingDate) updateData.readingDate = readingDate;
    if (status) updateData.status = status;

    const updated = await Bill.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
});

router.delete('/:id', requireAuth(['employee', 'admin']), async (req, res) => {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill deleted successfully" });
});

module.exports = router;
