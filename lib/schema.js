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

  this._virtualMethods = {};
}

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

  obj._virtualMethods = _.cloneDeep(this._virtualMethods);

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

Schema.prototype.virtual = function(name, method) {
  assert(_.isString(name), `${utils.obj2Str(name)} is not a valid string`);
  assert(_.isFunction(name), `${utils.obj2Str(method)} is not a valid function`);

  const obj = this.clone();
  obj._virtualMethods[name] = method;
  return obj;
};

Schema.prototype.toObject = function(options) {
  options = options || {};
  options = _.extend({}, options, config);

  let obj = {
    type: this._type
  };

  if (options.includeVirtuals) {
    _.each(this._virtualMethods, function(name, method) {
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
    obj._methods[name] = { fn: _fn, args: [], type: type };
    return obj;
  };
};

addCustomMehtod(Schema.prototype, 'validate', 'validator');
addCustomMehtod(Schema.prototype, 'sanitize', 'sanitizer');

Schema.prototype._validate = function _validate(val, obj, options) {
  let value = val;
  let errors = new Errors();

  options = _.extend({}, options);

  let methods = this._methods;

  _.each(methods, function(method, name) {
    var args = (method.args || []).slice();

    args.unshift(value);

    // apply all validators
    if (method.type === 'validator') {
      // check all validators under `strict` mode
      if (!options.strict && errors.any()) return;

      let error = method.fn.apply(method, args);

      if (_.isError(error)) errors.add(name, error);

    }
    // apply all sanitizers
    else if (method.type === 'sanitizer') {
      value = method.fn.apply(method, args);
    }
  });

  return { errors, value };
};

module.exports = Schema;
