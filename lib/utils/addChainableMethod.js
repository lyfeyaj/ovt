'use strict';

/*!
 * Module dependencies
 */

const bue = require('bue');
const obj2Str = require('./obj2Str');
const errorableMethodWrapper = require('./errorableMethodWrapper');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
const hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
const excludeNames = /^(?:length|name|arguments|caller)$/;

// Allowed types
const allowedTypes = /^(?:validator|sanitizer)$/;

// Cache `Function` properties
const call  = Function.prototype.call;
const apply = Function.prototype.apply;
const bind  = Function.prototype.bind;

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

module.exports = function(ctx, type, name, method) {
  bue.assert(bue.isObject(ctx), `${obj2Str(ctx)} is not a valid Object`);
  bue.assert(bue.isString(name), `${obj2Str(name)} is not a valid String`);
  bue.assert(bue.isFunction(method), `${obj2Str(method)} is not a valid Function`);

  let _fn = errorableMethodWrapper(type, name, method);

  Object.defineProperty(ctx, name, {
    get: function () {
      let isSpecialType = allowedTypes.test(type);
      let self = isSpecialType ?
                 Object.assign(new ctx.constructor(), this) :
                 method.apply(this, arguments);

      let chainableMethod = function chainableMethod (args, defaultMessage) {
        if (isSpecialType) {
          args = bue.isArray(args) ? args : [args];

          let containerName = `_${type}s`;

          // Initialize `__validators` and `__sanitizers` property
          if (!self[containerName]) {
            self[containerName] = {};
          }

          // Add chainable method
          self[containerName][name] = {
            fn: _fn,
            args: args,
            message: defaultMessage || ''
          };
        } else {
          self = method.apply(self, arguments);
        }

        return self;
      };

      // Use `__proto__` if available
      if (hasProtoSupport) {
        // Inherit all properties from the object by replacing the `Function` prototype
        let prototype = chainableMethod.__proto__ = Object.create(self);
        // Restore the `call` , `apply` and `bind` methods from `Function`
        prototype.call = call;
        prototype.apply = apply;
        prototype.bind = bind;
      }
      // Otherwise, redefine all properties (slow!)
      else {
        let propertyNames = Object.getOwnPropertyNames(ctx);
        propertyNames.forEach(function (propertyName) {
          if (!excludeNames.test(propertyName)) {
            let pd = Object.getOwnPropertyDescriptor(ctx, propertyName);
            Object.defineProperty(chainableMethod, propertyName, pd);
          }
        });
      }

      // call chainableMethod in case of only property is called
      chainableMethod();

      // Assign properties to `chainableMethod`
      Object.assign(chainableMethod, self);

      return chainableMethod;
    },

    configurable: true
  });
};
