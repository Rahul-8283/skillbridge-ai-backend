const AppError = require('../utils/AppError');
const User = require('../models/user.model');
const SeekerProfile = require('../models/seekerProfile.model');
const ProviderProfile = require('../models/providerProfile.model');
const JobApplication = require('../models/jobApplication.model');

exports.getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let profileData = null;
    
    if (user.role === 'seeker') {
      profileData = await SeekerProfile.findOne({ userId });
    } else if (user.role === 'provider') {
      profileData = await ProviderProfile.findOne({ userId });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        profile: profileData
      }
    });

  } catch (err) {
    next(err);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Ensure the user is only updating their own profile
    if (req.user._id.toString() !== userId) {
      return next(new AppError('You are not authorized to update this profile', 403));
    }

    const { name, ...profileData } = req.body;

    // Update basic user info
    let user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (name) {
      user.name = name;
      await user.save();
    }

    let updatedProfile = null;
    
    if (user.role === 'seeker') {
      updatedProfile = await SeekerProfile.findOneAndUpdate(
        { userId },
        { ...profileData },
        { new: true, runValidators: true, upsert: true }
      );
    } else if (user.role === 'provider') {
      updatedProfile = await ProviderProfile.findOneAndUpdate(
        { userId },
        { ...profileData },
        { new: true, runValidators: true, upsert: true }
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        profile: updatedProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserApplications = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Ensure the user is only fetching their own applications (or maybe admin later)
    if (req.user._id.toString() !== userId) {
      return next(new AppError('You are not authorized to view these applications', 403));
    }

    const applications = await JobApplication.find({ userId }).populate('jobId');

    res.status(200).json({
      status: 'success',
      data: applications
    });
  } catch (err) {
    next(err);
  }
};
