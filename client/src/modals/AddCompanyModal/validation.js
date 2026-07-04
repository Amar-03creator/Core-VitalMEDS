// modals/AddCompanyModal/validation.js
export const patterns = {
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  aadhaar: /^[2-9][0-9]{11}$/,
  drugLicense: /^[A-Za-z0-9\/\s\-]{5,30}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  pincode: /^[1-9][0-9]{5}$/,
  drugsBazaarId: /^[A-Za-z0-9\-]{5,20}$/,
};

export const errorMessages = {
  gstin: 'Invalid GSTIN. Must be 15 characters (e.g., 21ABCDE1234F1Z5).',
  pan: 'Invalid PAN. Must be 10 characters (e.g., ABCDE1234F).',
  aadhaar: 'Invalid Aadhaar. Must be 12 digits, not starting with 0 or 1.',
  drugLicense: 'Drug license must be 5-30 alphanumeric characters.',
  email: 'Invalid email address.',
  pincode: 'Invalid pincode. Must be 6 digits, first digit 1-9.',
  drugsBazaarId: 'DrugsBazaar ID must be 5-20 alphanumeric characters.',
};

export const validateField = (name, value) => {
  if (!value || value.trim() === '') return null;
  let processed = value;
  if (name === 'email') processed = value.toLowerCase();
  else {
    processed = value.toUpperCase().replace(/\s/g, '');
  }
  const pattern = patterns[name];
  if (!pattern) return null;
  return pattern.test(processed) ? null : errorMessages[name];
};