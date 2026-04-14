const ProviderProfile = require('../models/providerProfile.model');
const AppError = require('../utils/AppError');
const { providerProfileSchema } = require('../utils/validationSchemas');

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(200).json({
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
    const { error, value } = providerProfileSchema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    const profile = await ProviderProfile.findOneAndUpdate(
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

const Job = require('../models/job.model');
const User = require('../models/user.model');
const SeekerProfile = require('../models/seekerProfile.model');

// Custom schema if provider candidates status array is not in model, or we can just fetch all seekers for now.
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: jobs
    });
  } catch (err) {
    next(err);
  }
};

exports.getCandidates = async (req, res, next) => {
  try {
    const seekers = await User.find({ role: 'seeker' }).select('-password');
    const enrichedSeekers = [];

    for (let seeker of seekers) {
      const profile = await SeekerProfile.findOne({ userId: seeker._id });
      enrichedSeekers.push({
        _id: seeker._id,
        name: seeker.name,
        email: seeker.email,
        profile: profile || {}
      });
    }

    res.status(200).json({
      status: 'success',
      data: enrichedSeekers
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCandidateStatus = async (req, res, next) => {
  try {
    const { candidateEmail, status } = req.body;
    
    // For simplicity, we can store candidate statuses in ProviderProfile model
    // Let's first make sure the profile exists
    let profile = await ProviderProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await ProviderProfile.create({ userId: req.user._id });
    }

    // Initialize arrays if they don't exist
    if (!profile.selectedCandidates) profile.selectedCandidates = [];
    if (!profile.rejectedCandidates) profile.rejectedCandidates = [];

    // Remove candidate from both lists first
    profile.selectedCandidates = profile.selectedCandidates.filter(c => c !== candidateEmail);
    profile.rejectedCandidates = profile.rejectedCandidates.filter(c => c !== candidateEmail);

    // Add to specific list based on status
    if (status === 'selected') {
      profile.selectedCandidates.push(candidateEmail);
    } else if (status === 'rejected') {
      profile.rejectedCandidates.push(candidateEmail);
    }

    await profile.save();

    res.status(200).json({ status: 'success', message: 'Candidate status updated' });
  } catch (err) {
    next(err);
  }
};

const fastapiService = require('../services/fastapi.service');

exports.getMatchedCandidates = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // First, verify the job belongs to the provider
    const job = await Job.findOne({ _id: jobId, postedBy: req.user._id });
    if (!job) {
      return next(new AppError('Job not found or unauthorized', 404));
    }
    
    // Get AI matches
    const matchesResponse = await fastapiService.matchCandidates(jobId);
    const matches = matchesResponse.matches || [];
    
    // Fetch all seekers and their profiles
    const seekers = await User.find({ role: 'seeker' }).select('-password');
    const enrichedSeekers = [];

    for (let seeker of seekers) {
      const profile = await SeekerProfile.findOne({ userId: seeker._id });
      // Find match data
      const matchData = matches.find(m => m.user_id === seeker._id.toString());
      
      enrichedSeekers.push({
        _id: seeker._id,
        name: seeker.name,
        email: seeker.email,
        profile: profile || {},
        matchScore: matchData ? Math.round(Number(matchData.score) * 100) : null,
        missingSkills: matchData ? matchData.missing_skills : [],
        matchedSkills: matchData ? matchData.matched_skills : []
      });
    }

    // Sort by match score descending
    enrichedSeekers.sort((a, b) => {
       if (a.matchScore === null && b.matchScore === null) return 0;
       if (a.matchScore === null) return 1;
       if (b.matchScore === null) return -1;
       return b.matchScore - a.matchScore;
    });

    res.status(200).json({
      status: 'success',
      data: enrichedSeekers
    });
  } catch (err) {
    next(err);
  }
};
