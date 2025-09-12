const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    contactNumber: { type: String, trim: true },
    address: {
        street: { type: String, trim: true },
        barangay: { type: String, trim: true },
        city: { type: String, default: 'Dasmariñas' },
        province: { type: String, default: 'Cavite' },
    },
    role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
}, { timestamps: true });

// Hash password
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
UserSchema.methods.generateToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET, // ✅ Loaded from app.js
        { expiresIn: '1d' }
    );
};

module.exports = mongoose.model('User', UserSchema);
