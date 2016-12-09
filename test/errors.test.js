'use strict';

const expect = require('chai').expect;
const Errors = require('../lib/errors.js');

describe('Errors', function() {
  let errors;
  beforeEach(function() {
    errors = new Errors();
  });

  describe('constructor()', function() {
    it('should inherits from Error', function() {
      expect(errors).to.be.instanceof(Error);
      expect(errors).to.be.instanceof(Errors);
    });

    it('should have specified instance properties', function() {
      expect(errors).to.have.deep.property('isOvt', true);
      expect(errors).to.have.deep.property('hasErrors', false);
      expect(errors).to.have.deep.property('name', 'ValidationError');
      expect(errors).to.have.property('_errors').deep.eq({});
    });
  });

  describe('add()', function() {
    it('should add error by name and message', function() {
      errors.add('name', 'can\'t be empty');
      errors.add('age');
      expect(errors).to.have.deep.property('_errors.name').to.include('can\'t be empty');
      expect(errors).to.have.deep.property('_errors.name').with.length(1);
      expect(errors).to.have.deep.property('_errors.age').to.include(errors.defaultMessage('age')).to.include('Validation age failed');
      expect(errors).to.have.deep.property('_errors.age').with.length(1);
    });
  });

  describe('get()', function() {
    it('should return error messages by name', function() {
      errors.add('name', 'can\'t be empty');
      expect(errors.get('name')).to.deep.equal(['can\'t be empty']);
    });
  });

  describe('concat()', function() {
    it('should return a new Errors instance with all errors concated', function() {
      errors.add('name', 'can\'t be empty').add('age', 'can\'t be less than 0');
      let errors1 = (new Errors).add('hobbies', 'is required').add('name', 'is too long');
      let errors2 = errors.concat(errors1);

      expect(errors2).to.have.deep.property('_errors.name').to.deep.eq(['can\'t be empty', 'is too long']);
      expect(errors2).to.have.deep.property('_errors.age').to.deep.eq(['can\'t be less than 0']);
      expect(errors2).to.have.deep.property('_errors.hobbies').to.deep.eq(['is required']);

      expect(errors1).to.have.deep.property('_errors.name').to.not.deep.eq(['can\'t be empty', 'is too long']);
      expect(errors1).to.not.have.deep.property('_errors.age');

      expect(errors).to.have.deep.property('_errors.name').to.not.deep.eq(['can\'t be empty', 'is too long']);
      expect(errors).to.not.have.deep.property('_errors.hobbies');
    });
  });

  describe('flatten()', function() {
    it('should return flattened messages array', function() {
      errors
        .add('name', 'can\'t be empty')
        .add('name', 'is too long')
        .add('age', 'can\'t be less than 0');

      expect(errors.flatten(' ')).to.deep.eq([
        'name can\'t be empty',
        'name is too long',
        'age can\'t be less than 0'
      ]);

      expect(errors.flatten(' - ')).to.deep.eq([
        'name - can\'t be empty',
        'name - is too long',
        'age - can\'t be less than 0'
      ]);
    });
  });

  describe('toHuman()', function() {
    it('should return human readable messages', function() {
      errors
        .add('name', 'can\'t be empty')
        .add('name', 'is too long')
        .add('age', 'can\'t be less than 0');

      expect(errors.toHuman(' ')).to.eq('name can\'t be empty; name is too long; age can\'t be less than 0');
      expect(errors.toHuman(' - ')).to.eq('name - can\'t be empty; name - is too long; age - can\'t be less than 0');
    });
  });

  describe('asJSON()', function() {
    it('should return json object', function() {
      errors
        .add('name', 'can\'t be empty')
        .add('name', 'is too long')
        .add('age', 'can\'t be less than 0');

      expect(errors.asJSON()).to.deep.eq({
        name: ['can\'t be empty', 'is too long'],
        age: ['can\'t be less than 0']
      });
    });
  });

  describe('any()', function() {
    it('should return true if there is any errors or return false if none', function() {
      expect(errors.any()).to.eq(false);
      errors.add('name', 'can\'t be empty');
      expect(errors.any()).to.eq(true);
      expect((new Errors).concat(errors).any()).to.eq(true);
    });
  });
});
