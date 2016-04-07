'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function RegExpType() {
  AnyType.call(this);

  this._type = 'regexp';
  this._defaultValidator = 'isRegExp';
}

utils.inherits(RegExpType, AnyType);

let proto = RegExpType.prototype;

proto.convert = function(val) {
  return utils.isRegExp(val) ? val : new RegExp(val);
};

utils.addChainableMethod(proto, 'isRegExp', function(val) {
  return utils.isRegExp(val);
});

module.exports = RegExpType;
