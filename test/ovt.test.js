'use strict';

const expect = require('chai').expect;
const ovt = require('../');

describe('Ovt', function() {
  describe('parseOptions()', function() {
    it('should return correct options according to passed options', function() {
      expect(ovt.parseOptions({ abortEarly: false })).to.have.property('abortEarly', false);
      expect(ovt.parseOptions({ abortEarly: true })).to.have.property('abortEarly', true);
      expect(ovt.parseOptions({ abortEarly: null })).to.have.property('abortEarly', true);
      expect(ovt.parseOptions({ abortEarly: undefined })).to.have.property('abortEarly', true);

      expect(ovt.parseOptions({ convert: false })).to.have.property('convert', false);
      expect(ovt.parseOptions({ convert: true })).to.have.property('convert', true);
      expect(ovt.parseOptions({ convert: null })).to.have.property('convert', true);
      expect(ovt.parseOptions({ convert: undefined })).to.have.property('convert', true);

      expect(ovt.parseOptions({ noDefaults: false })).to.have.property('noDefaults', false);
      expect(ovt.parseOptions({ noDefaults: true })).to.have.property('noDefaults', true);
      expect(ovt.parseOptions({ noDefaults: null })).to.have.property('noDefaults', false);
      expect(ovt.parseOptions({ noDefaults: undefined })).to.have.property('noDefaults', false);

      expect(ovt.parseOptions({ locale: 'en' })).to.have.property('locale', 'en');
      expect(ovt.parseOptions({ locale: 'zh-CN' })).to.have.property('locale', 'zh-CN');
      expect(ovt.parseOptions({ locale: null })).to.have.property('locale', 'en');
      expect(ovt.parseOptions({ locale: undefined })).to.have.property('locale', 'en');
    });
  });
});
