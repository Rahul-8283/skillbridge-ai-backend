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
    const resumes = await Resume.find({ userId: req.user._id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      data: resumes
    });
  } catch (err) {
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
      console.log('📤 Sending resume to FastAPI for analysis...');
      console.log('🔍 Resume file:', req.file.originalname, 'Size:', req.file.size, 'bytes');
      const matchResponse = await fastapiService.matchJobs(req.user._id.toString(), req.file.path);
      console.log('✅ FastAPI analysis successful:', matchResponse);
      analysisData = matchResponse;
      fallbackMatches = matchResponse.matches || [];
    } catch (err) {
      // Log comprehensive error information
      const status = err?.response?.status;
      const errorDetail = err?.response?.data?.detail || err?.response?.data?.message || err.message;
      const fullError = err?.response?.data;
      
      fastapiError = `FastAPI Error (${status}): ${errorDetail}`;
      
      console.error('❌ FastAPI MATCHING FAILED - FULL DETAILS:', {
        httpStatus: status,
        errorMessage: errorDetail,
        fullResponseData: fullError,
        requestURL: err.config?.url,
        requestMethod: err.config?.method,
        requestBaseURL: err.config?.baseURL,
        errorType: err.code,
        timestamp: new Date().toISOString()
      });
      
      // Generate mock analysis data as fallback
      console.log('⚠️  Using fallback analysis due to AI service unavailability');
      analysisData = {
        fallback: true,
        error: fastapiError,
        message: 'AI analysis unavailable. Please try uploading again or contact support.',
        matches: [],
        debugInfo: process.env.NODE_ENV === 'development' ? {
          fastAPIURL: process.env.FASTAPI_URL_PRO || process.env.FASTAPI_URL_DEV,
          actualError: errorDetail,
          fullResponse: fullError
        } : undefined
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

    // IMPORTANT: Frontend expects either matches or analysis to be non-null/non-empty
    // Return analysis even if it's a fallback error message so frontend doesn't throw
    res.status(201).json({
      status: 'success',
      data: {
        resume: newResume,
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
    console.log('\n🧪 TESTING FASTAPI CONNECTION...');
    console.log('MODE_S:', process.env.MODE_S);
    console.log('FASTAPI_URL_DEV:', process.env.FASTAPI_URL_DEV);
    console.log('FASTAPI_URL_PRO:', process.env.FASTAPI_URL_PRO);
    
    const fastapi = require('../config/fastapi');
    const baseUrl = fastapi.defaults.baseURL;
    console.log('✅ Axios instance baseURL:', baseUrl);
    
    // Test /health endpoint
    console.log('📍 Testing /health endpoint...');
    const healthResponse = await fastapi.get('/health');
    
    console.log('✅ Health check passed:', healthResponse.status);
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'FastAPI connection successful',
        baseURL: baseUrl,
        healthCheck: healthResponse.data,
        envConfig: {
          MODE_S: process.env.MODE_S,
          FASTAPI_URL_DEV: process.env.FASTAPI_URL_DEV,
          FASTAPI_URL_PRO: process.env.FASTAPI_URL_PRO
        }
      }
    });
  } catch (err) {
    console.error('❌ FastAPI connection test FAILED:', err.message);
    console.error('Full error:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      code: err.code
    });
    
    res.status(200).json({
      status: 'error',
      data: {
        message: 'FastAPI connection failed',
        error: err.message,
        errorCode: err.code,
        httpStatus: err.response?.status,
        errorResponse: err.response?.data,
        envConfig: {
          MODE_S: process.env.MODE_S,
          FASTAPI_URL_DEV: process.env.FASTAPI_URL_DEV,
          FASTAPI_URL_PRO: process.env.FASTAPI_URL_PRO
        }
      }
    });
  }
};
