const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['seeker', 'provider'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    return {
      id: returnedObject._id.toString(),
      name: returnedObject.name,
      email: returnedObject.email,
      role: returnedObject.role,
      createdAt: returnedObject.createdAt,
    };
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
