'use strict';

module.exports = {
  any: {
    convertError: 'convert failed',
    required: 'is required',
    optional: 'is optional',
    forbidden: 'is forbidden',
    valid: 'must be one of "{{flattenedArgs}}"',
    only: 'must be one of "{{flattenedArgs}}"',
    whitelist: 'must be one of "{{flattenedArgs}}"',
    oneOf: 'must be one of "{{flattenedArgs}}"',
    equals: 'not equal to {{0}}',
    eq: 'not equal to {{0}}',
    equal: 'not equal to {{0}}',
    invalid: 'can\'t be one of "{{flattenedArgs}}"',
    not: 'can\'t be one of "{{flattenedArgs}}"',
    disallow: 'can\'t be one of "{{flattenedArgs}}"',
    blacklist: 'can\'t be one of "{{flattenedArgs}}"'
  },

  array: {
    isArray: 'is not a valid array',
    forbidden: 'Forbidden value can\'t be included',
    inclusions: 'No valid schema matches',
    requireds: '{{preferedLength}} elements are required, now is {{currentLength}}',
    isLength: 'length must be {{0}}',
    maxLength: 'length must be less than {{0}}',
    minLength: 'length must be longer than {{0}}'
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

  function: {
    isFunction: 'is not a valid function',
    arity: 'arguments length must be {{0}}',
    minArity: 'arguments length must be less than {{0}}',
    maxArity: 'arguments length must be longer than {{0}}'
  },

  number: {
    isNumber: 'is not a valid number'
  },

  object: {
    isObject: 'is not a valid object'
  },

  regexp: {
    isRegExp: 'is not a valid regular expression'
  },

  string: {
    isString: 'is not a valid string'
  }
};
