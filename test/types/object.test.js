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

  let schemaBuilder = function() {
    return (new ObjectType()).isObject();
  };

  beforeEach(function() {
    schema = schemaBuilder();
  });

  helpers.inheritsAnyTypeBy(ObjectType);

  describe('isObject()', function() {
    describe('validate valid values', function() {
      helpers.validateIt(function() { return schema; }, [
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
      expect(schema.convert(1)).to.deep.eq(new Number(1));
      expect(schema.convert('')).to.deep.eq(new String(''));
      expect(schema.convert(null)).to.deep.eq({});
      expect(schema.convert(undefined)).to.deep.eq({});
      expect(schema.convert(true)).to.deep.eq(new Boolean(true));
      expect(schema.convert(false)).to.deep.eq(new Boolean(false));
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
    describe('validate valid values', function() {
      let newSchema = (new ObjectType()).initialize().keys({
        name: (new StringType).isString().required().valid('Felix'),
        hobbies: (new ArrayType).isArray().required().items((new StringType).isString().required())
      }).keys({
        gender: (new StringType).isString().required().only(['male', 'female', 'unknown'])
      }).keys({
        languages: [new StringType],
        children: { name: new StringType }
      });

      helpers.validateIt(function() { return newSchema; }, testCases, { convert: false });

      it('should not have nickname as key', function() {
        newSchema.keys({
          nickname: (new StringType).isString().required().valid('my nick name')
        });

        expect(newSchema._inner.children).not.to.have.property('nickname');
      });
    });
  });

  describe('initialize()', function() {
    describe('validate valid values', function() {
      let newSchema = new ObjectType().initialize({
        name: (new StringType).isString().required().valid('Felix'),
        hobbies: (new ArrayType).isArray().required().items((new StringType).isString().required()),
        gender: (new StringType).isString().required().only(['male', 'female', 'unknown']),
        languages: [new StringType],
        children: { name: new StringType }
      });

      helpers.validateIt(function() { return newSchema; }, testCases, { convert: false });

      it('should not have nickname as key', function() {
        newSchema.keys({
          nickname: (new StringType).isString().required().valid('my nick name')
        });

        expect(newSchema._inner.children).not.to.have.property('nickname');
      });
    });
  });

  describe('add()', function() {
    describe('should validate valid values', function() {
      helpers.validateIt(
        function() {
          return schemaBuilder()
            .add('name', (new StringType).isString().required().valid('Felix'))
            .add('hobbies', (new ArrayType).isArray().required().items((new StringType).isString().required()))
            .add('gender', (new StringType).isString().required().only(['male', 'female', 'unknown']));
        }

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

  describe('remove()', function() {
    describe('should validate valid values', function() {
      var objSchema = function() {
        return schemaBuilder()
          .add('name', (new StringType).isString().required().valid('Felix'))
          .add('hobbies', (new ArrayType).isArray().required().items((new StringType).isString().required()))
          .add('gender', (new StringType).isString().required().only(['male', 'female', 'unknown']))
          .remove('hobbies');
      };
      helpers.validateIt(objSchema,
        [
          [null, false],
          [{}, false],
          [{ name: 'Jill' }, false],
          [{ name: 'Felix', gender: 'male' }, true],
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

      it('should not have `hobbies` as key child schema', function() {
        expect(objSchema()).not.to.have.deep.property('_inner.children.hobbies');
      });
    });
  });

  describe('when()', function() {
    describe('should match specific condition - sub condition', function() {
      helpers.validateIt(
        function() {
          return schemaBuilder().keys({
            name: (new StringType).isString().required().valid('Felix'),
            hobbies: (new ArrayType).isArray().required().items((new StringType).isString().required()),
            gender: (new StringType).isString().required().only(['male', 'female', 'unknown']),
            x: (new AnyType).when('gender', {
              is: 'male',
              then: (new StringType).initialize().valid('xi'),
              otherwise: (new NumberType).initialize().integer().min(5)
            })
          });
        }
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
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male' }, true],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male', x: 'xi' }, true],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male', x: 1 }, false],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5 }, true],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 2 }, false],
        ],
        { convert: false }
      );
    });

    describe('should match specific condition - parent object condition', function() {
      helpers.validateIt(
        function() {
          return schemaBuilder().keys({
            name: (new StringType).isString().required().valid('Felix'),
            hobbies: (new ArrayType).isArray().required().items((new StringType).isString().required()),
            gender: (new StringType).isString().required().only(['male', 'female', 'unknown']),
            x: (new AnyType).initialize(),
            profile: schemaBuilder().keys({
              school: (new StringType).isString().required(),
              age: (new NumberType).initialize().required().integer().min(0),
              job: (new StringType).initialize()
            }).when(
              'age',
              {
                is: (new NumberType).initialize().min(22),
                then: (new ObjectType).initialize({
                  job: (new StringType).initialize().required()
                }).rename('job', 'career')
              }
            )
          }).when('gender', {
            is: 'male',
            then: (new ObjectType).initialize().keys({
              x: (new StringType).initialize().valid('xi').required()
            }),
            otherwise: (new ObjectType).initialize().keys({
              x: (new NumberType).initialize().integer().min(5)
            })
          });
        }
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
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male' }, false],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male', x: 'xi' }, true],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'male', x: 1 }, false],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5 }, true],
          [{ name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 2 }, false],
          [{
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: {}
          }, false],
          [{
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: { school: 'MIT' }
          }, false],
          [{
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: { school: 'MIT', age: -1 }
          }, false],
          [{
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: { school: 'MIT', age: 1 }
          }, true],
          [{
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: { school: 'MIT', age: 1.1 }
          }, false],
          [{
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: { school: 'MIT', age: 22 }
          }, false],
          [{
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: { school: 'MIT', age: 22, job: 'Accounting' }
          }, true],
          [{
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: { school: 'MIT', age: 22, job: 'Accounting' }
          }, {
            name: 'Felix', hobbies: ['pingpong'], gender: 'female', x: 5,
            profile: { school: 'MIT', age: 22, career: 'Accounting' }
          }],
        ],
        { convert: false }
      );
    });
  });
});
