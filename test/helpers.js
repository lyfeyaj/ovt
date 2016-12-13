'use strict';

const expect = require('chai').expect;
const Ovt = require('../');

module.exports = {
  validate: function(schema, samples, options) {
    options = options || {};
    samples = samples || [];
    samples.forEach(function(sample) {
      var value = sample[0];
      var result = sample[1];
      if (result === true) {
        expect(function() {
          Ovt.assert(value, schema, options);
        }).to.not.throw(Error);
      } else if (result === false) {
        expect(function() {
          Ovt.assert(value, schema, options);
        }).to.throw(Error);
      } else {
        expect(Ovt.validate(value, schema, options)).to.have.deep.property('value').to.eql(result);
      }
    });
  },

  attempt: function(schema, value, options) {
    options = options || {};
    return Ovt.attempt(value, schema, options);
  },

  validateIt(schemaFn, samples, options) {
    let self = this;

    (samples || []).forEach(function(sample) {
      it(`- sample: ${JSON.stringify(sample)}`, function() {
        let schema = schemaFn();
        self.validate(schema, [sample], options);
      });
    });
  },

  inheritsAnyTypeBy: function(type) {
    let schema;
    beforeEach(function() {
      schema = new type();
    });

    describe('required()', function() {
      it('should have required method', function() {
        expect(schema.required).to.be.a('function');
      });
    });

    describe('optional()', function() {
      it('should have optional method', function() {
        expect(schema.optional).to.be.a('function');
      });
    });

    describe('forbidden()', function() {
      it('should have forbidden method', function() {
        expect(schema.forbidden).to.be.a('function');
      });
    });

    describe('valid()', function() {
      it('should have valid method', function() {
        expect(schema.valid).to.be.a('function');
      });
    });

    describe('only()', function() {
      it('should have only method', function() {
        expect(schema.only).to.be.a('function');
      });
    });

    describe('whitelist()', function() {
      it('should have whitelist method', function() {
        expect(schema.whitelist).to.be.a('function');
      });
    });

    describe('oneOf()', function() {
      it('should have oneOf method', function() {
        expect(schema.oneOf).to.be.a('function');
      });
    });

    describe('equals()', function() {
      it('should have equals method', function() {
        expect(schema.equals).to.be.a('function');
      });
    });

    describe('eq()', function() {
      it('should have eq method', function() {
        expect(schema.eq).to.be.a('function');
      });
    });

    describe('equal()', function() {
      it('should have equal method', function() {
        expect(schema.equal).to.be.a('function');
      });
    });

    describe('invalid()', function() {
      it('should have invalid method', function() {
        expect(schema.invalid).to.be.a('function');
      });
    });

    describe('not()', function() {
      it('should have not method', function() {
        expect(schema.not).to.be.a('function');
      });
    });

    describe('disallow()', function() {
      it('should have disallow method', function() {
        expect(schema.disallow).to.be.a('function');
      });
    });

    describe('blacklist()', function() {
      it('should have blacklist method', function() {
        expect(schema.blacklist).to.be.a('function');
      });
    });
  }
};
