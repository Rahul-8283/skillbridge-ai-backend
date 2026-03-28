const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('seeker', 'provider').required().messages({
    'any.only': 'Role must be either "seeker" or "provider"',
    'any.required': 'Role is required',
  }),
  name: Joi.string().required().messages({
    'any.required': 'Name is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const seekerProfileSchema = Joi.object({
  resume: Joi.string().allow(''),
  skills: Joi.string().allow(''),
  experience: Joi.string().allow(''),
  education: Joi.string().allow(''),
  location: Joi.string().allow(''),
  salaryExpectation: Joi.string().allow(''),
  availability: Joi.string().valid('immediately', '2weeks', '1month', '2months')
}).options({ allowUnknown: true });

const providerProfileSchema = Joi.object({
  companyName: Joi.string().allow(''),
  companyDescription: Joi.string().allow(''),
  companyWebsite: Joi.string().uri().allow(''),
  industry: Joi.string().allow(''),
  companySize: Joi.string().allow(''),
  location: Joi.string().allow(''),
  contactEmail: Joi.string().email().allow(''),
  logo: Joi.string().uri().allow('')
}).options({ allowUnknown: true });

const jobSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  company: Joi.string().required(),
  location: Joi.string().required(),
  salary: Joi.string().required(),
  type: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'),
  skillsRequired: Joi.array().items(Joi.string())
});

const jobApplicationSchema = Joi.object({
  jobId: Joi.string().required(),
  resumeId: Joi.string().allow(null, '')
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  seekerProfileSchema,
  providerProfileSchema,
  jobSchema,
  jobApplicationSchema,
};
