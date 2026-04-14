const Job = require('../models/job.model');
const AppError = require('../utils/AppError');
const { jobSchema } = require('../utils/validationSchemas');
const fastapiService = require('../services/fastapi.service');

exports.getAllJobs = async (req, res, next) => {
  try {
    // Basic filtering and searching
    const { search, location, type, page = 1, limit = 10 } = req.query;
    const query = { status: 'open' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    const jobs = await Job.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Job.countDocuments(query);

    console.log('✅ Fetched', jobs.length, 'jobs from DB (total:', total, ')');

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      total,
      data: jobs
    });
  } catch (err) {
    console.error('❌ Error fetching jobs:', err.message);
    next(err);
  }
};

exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: job
    });
  } catch (err) {
    next(err);
  }
};

// Provider specific job posting (optional in this phase but good to have)
exports.createJob = async (req, res, next) => {
  try {
    const { error, value } = jobSchema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    const job = await Job.create({
      ...value,
      postedBy: req.user._id
    });

    // Fire-and-forget to prevent blocking the response during slow FastAPI starts
    fastapiService.createJob({
      job_id: job._id.toString(),
      skills_text: `${job.title} ${job.description} ${job.skillsRequired?.join(' ')}`,
      title: job.title
    }).catch(fastapiErr => {
      console.error("FastAPI Job Sync Failed:", fastapiErr.message);
    });

    res.status(201).json({
      status: 'success',
      data: job
    });
  } catch (err) {
    next(err);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    // Only the provider who posted the job can update it
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });

    if (!job) {
      return next(new AppError('Job not found or you are unauthorized to update it', 404));
    }

    // Validate job status transitions
    const currentStatus = job.status;
    const newStatus = req.body.status;
    const newExpirationDate = req.body.expirationDate;

    // Prevent invalid status transitions
    if (newStatus && newStatus !== currentStatus) {
      console.log(`Status change attempt: ${currentStatus} → ${newStatus}`);
      
      // Only allow: open → closed (when filled or employer ends it)
      if (!['open', 'closed', 'paused'].includes(newStatus)) {
        return next(new AppError('Invalid job status. Allowed: open, closed, paused', 400));
      }
    }

    // Validate expiration date - prevent backdating
    if (newExpirationDate) {
      const newDate = new Date(newExpirationDate);
      const now = new Date();
      const currentExpiration = new Date(job.expirationDate);

      // Cannot set expiration date in the past
      if (newDate < now) {
        return next(new AppError('Expiration date cannot be in the past', 400));
      }
    }

    // Whitelist allowed fields to update
    const allowedFields = ['title', 'description', 'location', 'salary', 'type', 'skillsRequired', 'expirationDate', 'status', 'applicantRequirements'];
    const updateData = {};
    
    for (let field of allowedFields) {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field];
      }
    }

    // Log the update for audit trail
    console.log('📝 Job update by provider:', {
      jobId: job._id,
      providerId: req.user._id,
      changedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: updatedJob
    });
  } catch (err) {
    console.error('❌ Job update error:', err.message);
    next(err);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });

    if (!job) {
      return next(new AppError('Job not found or you are unauthorized to delete it', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

const Resume = require('../models/resume.model');
const JobApplication = require('../models/jobApplication.model');

// Match Jobs (for seeker)
exports.getJobMatches = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Get latest resume
    const resume = await Resume.findOne({ userId }).sort('-createdAt');
    if (!resume) {
      console.log('⚠️ No resume found for user:', userId);
      return res.status(200).json({
        status: 'success',
        data: { matches: [] }
      });
    }

    console.log('📊 Computing job matches for user:', userId);
    const matches = await fastapiService.matchJobs(userId.toString(), resume.fileUrl);
    console.log('✅ Found', matches.matches?.length || 0, 'matching jobs');
    
    res.status(200).json({
      status: 'success',
      data: matches
    });
  } catch (err) {
    console.error('❌ Error matching jobs:', err.message);
    // Return empty results instead of 500
    res.status(200).json({
      status: 'success',
      data: { matches: [] }
    });
  }
};

// Skill gap analysis
exports.getSkillGap = async (req, res, next) => {
  try {
    const { jobId, userId } = req.params;
    // For now we return a mock since the exact FastAPI analysis may not be ready
    // Ideally calls FastAPI `/analyze-skill-gap`
    res.status(200).json({
      status: 'success',
      data: {
        missing_skills: ["React", "Node.js"], /* Mock data */
        match_score: 85
      }
    });
  } catch (err) {
    next(err);
  }
};

// Apply to job
exports.applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id; // Caller must be authenticated

    const alreadyApplied = await JobApplication.findOne({ jobId, userId });

    if (alreadyApplied) {
      return next(new AppError('You have already applied for this job', 400));
    }

    const application = await JobApplication.create({
      jobId,
      userId,
      resumeId: req.body.resumeId // optional
    });

    res.status(201).json({
      status: 'success',
      data: application
    });
  } catch (err) {
    next(err);
  }
};

exports.getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // Ensure the current user is the provider for this job
    const job = await Job.findOne({ _id: jobId, postedBy: req.user._id });
    if (!job) {
      return next(new AppError('Job not found or you are not authorized to view its applications', 404));
    }

    const applications = await JobApplication.find({ jobId }).populate('userId', 'name email').populate('resumeId');
    
    res.status(200).json({
      status: 'success',
      data: applications
    });
  } catch (err) {
    next(err);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { status } = req.body;
    
    // Ensure status is valid
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }
    
    // Find application and ensure the current user is the job provider
    const application = await JobApplication.findById(appId).populate('jobId');
    if (!application) {
      return next(new AppError('Application not found', 404));
    }
    
    if (application.jobId.postedBy.toString() !== req.user._id.toString()) {
       return next(new AppError('You are not authorized to update this application', 403));
    }
    
    application.status = status;
    await application.save();
    
    res.status(200).json({
      status: 'success',
      data: application
    });
  } catch (err) {
    next(err);
  }
};

