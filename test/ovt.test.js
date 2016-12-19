'use strict';

const expect = require('chai').expect;
const ovt = require('../');

describe('Ovt', function() {

  describe('constructor()', function() {
    it('should have specified properties', function() {
      expect(ovt).to.have.property('config');
      expect(ovt).to.have.property('Schema');
      expect(ovt).to.have.property('I18n');
      expect(ovt).to.have.property('TYPES');
    });
  });

  describe('parseOptions()', function() {
    it('should return correct options according to passed options', function() {
      expect(ovt.parseOptions({ abortEarly: false })).to.have.property('abortEarly', false);
      expect(ovt.parseOptions({ abortEarly: true })).to.have.property('abortEarly', true);
      expect(ovt.parseOptions({ abortEarly: null })).to.have.property('abortEarly', true);
      expect(ovt.parseOptions({ abortEarly: undefined })).to.have.property('abortEarly', true);
      ovt.config.abortEarly = false;
      expect(ovt.parseOptions({ abortEarly: null })).to.have.property('abortEarly', false);
      expect(ovt.parseOptions({ abortEarly: undefined })).to.have.property('abortEarly', false);
      ovt.config.abortEarly = true;

      expect(ovt.parseOptions({ convert: false })).to.have.property('convert', false);
      expect(ovt.parseOptions({ convert: true })).to.have.property('convert', true);
      expect(ovt.parseOptions({ convert: null })).to.have.property('convert', true);
      expect(ovt.parseOptions({ convert: undefined })).to.have.property('convert', true);
      ovt.config.convert = false;
      expect(ovt.parseOptions({ convert: null })).to.have.property('convert', false);
      expect(ovt.parseOptions({ convert: undefined })).to.have.property('convert', false);
      ovt.config.convert = true;

      expect(ovt.parseOptions({ noDefaults: false })).to.have.property('noDefaults', false);
      expect(ovt.parseOptions({ noDefaults: true })).to.have.property('noDefaults', true);
      expect(ovt.parseOptions({ noDefaults: null })).to.have.property('noDefaults', false);
      expect(ovt.parseOptions({ noDefaults: undefined })).to.have.property('noDefaults', false);
      ovt.config.noDefaults = true;
      expect(ovt.parseOptions({ noDefaults: null })).to.have.property('noDefaults', true);
      expect(ovt.parseOptions({ noDefaults: undefined })).to.have.property('noDefaults', true);
      ovt.config.noDefaults = false;

      expect(ovt.parseOptions({ locale: 'en' })).to.have.property('locale', 'en');
      expect(ovt.parseOptions({ locale: 'zh-CN' })).to.have.property('locale', 'zh-CN');
      expect(ovt.parseOptions({ locale: null })).to.have.property('locale', 'en');
      expect(ovt.parseOptions({ locale: undefined })).to.have.property('locale', 'en');
      ovt.config.defaultLocale = 'zh-CN';
      expect(ovt.parseOptions({ locale: null })).to.have.property('locale', 'zh-CN');
      expect(ovt.parseOptions({ locale: undefined })).to.have.property('locale', 'zh-CN');
      ovt.config.defaultLocale = 'en';

      expect(ovt.parseOptions({ allowUnknown: false })).to.have.property('allowUnknown', false);
      expect(ovt.parseOptions({ allowUnknown: true })).to.have.property('allowUnknown', true);
      expect(ovt.parseOptions({ allowUnknown: null })).to.have.property('allowUnknown', false);
      expect(ovt.parseOptions({ allowUnknown: undefined })).to.have.property('allowUnknown', false);
      ovt.config.allowUnknown = true;
      expect(ovt.parseOptions({ allowUnknown: null })).to.have.property('allowUnknown', true);
      expect(ovt.parseOptions({ allowUnknown: undefined })).to.have.property('allowUnknown', true);
      ovt.config.allowUnknown = false;

      expect(ovt.parseOptions({ stripUnknown: false })).to.have.property('stripUnknown', false);
      expect(ovt.parseOptions({ stripUnknown: true })).to.have.property('stripUnknown', true);
      expect(ovt.parseOptions({ stripUnknown: null })).to.have.property('stripUnknown', false);
      expect(ovt.parseOptions({ stripUnknown: undefined })).to.have.property('stripUnknown', false);
      ovt.config.stripUnknown = true;
      expect(ovt.parseOptions({ stripUnknown: null })).to.have.property('stripUnknown', true);
      expect(ovt.parseOptions({ stripUnknown: undefined })).to.have.property('stripUnknown', true);
      ovt.config.stripUnknown = false;
    });
  });

  describe('addMethod()', function() {
    it('should add method to specific type', function() {
      expect(ovt.string().abc).not.to.be.a.function;
      ovt.addMethod('string', 'abc', { method: function(){} });
      expect(ovt.string().abc).to.be.a.function;
    });
  });

  describe('plugin()', function() {
    it('should invoke plugin fn', function() {
      let opts = { test: 1 };
      let plugin = function(o, options) {
        expect(o).to.be.eq(ovt);
        expect(options).to.be.eq(opts);
      };

      ovt.plugin(plugin, opts);
    });
  });

  describe('ref()', function() {
    it('should return a ref object', function() {
      expect(ovt.ref('name')).to.be.deep.eq({ __key: 'name', __isRef: true });
    });
  });

  describe('isRef()', function() {
    it('should return true if a object is ref', function() {
      expect(ovt.isRef(ovt.ref('name'))).to.be.eq(true);
      expect(ovt.isRef({})).to.be.eq(false);
      expect(ovt.isRef()).to.be.eq(false);
      expect(ovt.isRef('')).to.be.eq(false);
      expect(ovt.isRef(1)).to.be.eq(false);
      expect(ovt.isRef(null)).to.be.eq(false);
    });
  });

  describe('l(), m()', function() {
    it('should return a localized message object', function() {
      expect(ovt.l('is required')).to.be.deep.eq({ __msg: { en: 'is required' }, __isLocale: true });
      expect(ovt.m('is required')).to.be.deep.eq({ __msg: { en: 'is required' }, __isLocale: true });
      expect(ovt.m({ 'zh-CN': '不能为空' })).to.be.deep.eq({ __msg: { 'zh-CN': '不能为空' }, __isLocale: true });
      expect(ovt.l({ 'zh-CN': '不能为空' })).to.be.deep.eq({ __msg: { 'zh-CN': '不能为空' }, __isLocale: true });
    });
  });

  describe('isLocale()', function() {
    it('should return true if a object is localized object', function() {
      expect(ovt.isLocale(ovt.l('name'))).to.be.eq(true);
      expect(ovt.isLocale({})).to.be.eq(false);
      expect(ovt.isLocale()).to.be.eq(false);
      expect(ovt.isLocale('')).to.be.eq(false);
      expect(ovt.isLocale(1)).to.be.eq(false);
      expect(ovt.isLocale(null)).to.be.eq(false);
    });
  });

  describe('TYPES', function() {
    for (let name in ovt.TYPES) {
      describe(`${name}()`, function() {
        it(`should return ${name} schema with default validator applied`, function() {
          let TypeSchema = ovt.TYPES[name];
          let schema = ovt[name]();
          expect(schema).to.be.instanceOf(TypeSchema);
          if (schema._defaultValidator) {
            expect(schema).to.have.deep.property(`_methods.${schema._defaultValidator}`);
          }
        });
      });
    }
  });
});
