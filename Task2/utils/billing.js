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

module.exports = { calculateBill, calculateFine };
