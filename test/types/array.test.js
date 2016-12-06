'use strict';

const helpers = require('../helpers');
const ArrayType = require('../../lib/types/array');
const AnyType = require('../../lib/types/any');

describe('ArrayType', function() {
  let schema;
  let anySchema;

  beforeEach(function() {
    schema = (new ArrayType()).isArray();
    anySchema = new AnyType();
  });

  helpers.inheritsAnyTypeBy(ArrayType);

  describe('required()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.required(), [
        [undefined, false],
        [null, false],
        [1, false],
        [[], true],
        [new Array, true]
      ], { convert: false });

      helpers.validate(schema.required(), [
        [undefined, false],
        [null, true],
        [1, true],
        [[], true],
        [new Array, true]
      ], { convert: true });
    });
  });

  describe('isLength()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.isLength(2), [
        [new Array(3), false],
        [new Array(2), true]
      ]);
    });
  });

  describe('maxLength()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.maxLength(2), [
        [new Array(3), false],
        [new Array(2), true],
        [new Array(1), true],
        [new Array(), true]
      ]);
    });
  });

  describe('minLength()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.minLength(2), [
        [new Array(3), true],
        [new Array(2), true],
        [new Array(1), false],
        [new Array(), false]
      ]);
    });
  });

  describe('minLength()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.minLength(2), [
        [new Array(3), true],
        [new Array(2), true],
        [new Array(1), false],
        [new Array(), false]
      ]);
    });
  });

  describe('items()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.items(
        anySchema.required().valid(1),
        anySchema.required().valid(2),
        anySchema.forbidden().valid(3),
        anySchema.optional()
      ), [
        [[1, 2], true],
        [[1, 2, 3], false],
        [[1], false],
        [[2], false],
        [[3], false],
        [[1,2,4], true]
      ]);
    });
  });

  describe('initialize()', function() {
    it('should validate valid values', function() {
      helpers.validate(new ArrayType().initialize(
        anySchema.required().valid(1),
        anySchema.required().valid(2),
        anySchema.forbidden().valid(3),
        anySchema.optional()
      ), [
        [[1, 2], true],
        [[1, 2, 3], false],
        [[1], false],
        [[2], false],
        [[3], false],
        [[1,2,4], true]
      ]);
    });
  });

  describe('items()', function() {
    it('should validate required valid values', function() {
      helpers.validate(schema.items(
        anySchema.required().valid(1),
        anySchema.required().valid(2),
        anySchema.optional()
      ), [
        [[1, 2], true],
        [[1], false],
        [[2], false],
        [[1,2,4], true]
      ]);
    });

    it('should validate forbidden values', function() {
      helpers.validate(schema.items(
        anySchema.forbidden().valid(1),
        anySchema.forbidden().valid(2),
        anySchema.optional()
      ), [
        [[1, 2], false],
        [[1], false],
        [[2], false],
        [[4], true]
      ]);
    });

    it('should validate both required and forbidden values', function() {
      helpers.validate(schema.items(
        anySchema.required().valid(1),
        anySchema.required().valid(2),
        anySchema.forbidden().valid(3),
        anySchema.optional()
      ), [
        [[1, 2], true],
        [[1, 2, 3], false],
        [[1], false],
        [[2], false],
        [[3], false],
        [[4], false],
        [[1,2,4], true]
      ]);
    });
  });

  describe('elements()', function() {
    it('should validate required valid values', function() {
      helpers.validate(schema.elements(
        anySchema.required().valid(1),
        anySchema.required().valid(2),
        anySchema.optional()
      ), [
        [[1, 2], true],
        [[1], false],
        [[2], false],
        [[1,2,4], true]
      ]);
    });

    it('should validate forbidden values', function() {
      helpers.validate(schema.elements(
        anySchema.forbidden().valid(1),
        anySchema.forbidden().valid(2),
        anySchema.optional()
      ), [
        [[1, 2], false],
        [[1], false],
        [[2], false],
        [[4], true]
      ]);
    });

    it('should validate both required and forbidden values', function() {
      helpers.validate(schema.elements(
        anySchema.required().valid(1),
        anySchema.required().valid(2),
        anySchema.forbidden().valid(3),
        anySchema.optional()
      ), [
        [[1, 2], true],
        [[1, 2, 3], false],
        [[1], false],
        [[2], false],
        [[3], false],
        [[4], false],
        [[1,2,4], true]
      ]);
    });
  });

  describe('ordered()', function() {
    it('should validate required valid values in order', function() {
      helpers.validate(schema.ordered(
        anySchema.required().valid(1),
        anySchema.required().valid(2),
        anySchema.valid(3).forbidden(),
        anySchema.optional()
      ), [
        [[1, 2], true],
        [[1, 2, 4, 3], true],
        [[1, 2, 3, 4], false],
        [[2, 1], false],
        [[], false],
        [[1], false],
        [[2], false],
        [[1, 2, 4], true]
      ]);
    });
  });
});
