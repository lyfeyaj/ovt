'use strict';

/*!
 * Module dependencies
 */

const obj2Str = require('./obj2Str');
const noop = require('./noop');
const tryCatch = require('./tryCatch');
const cloneArray = require('./cloneArray');
const parseArg = require('./parseArg');
const isString = require('./isString');
const isFunction = require('./isFunction');
const isObject = require('./isObject');
const isLocale = require('./isLocale');
const assert = require('./assert');
const isRef = require('./isRef');

/**
 * ### addChainableMethod (ctx, name, options)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(StringType.prototype, 'isEmail', function (val) {
 *       if (!val) return `${val} is not a valid email`;
 *     }, null, { type: 'validator' });
 *
 * The result can then be used as both a method that can be executing,
 * or as a language chain.
 *
 *     ovt.string().required().isEmail();
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Object} options
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

function addChainableMethod(ctx, name, options) {
  options = options || {};

  assert(isObject(ctx), `${obj2Str(ctx)} is not a valid Object`);
  assert(isString(name), `${obj2Str(name)} is not a valid String`);

  const hasChainingBehaviour = isFunction(options.chainingBehaviour);
  const hasMethod = isFunction(options.method);

  assert(
    hasMethod || hasChainingBehaviour,
    `Invalid chainable method \`${name}\`, options method or chainingBehaviour should be provided!`
  );

  // assign default type, default is `validator`
  options.type = options.type || 'validator';

  // whether the method can be overwrite, default is `true`
  options.allowMethodOverwrite = options.allowMethodOverwrite === false;

  // Search method
  const method = options.method || noop;

  // Wrap method by catchable function
  const defaultFn = tryCatch(options.type, name, method);

  // TODO: detect name conflict
  // Add cooresponding method
  ctx[name] = function(fn) {
    let self = this.clone();

    // Apply chainable behaviour
    if (hasChainingBehaviour) {
      self = options.chainingBehaviour.apply(self, arguments) || self;
    }

    // Add method
    if (hasMethod) {
      let _fn = defaultFn;
      let args = cloneArray(arguments);

      // handle method overwritten for validators
      // for example: ovt.string.isEmail(function(val) { /* your custom validator */ });
      if (options.allowMethodOverwrite && options.type === 'validator' && isFunction(fn)) {
        _fn = tryCatch(options.type, name, fn);
        args.shift();
      }

      // handle custom locale
      let locale;
      if (isLocale(args[args.length - 1])) locale = args.pop();

      // Analyze references
      let refs = Object.create(null);
      for (let i = 0; i < args.length; i++) {
        if (isRef(args[i])) {
          refs[i] = args[i];
        }
      }

      // Initialize `_methods` property
      if (!self._methods) self._methods = {};
      // if (!self._methods[name]) self._methods[name] = [];

      self._methods[name] = {
        name: name,
        fn: _fn,
        args: args,
        refs: refs,
        type: options.type,
        locale: locale
      };
    }

    return self;
  };
}

module.exports = function chainable(proto) {
  return function chainableProxy() {
    let args = parseArg(arguments);
    let options = args.pop();
    args.forEach(function(name) {
      addChainableMethod(proto, name, options);
    });
  };
};
