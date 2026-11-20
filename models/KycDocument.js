const mongoose = require('mongoose');

const kycDocumentSchema = new mongoose.Schema({
  // Document identification
  registrationSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RegistrationSession', required: true, index: true },
  
  // Document type and purpose
  documentType: { 
    type: String, 
    enum: [
      'identity_front', 
      'identity_back', 
      'selfie', 
      'proof_of_address', 
      'proof_of_income',
      'tax_document',
      'other'
    ], 
    required: true 
  },
  
  // File metadata
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  
  // Storage (using GridFS or object storage reference)
  storageProvider: { type: String, enum: ['gridfs', 's3', 'local'], default: 'gridfs' },
  storageKey: { type: String, required: true }, // GridFS file ID or S3 key
  
  // Document data
  extractedData: { type: mongoose.Schema.Types.Mixed }, // OCR extracted fields
  ocrConfidence: { type: Number },
  
  // Verification status
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'verified', 'rejected', 'manual_review'], 
    default: 'uploaded' 
  },
  
  // Verification results
  verificationResult: {
    isValid: { type: Boolean },
    checks: [{
      name: { type: String },
      passed: { type: Boolean },
      confidence: { type: Number },
      details: { type: String }
    }],
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    notes: { type: String },
  },
  
  // Security
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  
  // Expiry
  expiresAt: { type: Date, index: { expires: 0 } }, // TTL for cleanup
}, { timestamps: true });

// Indexes
kycDocumentSchema.index({ registrationSessionId: 1, documentType: 1 });
kycDocumentSchema.index({ status: 1 });
kycDocumentSchema.index({ uploadedAt: -1 });

// Static method to create document record
kycDocumentSchema.statics.createRecord = function(data) {
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
  return this.create({ ...data, expiresAt });
};

// Instance method to mark as verified
kycDocumentSchema.methods.markVerified = function(result, reviewerId) {
  this.status = 'verified';
  this.verificationResult = {
    isValid: result.isValid,
    checks: result.checks || [],
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    notes: result.notes || '',
  };
  return this.save();
};

// Instance method to mark as rejected
kycDocumentSchema.methods.markRejected = function(reason, reviewerId) {
  this.status = 'rejected';
  this.verificationResult = {
    isValid: false,
    checks: [],
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    notes: reason,
  };
  return this.save();
};

module.exports = mongoose.model('KycDocument', kycDocumentSchema);