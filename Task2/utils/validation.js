const validateName = (name) => /^[a-zA-Z\s]+$/.test(name);
const validatePhone = (phone) => /^\d{10}$/.test(phone);
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports = { validateName, validatePhone, validateEmail };
