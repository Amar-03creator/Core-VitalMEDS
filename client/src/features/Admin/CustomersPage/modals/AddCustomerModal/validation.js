// customers/modals/AddCustomerModal/validation.js

export const patterns = {
  // Future-proof GSTIN (allows 14th character to evolve beyond 'Z')
  gstin:        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{2}[0-9A-Z]{1}$/,
  // Standard PAN
  pan:          /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  // Aadhaar: 12 digits, cannot start with 0 or 1
  aadhaar:      /^[2-9]{1}[0-9]{11}$/,
  // Standard Email
  email:        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Indian Pincode: 6 digits, first digit 1-9
  pincode:      /^[1-9]{1}[0-9]{5}$/,
  // Indian Mobile (used internally if needed)
  phone:        /^(?:\+91|91|0)?[6-9]\d{9}$/,
  // Drug License: 5-40 chars
  drugLicense:  /^[A-Za-z0-9\/\s\-]{5,40}$/,
};

export const errorMessages = {
  gstin:       'Invalid GSTIN format (e.g., 21ABCDE1234F1Z5).',
  pan:         'Invalid PAN format (e.g., ABCDE1234F).',
  aadhaar:     'Invalid Aadhaar (12 digits, cannot start with 0 or 1).',
  email:       'Invalid email address.',
  pincode:     'Invalid pincode (6 digits, cannot start with 0).',
  phone:       'Must be a valid 10-digit mobile number.',
  drugLicense: 'License must be 5–40 alphanumeric characters.',
};

export const validateField = (name, value) => {
  if (!value || value.trim() === '') return null;
  let processed = value;
  if (name === 'email') processed = value.toLowerCase();
  else processed = value.toUpperCase().replace(/\s/g, '');
  
  const pattern = patterns[name];
  if (!pattern) return null;
  return pattern.test(processed) ? null : errorMessages[name];
};