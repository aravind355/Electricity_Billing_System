const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Log = require('../models/Log');
const { validateName, validatePhone, validateEmail } = require('../utils/validation');

router.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

router.post('/register', async (req, res) => {
    const { name, phone, email, address, pincode, type } = req.body;

    if (!validateName(name)) return res.status(400).json({ message: "Invalid Name" });
    if (!validatePhone(phone)) return res.status(400).json({ message: "Invalid Phone" });
    if (email && !validateEmail(email)) return res.status(400).json({ message: "Invalid Email" });
    if (!address || !pincode || !type) return res.status(400).json({ message: "All fields required" });

    let serviceNo;
    let isUnique = false;
    while (!isUnique) {
        serviceNo = Math.floor(10000 + Math.random() * 90000).toString();
        const existing = await User.findOne({ serviceNo });
        if (!existing) isUnique = true;
    }

    const newUser = new User({
        name, phone, email, address, pincode, type, serviceNo,
        role: 'user', isApproved: false
    });

    await newUser.save();
    res.json({ message: "Registration successful! Your Service Number is " + serviceNo });
});

router.post('/login', async (req, res) => {
    const { serviceNo, password } = req.body;
    const user = await User.findOne({ serviceNo, password });

    if (user) {
        if (!user.isApproved && user.role === 'user') {
            return res.status(403).json({ message: "Account pending approval" });
        }

        req.session.user = {
            id: user._id,
            serviceNo: user.serviceNo,
            role: user.role,
            name: user.name
        };

        await Log.create({
            serviceNo: user.serviceNo,
            role: user.role,
            loginTime: new Date()
        });

        res.json({ message: "Login successful", user: req.session.user });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

router.post('/logout', async (req, res) => {
    if (req.session.user) {
        await Log.findOneAndUpdate(
            { serviceNo: req.session.user.serviceNo, logoutTime: null },
            { logoutTime: new Date() },
            { sort: { loginTime: -1 } }
        );
    }
    req.session.destroy();
    res.json({ message: "Logged out" });
});

module.exports = router;
