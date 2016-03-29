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

proto.ordered = function() {
  let obj = this.clone();

  let args = utils.parseArg(arguments);

  _.each(args, function(arg, i) {
    assert(arg.isOvt, `${utils.obj2Str(arg)} is not a valid ovt schema`);

    obj.inners[i] = arg;
  });

  return obj;
};

proto.elements = function() {
  let obj = this.clone();

  let args = utils.parseArg(arguments);

  let inners = _.map(args, function(arg) {
    assert(arg.isOvt, `${utils.obj2Str(arg)} is not a valid ovt schema`);

    return arg;
  });

  obj._inners[0] = inners;

  return obj;
};

proto.items = proto.elements;

utils.addChainableMethod(proto, 'isArray', function(val) {
  return _.isArray(val);
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

// Sanitizers from `lodash`
[
  // Array specific sanitizers
  'chunk',
  'compact',
  'concat',
  'difference',
  'differenceBy',
  'differenceWith',
  'drop',
  'dropRight',
  'dropRightWhile',
  'dropWhile',
  'fill',
  'findIndex',
  'findLastIndex',
  'first',
  'flatten',
  'flattenDeep',
  'flattenDepth',
  'fromPairs',
  'head',
  'indexOf',
  'initial',
  'intersection',
  'intersectionBy',
  'intersectionWith',
  'join',
  'last',
  'lastIndexOf',
  'pull',
  'pullAll',
  'pullAllBy',
  'pullAllWith',
  'pullAt',
  'remove',
  'reverse',
  'slice',
  'sortedIndex',
  'sortedIndexBy',
  'sortedIndexOf',
  'sortedLastIndex',
  'sortedLastIndexBy',
  'sortedLastIndexOf',
  'sortedUniq',
  'sortedUniqBy',
  'tail',
  'take',
  'takeRight',
  'takeRightWhile',
  'takeWhile',
  'union',
  'unionBy',
  'unionWith',
  'uniq',
  'uniqBy',
  'uniqWith',
  'unzip',
  'unzipWith',
  'without',
  'xor',
  'xorBy',
  'xorWith',
  'zip',
  'zipObject',
  'zipObjectDeep',
  'zipWith',

  // Collection sanitizers
  'countBy',
  'each',
  'forEach',
  'eachRight',
  'forEachRight',
  'every',
  'filter',
  'find',
  'findLast',
  'flatMap',
  'forEach',
  'forEachRight',
  'groupBy',
  'includes',
  'invokeMap',
  'keyBy',
  'map',
  'orderBy',
  'partition',
  'reduce',
  'reduceRight',
  'reject',
  'sample',
  'sampleSize',
  'shuffle',
  'size',
  'some',
  'sortBy'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    return _[name].apply(_, arguments);
  }, { type: 'sanitizer' });
});

module.exports = ArrayType;
