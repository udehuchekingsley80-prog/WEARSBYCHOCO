const mongoose = require('mongoose');

const registrationSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: { type: String, required: true, unique: true, index: true },
  
  // Current step (1-5)
  currentStep: { type: Number, default: 1, min: 1, max: 5 },
  
  // Step completion status
  stepsCompleted: [{ type: Number }],
  
  // Step 1: Personal Information
  personalInfo: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    dateOfBirth: { type: Date },
    nationality: { type: String, trim: true },
    countryOfResidence: { type: String, trim: true },
    taxResidency: [{ type: String, trim: true }],
    phoneNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  
  // Step 2: Address Information
  addressInfo: {
    residentialAddress: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      stateProvince: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    mailingAddressSame: { type: Boolean, default: true },
    mailingAddress: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      stateProvince: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    addressVerified: { type: Boolean, default: false },
  },
  
  // Step 3: Identity Verification
  identityInfo: {
    documentType: { type: String, enum: ['passport', 'national_id', 'drivers_license'] },
    documentNumber: { type: String, trim: true },
    documentExpiry: { type: Date },
    issuingCountry: { type: String, trim: true },
    frontDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'KycDocument' },
    backDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'KycDocument' },
    selfieDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'KycDocument' },
    verified: { type: Boolean, default: false },
    verificationScore: { type: Number },
    verificationNotes: { type: String },
  },
  
  // Step 4: Financial Profile
  financialInfo: {
    employmentStatus: { type: String, enum: ['employed', 'self_employed', 'unemployed', 'student', 'retired', 'other'] },
    employerName: { type: String, trim: true },
    occupation: { type: String, trim: true },
    annualIncome: { type: String, enum: ['under_25k', '25k_50k', '50k_100k', '100k_250k', '250k_500k', 'over_500k', 'prefer_not_to_say'] },
    sourceOfFunds: { type: String, enum: ['salary', 'business', 'investments', 'inheritance', 'savings', 'other'] },
    expectedMonthlyVolume: { type: String, enum: ['under_1k', '1k_5k', '5k_10k', '10k_25k', '25k_50k', 'over_50k'] },
    expectedTransactionTypes: [{ type: String, enum: ['domestic_transfer', 'international_transfer', 'card_payments', 'crypto', 'other'] }],
  },
  
  // Step 5: Compliance & Agreements
  complianceInfo: {
    isPoliticallyExposed: { type: Boolean, default: false },
    pepDetails: { type: String },
    hasSanctions: { type: Boolean, default: false },
    sanctionsDetails: { type: String },
    fatcaStatus: { type: String, enum: ['us_person', 'non_us_person', 'not_applicable'] },
    crsStatus: { type: String, enum: ['reportable', 'non_reportable', 'not_applicable'] },
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
    privacyAccepted: { type: Boolean, default: false },
    privacyAcceptedAt: { type: Date },
    marketingConsent: { type: Boolean, default: false },
  },
  
  // Risk assessment
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  riskFactors: [{ type: String }],
  
  // Status
  status: { type: String, enum: ['in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'expired'], default: 'in_progress' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  expiresAt: { type: Date, index: { expires: 0 } }, // TTL index for auto-cleanup
  
  // Completed user reference (set on approval)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Review metadata
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },
}, { timestamps: true });

// Indexes
registrationSessionSchema.index({ email: 1 });
registrationSessionSchema.index({ status: 1 });
registrationSessionSchema.index({ createdAt: -1 });

// Pre-save middleware
registrationSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to create new session
registrationSessionSchema.statics.createSession = function(data = {}) {
  const sessionId = 'reg_' + require('crypto').randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return this.create({ sessionId, expiresAt, ...data });
};

// Instance method to update step
registrationSessionSchema.methods.completeStep = function(stepNumber, data) {
  if (!this.stepsCompleted.includes(stepNumber)) {
    this.stepsCompleted.push(stepNumber);
    this.stepsCompleted.sort((a, b) => a - b);
  }
  this.currentStep = Math.max(this.currentStep, stepNumber + 1);
  Object.assign(this, data);
  return this.save();
};

module.exports = mongoose.model('RegistrationSession', registrationSessionSchema);