const mongoose = require('mongoose');
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

        // Validate userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return next(new AppError('Invalid userId format', 400));
        }

        // Check if a plan already exists for this job
        try {
            const existingPlan = await LearningPlan.findOne({ 
                userId: new mongoose.Types.ObjectId(userId), 
                jobId 
            });
            if (existingPlan) {
                return res.status(200).json({
                    status: 'success',
                    data: existingPlan
                });
            }
        } catch (err) {
            console.log('Error checking existing plan, continuing...');
        }

        // Generate via FastAPI
        const roadmapData = await fastapiService.generateRoadmap({
            user_id: userId,
            job_id: jobId,
            hours_per_day: hoursPerDay
        });

        // Try to find job, but don't fail if it doesn't exist
        let jobTitle = 'Target Role';
        try {
            // Check if jobId is a valid ObjectId format
            if (mongoose.Types.ObjectId.isValid(jobId)) {
                const job = await Job.findById(jobId);
                if (job) {
                    jobTitle = job.title || 'Target Role';
                }
            }
        } catch (err) {
            console.log('Could not find job with ID:', jobId);
        }

        // Map and Save to MongoDB
        const newPlan = await LearningPlan.create({
            userId: new mongoose.Types.ObjectId(userId),
            jobId,
            title: `Learning Plan for ${jobTitle}`,
            targetRole: roadmapData.target_role || jobTitle,
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
        console.error('Generate roadmap error:', err);
        next(err);
    }
};

exports.getLearningPlans = async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return next(new AppError('userId is required', 400));
        }

        // Validate userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return next(new AppError('Invalid userId format', 400));
        }

        const plans = await LearningPlan.find({ userId: new mongoose.Types.ObjectId(userId) }).sort('-createdAt');
        
        res.status(200).json({
            status: 'success',
            data: plans
        });
    } catch (err) {
        console.error('Get learning plans error:', err);
        next(err);
    }
};

// Mock endpoints to prevent 404s for frontend dashboard components
exports.getActivities = async (req, res) => res.status(200).json([]);
exports.getAchievements = async (req, res) => res.status(200).json([]);
exports.getProgressStats = async (req, res) => res.status(200).json({});
