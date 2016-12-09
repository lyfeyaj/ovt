'use strict';

const expect = require('chai').expect;
const helpers = require('../helpers');
const AnyType = require('../../lib/types/any');
const ObjectType = require('../../lib/types/object');
const ArrayType = require('../../lib/types/array');
const StringType = require('../../lib/types/string');
const NumberType = require('../../lib/types/number');

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

  describe('convert()', function() {
    it('should convert the value to object', function() {
      expect(schema.convert(1)).to.deep.eq({});
      expect(schema.convert('')).to.deep.eq({});
      expect(schema.convert(null)).to.deep.eq({});
      expect(schema.convert(undefined)).to.deep.eq({});
      expect(schema.convert(true)).to.deep.eq({});
      expect(schema.convert(false)).to.deep.eq({});
      expect(schema.convert([])).to.deep.eq([]);
    });
  });

  describe('concat()', function() {
    let objSchema, strSchema, anySchema;

    beforeEach(function() {
      objSchema = (new ObjectType).keys({ name: (new StringType).isString().required() });
      strSchema = (new StringType).isString().required();
      anySchema = (new AnyType).valid('air', 'water', 'earth').required();
    });

    it('should raise error if schema types aren\'t match', function() {
      expect(function() { objSchema.concat(strSchema); }).to.throw(Error);
      expect(function() { strSchema.concat(objSchema); }).to.throw(Error);
      expect(function() { anySchema.concat(strSchema); }).to.not.throw(Error);
      expect(function() { strSchema.concat(anySchema); }).to.not.throw(Error);
      expect(function() { anySchema.concat(objSchema); }).to.not.throw(Error);
      expect(function() { objSchema.concat(anySchema); }).to.not.throw(Error);
      expect(function() { anySchema.concat(anySchema); }).to.not.throw(Error);
      expect(function() { objSchema.concat(objSchema); }).to.not.throw(Error);
      expect(function() { strSchema.concat(strSchema); }).to.not.throw(Error);
    });

    it('should concat another schema', function() {
      let anyObj = anySchema.concat(objSchema);
      expect(anyObj).to.not.deep.eq(anySchema);
      expect(anyObj).to.not.deep.eq(objSchema);
      expect(anyObj._type).to.eq('object');
      expect(anyObj._inner.children).to.have.property('name').deep.eq(objSchema._inner.children.name);
      expect(anyObj._methods).to.have.property('valid').deep.eq(anySchema._methods.valid);

      anyObj = anyObj.keys({ age: (new NumberType).isNumber().integer().min(0) });

      expect(anySchema._inner.children).to.not.have.property('age');
      expect(objSchema._inner.children).to.not.have.property('age');
      expect(anyObj._inner.children).to.have.property('age').to.have.property('_type', 'number');
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

  let testCases = [
    [{ name: 'Jill' }, false],
    [{ name: 'Felix' }, false],
    [{ name: 'Felix', hobbies: [] }, false],
    [{ name: 'Felix', hobbies: ['pingpong'] }, false],
    [{ hobbies: ['pingpong'], gender: 'male' }, false],
    [{ name: 'Felix', gender: 'male' }, false],
    [{ name: 'Felix', hobbies: ['pingpong'], gender: 'boy' }, false],
    [{ name: 'Jill', hobbies: ['pingpong'], gender: 'male' }, false],
    [{ name: 'Felix', hobbies: [1], gender: 'male' }, false],
    [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male' }, true]
  ];

  describe('keys()', function() {
    it('should validate valid values', function() {
      let newSchema = schema.keys({
        name: (new StringType).isString().required().valid('Felix'),
        hobbies: (new ArrayType).isArray().required().items((new StringType).isString().required())
      }).keys({
        gender: (new StringType).isString().required().only(['male', 'femaile', 'unknown'])
      }).keys({
        languages: [new StringType],
        children: { name: new StringType }
      });
      helpers.validate(newSchema, testCases, { convert: false });

      newSchema.keys({
        nickname: (new StringType).isString().required().valid('my nick name')
      });

      expect(newSchema._inner.children).not.to.have.property('nickname');
    });
  });

  describe('initialize()', function() {
    it('should validate valid values', function() {
      let newSchema = new ObjectType().initialize({
        name: (new StringType).isString().required().valid('Felix'),
        hobbies: (new ArrayType).isArray().required().items((new StringType).isString().required()),
        gender: (new StringType).isString().required().only(['male', 'femaile', 'unknown']),
        languages: [new StringType],
        children: { name: new StringType }
      });
      helpers.validate(newSchema, testCases, { convert: false });

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
          [null, false],
          [{}, false],
          [{ name: 'Jill' }, false],
          [{ name: 'Felix' }, false],
          [{ hobbies: ['pingpong'] }, false],
          [{ name: 'Felix', hobbies: [] }, false],
          [{ name: 'Felix', hobbies: ['pingpong'] }, false],
          [{ hobbies: ['pingpong'], gender: 'boy' }, false],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'boy' }, false],
          [{ name: 'Felix', hobbies: [], gender: 'boy' }, false],
          [{ name: 'Felix', gender: 'boy' }, false],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male' }, true]
        ],
        { convert: false }
      );
    });
  });
});
