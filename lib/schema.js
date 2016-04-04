'use strict';

const _ = require('lodash');
const assert = require('assert');
const utils = require('./utils');
const Errors = require('./errors');
const config = require('./config');

function Schema() {
  this._type = null;
  this._defaultValue = null;
  this.isOvt = true;
  this._description = null;
  this._notes = [];
  this._tags = [];
  this._methods = {};
  this._inner = {};

  this._virtuals = {};
}

Schema.prototype.convert = function(val) { return val; };

Schema.prototype.clone = function() {
  const obj = Object.create(Object.getPrototypeOf(this));

  obj._type = this._type;
  obj._defaultValue = this._defaultValue;
  obj.isOvt = true;
  obj._methods = _.cloneDeep(this._methods);

  obj._description = this._description;
  obj._notes = this._notes.slice();
  obj._tags = this._tags.slice();

  obj._inner = _.cloneDeep(this._inner);

  obj._virtuals = _.cloneDeep(this._virtuals);

  return obj;
};

let proto = Schema.prototype;

proto.toObject = function(options) {
  options = options || {};
  options = _.extend({}, options, config);

  let obj = {
    type: this._type
  };

  if (options.includeVirtuals) {
    _.each(this._virtuals, function(name, method) {
      obj[name] = method;
    });
  }

  return obj;
};

const addCustomMehtod = function addCustomMehtod(ctx, methodName, type) {
  ctx[methodName] = function (fn) {
    assert(_.isFunction(fn), `${utils.obj2Str(fn)} is not a valid function`);

    let name = utils.getName(fn);
    let _fn = utils.tryCatch(type, name, fn);

    const obj = this.clone();
    obj._methods[name] = obj._methods[name] || [];
    obj._methods[name].push({ fn: _fn, args: [], type: type });
    return obj;
  };
};

addCustomMehtod(proto, 'validate', 'validator');
addCustomMehtod(proto, 'sanitize', 'sanitizer');

proto._validate = function _validate(val, state, options) {
  state = state || {};
  options = _.extend({}, options);

  let value = val;
  let errors = state.errors;
  let self = this;

  options.skipSantizers = options.skipSantizers === true;
  options.skipValidators = options.skipValidators === true;
  options.abortEarly = options.abortEarly === true;
  options.convert = options.convert === true;

  let canAbortEarly = function() {
    return options.abortEarly && errors && errors.any();
  };

  let handleResult = function() {
    return { errors: errors && errors.any() ? errors : null, value };
  };

  if (canAbortEarly()) return handleResult();

  errors = new Errors();

  let methods = self._methods;

  // validate when val is `required` or `forbidden` or equal to `undefined`
  let validationNeeded = methods.forbidden || methods.required || !_.isUndefined(val);

  if (validationNeeded) {
    // convert value to specific type
    if (options.convert) {
      try {
        value = self.convert(value);
      } catch (e) {
        value = null;
        errors.add('convertError', e);
      }
    }

    // iterate all methods
    _.some(methods, function(fns, name) {

      // check all validators under `strict` mode
      if (canAbortEarly()) return true;

      // check if need to validate inners
      if (name === '__validateInnerFlag__' && fns) {
        let res = self._validateInner(val, { errors: errors }, options);

        value = res.value;
        errors.concat(res.errors);
      } else {
        _.some(fns, function(fn) {
          if (canAbortEarly()) return true;

          // apply all validators
          if (!options.skipValidators && fn.type === 'validator') {

            let error = utils.invokeMethod(fn, value);

            if (_.isError(error)) errors.add(name, error);
          }
          // apply all sanitizers
          else if (!options.skipSantizers && fn.type === 'sanitizer') {
            value = utils.invokeMethod(fn, value);
          }
        });
      }
    });
  }

  return handleResult();
};

proto._sanitize = function _sanitize(val, obj, options) {
  let value = val;
  options = _.extend({}, options);

  let methods = this._methods;

  _.each(methods, function(method) {
    if (method.type === 'sanitizer') {
      value = utils.invokeMethod(method, value);
    }
  });

  return { errors: null, value };
};

const addDescription = function(desc) {
  if (_.isUndefined(desc)) return this;

  assert(_.isString(desc), 'Description must be a non-empty string');
  const obj = this.clone();
  obj._description = desc;
  return obj;
};

utils.addChainableMethod(proto, 'desc', _.noop, addDescription, { onlyChainable: true });
utils.addChainableMethod(proto, 'description', _.noop, addDescription, { onlyChainable: true });

const addNotes = function(notes) {
  if (_.isUndefined(notes)) return this;

  assert(
    notes && (_.isString(notes) || _.isArray(notes)),
    'Notes must be a non-empty string or array'
  );

  const obj = this.clone();
  obj._notes = obj._notes.concat(notes);
  return obj;
};

utils.addChainableMethod(proto, 'note', _.noop, addNotes, { onlyChainable: true });
utils.addChainableMethod(proto, 'notes', _.noop, addNotes, { onlyChainable: true });

const addTags = function(tags) {
  if (_.isUndefined(tags)) return this;

  assert(
    tags && (_.isString(tags) || _.isArray(tags)),
    'Tags must be a non-empty string or array'
  );

  const obj = this.clone();
  obj._tags = obj._tags.concat(tags);
  return obj;
};

utils.addChainableMethod(proto, 'tag', _.noop, addTags, { onlyChainable: true });
utils.addChainableMethod(proto, 'tags', _.noop, addTags, { onlyChainable: true });

const addVirtual = function(name, value) {
  if (_.isUndefined(name)) return this;

  assert(_.isString(name), `${utils.obj2Str(name)} is not a valid string`);

  const obj = this.clone();
  obj._virtuals[name] = value;
  return obj;
};

utils.addChainableMethod(proto, 'virtual', _.noop, addVirtual, { onlyChainable: true });

module.exports = Schema;
