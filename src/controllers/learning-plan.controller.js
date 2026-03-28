const fastapiService = require('../services/fastapi.service');
const AppError = require('../utils/AppError');

exports.generateRoadmap = async (req, res, next) => {
    try {
        const { userId, jobId, hoursPerDay = 2 } = req.body;
        
        if (!userId || !jobId) {
            return next(new AppError('userId and jobId are required to generate roadmap', 400));
        }

        const roadmap = await fastapiService.generateRoadmap({
            user_id: userId,
            job_id: jobId,
            hours_per_day: hoursPerDay
        });

        res.status(200).json({
            status: 'success',
            data: roadmap
        });
    } catch (err) {
        next(err);
    }
};

// Mock endpoints to prevent 404s for frontend dashboard components
exports.getLearningPlans = async (req, res) => res.status(200).json([]);
exports.getActivities = async (req, res) => res.status(200).json([]);
exports.getAchievements = async (req, res) => res.status(200).json([]);
exports.getProgressStats = async (req, res) => res.status(200).json({});
