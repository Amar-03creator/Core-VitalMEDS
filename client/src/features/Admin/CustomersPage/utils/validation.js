// customers/utils/validation.js

export const patterns = {
  gstin:       /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  pan:         /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  aadhaar:     /^[2-9][0-9]{11}$/,
  email:       /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  pincode:     /^[1-9][0-9]{5}$/,
  drugLicense: /^[A-Za-z0-9\/\s\-]{5,40}$/,
  phone:       /^[6-9]\d{9}$/,
};

export const errorMessages = {
  gstin:       'Invalid GSTIN (e.g., 21ABCDE1234F1Z5).',
  pan:         'Invalid PAN (e.g., ABCDE1234F).',
  aadhaar:     'Invalid Aadhaar — 12 digits, not starting with 0 or 1.',
  email:       'Invalid email address.',
  pincode:     'Invalid pincode — 6 digits, first digit 1–9.',
  drugLicense: 'License must be 5–40 alphanumeric characters.',
  phone:       'Must be a valid 10-digit mobile number starting with 6–9.',
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
