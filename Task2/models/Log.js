const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    serviceNo: String,
    role: String,
    loginTime: { type: Date, default: Date.now },
    logoutTime: Date
});

module.exports = mongoose.model('Log', logSchema);
