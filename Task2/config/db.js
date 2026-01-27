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

module.exports = connectDB;
