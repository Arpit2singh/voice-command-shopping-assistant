const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
  },
  preferredLang: {
    type: String,
    default: 'en-IN',
    enum: ['en-IN', 'hi-IN', 'en-US', 'en-GB'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
