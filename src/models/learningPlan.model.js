const mongoose = require('mongoose');

const learningPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.Mixed, // Allow both string IDs (mock) and ObjectId
    required: true
  },
  title: String,
  targetRole: String,
  overallDays: Number,
  hoursPerDay: Number,
  skills: [mongoose.Schema.Types.Mixed], // Allow flexible structure from FastAPI (including links, videos, etc.)
  completedModules: [Number], // IDs or indices
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('LearningPlan', learningPlanSchema);
