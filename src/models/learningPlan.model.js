const mongoose = require('mongoose');

const learningPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  title: String,
  targetRole: String,
  overallDays: Number,
  hoursPerDay: Number,
  skills: [{
    keyword: String,
    total_days: Number,
    summary: String,
    video_url: String, // From FastAPI (YouTube)
    github_url: String, // From FastAPI (GitHub)
    roadmap: [String]
  }],
  completedModules: [Number], // IDs or indices
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('LearningPlan', learningPlanSchema);
