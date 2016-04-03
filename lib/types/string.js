'use strict';

const _ = require('lodash');
const Validators = require('validator');
const xss = require('xss');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function StringType() {
  AnyType.call(this);

  this._type = 'string';
}

inherits(StringType, AnyType);

let proto = StringType.prototype;

proto.convert = function(val) {
  return _.isString(val) ? val : _.toString(val);
};

utils.addChainableMethod(proto, 'isString', function(val) {
  return _.isString(val);
});

[
  'contains',
  'isAfter',
  'isAlpha',
  'isAlphanumeric',
  'isAscii',
  'isBase64',
  'isBefore',
  'isBoolean',
  'isByteLength',
  'isCreditCard',
  'isCurrency',
  'isDate',
  'isDecimal',
  'isDivisibleBy',
  'isEmail',
  'isFQDN',
  'isFloat',
  'isFullWidth',
  'isHalfWidth',
  'isHexColor',
  'isHexadecimal',
  'isIP',
  'isISBN',
  'isISIN',
  'isISO8601',
  'isIn',
  'isInt',
  'isJSON',
  'isLength',
  'isLowercase',
  'isMACAddress',
  'isMobilePhone',
  'isMongoId',
  'isMultibyte',
  'isNull',
  'isNumeric',
  'isSurrogatePair',
  'isURL',
  'isUUID',
  'isUppercase',
  'isVariableWidth',
  'isWhitelisted',
  'matches'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    let validator = Validators[name];
    return validator.apply(Validators, arguments);
  });
});

// Add sanitizers for StringType
[
  'blacklist',
  'unescape',
  'normalizeEmail',
  'stripLow',
  'whitelist'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    let validator = Validators[name];
    return validator.apply(Validators, arguments);
  }, { type: 'sanitizer' });
});

utils.addChainableMethod(proto, 'xss', function() {
  return xss.apply(xss, arguments);
});

// Methods from `lodash`
[
  'camelCase',
  'capitalize',
  'deburr',
  'endsWith',
  'escape',
  'escapeRegExp',
  'kebabCase',
  'lowerCase',
  'lowerFirst',
  'pad',
  'padEnd',
  'padStart',
  'parseInt',
  'repeat',
  'replace',
  'snakeCase',
  'split',
  'startCase',
  'startsWith',
  'template',
  'toLower',
  'toUpper',
  'trim',
  'trimEnd',
  'trimStart',
  'truncate',
  'unescape',
  'upperCase',
  'upperFirst',
  'words'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    return _[name].apply(_, arguments);
  }, { type: 'sanitizer' });
});

module.exports = StringType;
