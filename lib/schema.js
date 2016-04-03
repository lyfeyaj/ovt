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

Schema.prototype.description = Schema.prototype.desc = function(desc) {
  assert(desc && _.isString(desc), 'Description must be a non-empty string');
  const obj = this.clone();
  obj._description = desc;
  return obj;
};

Schema.prototype.notes = Schema.prototype.note = function(notes) {
  assert(
    notes && (_.isString(notes) || _.isArray(notes)),
    'Notes must be a non-empty string or array'
  );

  const obj = this.clone();
  obj._notes = obj._notes.concat(notes);
  return obj;
};

Schema.prototype.tags = Schema.prototype.tag = function(tags) {
  assert(
    tags && (_.isString(tags) || _.isArray(tags)),
    'Tags must be a non-empty string or array'
  );

  const obj = this.clone();
  obj._tags = obj._tags.concat(tags);
  return obj;
};

Schema.prototype.virtual = function(name, value) {
  assert(_.isString(name), `${utils.obj2Str(name)} is not a valid string`);

  const obj = this.clone();
  obj._virtuals[name] = value;
  return obj;
};

Schema.prototype.toObject = function(options) {
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

addCustomMehtod(Schema.prototype, 'validate', 'validator');
addCustomMehtod(Schema.prototype, 'sanitize', 'sanitizer');

Schema.prototype._validate = function _validate(val, state, options) {
  state = state || {};
  options = _.extend({}, options);

  let value = val;
  let errors = state.errors;

  options.skipSantizers = options.skipSantizers === true;
  options.skipValidators = options.skipValidators === true;
  options.abortEarly = options.abortEarly === true;
  options.convert = options.convert === true;

  if (options.convert) {
    value = this.convert(value);
  }

  let canAbortEarly = function() {
    return options.abortEarly && errors && errors.any();
  };

  let handleResult = function() {
    return { errors: errors && errors.any() ? errors : null, value };
  };

  if (canAbortEarly()) return handleResult();

  errors = new Errors();

  let methods = this._methods;

  // validate when val is `required` or `forbidden` or equal to `undefined`
  let validationNeeded = methods.forbidden || methods.required || !_.isUndefined(val);

  if (validationNeeded) {
    _.each(methods, function(fns, name) {

      // check all validators under `strict` mode
      if (canAbortEarly()) return;

      _.each(fns, function(fn) {
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
    });

    if (canAbortEarly()) return handleResult();

    // let inners = this._inner;
    if (~['object', 'array'].indexOf(this._type)) {
      state = { errors: errors };
      let res = this._validateInner(val, state, options);

      value = res.value;
      errors.concat(res.errors);
    }
  }

  return handleResult();
};

Schema.prototype._sanitize = function _sanitize(val, obj, options) {
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

module.exports = Schema;
