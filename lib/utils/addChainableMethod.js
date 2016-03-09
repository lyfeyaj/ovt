/*!
 * Module dependencies
 */

var bue = require('bue');
var obj2Str = require('./obj2Str');
var errorableMethodWrapper = require('./errorableMethodWrapper');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
var hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
var excludeNames = /^(?:length|name|arguments|caller)$/;

// Allowed types
var allowedTypes = /^(?:validator|sanitizer)$/;

// Cache `Function` properties
var call  = Function.prototype.call;
var apply = Function.prototype.apply;
var bind  = Function.prototype.bind;

// Check whether `type` is allowed
var checkType = function checkType(type) {
  var result = !allowedTypes.test(type);
  bue.assert(result, `Unknown type ${type} declared!`);
};

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
  checkType();

  var _fn = errorableMethodWrapper(type, name, method);

  Object.defineProperty(ctx, name, {
    get: function () {
      var self = Object.assign(new ctx.constructor(), this);

      var chainableMethod = function chainableMethod (args, defaultMessage) {
        args = bue.isArray(args) ? args : [args];

        var containerName = `__${type}s`;

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

        return self;
      };

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

      // call chainableMethod in case of only property is called
      chainableMethod();

      // Assign properties to `chainableMethod`
      Object.assign(chainableMethod, self);

      return chainableMethod;
    },

    configurable: true
  });
};
