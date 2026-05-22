const mongoose = require('mongoose');
const LearningPlan = require('../models/learningPlan.model');
const Job = require('../models/job.model');
const fastapiService = require('../services/fastapi.service');
const AppError = require('../utils/AppError');

const extractUpstreamError = (err, defaultMessage) => {
    const status = err?.response?.status;
    const detail = err?.response?.data?.detail;
    const message = err?.response?.data?.message;

    if (status === 429) {
        return {
            statusCode: 503,
            message: 'AI service quota limit reached. Please try again later or refresh API credits.'
        };
    }

    return {
        statusCode: status || 502,
        message: detail || message || err?.message || defaultMessage
    };
};

const FALLBACK_SUMMARY_MARKER = 'Summary not available yet';

const normalizeRoadmapSteps = (stepsInput) => {
    if (Array.isArray(stepsInput)) {
        return stepsInput
            .map((step) => {
                if (typeof step === 'string') return step.trim();
                if (step && typeof step === 'object') {
                    return (
                        step.step ||
                        step.title ||
                        step.description ||
                        step.text ||
                        ''
                    ).toString().trim();
                }
                return '';
            })
            .filter(Boolean);
    }

    if (typeof stepsInput === 'string') {
        return stepsInput
            .split(/\r?\n+/)
            .map((line) => line.replace(/^\s*[-*\d.]+\s*/, '').trim())
            .filter(Boolean);
    }

    return [];
};

const hasFallbackPlanContent = (planDoc) => {
    const skills = Array.isArray(planDoc?.skills) ? planDoc.skills : [];
    if (!skills.length) return false;

    return skills.some((skill) => {
        const summary = (skill?.summary || '').toString();
        const roadmap = normalizeRoadmapSteps(
            skill?.roadmap || skill?.roadmap_steps || skill?.steps || skill?.curriculum_topics
        );

        const hasFallbackSummary = summary.includes(FALLBACK_SUMMARY_MARKER);
        const hasFallbackRoadmap =
            roadmap.length === 3 &&
            roadmap[0]?.toLowerCase().includes('absolute basics') &&
            roadmap[1]?.toLowerCase().includes('documentation') &&
            roadmap[2]?.toLowerCase().includes('portfolio');

        return hasFallbackSummary || hasFallbackRoadmap;
    });
};

const normalizeRoadmapSkills = (skills = []) => {
    if (!Array.isArray(skills)) return [];

    return skills.map((skillItem) => {
        const item = skillItem && typeof skillItem === 'object' ? skillItem : {};
        const youtubeItems = Array.isArray(item.youtube) ? item.youtube : [];
        const resources = Array.isArray(item.resources) ? item.resources : [];

        const normalizedYoutubeUrl =
            item.youtube_url ||
            item.video_url ||
            item.videoUrl ||
            item.youtubeUrl ||
            youtubeItems[0]?.url ||
            null;

        const normalizedSummary =
            item.summary ||
            item.description ||
            item.overview ||
            item.plan_summary ||
            item.explanation ||
            `Master the fundamentals of ${item.skill || 'this skill'} through structured learning and hands-on practice.`;

        const normalizedRoadmap = normalizeRoadmapSteps(
            item.roadmap ||
            item.roadmap_steps ||
            item.steps ||
            item.curriculum_topics ||
            item.learning_path
        );

        const normalizedStepTimeDays = Array.isArray(item.step_time_days)
            ? item.step_time_days.map((day) => {
                const parsed = Number(day);
                return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
            })
            : [];

        const normalizedTotalDays = Number(
            item.total_days ??
            item.duration_days ??
            item.days ??
            item.estimated_days ??
            0
        );

        return {
            skill: item.skill || item.keyword || item.name || 'Unnamed Skill',
            youtube_url: normalizedYoutubeUrl,
            summary: normalizedSummary,
            roadmap: normalizedRoadmap,
            step_time_days: normalizedStepTimeDays,
            total_days: Number.isFinite(normalizedTotalDays)
                ? Number(normalizedTotalDays.toFixed(2))
                : 0,
            resources: resources.length > 0 ? resources : []
        };
    });
};

exports.generateRoadmap = async (req, res, next) => {
    try {
        const { userId: bodyUserId, jobId, hoursPerDay = 2 } = req.body;
        const authenticatedUserId = req.user?._id?.toString();
        const effectiveUserId = authenticatedUserId || bodyUserId;
        let existingPlanDoc = null;
        
        if (!effectiveUserId || !jobId) {
            return next(new AppError('userId and jobId are required to generate roadmap', 400));
        }

        // Validate userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(effectiveUserId)) {
            return next(new AppError('Invalid userId format', 400));
        }

        // Check if a plan already exists for this job
        try {
            const existingPlan = await LearningPlan.findOne({ 
                userId: new mongoose.Types.ObjectId(effectiveUserId), 
                jobId 
            });
            if (existingPlan) {
                existingPlanDoc = existingPlan;
                const normalizedExistingSkills = normalizeRoadmapSkills(existingPlan.skills || []);
                const existingSkillsJson = JSON.stringify(existingPlan.skills || []);
                const normalizedSkillsJson = JSON.stringify(normalizedExistingSkills);

                if (existingSkillsJson !== normalizedSkillsJson) {
                    existingPlan.skills = normalizedExistingSkills;
                    await existingPlan.save();
                }

                if (hasFallbackPlanContent(existingPlan)) {
                    console.log('[Roadmap] Existing plan has fallback content; regenerating fresh roadmap.');
                } else {
                    return res.status(200).json({
                        status: 'success',
                        data: existingPlan
                    });
                }
            }
        } catch (err) {
            console.log('Error checking existing plan, continuing...');
        }

        // Generate via FastAPI
        let roadmapData;
        try {
            roadmapData = await fastapiService.generateRoadmap({
                user_id: effectiveUserId,
                job_id: jobId,
                hours_per_day: hoursPerDay
            });
        } catch (err) {
            console.error('FastAPI roadmap generation failed:', err.response?.data || err.message);
            const upstream = extractUpstreamError(err, 'Failed to generate learning roadmap.');
            return next(new AppError(upstream.message, upstream.statusCode));
        }

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
        const normalizedSkills = normalizeRoadmapSkills(roadmapData.skills);
        const normalizedOverallDays = Number(roadmapData.overall_days ?? roadmapData.overallDays ?? 0);
        
        // Get target role from FastAPI response or use job title as fallback
        let targetRole = roadmapData.target_role || roadmapData.targetRole || jobTitle;
        
        const planPayload = {
            userId: new mongoose.Types.ObjectId(effectiveUserId),
            jobId,
            title: `Learning Plan for ${targetRole}`,
            targetRole: targetRole,
            overallDays: Number.isFinite(normalizedOverallDays) ? Number(normalizedOverallDays.toFixed(2)) : 0,
            hoursPerDay,
            skills: normalizedSkills,
            status: 'active'
        };

        const newPlan = existingPlanDoc
            ? await LearningPlan.findByIdAndUpdate(existingPlanDoc._id, planPayload, { new: true, runValidators: true })
            : await LearningPlan.create(planPayload);

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
        const paramUserId = req.params.userId;
        const authenticatedUserId = req.user?._id?.toString();
        const effectiveUserId = mongoose.Types.ObjectId.isValid(paramUserId)
            ? paramUserId
            : authenticatedUserId;
        
        if (!effectiveUserId) {
            return next(new AppError('userId is required', 400));
        }

        // Validate userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(effectiveUserId)) {
            return next(new AppError('Invalid userId format', 400));
        }

        const plans = await LearningPlan.find({ userId: new mongoose.Types.ObjectId(effectiveUserId) }).sort('-createdAt');

        const plansToRepair = [];
        for (const plan of plans) {
            const normalizedSkills = normalizeRoadmapSkills(plan.skills || []);
            if (JSON.stringify(plan.skills || []) !== JSON.stringify(normalizedSkills)) {
                plan.skills = normalizedSkills;
                plansToRepair.push(plan.save());
            }
        }

        if (plansToRepair.length > 0) {
            await Promise.all(plansToRepair);
        }
        
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
