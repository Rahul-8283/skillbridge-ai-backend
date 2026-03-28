const mongoose = require('mongoose');

const seekerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  resume: String, // String for URL or text for now
  skills: String, // Comma-separated or text as in frontend
  experience: String, // "Years of Experience"
  education: String, // Textarea content
  location: String,
  salaryExpectation: String,
  availability: {
    type: String,
    enum: ['immediately', '2weeks', '1month', '2months'],
    default: 'immediately'
  }
}, { timestamps: true });

module.exports = mongoose.model('SeekerProfile', seekerProfileSchema);
