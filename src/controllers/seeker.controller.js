const SeekerProfile = require('../models/seekerProfile.model');
const Resume = require('../models/resume.model');
const JobApplication = require('../models/jobApplication.model');
const AppError = require('../utils/AppError');
const { seekerProfileSchema, jobApplicationSchema } = require('../utils/validationSchemas');
const fastapiService = require('../services/fastapi.service');

// Seeker Profile
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await SeekerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(204).json({
        status: 'success',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      data: profile
    });
  } catch (err) {
    next(err);
  }
};

exports.upsertProfile = async (req, res, next) => {
  try {
    const { error, value } = seekerProfileSchema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    const profile = await SeekerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { ...value, userId: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: profile
    });
  } catch (err) {
    next(err);
  }
};

// Resumes
exports.getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort('-createdAt').lean();
    console.log('✅ Fetched', resumes.length, 'resumes from DB');
    res.status(200).json({
      status: 'success',
      data: resumes
    });
  } catch (err) {
    console.error('❌ Error fetching resumes:', err.message);
    next(err);
  }
};

exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    // Call FastAPI matching
    let analysisData = null;
    let fallbackMatches = [];
    let fastapiError = null;
    
    try {
      const matchResponse = await fastapiService.matchJobs(req.user._id.toString(), req.file.path);
      analysisData = matchResponse;
      fallbackMatches = matchResponse.matches || [];
    } catch (err) {
      const errorDetail = err?.response?.data?.detail || err.message;
      fastapiError = `FastAPI Error: ${errorDetail}`;
      
      if (errorDetail.includes('NoneType') || errorDetail.includes('session')) {
        console.error('❌ Resume upload error: Neo4j database issue - Database may be offline or credentials incorrect');
      }
      
      // Generate fallback analysis
      analysisData = {
        fallback: true,
        error: fastapiError,
        message: 'AI analysis unavailable. Please try uploading again or contact support.',
        matches: []
      };
      fallbackMatches = [];
    }

    const newResume = await Resume.create({
      userId: req.user._id,
      filename: req.file.originalname,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      analysis: analysisData
    });

    console.log('✅ Resume saved successfully:', { id: newResume._id, filename: newResume.filename });

    // IMPORTANT: Frontend expects either matches or analysis to be non-null/non-empty
    // Return analysis even if it's a fallback error message so frontend doesn't throw
    res.status(201).json({
      status: 'success',
      data: {
        resume: newResume.toObject(),
        analysis: analysisData,
        matches: fallbackMatches,
        ...(fastapiError && { warning: fastapiError })
      }
    });
  } catch (err) {
    console.error('❌ Resume upload controller error:', err);
    next(err);
  }
};

exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return next(new AppError('Resume not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

// Job Applications
exports.applyForJob = async (req, res, next) => {
  try {
    const { error, value } = jobApplicationSchema.validate(req.body);
    if (error) {
       return next(new AppError(error.details[0].message, 400));
    }

    const alreadyApplied = await JobApplication.findOne({
      jobId: value.jobId,
      userId: req.user._id
    });

    if (alreadyApplied) {
      return next(new AppError('You have already applied for this job', 400));
    }

    const application = await JobApplication.create({
      ...value,
      userId: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: application
    });
  } catch (err) {
    next(err);
  }
};

exports.getApplications = async (req, res, next) => {
  try {
    const applications = await JobApplication.find({ userId: req.user._id })
      .populate('jobId')
      .populate('resumeId');

    res.status(200).json({
      status: 'success',
      data: applications
    });
  } catch (err) {
    next(err);
  }
};

exports.getApplicationDetails = async (req, res, next) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('jobId').populate('resumeId');

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: application
    });
  } catch (err) {
    next(err);
  }
};

exports.getJobMatches = async (req, res, next) => {
  try {
    // Get latest resume
    const resume = await Resume.findOne({ userId: req.user._id }).sort('-createdAt');
    if (!resume) {
      return res.status(200).json({
        status: 'success',
        data: { matches: [] }
      });
    }

    const matches = await fastapiService.matchJobs(req.user._id.toString(), resume.fileUrl);
    
    res.status(200).json({
      status: 'success',
      data: matches
    });
  } catch (err) {
    console.error("Match Jobs Error:", err);
    // Return empty results instead of 500
    res.status(200).json({
      status: 'success',
      data: { matches: [] }
    });
  }
};

// Diagnostic endpoint to test FastAPI connectivity
exports.testFastAPIConnection = async (req, res, next) => {
  try {
    const fastapi = require('../config/fastapi');
    const baseUrl = fastapi.defaults.baseURL;
    const healthResponse = await fastapi.get('/health');
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'FastAPI connection successful',
        baseURL: baseUrl,
        healthCheck: healthResponse.data
      }
    });
  } catch (err) {
    res.status(200).json({
      status: 'error',
      data: {
        message: 'FastAPI connection failed',
        error: err.message,
        errorCode: err.code,
        httpStatus: err.response?.status,
        errorResponse: err.response?.data
      }
    });
  }
};
