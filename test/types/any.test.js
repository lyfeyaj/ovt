'use strict';

const helpers = require('../helpers');
const AnyType = require('../../lib/types/any');

describe('AnyType', function() {
  let schema;

  beforeEach(function() {
    schema = new AnyType();
  });

  describe('required()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.required(), [
        [undefined, false],
        [null, true],
        [1, true],
        ['', true],
        [{}, true]
      ]);
    });
  });

  describe('optional()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.optional(), [
        [undefined, true],
        [null, true],
        [1, true],
        ['', true],
        [{}, true]
      ]);
    });
  });

  describe('forbidden()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.forbidden(), [
        [undefined, true],
        [null, false],
        [1, false],
        ['', false],
        [{}, false]
      ]);
    });
  });

  describe('valid()', function() {
    it('should validate valid values - spread', function() {
      helpers.validate(schema.valid(1, 3), [
        [1, true],
        [3, true],
        [2, false],
        [4, false]
      ]);
    });

    it('should validate valid values - array', function() {
      helpers.validate(schema.valid(1, 3), [
        [1, true],
        [3, true],
        [2, false],
        [4, false]
      ]);
    });
  });

  describe('only()', function() {
    it('should validate valid values - spread', function() {
      helpers.validate(schema.only(1, 3), [
        [1, true],
        [3, true],
        [2, false],
        [4, false]
      ]);
    });

    it('should validate valid values - array', function() {
      helpers.validate(schema.only([1, 3]), [
        [1, true],
        [3, true],
        [2, false],
        [4, false]
      ]);
    });
  });

  describe('whitelist()', function() {
    it('should validate valid values - spread', function() {
      helpers.validate(schema.whitelist(1, 3), [
        [1, true],
        [3, true],
        [2, false],
        [4, false]
      ]);
    });

    it('should validate valid values - array', function() {
      helpers.validate(schema.whitelist([1, 3]), [
        [1, true],
        [3, true],
        [2, false],
        [4, false]
      ]);
    });
  });

  describe('oneOf()', function() {
    it('should validate valid values - spread', function() {
      helpers.validate(schema.oneOf(1, 3), [
        [1, true],
        [3, true],
        [2, false],
        [4, false]
      ]);
    });

    it('should validate valid values - array', function() {
      helpers.validate(schema.oneOf([1, 3]), [
        [1, true],
        [3, true],
        [2, false],
        [4, false]
      ]);
    });
  });

  describe('equals()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.equals(1), [
        [1, true],
        [2, false],
        ['', false]
      ]);
    });
  });

  describe('eq()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.eq(1), [
        [1, true],
        [2, false],
        ['', false]
      ]);
    });
  });

  describe('equal()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.equal(1), [
        [1, true],
        [2, false],
        ['', false]
      ]);
    });
  });

  describe('invalid()', function() {
    it('should validate valid values - spread', function() {
      helpers.validate(schema.invalid(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true],
        [{}, true]
      ]);
    });

    it('should validate valid values - array', function() {
      helpers.validate(schema.invalid(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true],
        [{}, true]
      ]);
    });
  });

  describe('not()', function() {
    it('should validate valid values - spread', function() {
      helpers.validate(schema.not(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true],
        [{}, true]
      ]);
    });

    it('should validate valid values - array', function() {
      helpers.validate(schema.not([1, 2]), [
        [1, false],
        [2, false],
        [3, true],
        [4, true],
        [{}, true]
      ]);
    });
  });

  describe('disallow()', function() {
    it('should validate valid values - spread', function() {
      helpers.validate(schema.disallow(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true],
        [{}, true]
      ]);
    });

    it('should validate valid values - array', function() {
      helpers.validate(schema.disallow([1, 2]), [
        [1, false],
        [2, false],
        [3, true],
        [4, true],
        [{}, true]
      ]);
    });
  });

  describe('blacklist()', function() {
    it('should validate valid values - spread', function() {
      helpers.validate(schema.blacklist(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true],
        [{}, true]
      ]);
    });

    it('should validate valid values - array', function() {
      helpers.validate(schema.blacklist(1, 2), [
        [1, false],
        [2, false],
        [3, true],
        [4, true],
        [{}, true]
      ]);
    });
  });

  describe('empty()', function() {
    describe('with forbidden()', function() {
      helpers.validateIt(function() {
        return schema.forbidden().empty('');
      }, [
        [null, false],
        [0, false],
        [undefined, true],
        ['', false],
        ['a', false]
      ], { convert: false });

      let empty = (new AnyType).valid('', new String);
      helpers.validateIt(function() {
        return schema.forbidden().empty(empty);
      }, [
        [null, false],
        [0, false],
        [undefined, true],
        ['', false],
        ['a', false]
      ], { convert: false });
    });
  });
});
