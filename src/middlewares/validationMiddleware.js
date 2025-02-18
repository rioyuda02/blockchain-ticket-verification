// src/middlewares/validationMiddleware.js
const Joi = require('joi');
const PLANS = require('../config/plans');

const schema = Joi.object({
    prompt: Joi.string().required(),
});

const validateInput = (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

const signupSchema = Joi.object({
    first_name: Joi.string().trim().required().messages({
        'string.base': 'First name must be a string',
        'string.empty': 'First name cannot be empty',
        'any.required': 'First name is required'
    }),
    last_name: Joi.string().trim().required().messages({
        'string.base': 'Last name must be a string',
        'string.empty': 'Last name cannot be empty',
        'any.required': 'Last name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    password: Joi.string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{8,}$/)
        .message('Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character')
        .required(),
    phone_number: Joi.string().optional(),
});

const validateSignup = (req, res, next) => {
    const { error } = signupSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const signinSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

const validateSignin = (req, res, next) => {
    const { error } = signinSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const createSubscriptionSchema = Joi.object({
    id: Joi.any().optional(),
    email: Joi.string().email(),
    plan: Joi.string().required().valid(...Object.values(PLANS)).messages({
        'any.required': 'Plan is required',
        'any.only': `Plan must be one of: ${Object.values(PLANS).join(', ')}`
    }),
    end_date: Joi.date().iso().required().greater('now').messages({
        'date.required': 'End date is required',
        'date.format': 'End date must be a valid ISO 8601 date',
        'date.greater': 'End date must be in the future'
    }),
    start_date: Joi.date().iso().required().messages({
        'date.required': 'Start date is required',
        'date.format': 'Start date must be a valid ISO 8601 date',
    }),
    provider: Joi.string().valid('PayPal', 'Stripe').required().messages({
        'any.required': 'Provider is required',
        'any.only': 'Provider must be either PayPal or Stripe'
    }),
    billing_period: Joi.string().valid('Monthly', 'Yearly').required().messages({
        'any.required': 'Billing period is required',
        'any.only': 'Billing period must be either Monthly or Yearly'
    })
});

const validateCreateSubscription = (req, res, next) => {
    const { error } = createSubscriptionSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const updateSubscriptionSchema = Joi.object(
    {
        plan: Joi.string().valid(...Object.values(PLANS)),
        end_date: Joi.date().iso().greater('now'),
        start_date: Joi.date().iso(),
        provider: Joi.string().valid('PayPal', 'Stripe'),
        billing_period: Joi.string().valid('Monthly', 'Yearly')
    }
).or('plan', 'end_date', 'start_date', 'provider', 'billing_period').messages({
    'object.missing': 'At least one of plan or end_date must be provided'
});

const validateUpdateSubscription = (req, res, next) => {
    const { error } = updateSubscriptionSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const createStripeSubscriptionSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    paymentMethodId: Joi.string().required().messages({
        'any.required': 'Payment method ID is required'
    }),
    priceId: Joi.string().required().messages({
        'any.required': 'Price ID is required'
    }),
    trial_end: Joi.number().optional()
});

const validateCreateStripeSubscription = (req, res, next) => {
    const { error } = createStripeSubscriptionSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const createCatSchema = Joi.object({
    name: Joi.string().messages(),
    goals: Joi.string().required().messages({
        'any.required': 'Goals are required'
    }),
    photo: Joi.string(),
    issues_faced: Joi.string().required().messages({
        'any.required': 'Issues faced are required'
    }),
    activity_level: Joi.string().required().messages({
        'any.required': 'Activity level is required'
    }),
    gender: Joi.string().valid('Male', 'Boy', 'Girl', 'Female').required().messages({
        'any.required': 'Gender is required',
        'any.only': 'Gender must be either male, boy, girl, or female'
    }),
    age: Joi.number().integer().required().messages({
        'number.base': 'Age must be a number',
        'number.integer': 'Age must be an integer',
        'any.required': 'Age is required'
    }),
    country: Joi.string().optional().allow('').allow(null),
    zipcode: Joi.string().optional().allow('').allow(null),
    breed: Joi.string().required().messages({
        'any.required': 'Breed is required'
    }),
    weight: Joi.number().positive().required().messages({
        'number.positive': 'Weight must be a positive number',
        'any.required': 'Weight is required'
    }),
    target_weight: Joi.number().min(0).messages({
        'number.positive': 'Target weight must be a positive number',
    }),
    required_progress: Joi.string().required().messages({
        'any.required': 'Required progress is required'
    }),
    check_in_period: Joi.string().allow('').allow(null).valid('Daily', '3 Times a Week', 'Weekly').messages({
        'any.only': 'Check-in period must be one of: Daily, 3 Times a Week, Weekly',
    }),
    training_days: Joi.string().allow('').allow(null).messages(),
    medical_conditions: Joi.string().allow('').allow(null),
    medications: Joi.string().allow('').allow(null),
    dietary_restrictions: Joi.string().allow('').allow(null),
    medical_history: Joi.string().allow('').allow(null),
    items: Joi.string().required().messages({
        'any.required': 'Items are required'
    })
});

const validateCreateCat = (req, res, next) => {
    const { error } = createCatSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const resetPasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required()
});

const validateResetPassword = (req, res, next) => {
    const { error } = resetPasswordSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const updateCatSchema = Joi.object({
    name: Joi.string(),
    goal: Joi.string(),
    photo: Joi.any(),
    issues_faced: Joi.string().allow(''),
    activity_level: Joi.string(),
    gender: Joi.string().valid('male', 'boy', 'girl', 'female'),
    age: Joi.number().integer(),
    country: Joi.string().optional().allow('').allow(null),
    zipcode: Joi.string().optional().allow('').allow(null),
    breed: Joi.string(),
    weight: Joi.number().positive(),
    target_weight: Joi.number().positive(),
    required_progress: Joi.string(),
    check_in_period: Joi.string().allow('').allow(null).valid('Daily', '3 Times a Week', 'Weekly'),
    training_days: Joi.string().allow('').allow(null),
    medical_conditions: Joi.string().allow('').allow(null),
    medications: Joi.string().allow('').allow(null),
    dietary_restrictions: Joi.string().allow('').allow(null),
    medical_history: Joi.string().allow('').allow(null),
    items: Joi.string()
}).min(1);

const validateUpdateCat = (req, res, next) => {
    const { error } = updateCatSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const chatMessageSchema = Joi.object({
    conversation_id: Joi.number().required(),
    content: Joi.string().required(),
    role: Joi.string().valid('user', 'assistant').required(),
    timestamp: Joi.date().iso()
});

const validateChatMessage = (req, res, next) => {
    const { error } = chatMessageSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ error: errors.join(', ') });
    }
    next();
};

const openaiChatSchema = Joi.object({
    catId: Joi.number().integer().required(),
    language: Joi.string().default('en'),
    messages: Joi.array().items(Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().required(),
        timestamp: Joi.date().iso()
    })).min(1).required()
});

const validateOpenAIChat = (req, res, next) => {
    const { error } = openaiChatSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        if (errors.some(err => err.includes('"messages" must contain at least 1 items'))) {
            return res.status(400).json({ error: 'Messages must be a non-empty array' });
        }
        return res.status(400).json({ errors });
    }
    next();
};

const updateConversationSchema = Joi.object({
    started_at: Joi.date().iso(),
    messages: Joi.array().items(Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().required(),
        timestamp: Joi.date().iso()
    })).min(1).required()
});

const validateUpdateConversation = (req, res, next) => {
    const { error } = updateConversationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const testPaymentSchema = Joi.object({
    amount: Joi.number().required().min(50).max(999999),  // amount in cents
    currency: Joi.string().required().valid('usd', 'eur', 'gbp'),
    payment_method: Joi.string().required()
}).messages({
    'number.min': 'Amount must be at least 50 cents',
    'number.max': 'Amount cannot exceed 9999.99',
    'string.valid': 'Currency must be one of: usd, eur, gbp'
});

const validateTestPayment = (req, res, next) => {
    const { error } = testPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const recommendationsSchema = Joi.object({
    name: Joi.string().messages(),
    goals: Joi.string().required().messages({
        'any.required': 'Goals are required'
    }),
    photo: Joi.string(),
    issues_faced: Joi.string().required().messages({
        'any.required': 'Issues faced are required'
    }),
    activity_level: Joi.string().required().messages({
        'any.required': 'Activity level is required'
    }),
    gender: Joi.string().valid('male', 'female', 'boy', 'girl').messages({
        'any.only': 'Gender must be either Male or Female'
    }),
    age: Joi.number().integer().required().messages({
        'number.base': 'Age must be a number',
        'number.integer': 'Age must be an integer',
        'any.required': 'Age is required'
    }),
    country: Joi.string().optional().allow('').allow(null),
    zipcode: Joi.string().optional().allow('').allow(null),
    breed: Joi.string().required().messages({
        'any.required': 'Breed is required'
    }),
    weight: Joi.number().positive().required().messages({
        'number.positive': 'Weight must be a positive number',
        'any.required': 'Weight is required'
    }),
    target_weight: Joi.number().min(0).messages({
        'number.min': 'Target weight must be at least 0',
        'any.required': 'Target weight is required'
    }),

    required_progress: Joi.string().required().messages({
        'any.required': 'Required progress is required'
    }),
    check_in_period: Joi.string().allow('').allow(null).valid('Daily', '3 Times a Week', 'Weekly').messages({
        'any.only': 'Check-in period must be one of: Daily, 3 Times a Week, Weekly',
    }),
    training_days: Joi.string().allow('').allow(null).messages(),
    medical_conditions: Joi.string().allow('').allow(null),
    medications: Joi.string().allow('').allow(null),
    dietary_restrictions: Joi.string().allow('').allow(null),
    medical_history: Joi.string().allow('').allow(null),
    items: Joi.string().required().messages({
        'any.required': 'Items are required'
    })
});

const validateRecommendations = (req, res, next) => {
    const { error } = recommendationsSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const signinOTPSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    })
});

const verifyOTPSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    token: Joi.string().required().messages({
        'any.required': 'Token is required'
    }),
    type: Joi.string().valid('email').required()
});

const signupOTPSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    first_name: Joi.string().trim().required().messages({
        'string.base': 'First name must be a string',
        'string.empty': 'First name cannot be empty',
        'any.required': 'First name is required'
    }),
    last_name: Joi.string().trim().required().messages({
        'string.base': 'Last name must be a string',
        'string.empty': 'Last name cannot be empty',
        'any.required': 'Last name is required'
    }),
    phone_number: Joi.string().optional(),
    otp: Joi.string().optional()
});

const validateSigninOTP = (req, res, next) => {
    const { error } = signinOTPSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const validateVerifyOTP = (req, res, next) => {
    const { error } = verifyOTPSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

const validateSignupOTP = (req, res, next) => {
    const { error } = signupOTPSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    next();
};

module.exports = {
    validateInput,
    validateSignup,
    validateSignin,
    validateCreateSubscription,
    validateUpdateSubscription,
    validateCreateCat,
    validateUpdateCat,
    validateChatMessage,
    validateOpenAIChat,
    validateUpdateConversation,
    validateTestPayment,
    validateCreateStripeSubscription,
    validateResetPassword,
    validateRecommendations,
    validateSigninOTP,
    validateVerifyOTP,
    validateSignupOTP
};
