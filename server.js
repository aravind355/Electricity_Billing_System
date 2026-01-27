const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { connectDB, User, Bill, Log, seedData } = require('./db');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'ebs-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
    if (req.url.endsWith('.html') || req.url === '/') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});
app.use(express.static(__dirname));

connectDB().then(seedData);

const validateName = (name) => /^[a-zA-Z\s]+$/.test(name);
const validatePhone = (phone) => /^\d{10}$/.test(phone);

const MINIMUM_CHARGE = 25;
const FINE_PER_MONTH = 150;

const calculateBill = (units, type) => {
    let bill = MINIMUM_CHARGE;
    if (units === 0) return bill;

    let remaining = units;
    let baseRate = type === 'industrial' ? 3.5 : type === 'commercial' ? 2.5 : 1.5;
    let maxRate = type === 'industrial' ? 6.5 : type === 'commercial' ? 5.5 : 4.5;
    let rate = baseRate;

    if (remaining <= 50) {
        bill += remaining * rate;
    } else if (remaining <= 100) {
        bill += 50 * rate;
        bill += (remaining - 50) * (rate + 1);
    } else if (remaining <= 150) {
        bill += 50 * rate;
        bill += 50 * (rate + 1);
        bill += (remaining - 100) * (rate + 2);
    } else {
        bill += 50 * rate;
        bill += 50 * (rate + 1);
        bill += 50 * (rate + 2);
        bill += (remaining - 150) * maxRate;
    }

    return bill;
};

const calculateFine = (dueDate, currentDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date(currentDate);
    if (now <= due) return 0;

    const diffTime = now - due;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const monthsLate = Math.ceil(diffDays / 30);
    return monthsLate * FINE_PER_MONTH;
};

const requireAuth = (roles) => (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    if (roles && !roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};

app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/register', async (req, res) => {
    const { name, phone, email, address, pincode, type } = req.body;
    if (!validateName(name)) return res.status(400).json({ message: "Invalid Name" });
    if (!validatePhone(phone)) return res.status(400).json({ message: "Invalid Phone" });
    if (!address || !pincode || !type) return res.status(400).json({ message: "All fields required" });

    let serviceNo;
    let isUnique = false;
    while (!isUnique) {
        serviceNo = Math.floor(10000 + Math.random() * 90000).toString();
        const existing = await User.findOne({ serviceNo });
        if (!existing) isUnique = true;
    }

    const newUser = new User({ name, phone, email, address, pincode, type, serviceNo });
    await newUser.save();
    res.json({ message: "Registration successful! Your Service Number is " + serviceNo });
});

app.post('/api/login', async (req, res) => {
    const { serviceNo, password } = req.body;
    const user = await User.findOne({ serviceNo, password });

    if (user) {
        if (!user.isApproved && user.role === 'user') return res.status(403).json({ message: "Account pending approval" });
        req.session.user = { id: user._id, serviceNo: user.serviceNo, role: user.role, name: user.name };
        await Log.create({ serviceNo: user.serviceNo, role: user.role, loginTime: new Date() });
        res.json({ message: "Login successful", user: req.session.user });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

app.post('/api/logout', async (req, res) => {
    if (req.session.user) {
        await Log.findOneAndUpdate({ serviceNo: req.session.user.serviceNo, logoutTime: null }, { logoutTime: new Date() }, { sort: { loginTime: -1 } });
    }
    req.session.destroy();
    res.json({ message: "Logged out" });
});

app.get('/api/admin/data', requireAuth(['admin']), async (req, res) => {
    const pending = await User.find({ role: 'user', isApproved: false });
    const usersData = await Promise.all((await User.find({ role: 'user', isApproved: true })).map(async (u) => {
        const billCount = await Bill.countDocuments({ serviceNo: u.serviceNo });
        const totalBill = await Bill.aggregate([{ $match: { serviceNo: u.serviceNo } }, { $group: { _id: null, total: { $sum: "$totalBill" } } }]);
        return { ...u._doc, billCount, totalAmount: totalBill[0]?.total || 0 };
    }));
    const empLogs = await Log.find({ role: 'employee' }).sort({ loginTime: -1 }).limit(20);
    const allRawBills = await Bill.find().sort({ timestamp: -1 });
    const allBills = await Promise.all(allRawBills.map(async (b) => {
        const u = await User.findOne({ serviceNo: b.serviceNo });
        return { ...b._doc, userName: u ? u.name : 'Unknown', userType: u ? u.type : '' };
    }));
    res.json({ pending, usersData, empLogs, allBills });
});

app.post('/api/admin/approve', requireAuth(['admin']), async (req, res) => {
    const user = await User.findByIdAndUpdate(req.body.id, { isApproved: true }, { new: true });
    res.json({ message: "User Approved", serviceNo: user.serviceNo });
});

app.post('/api/delete-user', requireAuth(['admin']), async (req, res) => {
    const user = await User.findById(req.body.id);
    if (user) {
        await User.findByIdAndDelete(req.body.id);
        await Bill.deleteMany({ serviceNo: user.serviceNo });
        res.json({ message: "User and their bills deleted" });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

app.get('/api/employee/data', requireAuth(['employee', 'admin']), async (req, res) => {
    const toInstall = await User.find({ role: 'user', isApproved: true });
    const allBills = await Bill.find().sort({ timestamp: -1 });
    const billsWithUser = await Promise.all(allBills.map(async (b) => {
        const u = await User.findOne({ serviceNo: b.serviceNo });
        return { ...b._doc, userName: u ? u.name : 'Unknown', userType: u ? u.type : '' };
    }));
    const users = await User.find({ role: 'user', isApproved: true });
    res.json({ toInstall: users, bills: billsWithUser, users });
});

app.post('/api/employee/add-usage', requireAuth(['employee', 'admin']), async (req, res) => {
    const { serviceNo, units, month, readingDate } = req.body;
    const user = await User.findOne({ serviceNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalBill = calculateBill(Number(units), user.type);
    const pendingBills = await Bill.find({ serviceNo, status: 'pending' });
    const previousPending = pendingBills.reduce((acc, curr) => acc + curr.totalBill + (curr.fine || 0), 0);

    const newBill = new Bill({
        serviceNo, month, units: Number(units), totalBill, previousPending,
        readingDate: readingDate || new Date(),
        dueDate: new Date(new Date(readingDate || new Date()).getTime() + 15 * 24 * 60 * 60 * 1000)
    });
    await newBill.save();
    res.json({ message: "Bill Generated", bill: newBill });
});

app.post('/api/employee/install', requireAuth(['employee', 'admin']), async (req, res) => {
    res.json({ message: "Installation Confirmed" });
});

app.put('/api/bill/:id', requireAuth(['employee', 'admin']), async (req, res) => {
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

app.delete('/api/bill/:id', requireAuth(['employee', 'admin']), async (req, res) => {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill deleted successfully" });
});

app.get('/api/user/info/:serviceNo', requireAuth(['user', 'employee', 'admin']), async (req, res) => {
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

app.post('/api/payment', requireAuth(['user']), async (req, res) => {
    const { billId, amount, paymentMethod } = req.body;
    const bill = await Bill.findById(billId);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    if (bill.status === 'paid') return res.status(400).json({ message: "Bill already paid" });

    const user = await User.findOne({ serviceNo: bill.serviceNo });
    if (!user || user.serviceNo !== req.session.user.serviceNo) return res.status(403).json({ message: "Unauthorized" });

    const transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    await Bill.findByIdAndUpdate(billId, { status: 'paid', fine: 0, paidAmount: amount, paymentMethod: paymentMethod, transactionId: transactionId, paidAt: new Date() });
    res.json({ success: true, message: "Payment Successful!", transactionId: transactionId, amount: amount });
});

app.listen(3000, () => console.log('Server running on port 3000'));