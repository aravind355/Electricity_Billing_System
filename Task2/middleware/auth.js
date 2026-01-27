const requireAuth = (roles) => (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    if (roles && !roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};

module.exports = { requireAuth };
