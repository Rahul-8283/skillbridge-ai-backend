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
      .limit(Number(limit));

    const total = await Job.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      total,
      data: jobs
    });
  } catch (err) {
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

    try {
      await fastapiService.createJob({
        job_id: job._id.toString(),
        skills_text: `${job.title} ${job.description} ${job.requirements}`,
        title: job.title
      });
    } catch (fastapiErr) {
      console.error("FastAPI Job Sync Failed:", fastapiErr.message);
    }

    res.status(201).json({
      status: 'success',
      data: job
    });
  } catch (err) {
    next(err);
  }
};
