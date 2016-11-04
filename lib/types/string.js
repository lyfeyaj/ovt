'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function StringType() {
  AnyType.call(this);

  this._type = 'string';
  this._defaultValidator = 'isString';
}

utils.inherits(StringType, AnyType);

let proto = StringType.prototype;

proto.convert = function(val) {
  return utils.isString(val) ? val : String(val);
};

utils.addChainableMethod(proto, 'required', function(val) {
  return !(val == null || val == '');
}, function() {
  let obj = this.clone();
  delete obj._methods.optional;
  delete obj._methods.forbidden;
  return obj;
});

utils.addChainableMethod(proto, 'isString', function(val) {
  return utils.isString(val);
});

module.exports = StringType;
