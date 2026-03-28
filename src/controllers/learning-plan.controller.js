const LearningPlan = require('../models/learningPlan.model');
const Job = require('../models/job.model');
const fastapiService = require('../services/fastapi.service');
const AppError = require('../utils/AppError');

exports.generateRoadmap = async (req, res, next) => {
    try {
        const { userId, jobId, hoursPerDay = 2 } = req.body;
        
        if (!userId || !jobId) {
            return next(new AppError('userId and jobId are required to generate roadmap', 400));
        }

        // Check if a plan already exists for this job
        const existingPlan = await LearningPlan.findOne({ userId, jobId });
        if (existingPlan) {
            return res.status(200).json({
                status: 'success',
                data: existingPlan
            });
        }

        // Generate via FastAPI
        const roadmapData = await fastapiService.generateRoadmap({
            user_id: userId,
            job_id: jobId,
            hours_per_day: hoursPerDay
        });

        const job = await Job.findById(jobId);

        // Map and Save to MongoDB
        const newPlan = await LearningPlan.create({
            userId,
            jobId,
            title: `Learning Plan for ${job?.title || 'Target Role'}`,
            targetRole: job?.title || 'Target Role',
            overallDays: roadmapData.overall_days,
            hoursPerDay,
            skills: roadmapData.skills || [],
            status: 'active'
        });

        res.status(200).json({
            status: 'success',
            data: newPlan
        });
    } catch (err) {
        next(err);
    }
};

exports.getLearningPlans = async (req, res, next) => {
    try {
        const plans = await LearningPlan.find({ userId: req.params.userId }).sort('-createdAt');
        res.status(200).json({
            status: 'success',
            data: plans
        });
    } catch (err) {
        next(err);
    }
};

// Mock endpoints to prevent 404s for frontend dashboard components
exports.getActivities = async (req, res) => res.status(200).json([]);
exports.getAchievements = async (req, res) => res.status(200).json([]);
exports.getProgressStats = async (req, res) => res.status(200).json({});
