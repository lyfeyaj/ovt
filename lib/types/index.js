'use strict';

const BooleanType = require('./boolean');
const AlternativesType = require('./alternatives');

module.exports = {
  'any': require('./any'),
  'array': require('./array'),
  'string': require('./string'),
  'boolean': BooleanType,
  'bool': BooleanType,
  'buffer': require('./buffer'),
  'date': require('./date'),
  'func': require('./func'),
  'number': require('./number'),
  'object': require('./object'),
  'regexp': require('./regexp'),
  'alternatives': AlternativesType,
  'alt': AlternativesType
};
