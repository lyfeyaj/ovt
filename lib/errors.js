'use strict';

const bue = require('bue');

/**
 * A wrapper to collect errors
 * @class
 */
function Errors() {
  this._errors = {};
}

/**
 * add a new error
 * {
 *   email: { isEmail: ['not a valid email']}
 * }
 */
Errors.prototype.add = function(type, name, msg) {
  msg = msg || this.defaultMessage(type, name);
  let obj = this._errors[type] || [];
  obj[name].push(msg);
  this._errors[type] = obj;
};


/**
 * To human readable format
 *   example:  email is not a valid; name is required
 */
Errors.prototype.toHuman = function() {
  return this.flatten().join('; ');
};

/**
 * Flatten Error Message
 *   example:  ['email is not a valid', 'name is required']
 */

Errors.prototype.flatten = function() {
  let self = this;
  let errors;
  errors = bue.map(self._errors, function(obj, type) {
    let result = bue.map(obj, function(messages, name) {
      return bue.map(messages, function(message) {
        return message.toString() || self.defaultMessage(type, name);
      });
    });
    return bue.flatten(result);
  });
  return bue.flatten(errors);
};

/**
 * To JSON  format
 */
Errors.prototype.asJSON = function() {
  return this._errors;
};

/**
 * Default message format
 */
Errors.prototype.defaultMessage = function(type, name) {
  return `Error ${name} for ${type} occured`;
};

/**
 * Check if there exists any error
 */
Errors.prototype.any = function() {
  return !bue.isEmpty(this._errors);
};
