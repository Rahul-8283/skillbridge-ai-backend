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
