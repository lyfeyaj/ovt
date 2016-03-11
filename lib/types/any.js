'use strict';

const bue = require('bue');
const utils = require('../utils');
const Errors = require('../errors');

function AnyType() {
  this._type = 'any';
  this._defaultValue = null;
  this.isOvt = true;
  this._description = null;
  this._notes = [];
  this._tags = [];
  this._validators = {};
  this._sanitizers = {};
  this._inner = {};
}

AnyType.addValidator =  function() {
  let args = Array.from(arguments);
  let method = args.pop();
  args.forEach(function(name) {
    utils.addChainableMethod(AnyType.prototype, 'validator', name, method);
  });
};

AnyType.addSanitizer = function(name, method) {
  utils.addChainableMethod(AnyType.prototype, 'sanitizer', name, method);
};

AnyType.prototype.clone = function() {
  const obj = Object.create(Object.getPrototypeOf(this));

  obj._type = this._type;
  obj._defaultValue = this._defaultValue;
  obj.isOvt = true;
  obj._validators = bue.extend({}, this._valids);
  obj._sanitizers = bue.extend({}, this._invalids);

  obj._description = this._description;
  obj._notes = this._notes.slice();
  obj._tags = this._tags.slice();

  obj._inner = {};
  const inners = Object.keys(this._inner);
  for (let i = 0; i < inners.length; ++i) {
    const key = inners[i];
    obj._inner[key] = this._inner[key] ? this._inner[key].slice() : null;
  }

  return obj;
};

AnyType.prototype.description = function(desc) {
  bue.assert(desc && bue.isString(desc), 'Description must be a non-empty string');
  const obj = this.clone();
  obj._description = desc;
  return obj;
};

AnyType.prototype.desc = AnyType.prototype.description;

AnyType.prototype.notes = function(notes) {
  bue.assert(
    notes && (bue.isString(notes) || bue.isArray(notes)),
    'Notes must be a non-empty string or array'
  );

  const obj = this.clone();
  obj._notes = obj._notes.concat(notes);
  return obj;
};

AnyType.prototype.tags = function(tags) {
  bue.assert(
    tags && (bue.isString(tags) || bue.isArray(tags)),
    'Tags must be a non-empty string or array'
  );

  const obj = this.clone();
  obj._tags = obj._tags.concat(tags);
  return obj;
};

const addCustomMehtod = function addCustomMehtod(ctx, methodName, type) {
  ctx[methodName] = function (fn) {
    bue.assert(bue.isFunction(fn), `${utils.obj2Str(fn)} is not a valid function`);

    let name = utils.getName(fn);
    let _fn = utils.errorableMethodWrapper(type, name, fn);

    const obj = this.clone();
    obj._methods[name] = { fn: _fn, args: [], type: type };
    return obj;
  };
};

addCustomMehtod(AnyType.prototype, 'validate', 'validator');
addCustomMehtod(AnyType.prototype, 'sanitize', 'sanitizer');

AnyType.addValidator('required', function(val) {
  return !bue.isUndefined(val);
});

AnyType.addValidator('optional', function() {});

AnyType.addValidator('forbidden', function(val) {
  return bue.isUndefined(val);
});

AnyType.addValidator('valid', 'equals', 'eq', 'equal', 'only', function() {
  return bue.eq.apply(bue, arguments);
});

AnyType.addValidator('invalid', 'not', 'disallow', function() {
  return !bue.eq.apply(bue, arguments);
});

module.exports = AnyType;
