const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;

export const validateField = (field, value, formData = {}) => {
  const val = value === undefined || value === null ? '' : String(value).trim();

  // Required check
  if (field.required && val === '') {
    return `${field.label} is required`;
  }

  // Skip further validation if empty and not required
  if (val === '') return null;

  // Email validation
  if (field.type === 'email' && !EMAIL_REGEX.test(val)) {
    return 'Please enter a valid email address';
  }

  // URL validation
  if (field.type === 'url' && !URL_REGEX.test(val)) {
    return 'Please enter a valid URL (http:// or https://)';
  }

  // Number validation
  if (field.type === 'number') {
    const num = Number(val);
    if (isNaN(num)) return 'Please enter a valid number';
    if (field.min !== undefined && num < field.min) {
      return `Minimum value is ${field.min}`;
    }
    if (field.max !== undefined && num > field.max) {
      return `Maximum value is ${field.max}`;
    }
  }

  // Min/max length
  if (field.minLength && val.length < field.minLength) {
    return `Must be at least ${field.minLength} characters`;
  }
  if (field.maxLength && val.length > field.maxLength) {
    return `Must be no more than ${field.maxLength} characters`;
  }

  // Date range validation: if this is an end_date, check it's after start_date
  if (field.name && field.name.includes('end_date') || field.name === 'check_out_date') {
    const startField = field.name === 'check_out_date' ? 'check_in_date' : field.name.replace('end', 'start');
    const startVal = formData[startField];
    if (startVal && val && new Date(val) < new Date(startVal)) {
      return `${field.label} must be after the start date`;
    }
  }

  return null;
};

export const validateForm = (fields, formData) => {
  const errors = {};
  let hasErrors = false;

  fields.forEach((field) => {
    const error = validateField(field, formData[field.name], formData);
    if (error) {
      errors[field.name] = error;
      hasErrors = true;
    }
  });

  return { errors, isValid: !hasErrors };
};
