'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const assert = require('assert');
const utils = require('../utils');
const AnyType = require('./any');
const Errors = require('../errors');

const ArrayType = require('./array');

function ObjectType() {
  AnyType.call(this);

  this._type = 'object';
  this._defaultValidator = 'isObject';

  this._inner.renames = {};
  this._inner.children = {};
}

inherits(ObjectType, AnyType);

let proto = ObjectType.prototype;

proto.convert = function(val) {
  return _.isObject(val) ? val : new Object(val);
};

proto._validateInner = function(obj, state, options) {
  options = options || {};
  let errors = new Errors();
  let value = _.clone(obj);

  let isErrored = function() {
    return state.hasErrors || errors.any();
  };

  let canAbortEarly = function() {
    return options.abortEarly && isErrored();
  };

  let handleResult = function() {
    return { errors: errors.any() ? errors : null, value };
  };

  if (canAbortEarly()) return handleResult();

  let children = this._inner.children;
  let renames = this._inner.renames;

  for (let name in children) {
    if (canAbortEarly()) break;

    let type = children[name];

    let val = _.get(value, name);
    let currentPath = utils.buildPath(state);
    let res = type._validate(val, {
      // original state
      original: state.original,
      parentObj: state.parentObj,

      // changed state
      parentType: type._type,
      parentPath: currentPath,
      key: name,
      hasErrors: isErrored()
    }, options);

    if (!res.errors) {
      let newName = renames[name];
      if (newName) {
        delete value[name];
        name = newName;
      }
      _.set(value, name, res.value);
    }
    errors = errors.concat(res.errors);
  }

  return handleResult();
};

utils.addChainableMethod(proto, 'isObject', function(val) {
  return _.isObject(val);
});

utils.addChainableMethod(proto, 'add', _.noop, function(name, schema) {
  assert(_.isString(name), `${utils.obj2Str(name)} is not a valid string`);
  assert(schema.isOvt || _.isObject(schema), `${utils.obj2Str(schema)} is not a valid object or schema`);

  let obj = this.clone();

  obj._inner.children[name] = schema;
  obj._methods.__validateInnerFlag__ = true;

  return obj;
}, { onlyChainable: true, avoidNoArgCall: true });

utils.addChainableMethod(proto, 'keys', _.noop, function(schemas) {
  schemas = schemas || {};

  assert(_.isObject(schemas), `${utils.obj2Str(schemas)} is not a valid objecet`);
  assert(!schemas.isOvt, `${utils.obj2Str(schemas)} can not be an ovt schema`);

  let obj = this.clone();

  _.each(schemas, function(schema, name) {
    if (schema.isOvt) {
      obj._inner.children[name] = schema;
    }
    // check array type
    else if (Array.isArray(schema)) {
      let arraySchema = utils.applyType('array', ArrayType);
      arraySchema = arraySchema.items.apply(arraySchema, schema);
      obj._inner.children[name] = arraySchema;
    }
    // check plain object type
    else if (_.isObject(schema)) {
      let objectSchema = utils.applyType('object', ObjectType);
      objectSchema = objectSchema.keys.apply(objectSchema, schema);
      obj._inner.children[name] = objectSchema;
    }
  });

  obj._methods.__validateInnerFlag__ = true;

  return obj;
}, { onlyChainable: true, avoidNoArgCall: true });

utils.addChainableMethod(proto, 'rename', _.noop, function(oldName, newName) {
  let obj = this.clone();
  obj._inner.renames[oldName] = newName;
  return obj;
}, {
  onlyChainable: true, avoidNoArgCall: true
});

// Sanitizers from `lodash`
[
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

module.exports = ObjectType;
