'use strict';

/*!
 * Module dependencies
 */

const obj2Str = require('./obj2Str');
const noop = require('./noop');
const cloneArray = require('./cloneArray');
const parseArg = require('./parseArg');
const isString = require('./isString');
const isFunction = require('./isFunction');
const isObject = require('./isObject');
const isLocale = require('./isLocale');
const assert = require('./assert');
const isRef = require('./isRef');
const Method = require('../method');

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
 * @param {String} type of which method will be added
 * @param {String} name of method to add
 * @param {Object} options
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

function addChainableMethod(ctx, type, name, options) {
  options = options || {};

  assert(isObject(ctx), `${obj2Str(ctx)} is not a valid Object`);
  assert(isString(name), `${obj2Str(name)} is not a valid String`);

  const hasChainingBehaviour = isFunction(options.chainingBehaviour);
  const hasMethod = isFunction(options.method);
  const hasParseArgs = isFunction(options.parseArgs);

  assert(
    hasMethod || hasChainingBehaviour,
    `Invalid chainable method \`${name}\`, options method or chainingBehaviour should be provided!`
  );

  // assign default type, default is `validator`
  options.type = options.type || 'validator';

  // whether the method can be overwrite, default is `true`
  options.allowMethodOverwrite = options.allowMethodOverwrite === false;

  // Default function
  const defaultFn = options.method || noop;

  // Add cooresponding method
  ctx[name] = function(fn) {
    let self = this.clone();
    let args = cloneArray(arguments);

    // Apply parseArgs
    if (hasParseArgs) {
      args = options.parseArgs.apply(null, args);
    }

    // Apply chainable behaviour
    if (hasChainingBehaviour) {
      self = options.chainingBehaviour.apply(self, args) || self;
    }

    // Add method
    if (hasMethod) {
      let _fn = defaultFn;

      // handle method overwritten for validators
      // for example: ovt.string.isEmail(function(val) { /* your custom validator */ });
      if (options.allowMethodOverwrite && options.type === 'validator' && isFunction(fn)) {
        _fn = fn;
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

      self._methods[name] = new Method({
        name: name,
        fn: _fn,
        args: args,
        refs: refs,
        type: options.type,
        path: `${type}.${name}`,
        locale: locale
      });
    }

    return self;
  };
}

module.exports = function chainable(proto, type) {
  return function chainableProxy() {
    let args = parseArg(arguments);
    let options = args.pop();
    args.forEach(function(name) {
      addChainableMethod(proto, type, name, options);
    });
  };
};
