const mongoose = require('mongoose');

const dlSchema = new mongoose.Schema({
  formType: { type: String, required: true },
  dlNumber: { type: String, required: true }
}, { _id: true });

const legalPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emails: [{ type: String }],
  phones: [{ type: String }],
  pan: { type: String },
  aadhaar: { type: String },
  legalIdsAddedAt: { type: Date, default: Date.now }, 
  hasClaimedAccount: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false }
});

// ✨ NEW: The locker for ex-employees and previous owners
const staffHistorySchema = new mongoose.Schema({
  role: { type: String, enum: ['Proprietor', 'Competent Person'] },
  name: String,
  emails: [{ type: String }],
  phones: [{ type: String }],
  joinedAt: Date,
  leftAt: { type: Date, default: Date.now },
  reason: String // e.g., 'Transferred Ownership', 'Resigned', 'Revoked'
});

const adminSchema = new mongoose.Schema({
  cognitold: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  
  establishmentName: { type: String, default: 'Mila Agencies' },
  gstinAdmin: { type: String },
  drugsBazaarId: { type: String },
  drugLicenses: [dlSchema],
  businessLegalAddedAt: { type: Date, default: Date.now }, 

  // ✨ NEW: Yearly quota tracking for legal changes
  legalInfoChangeCount: { type: Number, default: 0 },
  lastLegalInfoChangeDate: { type: Date },
  legalInfoChanges: [{
    field: String,
    oldValue: String,
    newValue: String,
    changedAt: { type: Date, default: Date.now }
  }],

  address: {
    street: String,
    city: String,
    district: String,
    state: String,
    pincode: String
  },

  isProprietorAlsoCP: { type: Boolean, default: false },
  proprietor: legalPersonSchema,
  competentPerson: legalPersonSchema, 
  
  // ✨ NEW: History array
  staffHistory: [staffHistorySchema],

  pendingSecurityAction: {
    actionType: { 
      type: String, 
      enum: ['CHANGE_BUSINESS_LEGAL', 'CHANGE_PROP_INFO', 'CHANGE_CP_INFO', 'TOGGLE_DUAL_ROLE', null],
      default: null
    },
    proposedData: mongoose.Schema.Types.Mixed, 
    proprietorOtp: String,
    cpOtp: String,
    proprietorVerified: { type: Boolean, default: false },
    cpVerified: { type: Boolean, default: false },
    expiresAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);