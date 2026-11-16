const { HttpError } = require('./http');

function validate(input, rules) {
  const fields = {};
  const values = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Check the highlighted fields', { body: 'Expected a JSON object' });
  }
  if (Object.keys(input).some(key => !Object.hasOwn(rules, key))) {
    fields.body = 'Unexpected fields were provided';
  }
  for (const [key, rule] of Object.entries(rules)) {
    try {
      values[key] = rule(Object.hasOwn(input, key) ? input[key] : undefined);
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      fields[key] = error.message;
    }
  }
  if (Object.keys(fields).length) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Check the highlighted fields', fields);
  }
  return values;
}

function text(min, max) {
  return value => {
    if (typeof value !== 'string') throw new TypeError('Enter text');
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (/[<>\u0000-\u001f\u007f]/.test(normalized) || normalized.length < min || normalized.length > max) {
      throw new TypeError('Enter ' + min + '–' + max + ' characters without angle brackets or control characters');
    }
    return normalized;
  };
}

function optional(rule, fallback = '') {
  return value => value === undefined ? fallback : rule(value);
}

function oneOf(...options) {
  return value => {
    if (!options.includes(value)) throw new TypeError('Choose one of the listed options');
    return value;
  };
}

function integer(min, max) {
  return value => {
    if (!Number.isSafeInteger(value) || value < min || value > max) {
      throw new TypeError('Enter a whole number from ' + min + ' to ' + max);
    }
    return value;
  };
}

function email(value) {
  const normalized = text(3, 100)(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(normalized)) throw new TypeError('Enter a valid email address');
  return normalized;
}

function phone(value) {
  const normalized = text(11, 12)(value);
  if (!/^03\d{2}-?\d{7}$/.test(normalized)) throw new TypeError('Enter a Pakistani mobile number');
  return normalized.replace('-', '');
}

function maskPhone(value) {
  const digits = value.replace('-', '');
  return digits.slice(0, 4) + '-***-**' + digits.slice(-2);
}

function password(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 64 || Buffer.byteLength(value) > 72) {
    throw new TypeError('Enter 8–64 characters and at most 72 UTF-8 bytes');
  }
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d\s]/];
  if (kinds.filter(pattern => pattern.test(value)).length < 3 || /[<>\u0000-\u001f\u007f]/.test(value)) {
    throw new TypeError('Use three character types and avoid angle brackets and control characters');
  }
  return value;
}

function id(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new HttpError(404, 'NOT_FOUND', 'Resource not found');
  }
  return Number(value);
}

module.exports = { validate, text, optional, oneOf, integer, email, phone, maskPhone, password, id };
