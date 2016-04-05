'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function DateType() {
  AnyType.call(this);

  this._type = 'date';
  this._defaultValidator = 'isDate';
}

inherits(DateType, AnyType);

let proto = DateType.prototype;

proto.convert = function(val) {
  return _.isDate(val) ? val : new Date(val);
};

utils.addChainableMethod(proto, 'isDate', function(val) {
  return _.isDate(val);
});

module.exports = DateType;
