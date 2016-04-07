'use strict';

const assert = require('assert');
const magico = require('magico');
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

utils.inherits(ObjectType, AnyType);

let proto = ObjectType.prototype;

proto.convert = function(val) {
  return utils.isObject(val) ? val : new Object(val);
};

proto._validateInner = function(obj, state, options) {
  options = options || {};
  let errors = new Errors();
  let value = utils.cloneObject(obj);

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

    let val = magico.get(value, name);
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
      magico.set(value, name, res.value);
    }
    errors = errors.concat(res.errors);
  }

  return handleResult();
};

utils.addChainableMethod(proto, 'isObject', function(val) {
  return utils.isObject(val);
});

utils.addChainableMethod(proto, 'add', utils.noop, function(name, schema) {
  assert(utils.isString(name), `${utils.obj2Str(name)} is not a valid string`);
  assert(schema.isOvt || utils.isObject(schema), `${utils.obj2Str(schema)} is not a valid object or schema`);

  let obj = this.clone();

  obj._inner.children[name] = schema;
  obj._methods.__validateInnerFlag__ = true;

  return obj;
}, { onlyChainable: true, avoidNoArgCall: true });

utils.addChainableMethod(proto, 'keys', utils.noop, function(schemas) {
  schemas = schemas || {};

  assert(utils.isObject(schemas), `${utils.obj2Str(schemas)} is not a valid objecet`);
  assert(!schemas.isOvt, `${utils.obj2Str(schemas)} can not be an ovt schema`);

  let obj = this.clone();

  for (let name in schemas) {
    let schema = schemas[name];

    if (schema.isOvt) {
      obj._inner.children[name] = schema;
    }
    // check array type
    else if (utils.isArray(schema)) {
      let arraySchema = utils.applyType('array', ArrayType);
      arraySchema = arraySchema.items.apply(arraySchema, schema);
      obj._inner.children[name] = arraySchema;
    }
    // check plain object type
    else if (utils.isObject(schema)) {
      let objectSchema = utils.applyType('object', ObjectType);
      objectSchema = objectSchema.keys.apply(objectSchema, schema);
      obj._inner.children[name] = objectSchema;
    }
  }

  obj._methods.__validateInnerFlag__ = true;

  return obj;
}, { onlyChainable: true, avoidNoArgCall: true });

utils.addChainableMethod(proto, 'rename', utils.noop, function(oldName, newName) {
  let obj = this.clone();
  obj._inner.renames[oldName] = newName;
  return obj;
}, {
  onlyChainable: true, avoidNoArgCall: true
});

module.exports = ObjectType;
