'use strict';

const expect = require('chai').expect;
const helpers = require('../helpers');
const StringType = require('../../lib/types/string');

describe('StringType', function() {
  let schema;

  beforeEach(function() {
    schema = (new StringType()).isString();
  });

  helpers.inheritsAnyTypeBy(StringType);

  describe('convert()', function() {
    it('should convert the value to string', function() {
      expect(schema.convert(1)).to.eq('1');
      expect(schema.convert('')).to.eq('');
      expect(schema.convert(null)).to.eq('null');
      expect(schema.convert({})).to.eq('[object Object]');
      expect(schema.convert([1])).to.eq('1');
      expect(schema.convert(undefined)).to.eq('undefined');
    });
  });

  describe('isString()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
        [null, false],
        [0, false],
        [{}, false],
        [[], false],
        [new String(), true],
        ['', true]
      ], { convert: false });
    });
  });

  describe('required()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.required(), [
        [null, false],
        [0, false],
        [undefined, false],
        [new String(), true],
        ['', true],
        ['a', true]
      ], { convert: false });
    });
  });

  describe('empty()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.required().empty(''), [
        [null, false],
        [0, false],
        [undefined, false],
        ['', false],
        ['a', true]
      ], { convert: false });

      let empty = (new StringType).valid('', new String);
      helpers.validate(schema.required().empty(empty), [
        [null, false],
        [0, false],
        [undefined, false],
        ['', false],
        ['a', true]
      ], { convert: false });
    });
  });
});
