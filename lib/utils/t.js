'use strict';

const magico = require('magico');
const I18n = require('baiji-i18n');
const config = require('../config');

module.exports = function t(name, options) {
  options = options || {};
  name = name || '';

  options.locale = options.locale || config.defaultLocale;
  options.scope = 'ovt';

  let fallbackName = String(name).split('.')[1] || 'unknown';
  let fallbackPath = `${options.locale}.${options.scope}.any.${fallbackName}`;
  options.defaultValue = magico.get(I18n.translations, fallbackPath);

  return I18n.t(name, options);
};
