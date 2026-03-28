const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: String,
  companyDescription: String,
  companyWebsite: String,
  industry: String,
  companySize: String,
  location: String,
  contactEmail: String,
  logo: String,
  selectedCandidates: [String],
  rejectedCandidates: [String]
}, { timestamps: true });

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
