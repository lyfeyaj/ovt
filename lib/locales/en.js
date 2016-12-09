'use strict';

module.exports = {
  any: {
    unknown: 'validation failed',
    convertError: 'convert failed',
    required: 'is required',
    optional: 'is optional',
    forbidden: 'is forbidden',
    valid: 'must be one of "{{args}}"',
    only: 'must be one of "{{args}}"',
    whitelist: 'must be one of "{{args}}"',
    oneOf: 'must be one of "{{args}}"',
    equals: 'not equal to {{0}}',
    eq: 'not equal to {{0}}',
    equal: 'not equal to {{0}}',
    invalid: 'can\'t be one of "{{args}}"',
    not: 'can\'t be one of "{{args}}"',
    disallow: 'can\'t be one of "{{args}}"',
    blacklist: 'can\'t be one of "{{args}}"'
  },

  array: {
    isArray: 'is not a valid array',
    forbidden: 'Forbidden value can\'t be included',
    inclusions: 'No valid schema matches',
    requireds: '{{preferedLength}} elements are required, now is {{currentLength}}',
    isLength: 'length must be {{0}}',
    length: 'length must be {{0}}',
    maxLength: 'length must be less than {{0}}',
    max: 'length must be less than {{0}}',
    minLength: 'length must be longer than {{0}}',
    min: 'length must be longer than {{0}}'
  },

  boolean: {
    isBoolean: 'is not a valid boolean'
  },

  buffer: {
    isBuffer: 'is not a valid buffer'
  },

  date: {
    isDate: 'is not a valid date'
  },

  func: {
    isFunction: 'is not a valid function',
    arity: 'arguments length must be {{0}}',
    minArity: 'arguments length must be less than {{0}}',
    maxArity: 'arguments length must be longer than {{0}}'
  },

  number: {
    isNumber: 'is not a valid number',
    isInteger: 'is not a integer',
    integer: 'is not a integer',
    isPositive: 'is not positive number',
    positive: 'is not positive number',
    isNegative: 'is not negative number',
    negative: 'is not negative number',
    min: 'can not less than {{0}}',
    max: 'can not larger than {{0}}'
  },

  object: {
    isObject: 'is not a valid object'
  },

  regexp: {
    isRegExp: 'is not a valid regular expression'
  },

  string: {
    isString: 'is not a valid string'
  },

  alternatives: {
    try: 'invalid'
  }
};
