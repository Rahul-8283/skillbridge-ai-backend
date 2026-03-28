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
    const resumes = await Resume.find({ userId: req.user._id });
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
    try {
      const matchResponse = await fastapiService.matchJobs(req.user._id.toString(), req.file.path);
      analysisData = matchResponse;
      fallbackMatches = matchResponse.matches || [];
    } catch(err) {
      console.error("FastAPI matching failed:", err);
    }

    const newResume = await Resume.create({
      userId: req.user._id,
      filename: req.file.originalname,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      analysis: analysisData // Save whatever we get
    });

    res.status(201).json({
      status: 'success',
      data: {
        resume: newResume,
        analysis: analysisData,
        matches: fallbackMatches
      }
    });
  } catch (err) {
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
