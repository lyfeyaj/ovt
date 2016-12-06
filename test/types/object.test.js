'use strict';

const expect = require('chai').expect;
const helpers = require('../helpers');
const ObjectType = require('../../lib/types/object');
const ArrayType = require('../../lib/types/array');
const StringType = require('../../lib/types/string');

describe('ObjectType', function() {
  let schema;

  beforeEach(function() {
    schema = (new ObjectType()).isObject();
  });

  helpers.inheritsAnyTypeBy(ObjectType);

  describe('isObject()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
        [null, false],
        [0, false],
        ['', false],
        [NaN, false],
        [[], true],
        [new Object(), true],
        [{}, true]
      ], { convert: false });
    });
  });

  describe('rename()', function() {
    it('should rename old key to new key', function() {
      helpers.validate(schema.rename('name', 'nickname'), [
        [{ name: 'Felix Liu' }, { nickname: 'Felix Liu' }]
      ], { convert: false });
    });

    it('should rename according to renames', function() {
      helpers.validate(schema.rename({
        name: 'nickname',
        sex: 'gender'
      }), [
        [{ name: 'Felix Liu', sex: 'male' }, { nickname: 'Felix Liu', gender: 'male' }]
      ], { convert: false });
    });
  });

  describe('keys()', function() {
    it('should validate valid values', function() {
      let newSchema = schema.keys({
        name: (new StringType).isString().required().valid('Felix'),
        hobbies: (new ArrayType).isArray().required().items((new StringType).isString().required())
      }).keys({
        gender: (new StringType).isString().required().only(['male', 'femaile', 'unknown'])
      });
      helpers.validate(newSchema, [
        [{ name: 'Jill' }, false],
        [{ name: 'Felix' }, false],
        [{ name: 'Felix', hobbies: [] }, false],
        [{ name: 'Felix', hobbies: ['pingpong'] }, false],
        [{ name: 'Felix', hobbies: ['pingpong'], gender: 'boy' }, false],
        [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male' }, true]
      ], { convert: false });

      newSchema.keys({
        nickname: (new StringType).isString().required().valid('my nick name')
      });

      expect(newSchema._inner.children).not.to.have.property('nickname');
    });
  });

  describe('add()', function() {
    it('should validate valid values', function() {
      helpers.validate(
        schema
          .add('name', (new StringType).isString().required().valid('Felix'))
          .add('hobbies', (new ArrayType).isArray().required().items((new StringType).isString().required()))
          .add('gender', (new StringType).isString().required().only(['male', 'femaile', 'unknown']))
      ,
        [
          [{ name: 'Jill' }, false],
          [{ name: 'Felix' }, false],
          [{ name: 'Felix', hobbies: [] }, false],
          [{ name: 'Felix', hobbies: ['pingpong'] }, false],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'boy' }, false],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male' }, true]
        ],
        { convert: false }
      );
    });
  });
});
