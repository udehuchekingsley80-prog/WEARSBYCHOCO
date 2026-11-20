const express = require('express');
const crypto = require('crypto');
const { body, param, query } = require('express-validator');
const { RegistrationSession, KycDocument, User } = require('../models');
const { handleValidation } = require('../middleware/validate');
const { generalApiLimiter } = require('../middleware/rateLimit');
const { sendEmail } = require('../utils/mailer');
const { buildRegistrationWelcomeEmail, buildRegistrationSubmittedEmail } = require('../utils/emailTemplates');

const router = express.Router();

// Constants
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Helper: generate session ID
function generateSessionId() {
  return 'reg_' + crypto.randomBytes(16).toString('hex');
}

// Helper: calculate risk score
function calculateRiskScore(session) {
  let score = 0;
  const factors = [];
  
  // PEP check
  if (session.complianceInfo?.isPoliticallyExposed) {
    score += 50;
    factors.push('Politically Exposed Person');
  }
  
  // Sanctions check
  if (session.complianceInfo?.hasSanctions) {
    score += 100;
    factors.push('Sanctions match');
  }
  
  // High-risk country
  const highRiskCountries = ['IR', 'KP', 'SY', 'CU', 'VE', 'BY', 'MM', 'AF'];
  if (session.personalInfo?.countryOfResidence && highRiskCountries.includes(session.personalInfo.countryOfResidence)) {
    score += 30;
    factors.push('High-risk country of residence');
  }
  
  // High expected volume
  const highVolumeTiers = ['25k_50k', 'over_50k'];
  if (session.financialInfo?.expectedMonthlyVolume && highVolumeTiers.includes(session.financialInfo.expectedMonthlyVolume)) {
    score += 20;
    factors.push('High expected transaction volume');
  }
  
  // Crypto transactions
  if (session.financialInfo?.expectedTransactionTypes?.includes('crypto')) {
    score += 15;
    factors.push('Cryptocurrency transactions expected');
  }
  
  // Age verification (under 25 or over 70)
  if (session.personalInfo?.dateOfBirth) {
    const age = Math.floor((Date.now() - new Date(session.personalInfo.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 25 || age > 70) {
      score += 10;
      factors.push(`Age-based risk (${age})`);
    }
  }
  
  let level = 'low';
  if (score >= 70) level = 'critical';
  else if (score >= 40) level = 'high';
  else if (score >= 20) level = 'medium';
  
  return { score, level, factors };
}

// Validation schemas for each step
const step1Validation = [
  body('personalInfo.firstName').trim().notEmpty().withMessage('First name is required'),
  body('personalInfo.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('personalInfo.dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
  body('personalInfo.nationality').trim().notEmpty().withMessage('Nationality is required'),
  body('personalInfo.countryOfResidence').trim().notEmpty().withMessage('Country of residence is required'),
  body('personalInfo.phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('personalInfo.email').isEmail().withMessage('Valid email is required'),
];

const step2Validation = [
  body('addressInfo.residentialAddress.line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('addressInfo.residentialAddress.city').trim().notEmpty().withMessage('City is required'),
  body('addressInfo.residentialAddress.country').trim().notEmpty().withMessage('Country is required'),
  body('addressInfo.residentialAddress.postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('addressInfo.mailingAddressSame').isBoolean().withMessage('Mailing address same flag required'),
];

const step3Validation = [
  body('identityInfo.documentType').isIn(['passport', 'national_id', 'drivers_license']).withMessage('Valid document type required'),
  body('identityInfo.documentNumber').trim().notEmpty().withMessage('Document number is required'),
  body('identityInfo.documentExpiry').isISO8601().withMessage('Valid expiry date required'),
  body('identityInfo.issuingCountry').trim().notEmpty().withMessage('Issuing country is required'),
];

const step4Validation = [
  body('financialInfo.employmentStatus').isIn(['employed', 'self_employed', 'unemployed', 'student', 'retired', 'other']).withMessage('Valid employment status required'),
  body('financialInfo.annualIncome').isIn(['under_25k', '25k_50k', '50k_100k', '100k_250k', '250k_500k', 'over_500k', 'prefer_not_to_say']).withMessage('Valid income range required'),
  body('financialInfo.sourceOfFunds').isIn(['salary', 'business', 'investments', 'inheritance', 'savings', 'other']).withMessage('Valid source of funds required'),
  body('financialInfo.expectedMonthlyVolume').isIn(['under_1k', '1k_5k', '5k_10k', '10k_25k', '25k_50k', 'over_50k']).withMessage('Valid volume range required'),
];

const step5Validation = [
  body('complianceInfo.isPoliticallyExposed').isBoolean().withMessage('PEP status required'),
  body('complianceInfo.hasSanctions').isBoolean().withMessage('Sanctions status required'),
  body('complianceInfo.fatcaStatus').isIn(['us_person', 'non_us_person', 'not_applicable']).withMessage('Valid FATCA status required'),
  body('complianceInfo.crsStatus').isIn(['reportable', 'non_reportable', 'not_applicable']).withMessage('Valid CRS status required'),
  body('complianceInfo.termsAccepted').equals('true').withMessage('Terms must be accepted'),
  body('complianceInfo.privacyAccepted').equals('true').withMessage('Privacy policy must be accepted'),
];

/**
 * POST /api/registration/start
 * Start a new registration session
 */
router.post(
  '/start',
  generalApiLimiter,
  async (req, res) => {
    try {
      // Check if email already has an active session
      const { email } = req.body;
      if (email) {
        const existing = await RegistrationSession.findOne({
          'personalInfo.email': email.toLowerCase(),
          status: 'in_progress',
          expiresAt: { $gt: new Date() },
        });
        if (existing) {
          return res.json({
            success: true,
            sessionId: existing.sessionId,
            currentStep: existing.currentStep,
            message: 'Resumed existing registration session',
          });
        }
      }

      const sessionId = generateSessionId();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

      const session = await RegistrationSession.create({
        sessionId,
        expiresAt,
        currentStep: 1,
        stepsCompleted: [],
      });

      res.json({
        success: true,
        sessionId,
        currentStep: 1,
        message: 'Registration session created',
      });
    } catch (err) {
      console.error('Registration start error:', err);
      res.status(500).json({ error: 'Failed to start registration' });
    }
  }
);

/**
 * GET /api/registration/:sessionId
 * Get registration session status
 */
router.get(
  '/:sessionId',
  [param('sessionId').matches(/^reg_[a-f0-9]{32}$/).withMessage('Invalid session ID')],
  handleValidation,
  async (req, res) => {
    try {
      const session = await RegistrationSession.findOne({ sessionId: req.params.sessionId });
      if (!session) {
        return res.status(404).json({ error: 'Registration session not found' });
      }

      if (session.expiresAt < new Date()) {
        return res.status(410).json({ error: 'Registration session has expired' });
      }

      res.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          currentStep: session.currentStep,
          stepsCompleted: session.stepsCompleted,
          status: session.status,
          personalInfo: session.personalInfo,
          addressInfo: session.addressInfo,
          identityInfo: session.identityInfo,
          financialInfo: session.financialInfo,
          complianceInfo: session.complianceInfo,
          riskScore: session.riskScore,
          riskLevel: session.riskLevel,
          riskFactors: session.riskFactors,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
      });
    } catch (err) {
      console.error('Registration get error:', err);
      res.status(500).json({ error: 'Failed to retrieve registration' });
    }
  }
);

/**
 * PUT /api/registration/:sessionId/step/:step
 * Update a specific step
 */
router.put(
  '/:sessionId/step/:step',
  generalApiLimiter,
  [param('sessionId').matches(/^reg_[a-f0-9]{32}$/).withMessage('Invalid session ID')],
  handleValidation,
  async (req, res) => {
    try {
      const step = parseInt(req.params.step, 10);
      if (step < 1 || step > 5) {
        return res.status(400).json({ error: 'Invalid step number' });
      }

      const session = await RegistrationSession.findOne({ sessionId: req.params.sessionId });
      if (!session) {
        return res.status(404).json({ error: 'Registration session not found' });
      }

      if (session.expiresAt < new Date()) {
        return res.status(410).json({ error: 'Registration session has expired' });
      }

      if (session.status !== 'in_progress') {
        return res.status(400).json({ error: 'Registration session is not in progress' });
      }

      // Validate step data
      let validationMiddleware;
      switch (step) {
        case 1: validationMiddleware = step1Validation; break;
        case 2: validationMiddleware = step2Validation; break;
        case 3: validationMiddleware = step3Validation; break;
        case 4: validationMiddleware = step4Validation; break;
        case 5: validationMiddleware = step5Validation; break;
      }

      // Run validation
      if (validationMiddleware) {
        for (const validate of validationMiddleware) {
          await validate.run(req);
        }
        const errors = handleValidation(req, res, () => {});
        if (errors) return;
      }

      // Update session with step data
      const updateData = {};
      switch (step) {
        case 1:
          updateData.personalInfo = req.body.personalInfo;
          break;
        case 2:
          updateData.addressInfo = req.body.addressInfo;
          break;
        case 3:
          updateData.identityInfo = { ...session.identityInfo, ...req.body.identityInfo };
          break;
        case 4:
          updateData.financialInfo = req.body.financialInfo;
          break;
        case 5:
          updateData.complianceInfo = {
            ...req.body.complianceInfo,
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
          };
          break;
      }

      // Mark step as completed
      if (!session.stepsCompleted.includes(step)) {
        session.stepsCompleted.push(step);
        session.stepsCompleted.sort((a, b) => a - b);
      }
      session.currentStep = Math.max(session.currentStep, step + 1);
      Object.assign(session, updateData);

      // Calculate risk score after step 4
      if (step >= 4) {
        const risk = calculateRiskScore(session);
        session.riskScore = risk.score;
        session.riskLevel = risk.level;
        session.riskFactors = risk.factors;
      }

      await session.save();

      res.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          currentStep: session.currentStep,
          stepsCompleted: session.stepsCompleted,
          riskScore: session.riskScore,
          riskLevel: session.riskLevel,
          riskFactors: session.riskFactors,
        },
      });
    } catch (err) {
      console.error('Registration step update error:', err);
      res.status(500).json({ error: 'Failed to update registration step' });
    }
  }
);

/**
 * POST /api/registration/:sessionId/submit
 * Submit registration for review
 */
router.post(
  '/:sessionId/submit',
  generalApiLimiter,
  [param('sessionId').matches(/^reg_[a-f0-9]{32}$/).withMessage('Invalid session ID')],
  handleValidation,
  async (req, res) => {
    try {
      const session = await RegistrationSession.findOne({ sessionId: req.params.sessionId });
      if (!session) {
        return res.status(404).json({ error: 'Registration session not found' });
      }

      if (session.expiresAt < new Date()) {
        return res.status(410).json({ error: 'Registration session has expired' });
      }

      if (session.status !== 'in_progress') {
        return res.status(400).json({ error: 'Registration session is not in progress' });
      }

      // Verify all steps completed
      if (session.stepsCompleted.length < 5) {
        return res.status(400).json({ 
          error: 'All steps must be completed before submission',
          completedSteps: session.stepsCompleted,
        });
      }

      // Check for existing user with same email
      const existingUser = await User.findOne({ 
        email: session.personalInfo.email.toLowerCase() 
      });
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      // Update status
      session.status = 'submitted';
      session.submittedAt = new Date();
      await session.save();

      // Send confirmation email
      try {
        const html = buildRegistrationSubmittedEmail({
          firstName: session.personalInfo.firstName,
          lastName: session.personalInfo.lastName,
          sessionId: session.sessionId,
        });
        await sendEmail({
          toEmail: session.personalInfo.email,
          subject: 'Northstar Financial — Registration Submitted for Review',
          body: `Thank you for completing your registration. Your application (${session.sessionId}) has been submitted for review.`,
          html,
          type: 'registration_submitted',
        });
      } catch (emailErr) {
        console.error('Registration submission email failed:', emailErr);
      }

      res.json({
        success: true,
        message: 'Registration submitted for review',
        sessionId: session.sessionId,
        estimatedReviewTime: '1-3 business days',
      });
    } catch (err) {
      console.error('Registration submit error:', err);
      res.status(500).json({ error: 'Failed to submit registration' });
    }
  }
);

/**
 * POST /api/registration/:sessionId/upload
 * Upload KYC document
 */
router.post(
  '/:sessionId/upload',
  generalApiLimiter,
  [param('sessionId').matches(/^reg_[a-f0-9]{32}$/).withMessage('Invalid session ID')],
  handleValidation,
  async (req, res) => {
    try {
      // This endpoint expects multipart/form-data with file upload
      // Implementation depends on upload middleware (multer, etc.)
      // For now, return a placeholder response
      res.status(501).json({ 
        error: 'Document upload endpoint not yet implemented',
        message: 'Use multipart/form-data with field "document" and "documentType"',
      });
    } catch (err) {
      console.error('Document upload error:', err);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

/**
 * GET /api/registration/:sessionId/documents
 * List uploaded documents
 */
router.get(
  '/:sessionId/documents',
  [param('sessionId').matches(/^reg_[a-f0-9]{32}$/).withMessage('Invalid session ID')],
  handleValidation,
  async (req, res) => {
    try {
      const session = await RegistrationSession.findOne({ sessionId: req.params.sessionId });
      if (!session) {
        return res.status(404).json({ error: 'Registration session not found' });
      }

      const documents = await KycDocument.find({ registrationSessionId: session._id })
        .select('-extractedData -verificationResult')
        .sort({ uploadedAt: -1 });

      res.json({
        success: true,
        documents: documents.map(doc => ({
          id: doc._id,
          documentType: doc.documentType,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          size: doc.size,
          status: doc.status,
          uploadedAt: doc.uploadedAt,
        })),
      });
    } catch (err) {
      console.error('Document list error:', err);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  }
);

module.exports = router;