'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function StringType() {
  AnyType.call(this);

  this._type = 'string';
  this._defaultValidator = 'isString';
}

utils.inherits(StringType, AnyType);

const proto = StringType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) {
  return utils.isString(val) ? val : String(val);
};

chainable('required', {
  method: function(val) {
    return !(val == null || val == '');
  },
  chainableBehaviour: function() {
    let obj = this.clone();
    delete obj._methods.optional;
    delete obj._methods.forbidden;
    return obj;
  }
});

chainable('isString', {
  method: function(val) {
    return utils.isString(val);
  }
});

module.exports = StringType;
