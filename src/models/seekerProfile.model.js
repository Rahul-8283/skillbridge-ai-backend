const mongoose = require('mongoose');

const seekerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'senior'],
    default: 'entry'
  },
  experience: [
    {
      title: String,
      company: String,
      duration: String,
      description: String
    }
  ],
  skills: [String],
  education: [
    {
      institution: String,
      degree: String,
      year: String
    }
  ],
  bio: String,
  location: String,
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String
  }
}, { timestamps: true });

module.exports = mongoose.model('SeekerProfile', seekerProfileSchema);
