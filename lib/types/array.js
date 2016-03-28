'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const assert = require('assert');
const utils = require('../utils');
const AnyType = require('./any');

function ArrayType() {
  AnyType.call(this);

  this._type = 'array';
}

inherits(ArrayType, AnyType);

let proto = ArrayType.prototype;

utils.addChainableMethod(proto, 'isArray', function(val) {
  return _.isArray(val);
});

// Add some array sanitizers
[
  'compact',
  'uniq',
  'take',
  'concat',
  'without'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    return _[name].apply(_, arguments);
  }, { type: 'sanitizer' });
});

const validateUnique = function(val) {
  let newVal = _.uniq(val);
  return newVal.length === val.length;
};

utils.addChainableMethod(proto, 'isUnique', validateUnique);

utils.addChainableMethod(proto, 'isLength', function(val, length) {
  return val.length === length;
});

utils.addChainableMethod(proto, 'max', function(val, length) {
  return val.length <= length;
});

utils.addChainableMethod(proto, 'min', function(val, length) {
  return val.length >= length;
});

proto.ordered = function() {
  let obj = this.clone();

  let args = utils.parseArg(arguments);

  _.each(args, function(arg, i) {
    assert(arg.isOvt, `${utils.obj2Str(arg)} is not a valid ovt schema`);

    obj.inners[i] = arg;
  });

  return obj;
};

proto.items = function() {
  let obj = this.clone();

  let args = utils.parseArg(arguments);

  let inners = _.map(args, function(arg) {
    assert(arg.isOvt, `${utils.obj2Str(arg)} is not a valid ovt schema`);

    return arg;
  });

  obj._inners[0] = inners;

  return obj;
};

module.exports = ArrayType;
