'use strict';

const Helper = require('./helpers');
const AnyType = require('../lib/types/any');

describe('AnyType', function() {
  let schema;

  beforeEach(function() {
    schema = new AnyType();
  });

  describe('required()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.required, [
        [undefined, false],
        [null, true],
        [1, true]
      ]);
    });
  });

  describe('optional()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.optional, [
        [undefined, true],
        [null, true],
        [1, true]
      ]);
    });
  });

  describe('forbidden()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.forbidden, [
        [undefined, true],
        [null, false],
        [1, false]
      ]);
    });
  });

  describe('valid()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.valid(1, 3), [
        [1, true],
        [3, true],
        [2, false]
      ]);
    });
  });

  describe('only()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.only(1, 3), [
        [1, true],
        [3, true],
        [2, false]
      ]);
    });
  });

  describe('whitelist()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.whitelist(1, 3), [
        [1, true],
        [3, true],
        [2, false]
      ]);
    });
  });

  describe('oneOf()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.oneOf(1, 3), [
        [1, true],
        [3, true],
        [2, false]
      ]);
    });
  });

  describe('equals()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.equals(1), [
        [1, true],
        [2, false]
      ]);
    });
  });

  describe('eq()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.eq(1), [
        [1, true],
        [2, false]
      ]);
    });
  });

  describe('equal()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.equal(1), [
        [1, true],
        [2, false]
      ]);
    });
  });

  describe('invalid()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.invalid(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true]
      ]);
    });
  });

  describe('not()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.not(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true]
      ]);
    });
  });

  describe('disallow()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.disallow(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true]
      ]);
    });
  });

  describe('blacklist()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema.blacklist(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true]
      ]);
    });
  });
});
