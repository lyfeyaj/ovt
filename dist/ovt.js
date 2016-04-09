(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.Ovt = require('./lib/ovt');

},{"./lib/ovt":4}],2:[function(require,module,exports){
"use strict";

module.exports = {
  convert: true,
  noDefaults: false,
  abortEarly: false,
  allowUnknown: false,
  includeVirtuals: false
};

},{}],3:[function(require,module,exports){
'use strict';

var utils = require('./utils');

/**
 * A wrapper to collect errors
 * @class
 */
function Errors() {
  Error.call(this);

  this.isOvt = true;
  this.hasErrors = false;
  this.name = 'ValidationError';
  this._errors = {};
}

utils.inherits(Errors, Error);

/**
 * add a new error
 * {
 *   isEmail: ['not a valid email']
 * }
 */
Errors.prototype.add = function (name, msg) {
  this.hasErrors = true;
  msg = msg || this.defaultMessage(name);
  var messages = this._errors[name] || [];
  messages = messages.concat(msg);
  this._errors[name] = messages;
  return this;
};

Errors.prototype.concat = function (errors) {
  var self = this;
  var newErrors = new Errors();
  errors = errors || new Errors();

  if (self.any()) {
    newErrors = newErrors.concat(self);
  }

  if (errors.any()) {
    for (var key in errors._errors) {
      newErrors.hasErrors = true;

      var messages = errors._errors[key];
      newErrors._errors[key] = newErrors._errors[key] || [];
      newErrors._errors[key] = newErrors._errors[key].concat(messages);
    }
  }

  return newErrors;
};

/**
 * To human readable format
 *   example:  email is not a valid; name is required
 */
Errors.prototype.toHuman = function () {
  return this.flatten().join('; ');
};

/**
 * Flatten Error Message
 *   example:  ['email is not a valid', 'name is required']
 */

Errors.prototype.flatten = function () {
  var self = this;
  var errors = [];

  var _loop = function _loop(name) {
    var messages = self._errors[name] || [];
    messages.forEach(function (message) {
      errors.push(message.toString() || self.defaultMessage(name));
    });
  };

  for (var name in self._errors) {
    _loop(name);
  }
  return errors;
};

/**
 * To JSON  format
 */
Errors.prototype.asJSON = function () {
  return this._errors;
};

/**
 * Default message format
 */
Errors.prototype.defaultMessage = function (name) {
  return 'Validation ' + name + 'failed';
};

/**
 * Check if there exists any error
 */
Errors.prototype.any = function () {
  return this.hasErrors;
};

module.exports = Errors;

},{"./utils":24}],4:[function(require,module,exports){
'use strict';

var config = require('./config');
var types = require('./types');
var Errors = require('./errors');
var utils = require('./utils');
var addChainableMethod = utils.addChainableMethod;

var validTypes = Object.keys(types);

var ovt = {};

var _loop = function _loop(name) {
  var Type = types[name];
  addChainableMethod(ovt, name, function () {
    return utils.applyType(name, Type);
  }, { type: 'internal' });
};

for (var name in types) {
  _loop(name);
}

ovt.addMethod = function addMethod(type, name, method, chainableBehaviourOrOptions, options) {
  utils.assert(~validTypes.indexOf(type), type + ' is not a valid schema type.');

  var proto = types[type].prototype;
  addChainableMethod(proto, name, method, chainableBehaviourOrOptions, options);
};

ovt.validate = function validate(obj, schema, optionsOrCallback, callback) {
  utils.assert(schema && schema.isOvt, utils.obj2Str(schema) + ' is not a valid Schema');

  var options = Object.assign({}, config);

  if (utils.isFunction(optionsOrCallback)) {
    callback = optionsOrCallback;
  } else {
    options = Object.assign(options, optionsOrCallback || {});
  }

  options.skipSantizers = options.skipSantizers === true;
  options.skipValidators = options.skipValidators === true;
  options.abortEarly = options.abortEarly === true;
  options.convert = options.convert === true;
  options.noDefaults = options.noDefaults === true;

  var res = schema._validate(obj, {
    parentPath: '',
    key: '',
    parentType: schema._type,
    parentObj: obj,
    original: obj,
    errors: new Errors()
  }, options);

  if (utils.isFunction(callback)) {
    return callback(res.errors, res.value);
  } else {
    return res;
  }
};

ovt.assert = function assert(obj, schema, options) {
  var res = ovt.validate(obj, schema, options);
  if (res.errors) {
    throw res.errors;
  }
};

ovt.ref = function ref(key) {
  return { __key: key, __isRef: true };
};

ovt.config = config;

module.exports = ovt;

},{"./config":2,"./errors":3,"./types":12,"./utils":24}],5:[function(require,module,exports){
'use strict';

var Errors = require('./errors');
var config = require('./config');
var utils = require('./utils');
var addChainableMethod = utils.addChainableMethod;

function Schema() {
  this._type = undefined;
  this._defaultValidator = undefined;
  this._defaultValue = undefined;
  this.isOvt = true;
  this._description = undefined;
  this._notes = [];
  this._tags = [];
  this._methods = {};
  this._inner = {
    inclusions: [],
    requireds: [],
    ordereds: [],
    exclusions: [],
    orderedExclusions: [],
    children: {},
    renames: {}
  };

  this._virtuals = {};
}

Schema.prototype.convert = function (val) {
  return val;
};

Schema.prototype.clone = function () {
  var obj = Object.create(Object.getPrototypeOf(this));
  var self = this;

  obj._type = self._type;
  obj._defaultValidator = self._defaultValidator;
  obj._defaultValue = self._defaultValue;
  obj.isOvt = true;
  obj._methods = {};

  for (var methodName in self._methods) {
    obj._methods[methodName] = utils.cloneObject(self._methods[methodName]);
  }

  obj._description = self._description;
  obj._notes = utils.cloneArray(self._notes);
  obj._tags = utils.cloneArray(self._tags);

  obj._inner = {
    inclusions: utils.cloneArray(self._inner.inclusions),
    requireds: utils.cloneArray(self._inner.requireds),
    ordereds: utils.cloneArray(self._inner.ordereds),
    orderedExclusions: utils.cloneArray(self._inner.orderedExclusions),
    exclusions: utils.cloneArray(self._inner.exclusions),
    children: utils.cloneObject(self._inner.children),
    renames: utils.cloneObject(self._inner.renames)
  };

  obj._virtuals = utils.cloneObject(self._virtuals);

  return obj;
};

var proto = Schema.prototype;

proto.toObject = function (options) {
  var conf = Object.assign({}, config);
  options = Object.assign(conf, options);

  var obj = this.clone();
  var self = this;

  if (options.includeVirtuals) {
    for (var name in self._virtuals) {
      obj._virtuals[name] = self._virtuals[name];
    }
  }

  return obj;
};

var addCustomMehtod = function addCustomMehtod(ctx, methodName, type) {
  ctx[methodName] = function (fn) {
    utils.assert(utils.isFunction(fn), utils.obj2Str(fn) + ' is not a valid function');

    var name = type === 'validator' ? '_customValidators' : '_customSanitizers';
    var _fn = utils.tryCatch(type, name, fn);
    var args = utils.cloneArray(arguments);
    args.shift();

    var obj = this.clone();

    obj._methods[name] = obj._methods[name] || [];
    obj._methods[name].push({ name: name, fn: _fn, args: args, type: type });
    return obj;
  };
};

addCustomMehtod(proto, 'validate', 'validator');
addCustomMehtod(proto, 'sanitize', 'sanitizer');

proto._validate = function _validate(val, state, options) {
  state = state || {};
  options = options || {};

  var self = this;
  var value = val;
  var errors = new Errors();

  var isErrored = function isErrored() {
    return state.hasErrors || errors.any();
  };

  var canAbortEarly = function canAbortEarly() {
    return options.abortEarly && isErrored();
  };

  var handleResult = function handleResult() {
    return { errors: errors.any() ? errors : null, value: value };
  };

  if (canAbortEarly()) return handleResult();

  var methods = self._methods;

  if (!options.noDefaults && utils.isUndefined(value)) value = this._defaultValue;

  // validate when val is `required` or `forbidden` or equal to `undefined`
  var validationNeeded = methods.forbidden || methods.required || !utils.isUndefined(value);

  if (!validationNeeded) return handleResult();

  var currentPath = utils.buildPath(state);
  var currentType = self._type;

  // convert value to specific type
  if (options.convert) {
    try {
      value = utils.isUndefined(value) ? value : self.convert(value);
    } catch (e) {
      value = null;
      errors.add(utils.buildPath({
        parentPath: currentPath,
        parentType: currentType,
        key: 'convertError'
      }), e);
    }
  }

  // Perform renames
  if (value && self._type === 'object') {
    var renames = self._inner.renames;
    value = utils.cloneObject(value);
    for (var oldName in renames) {
      var newName = renames[oldName];
      if (oldName in value) {
        value[newName] = value[oldName];
        delete value[oldName];
      }
    }
  }

  for (var name in methods) {
    // check all validators under `strict` mode
    if (canAbortEarly()) break;

    var fns = methods[name];

    // check if need to validate inners
    if (name === '__validateInnerFlag__' && fns) {
      var res = self._validateInner(value, {
        // original state
        original: state.original,

        // changed state
        key: '',
        parentPath: currentPath,
        parentType: currentType,
        parentObj: value,
        hasErrors: isErrored()
      }, options);

      value = res.value;
      errors = errors.concat(res.errors);
    } else {
      for (var mi = 0; mi < fns.length; mi++) {
        if (canAbortEarly()) break;

        var fn = fns[mi];

        var isValidator = fn.type === 'validator';
        var isSanitizer = fn.type === 'sanitizer';

        if (isValidator && options.skipValidators) break;
        if (isSanitizer && options.skipSantizers) break;
        if (!isValidator && !isSanitizer) break;

        var _res = utils.invokeMethod(fn, value, {
          // original state
          parentType: state.parentType,
          parentObj: state.parentObj,
          original: state.original,

          // changed state
          parentPath: currentPath,
          key: name,
          hasErrors: isErrored()
        });

        if (isValidator) {
          if (utils.isError(_res)) {
            var path = utils.buildPath({ parentPath: currentPath, parentType: currentType, key: name });
            errors.add(path, _res);
          }
        } else {
          value = _res;
        }
      }
    }
  }

  return handleResult();
};

var addDescription = function addDescription(desc) {
  if (utils.isUndefined(desc)) return this;

  utils.assert(utils.isString(desc), 'Description must be a non-empty string');
  var obj = this.clone();
  obj._description = desc;
  return obj;
};

addChainableMethod(proto, 'desc', utils.noop, addDescription, {
  onlyChainable: true,
  avoidNoArgCall: true
});
addChainableMethod(proto, 'description', utils.noop, addDescription, {
  onlyChainable: true,
  avoidNoArgCall: true
});

var addNotes = function addNotes(notes) {
  if (utils.isUndefined(notes)) return this;

  utils.assert(notes && (utils.isString(notes) || Array.isArray(notes)), 'Notes must be a non-empty string or array');

  var obj = this.clone();
  obj._notes = obj._notes.concat(notes);
  return obj;
};

addChainableMethod(proto, 'note', utils.noop, addNotes, {
  onlyChainable: true,
  avoidNoArgCall: true
});
addChainableMethod(proto, 'notes', utils.noop, addNotes, {
  onlyChainable: true,
  avoidNoArgCall: true
});

var addTags = function addTags(tags) {
  if (utils.isUndefined(tags)) return this;

  utils.assert(tags && (utils.isString(tags) || Array.isArray(tags)), 'Tags must be a non-empty string or array');

  var obj = this.clone();
  obj._tags = obj._tags.concat(tags);
  return obj;
};

addChainableMethod(proto, 'tag', utils.noop, addTags, {
  onlyChainable: true,
  avoidNoArgCall: true
});
addChainableMethod(proto, 'tags', utils.noop, addTags, {
  onlyChainable: true,
  avoidNoArgCall: true
});

var addVirtual = function addVirtual(name, value) {
  if (utils.isUndefined(name)) return this;

  utils.assert(utils.isString(name), utils.obj2Str(name) + ' is not a valid string');

  var obj = this.clone();
  obj._virtuals[name] = value;
  return obj;
};

addChainableMethod(proto, 'virtual', utils.noop, addVirtual, {
  onlyChainable: true,
  avoidNoArgCall: true
});

var addDefault = function addDefault(value) {
  var obj = this.clone();
  obj._defaultValue = value;
  return obj;
};

addChainableMethod(proto, 'default', utils.noop, addDefault, {
  onlyChainable: true
});

module.exports = Schema;

},{"./config":2,"./errors":3,"./utils":24}],6:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var addChainableMethod = utils.addChainableMethod;
var Schema = require('../schema');

function AnyType() {
  Schema.call(this);

  this._type = 'any';
}

utils.inherits(AnyType, Schema);

var proto = AnyType.prototype;

proto.convert = function (val) {
  return val;
};

addChainableMethod(proto, 'required', function (val) {
  return !utils.isUndefined(val);
}, function () {
  var obj = this.clone();
  delete obj._methods.optional;
  delete obj._methods.forbidden;
  return obj;
});

addChainableMethod(proto, 'optional', utils.noop, function () {
  var obj = this.clone();
  delete obj._methods.required;
  delete obj._methods.forbidden;
  return obj;
});

addChainableMethod(proto, 'forbidden', function (val) {
  return utils.isUndefined(val);
}, function () {
  var obj = this.clone();
  delete obj._methods.required;
  delete obj._methods.optional;
  return obj;
});

var validateWhitelist = function validateWhitelist() {
  var args = utils.cloneArray(arguments);
  var val = args.shift();
  args = utils.parseArg(args);
  return !! ~args.indexOf(val);
};

addChainableMethod(proto, 'valid', validateWhitelist);
addChainableMethod(proto, 'only', validateWhitelist);
addChainableMethod(proto, 'whitelist', validateWhitelist);
addChainableMethod(proto, 'oneOf', validateWhitelist);

var validateEqual = function validateEqual(value, other) {
  return value === other || value !== value && other !== other;
};

addChainableMethod(proto, 'equals', validateEqual);
addChainableMethod(proto, 'eq', validateEqual);
addChainableMethod(proto, 'equal', validateEqual);

var validateInvalid = function validateInvalid() {
  return !validateWhitelist.apply(this, arguments);
};

addChainableMethod(proto, 'invalid', validateInvalid);
addChainableMethod(proto, 'not', validateInvalid);
addChainableMethod(proto, 'disallow', validateInvalid);
addChainableMethod(proto, 'blacklist', validateInvalid);

module.exports = AnyType;

},{"../schema":5,"../utils":24}],7:[function(require,module,exports){
'use strict';

var AnyType = require('./any');
var Errors = require('../errors');
var utils = require('../utils');
var addChainableMethod = utils.addChainableMethod;

function ArrayType() {
  AnyType.call(this);

  this._type = 'array';
  this._defaultValidator = 'isArray';

  this._inner.inclusions = [];
  this._inner.requireds = [];
  this._inner.ordereds = [];
  this._inner.orderedExclusions = [];
  this._inner.exclusions = [];
}

utils.inherits(ArrayType, AnyType);

var proto = ArrayType.prototype;

proto.convert = function (val) {
  return utils.castArray(val);
};

proto._validateInner = function (val, state, options) {
  options = options || {};
  var errors = new Errors();
  var value = val.slice();
  var self = this;

  var isErrored = function isErrored() {
    return state.hasErrors || errors.any();
  };

  var canAbortEarly = function canAbortEarly() {
    return options.abortEarly && isErrored();
  };

  var handleResult = function handleResult() {
    return { errors: errors.any() ? errors : null, value: value };
  };

  if (canAbortEarly()) return handleResult();

  var stateBuilder = function stateBuilder() {
    return {
      // original state
      key: state.key,
      original: state.original,
      parentObj: state.parentObj,
      parentType: state.parentType,
      parentPath: state.parentPath,

      // changed state
      hasErrors: isErrored()
    };
  };

  var exclusions = self._inner.exclusions;
  var requireds = utils.cloneArray(self._inner.requireds);
  var inclusions = utils.cloneArray(self._inner.inclusions).concat(requireds);
  var ordereds = self._inner.ordereds;
  var orderedExclusions = self._inner.orderedExclusions;

  var parentPath = utils.buildPath(state);

  value = (value || []).map(function (item, vi) {

    if (canAbortEarly()) return item;

    var currentPath = utils.buildPath({
      parentType: state.parentType,
      parentPath: parentPath,
      key: vi
    });

    // Validate exclusions
    for (var ei = 0; ei < exclusions.length; ei++) {
      if (canAbortEarly()) break;

      var exclusion = exclusions[ei];

      var res = exclusion._validate(item, stateBuilder(), options);

      if (!res.errors) {
        errors.add(utils.buildPath({
          parentPath: currentPath,
          parentType: self._type,
          key: 'forbidden'
        }), new Error('Forbidden value can\'t be included'));
      }
    }

    if (canAbortEarly()) return item;

    // Validate ordereds
    var ordered = ordereds[vi];
    if (ordered) {
      var _res = ordered._validate(item, stateBuilder(), options);
      item = _res.value;
      errors = errors.concat(_res.errors);
    }

    // Validate exclusion with orders
    var orderedExclusion = orderedExclusions[vi];
    if (orderedExclusion) {
      var _res2 = orderedExclusion._validate(item, stateBuilder(), options);

      if (!_res2.errors) {
        errors.add(utils.buildPath({
          parentPath: currentPath,
          parentType: self._type,
          key: 'forbidden'
        }), new Error('Forbidden value can\'t be included'));
      }
    }

    if (canAbortEarly()) return item;

    // Validate requireds
    var matchRequiredIndex = null;
    for (var ri = 0; ri < requireds.length; ri++) {
      var required = requireds[ri];
      var _res3 = required._validate(item, stateBuilder(), options);
      if (_res3.errors) continue;
      item = _res3.value;
      matchRequiredIndex = ri;
      break;
    }
    if (matchRequiredIndex !== null) requireds.splice(matchRequiredIndex, 1);

    if (canAbortEarly()) return item;

    // Validate inclusions
    var isIncluded = null;
    for (var ii = 0; ii < inclusions.length; ii++) {
      if (canAbortEarly()) break;
      if (isIncluded) break;

      var inclusion = inclusions[ii];
      var _res4 = inclusion._validate(item, stateBuilder(), options);

      if (!_res4.errors) {
        isIncluded = _res4;
      }
    }

    if (isIncluded) {
      item = isIncluded.value;
    } else {
      if (inclusions.length) {
        errors.add(utils.buildPath({
          parentPath: parentPath,
          parentType: self._type,
          key: 'inclusions'
        }), new Error('No valid schema matches'));
      }
    }

    return item;
  });

  if (canAbortEarly()) return handleResult();

  if (requireds.length) {
    var preferedLength = self._inner.requireds.length;
    errors.add(utils.buildPath({
      parentPath: parentPath,
      parentType: self._type,
      key: 'requireds'
    }), new Error(preferedLength + ' elements are required, now is ' + (preferedLength - requireds.length)));
  }

  if (canAbortEarly()) return handleResult();

  // validate additional ordereds
  if (ordereds.length > value.length) {
    for (var oi = value.length; oi < ordereds.length; oi++) {
      var ordered = ordereds[oi];
      if (ordered) {
        var res = ordered._validate(undefined, stateBuilder(), options);
        errors = errors.concat(res.errors);
      }
    }
  }

  return handleResult();
};

addChainableMethod(proto, 'isArray', function (val) {
  return utils.isArray(val);
});

addChainableMethod(proto, 'ordered', utils.noop, function () {
  var obj = this.clone();

  var types = utils.parseArg(arguments);

  types.forEach(function (type, i) {
    utils.assert(type.isOvt, utils.obj2Str(type) + ' is not a valid ovt schema');
    if ('forbidden' in type._methods) {
      obj._inner.orderedExclusions[i] = type.optional;
    } else {
      obj._inner.ordereds[i] = type;
    }
  });

  obj._methods.__validateInnerFlag__ = true;

  return obj;
}, {
  onlyChainable: true,
  avoidNoArgCall: true
});

var addElements = function addElements() {
  var obj = this.clone();

  var types = utils.parseArg(arguments);

  types.forEach(function (type) {
    utils.assert(type.isOvt, utils.obj2Str(type) + ' is not a valid ovt schema');

    if ('required' in type._methods) {
      obj._inner.requireds.push(type);
    } else if ('forbidden' in type._methods) {
      obj._inner.exclusions.push(type.optional());
    } else {
      obj._inner.inclusions.push(type);
    }
  });

  obj._methods.__validateInnerFlag__ = true;

  return obj;
};

addChainableMethod(proto, 'elements', utils.noop, addElements, {
  onlyChainable: true,
  avoidNoArgCall: true
});
addChainableMethod(proto, 'items', utils.noop, addElements, {
  onlyChainable: true,
  avoidNoArgCall: true
});

addChainableMethod(proto, 'isLength', function (val, length) {
  return val.length === length;
});

addChainableMethod(proto, 'maxLength', function (val, maxLength) {
  return val.length <= maxLength;
});

addChainableMethod(proto, 'minLength', function (val, minLength) {
  return val.length >= minLength;
});

module.exports = ArrayType;

},{"../errors":3,"../utils":24,"./any":6}],8:[function(require,module,exports){
'use strict';

var AnyType = require('./any');
var utils = require('../utils');

function BooleanType() {
  AnyType.call(this);

  this._type = 'boolean';
  this._defaultValidator = 'isBoolean';
}

utils.inherits(BooleanType, AnyType);

var proto = BooleanType.prototype;

proto.convert = function (val) {
  return utils.isBoolean(val) ? val : Boolean(val).valueOf();
};

utils.addChainableMethod(proto, 'isBoolean', function (val) {
  return utils.isBoolean(val);
});

module.exports = BooleanType;

},{"../utils":24,"./any":6}],9:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var AnyType = require('./any');

var hasBufferSupported = typeof Buffer !== 'undefined';

function BufferType() {
  AnyType.call(this);

  this._type = 'buffer';
  this._defaultValidator = 'isBuffer';
}

utils.inherits(BufferType, AnyType);

var proto = BufferType.prototype;

proto.convert = function (val) {
  return hasBufferSupported ? val instanceof Buffer ? val : new Buffer(val) : val;
};

utils.addChainableMethod(proto, 'isBuffer', function (val) {
  return hasBufferSupported ? val instanceof Buffer : false;
});

module.exports = BufferType;

},{"../utils":24,"./any":6}],10:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var AnyType = require('./any');

function DateType() {
  AnyType.call(this);

  this._type = 'date';
  this._defaultValidator = 'isDate';
}

utils.inherits(DateType, AnyType);

var proto = DateType.prototype;

proto.convert = function (val) {
  return utils.isDate(val) ? val : new Date(val);
};

utils.addChainableMethod(proto, 'isDate', function (val) {
  return utils.isDate(val);
});

module.exports = DateType;

},{"../utils":24,"./any":6}],11:[function(require,module,exports){
'use strict';

var AnyType = require('./any');
var utils = require('../utils');
var addChainableMethod = utils.addChainableMethod;

function FunctionType() {
  AnyType.call(this);

  this._type = 'function';
  this._defaultValidator = 'isFunction';
}

utils.inherits(FunctionType, AnyType);

var proto = FunctionType.prototype;

proto.convert = function (val) {
  return utils.isFunction(val) ? val : new Function(val);
};

addChainableMethod(proto, 'isFunction', function (val) {
  return utils.isFunction(val);
});

addChainableMethod(proto, 'arity', function (length) {
  return length === arguments.length - 1;
});

addChainableMethod(proto, 'minArity', function (length) {
  return length >= arguments.length - 1;
});

addChainableMethod(proto, 'maxArity', function (length) {
  return length <= arguments.length - 1;
});

module.exports = FunctionType;

},{"../utils":24,"./any":6}],12:[function(require,module,exports){
'use strict';

module.exports = {
  'any': require('./any'),
  'array': require('./array'),
  'string': require('./string'),
  'boolean': require('./boolean'),
  'buffer': require('./buffer'),
  'date': require('./date'),
  'function': require('./function'),
  'number': require('./number'),
  'object': require('./object'),
  'regexp': require('./regexp')
};

},{"./any":6,"./array":7,"./boolean":8,"./buffer":9,"./date":10,"./function":11,"./number":13,"./object":14,"./regexp":15,"./string":16}],13:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var AnyType = require('./any');

function NumberType() {
  AnyType.call(this);

  this._type = 'number';
  this._defaultValidator = 'isNumber';
}

utils.inherits(NumberType, AnyType);

var proto = NumberType.prototype;

proto.convert = function (val) {
  return utils.isNumber(val) ? val : Number(val);
};

utils.addChainableMethod(proto, 'isNumber', function (val) {
  return utils.isNumber(val);
});

module.exports = NumberType;

},{"../utils":24,"./any":6}],14:[function(require,module,exports){
'use strict';

var magico = require('magico');
var AnyType = require('./any');
var Errors = require('../errors');
var utils = require('../utils');
var addChainableMethod = utils.addChainableMethod;

var ArrayType = require('./array');

function ObjectType() {
  AnyType.call(this);

  this._type = 'object';
  this._defaultValidator = 'isObject';

  this._inner.renames = {};
  this._inner.children = {};
}

utils.inherits(ObjectType, AnyType);

var proto = ObjectType.prototype;

proto.convert = function (val) {
  return utils.isObject(val) ? val : new Object(val);
};

proto._validateInner = function (obj, state, options) {
  options = options || {};
  var errors = new Errors();

  var isErrored = function isErrored() {
    return state.hasErrors || errors.any();
  };

  var canAbortEarly = function canAbortEarly() {
    return options.abortEarly && isErrored();
  };

  var handleResult = function handleResult() {
    return { errors: errors.any() ? errors : null, value: obj };
  };

  if (canAbortEarly()) return handleResult();

  var children = this._inner.children;
  var renames = this._inner.renames;

  // Validate inners
  for (var name in children) {
    if (canAbortEarly()) break;

    var type = children[name];
    name = renames[name] ? renames[name] : name;

    var val = magico.get(obj, name);
    var currentPath = utils.buildPath(state);
    var res = type._validate(val, {
      // original state
      original: state.original,
      parentObj: obj,

      // changed state
      parentType: type._type,
      parentPath: currentPath,
      key: name,
      hasErrors: isErrored()
    }, options);

    magico.set(obj, name, res.value);
    errors = errors.concat(res.errors);
  }

  return handleResult();
};

addChainableMethod(proto, 'isObject', function (val) {
  return utils.isObject(val);
});

addChainableMethod(proto, 'add', utils.noop, function (name, schema) {
  utils.assert(utils.isString(name), utils.obj2Str(name) + ' is not a valid string');
  utils.assert(schema.isOvt || utils.isObject(schema), utils.obj2Str(schema) + ' is not a valid object or schema');

  var obj = this.clone();

  obj._inner.children[name] = schema;
  obj._methods.__validateInnerFlag__ = true;

  return obj;
}, { onlyChainable: true, avoidNoArgCall: true });

addChainableMethod(proto, 'keys', utils.noop, function (schemas) {
  schemas = schemas || {};

  utils.assert(utils.isObject(schemas), utils.obj2Str(schemas) + ' is not a valid objecet');
  utils.assert(!schemas.isOvt, utils.obj2Str(schemas) + ' can not be an ovt schema');

  var obj = this.clone();

  for (var name in schemas) {
    var schema = schemas[name] || {};
    utils.assert(schema.isOvt, utils.obj2Str(schema) + ' can must be an ovt schema');

    if (schema.isOvt) {
      obj._inner.children[name] = schema;
    }
    // check array type
    else if (utils.isArray(schema)) {
        var arraySchema = utils.applyType('array', ArrayType);
        arraySchema = arraySchema.items.apply(arraySchema, schema);
        obj._inner.children[name] = arraySchema;
      }
      // check plain object type
      else if (utils.isObject(schema)) {
          var objectSchema = utils.applyType('object', ObjectType);
          objectSchema = objectSchema.keys.apply(objectSchema, schema);
          obj._inner.children[name] = objectSchema;
        }
  }

  obj._methods.__validateInnerFlag__ = true;

  return obj;
}, { onlyChainable: true, avoidNoArgCall: true });

addChainableMethod(proto, 'rename', utils.noop, function (oldName, newName) {
  var obj = this.clone();
  if (utils.isString(newName)) {
    utils.assert(utils.isString(oldName), utils.obj2Str(oldName) + ' is not a valid string');
  }
  if (utils.isString(oldName)) {
    obj._inner.renames[oldName] = newName;
  } else {
    if (utils.isObject(oldName)) {
      obj._inner.renames = Object.assign(obj._inner.renames, oldName);
    }
  }
  return obj;
}, {
  onlyChainable: true, avoidNoArgCall: true
});

module.exports = ObjectType;

},{"../errors":3,"../utils":24,"./any":6,"./array":7,"magico":42}],15:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var AnyType = require('./any');

function RegExpType() {
  AnyType.call(this);

  this._type = 'regexp';
  this._defaultValidator = 'isRegExp';
}

utils.inherits(RegExpType, AnyType);

var proto = RegExpType.prototype;

proto.convert = function (val) {
  return utils.isRegExp(val) ? val : new RegExp(val);
};

utils.addChainableMethod(proto, 'isRegExp', function (val) {
  return utils.isRegExp(val);
});

module.exports = RegExpType;

},{"../utils":24,"./any":6}],16:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var AnyType = require('./any');

function StringType() {
  AnyType.call(this);

  this._type = 'string';
  this._defaultValidator = 'isString';
}

utils.inherits(StringType, AnyType);

var proto = StringType.prototype;

proto.convert = function (val) {
  return utils.isString(val) ? val : String(val);
};

utils.addChainableMethod(proto, 'isString', function (val) {
  return utils.isString(val);
});

module.exports = StringType;

},{"../utils":24,"./any":6}],17:[function(require,module,exports){
'use strict';

/*!
 * Module dependencies
 */

var obj2Str = require('./obj2Str');
var tryCatch = require('./tryCatch');
var cloneArray = require('./cloneArray');
var isString = require('./isString');
var isFunction = require('./isFunction');
var isObject = require('./isObject');
var cloneObject = require('./cloneObject');
var assert = require('./assert');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
var hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
var excludeNames = /^(?:length|name|arguments|caller)$/;

// Cache `Function` properties
var call = Function.prototype.call;
var apply = Function.prototype.apply;
var bind = Function.prototype.bind;

/**
 * ### addChainableMethod (ctx, type, name, method)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(ovt.internals.String, 'validator', 'required', function (str) {
 *       if (!str) return `${str} is required`;
 *     });
 *
 * Can also be accessed directly from `ovt.Schema`.
 *
 *     ovt.Schema.addChainableMethod('validator', 'isEmail', fn);
 *
 * The result can then be used as both a method that can be executing,
 * or as a language chain.
 *
 *     ovt.string.required.isEmail;
 *     ovt.string.required.isEmail();
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} type of method to add
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainableBehaviour, options) {
  assert(isObject(ctx), obj2Str(ctx) + ' is not a valid Object');
  assert(isString(name), obj2Str(name) + ' is not a valid String');
  assert(isFunction(method), obj2Str(method) + ' is not a valid Function');

  options = options || {};

  if (!isFunction(chainableBehaviour)) {
    options = chainableBehaviour || options;
    chainableBehaviour = function chainableBehaviour() {
      return this;
    };
  }

  // whether property can be called as a function, default is `true`
  options.callable = options.callable !== false;

  // assign default type, default is `validator`
  options.type = options.type || 'validator';

  // check if only apply chainableBehaviour, default is `false`
  options.onlyChainable = options.onlyChainable === true;

  // avoid call function with no arguments, default is `false`
  options.avoidNoArgCall = options.avoidNoArgCall === true;

  // whether the method can be overwritten, default is `true`
  options.overwriteable = options.overwriteable === false;

  var defaultFn = tryCatch(options.type, name, method);

  Object.defineProperty(ctx, name, {
    get: function get() {
      var self = void 0;
      var isSpecialType = options.type === 'validator' || options.type === 'sanitizer';
      if (isSpecialType) {
        self = Object.assign(new this.constructor(), this);
      } else {
        self = method.apply(this, arguments);
      }

      var methodIndex = -1;

      var chainableMethod = function chainableMethod(fn) {
        if (options.avoidNoArgCall && arguments.length === 0) return self;

        var _fn = defaultFn;
        var args = cloneArray(arguments);

        // handle method overwritten for validators
        if (options.overwriteable && options.type === 'validator' && isFunction(fn)) {
          _fn = tryCatch(options.type, name, fn);
          args.shift();
        }

        self = chainableBehaviour.apply(self, arguments);

        if (isSpecialType) {
          if (!options.onlyChainable) {
            // Initialize `_methods` property
            if (!self._methods) {
              self._methods = {};
            }
            // Or, clone methods
            else {
                self._methods = cloneObject(self._methods);
              }

            // Add chainable method
            if (self._methods[name]) {
              self._methods[name] = cloneArray(self._methods[name]);
            } else {
              self._methods[name] = [];
            }
            var _method = { name: name, fn: _fn, args: args, type: options.type };
            if (~methodIndex) {
              self._methods[name][methodIndex] = _method;
            } else {
              methodIndex = self._methods[name].length;
              self._methods[name].push(_method);
            }
          }
        } else {
          self = method.apply(self, arguments);
        }

        return self;
      };

      // call chainableMethod in case of only property is called
      chainableMethod();

      if (options.callable) {
        // Use `__proto__` if available
        if (hasProtoSupport) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = chainableMethod.__proto__ = Object.create(self);
          // Restore the `call` , `apply` and `bind` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
          prototype.bind = bind;
        }
        // Otherwise, redefine all properties (slow!)
        else {
            var propertyNames = Object.getOwnPropertyNames(ctx);
            propertyNames.forEach(function (propertyName) {
              if (!excludeNames.test(propertyName)) {
                var pd = Object.getOwnPropertyDescriptor(ctx, propertyName);
                Object.defineProperty(chainableMethod, propertyName, pd);
              }
            });
          }

        Object.assign(chainableMethod, self);

        return chainableMethod;
      } else {
        return self;
      }
    },

    configurable: true
  });
};

},{"./assert":19,"./cloneArray":22,"./cloneObject":23,"./isFunction":31,"./isObject":33,"./isString":36,"./obj2Str":39,"./tryCatch":41}],18:[function(require,module,exports){
'use strict';

module.exports = function (name, Type) {
  var instance = new Type();
  return instance._defaultValidator ? instance[instance._defaultValidator] : instance;
};

},{}],19:[function(require,module,exports){
'use strict';

module.exports = function ok(condition, message) {
  if (!condition) {
    var error = new Error(message);
    error.name = 'AssertionError';
    throw error;
  }
};

},{}],20:[function(require,module,exports){
'use strict';

module.exports = function buildPath(state) {
  var key = state.key;
  var parentPath = state.parentPath || '';
  if (key === null || key === undefined || key !== key) return parentPath;

  if (state.parentType === 'array' && Number.isInteger(key)) {
    return parentPath + '[' + key + ']';
  } else {
    if (key === '') {
      return parentPath;
    } else {
      return parentPath ? parentPath + '.' + key : key;
    }
  }
};

},{}],21:[function(require,module,exports){
'use strict';

var isArray = require('./isArray');

module.exports = function castArray() {
  if (!arguments.length) {
    return [];
  }
  var value = arguments[0];
  return isArray(value) ? value : [value];
};

},{"./isArray":27}],22:[function(require,module,exports){
'use strict';

module.exports = function cloneArray(array) {
  array = array || [];
  var newArray = new Array(array.length);
  var i = array.length;
  while (i--) {
    newArray[i] = array[i];
  }
  return newArray;
};

},{}],23:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');

module.exports = function cloneObject(val) {
  if (isObject(val)) {
    var Ctor = val.constructor;
    var obj = new Ctor();
    for (var key in val) {
      obj[key] = val[key];
    }
    return val;
  } else {
    return val;
  }
};

},{"./isObject":33}],24:[function(require,module,exports){
'use strict';

/*!
 * No operation
 */

exports.noop = require('./noop');

/*!
 * Assert
 */

exports.assert = require('./assert');

/*!
 * inherits
 */

exports.inherits = require('./inherits');

/*!
 * error check
 */

exports.isError = require('./isError');

/*!
 * undefined check
 */

exports.isUndefined = require('./isUndefined');

/*!
 * array check
 */

exports.isArray = require('./isArray');

/*!
 * boolean check
 */

exports.isBoolean = require('./isBoolean');

/*!
 * date check
 */

exports.isDate = require('./isDate');

/*!
 * function check
 */

exports.isFunction = require('./isFunction');

/*!
 * number check
 */

exports.isNumber = require('./isNumber');

/*!
 * object check
 */

exports.isObject = require('./isObject');

/*!
 * regexp check
 */

exports.isRegExp = require('./isRegExp');

/*!
 * string check
 */

exports.isString = require('./isString');

/*!
 * cast to array
 */

exports.castArray = require('./castArray');

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('./addChainableMethod');

/*!
 * Object to string utility
 */

exports.obj2Str = require('./obj2Str');

/*!
 * Wrapper method with proper error message
 */

exports.tryCatch = require('./tryCatch');

/*!
 * Invode method
 */

exports.invokeMethod = require('./invokeMethod');

/*!
 * Parse arguments
 */

exports.parseArg = require('./parseArg');

/*!
 * Apply type with default behaviours
 */

exports.applyType = require('./applyType');

/*!
 * Build path
 */

exports.buildPath = require('./buildPath');

/*!
 * Array fast clone
 */

exports.cloneArray = require('./cloneArray');

/*!
 * Object fast clone
 */

exports.cloneObject = require('./cloneObject');

/*!
 * Check if a object is reference
 */

exports.isRef = require('./isRef');

},{"./addChainableMethod":17,"./applyType":18,"./assert":19,"./buildPath":20,"./castArray":21,"./cloneArray":22,"./cloneObject":23,"./inherits":25,"./invokeMethod":26,"./isArray":27,"./isBoolean":28,"./isDate":29,"./isError":30,"./isFunction":31,"./isNumber":32,"./isObject":33,"./isRef":34,"./isRegExp":35,"./isString":36,"./isUndefined":37,"./noop":38,"./obj2Str":39,"./parseArg":40,"./tryCatch":41}],25:[function(require,module,exports){
'use strict';

module.exports = function inherits(ctor, superCtor) {

  if (ctor === undefined || ctor === null) throw new TypeError('The constructor to `inherits` must not be null or undefined.');

  if (superCtor === undefined || superCtor === null) throw new TypeError('The super constructor to `inherits` must not be null or undefined.');

  if (superCtor.prototype === undefined) throw new TypeError('The super constructor to `inherits` must have a prototype.');

  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

},{}],26:[function(require,module,exports){
'use strict';

var cloneArray = require('./cloneArray');
var isRef = require('./isRef');
var magico = require('magico');

module.exports = function invokeMethod(method, val, state) {
  state = state || {
    parentPath: '',
    key: '',
    parentType: 'any',
    parentObj: undefined,
    original: undefined,
    hasErrors: false
  };

  var args = cloneArray(method.args || []);

  args = args.map(function (arg) {
    if (isRef(arg)) {
      return magico.get(state.parentObj, arg.__key);
    } else {
      return arg;
    }
  });

  args.unshift(val);

  return method.fn.apply(state, args);
};

},{"./cloneArray":22,"./isRef":34,"magico":42}],27:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var arrayTag = '[object Array]';

var nativeIsArray = Array.isArray;

module.exports = function isArray(value) {
  return nativeIsArray ? nativeIsArray(value) : isObject(value) && obj2Str(value) === arrayTag;
};

},{"./isObject":33,"./obj2Str":39}],28:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var booleanTag = '[object Boolean]';

module.exports = function isBoolean(value) {
  if (typeof value === 'boolean') return true;
  return isObject(value) && obj2Str(value) === booleanTag;
};

},{"./isObject":33,"./obj2Str":39}],29:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var DateTag = '[object Date]';

module.exports = function isDate(value) {
  return isObject(value) && obj2Str(value) === DateTag;
};

},{"./isObject":33,"./obj2Str":39}],30:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var obj2Str = require('./obj2Str');
var errorTag = '[object Error]';

module.exports = function isError(value) {
  var isObjectLike = !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
  if (!isObjectLike) return false;
  return obj2Str(value) === errorTag || typeof value.message === 'string' && typeof value.name === 'string';
};

},{"./obj2Str":39}],31:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');

var FunctionTag = '[object Function]';
var GeneratorTag = '[object GeneratorFunction]';

module.exports = function isFunction(value) {
  var tag = isObject(value) ? obj2Str(value) : '';
  return tag === FunctionTag || tag === GeneratorTag;
};

},{"./isObject":33,"./obj2Str":39}],32:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var NumberTag = '[object Number]';

module.exports = function isNumber(value) {
  return typeof value === 'number' || isObject(value) && obj2Str(value) === NumberTag;
};

},{"./isObject":33,"./obj2Str":39}],33:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

module.exports = function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return !!value && (type === 'object' || type === 'function');
};

},{}],34:[function(require,module,exports){
"use strict";

module.exports = function isRef(obj) {
  return obj && obj.__isRef === true;
};

},{}],35:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var RegExpTag = '[object RegExp]';

module.exports = function isRegExp(value) {
  return isObject(value) && obj2Str(value) === RegExpTag;
};

},{"./isObject":33,"./obj2Str":39}],36:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var isArray = require('./isArray');
var obj2Str = require('./obj2Str');
var stringTag = '[object String]';

module.exports = function isString(value) {
  return typeof value === 'string' || !isArray(value) && isObject(value) && obj2Str(value) === stringTag;
};

},{"./isArray":27,"./isObject":33,"./obj2Str":39}],37:[function(require,module,exports){
"use strict";

module.exports = function isUndefined(value) {
  return value === undefined;
};

},{}],38:[function(require,module,exports){
"use strict";

module.exports = function noop() {
  // No operation;
};

},{}],39:[function(require,module,exports){
"use strict";

module.exports = function (obj) {
  return Object.prototype.toString.call(obj);
};

},{}],40:[function(require,module,exports){
'use strict';

var cloneArray = require('./cloneArray');
var isArray = require('./isArray');

module.exports = function parseArg(args) {
  if (args && args.length) {
    if (args.length === 1 && isArray(args[0])) {
      return args[0];
    } else {
      return cloneArray(args);
    }
  }

  return [];
};

},{"./cloneArray":22,"./isArray":27}],41:[function(require,module,exports){
'use strict';

var isError = require('./isError');
var isString = require('./isString');

// Wrapper method with proper error message
module.exports = function tryCatch(type, name, method) {
  return function () {
    var result = null;

    try {
      result = method.apply(this, arguments);
    } catch (e) {
      result = e;
    }

    if (type !== 'validator') return result;

    // return Error directly
    if (isError(result)) {
      return result;
    }
    // wrap a string with Error
    else if (isString(result)) {
        new Error(result);
      }
      // return Error of default message when validation failed
      else if (result === false) {
          var message = 'validation failed';
          return new Error(message);
        }
  };
};

},{"./isError":30,"./isString":36}],42:[function(require,module,exports){
'use strict';

/*!
 * Module variables
 */

var SEPERATOR = /\[['"]?|\.|['"]?\]/;
var STRING_DETECTOR = '[object String]';
var ARRAY_DETECTOR = '[object Array]';

/*!
 * Check if an object is a string
 */

function isString (str) {
  return Object.prototype.toString.call(str) === STRING_DETECTOR;
}

/*!
 * Check if an object is an array
 */

function isArray (str) {
  return Object.prototype.toString.call(str) === ARRAY_DETECTOR;
}

/*!
 * Check if a string is a positive integer
 */

function isPositiveInteger (obj) {
  if (isString(obj)) {
    return /^(0|[1-9]\d*)$/.test(obj);
  } else {
    return (obj >>> 0) === obj;
  }
}

function isNil (obj) {
  return obj !== obj || obj === undefined || obj === null;
}

/*!
 * Remove falsy values from an array
 */
function compact (array) {
  array = array || [];
  return array.filter(function(el) {
    return el === 0 || Boolean(el).valueOf();
  });
}

/*!
 * Eval an object for specific action type: `get`, `set`, `remove`, `exists`
 */

function _eval (type, obj, path, value) {
  // Parse string path into an array
  if (isString(path)) {
    path = compact(path.trim().split(SEPERATOR));
  }

  // Return if path is invalid
  if (!path || !isArray(path) || path.length === 0) return;

  // Copy array for future use
  path = path.slice();

  // Shift the first path value
  var key = path.shift();

  // Return `undefined` if obj is `NaN` or `null` or `undefined`
  if (isNil(obj)) return;

  switch (type) {
    case 'get':
      if (path.length === 0) {
        return obj[key];
      }
      break;
    case 'set':
      if (path.length) {
        if (typeof obj[key] === 'undefined') {
          obj[key] = {};
        }

        if (isNil(obj[key])) return false;
      } else {
        obj[key] = value;
        return true;
      }
      break;
    case 'remove':
      if (path.length === 0) {

        if (isArray(obj) && isPositiveInteger(key)) {
          key = Number(key);

          if (obj.length - 1 < key) return false;

          obj.splice(key, 1);
        } else {
          if (!Object.hasOwnProperty.call(obj, key)) return false;

          delete obj[key];
        }

        return true;
      }
      break;
    case 'exists':
      if (path.length === 0) {
        if (isArray(obj) && isPositiveInteger(key)) {
          key = Number(key);
          return obj.length - 1 >= key;
        } else {
          return Object.hasOwnProperty.call(obj, key);
        }
      }
      break;
    default:
      return;
  }

  return _eval(type, obj[key], path, value);
}

/**
 * ### Magico (object)
 *
 * @param {Object} object to which will be wrapped for later use
 * @name Magico
 * @api public
 */
function Magico(obj) {
  this._obj = obj;
}

/**
 * ### Magico.wrap (object)
 *
 * @param {Object} object to which will be wrapped for later use
 * @name Magico.wrap
 * @return Magico instance
 * @api public
 */

Magico.wrap = function (obj) {
  return new Magico(obj);
};

/**
 * ### Magico.set (object, path, value)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be set
 * @name Magico.set
 * @return {Boolean} whether the value is set or not
 * @api public
 */

Magico.set = function (obj, path, value) {
  return !!_eval('set', obj, path, value);
};

/**
 * ### Magico.get (object, path)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @name Magico.get
 * @return {Object} the value of properties
 * @api public
 */

Magico.get = function (obj, path) {
  return _eval('get', obj, path);
};

/**
 * ### Magico.exists (object, path)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @name Magico.exists
 * @return {Boolean} the value of path exists or not
 * @api public
 */

Magico.exists = function (obj, path) {
  return !!_eval('exists', obj, path);
};

/**
 * ### Magico.remove (object, path, value)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be remove
 * @name Magico.remove
 * @return {Boolean} whether the value is removed or not
 * @api public
 */

Magico.remove = function (obj, path) {
  return !!_eval('remove', obj, path);
};

/**
 * ### Magico.prototype.set (path, value)
 *
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be set
 * @name Magico.prototype.set
 * @return {Boolean} whether the value is set or not
 * @api public
 */

Magico.prototype.set = function (path, value) {
  return Magico.set(this._obj, path, value);
};

/**
 * ### Magico.prototype.get (path)
 *
 * @param {String | Array} path to which will use to access object
 * @name Magico.prototype.get
 * @return {Object} the value of properties
 * @api public
 */

Magico.prototype.get = function (path) {
  return Magico.get(this._obj, path);
};

/**
 * ### Magico.prototype.exists (path)
 *
 * @param {String | Array} path to which will use to access object
 * @name Magico.prototype.exists
 * @return {Boolean} the value of path exists or not
 * @api public
 */

Magico.prototype.exists = function (path) {
  return Magico.exists(this._obj, path);
};

/**
 * ### Magico.prototype.remove (path, value)
 *
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be remove
 * @name Magico.prototype.remove
 * @return {Boolean} whether the value is removed or not
 * @api public
 */

Magico.prototype.remove = function (path) {
  return Magico.remove(this._obj, path);
};

/**
 * ### Magico.prototype.toObject
 *
 * @name Magico.prototype.toObject
 * @return {Object} the changed object
 * @api public
 */

Magico.prototype.toObject = function () {
  return this._obj;
};

// Export Magico function
module.exports = Magico;

},{}]},{},[1]);
