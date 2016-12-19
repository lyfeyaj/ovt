'use strict';

const Schema = require('../lib/schema');
const expect = require('chai').expect;

describe('Schema', function() {
  let schema;

  beforeEach(function() {
    schema = new Schema();
  });

  describe('convert()', function() {
    it('should return the same value as passed', function() {
      expect(schema.convert(1)).to.eq(1);
      expect(schema.convert('')).to.eq('');
      expect(schema.convert(null)).to.eq(null);
      expect(schema.convert({})).to.deep.eq({});
      expect(schema.convert([1])).to.deep.eq([1]);
    });
  });

  describe('clone()', function() {
    it('should return a new object instead the original one', function() {
      schema._defaultValidator = '';
      schema._methods = { a: 'c' };
      schema = schema
        .default('abc')
        .empty(1)
        .desc('desc')
        .note('note1')
        .tag('tag1')
        .options({ allowUnknown: false });
      let newSchema = schema.clone();

      expect(newSchema).to.have.property('_type', schema._type);
      expect(newSchema).to.have.property('_options').deep.eq({ allowUnknown: false });
      expect(newSchema).to.have.property('_defaultValidator', schema._defaultValidator).eq('');
      expect(newSchema).to.have.property('_defaultValue', schema._defaultValue).eq('abc');
      expect(newSchema).to.have.property('_emptySchema', schema._emptySchema).eq(1);
      expect(newSchema).to.have.property('isOvt', schema.isOvt).eq(true);
      expect(newSchema).to.have.property('_description', schema._description).eq('desc');
      expect(newSchema).to.have.property('_notes').to.deep.eq(schema._notes).to.include('note1');
      expect(newSchema).to.have.property('_tags').to.deep.eq(schema._tags).to.include('tag1');
      expect(newSchema).to.have.property('_methods').to.deep.eq(schema._methods).to.deep.eq({ a: 'c' });
      expect(newSchema).to.have.property('_inner').to.deep.eq(schema._inner).to.deep.eq({
        // array inners
        inclusions: [],
        requireds: [],
        ordereds: [],
        exclusions: [],
        orderedExclusions: [],

        // object inners
        children: {},
        renames: {}
      });

      newSchema['anotherKey'] = 'anotherValue';
      delete newSchema._inner;
      expect(schema).not.have.property('anotherKey');
      expect(schema).have.property('_inner');
      expect(newSchema).have.property('anotherKey', 'anotherValue');
      expect(newSchema).not.have.property('_inner');
    });
  });

  describe('validate()', function() {
    it('should add custom validators', function() {
      expect(schema.validate(1)).to.have.property('value', 1);
    });
  });

  describe('options()', function() {
    it('should add schema based options', function() {
      let opts = { locale: 'zh-CN' };
      expect(schema.options(opts)).to.have.property('_options').deep.eq(opts);
    });
  });

  describe('desc()', function() {
    it('should add cooresponding description', function() {
      let description = 'schema validator';
      expect(schema.desc(description)).have.property('_description', description);
    });

    it('should not throw an error if no description added', function() {
      expect(function() {
        schema.desc();
      }).to.not.throw(Error);
    });
  });

  describe('description()', function() {
    it('should add cooresponding description', function() {
      let description = 'schema validator';
      expect(schema.description(description)).have.property('_description', description);
      expect(schema.description(description)).have.property('_label', description);
    });

    it('should not throw an error if no description added', function() {
      expect(function() {
        schema.description();
      }).to.not.throw(Error);
    });
  });

  describe('label()', function() {
    it('should add cooresponding label', function() {
      let label = 'schema validator';
      expect(schema.label(label)).have.property('_label', label);
    });

    it('should not throw an error if no label added', function() {
      expect(function() {
        schema.label();
      }).to.not.throw(Error);
    });
  });

  describe('empty()', function() {
    it('should add cooresponding empty schema', function() {
      expect(schema.empty('')).have.property('_emptySchema', '');
    });

    it('should reset empty schema if nothing passed', function() {
      expect(schema.empty('').empty()).have.property('_emptySchema', undefined);
    });
  });

  describe('default()', function() {
    it('should add cooresponding default', function() {
      let defaultValue = 'defaut value';
      expect(schema.default(defaultValue)).have.property('_defaultValue', defaultValue);
    });

    it('should not throw an error if no default value added', function() {
      expect(function() {
        schema.default();
      }).to.not.throw(Error);
    });
  });

  describe('note()', function() {
    it('should add cooresponding note', function() {
      let notes = 'note';
      expect(schema.note(notes)).have.property('_notes').eql([notes]);
      expect(schema.note([notes])).have.property('_notes').eql([notes]);
      expect(schema.note([notes]).note(notes)).have.property('_notes').eql([notes, notes]);
    });

    it('should not throw an error if no note added', function() {
      expect(function() {
        schema.note();
      }).to.not.throw(Error);
    });
  });

  describe('notes()', function() {
    it('should add cooresponding note', function() {
      let notes = 'note';
      expect(schema.notes(notes)).have.property('_notes').eql([notes]);
      expect(schema.notes([notes])).have.property('_notes').eql([notes]);
      expect(schema.notes([notes]).notes(notes)).have.property('_notes').eql([notes, notes]);
    });

    it('should not throw an error if no note added', function() {
      expect(function() {
        schema.notes();
      }).to.not.throw(Error);
    });
  });

  describe('tags()', function() {
    it('should add cooresponding tag', function() {
      let tags = 'tag';
      expect(schema.tags(tags)).have.property('_tags').eql([tags]);
      expect(schema.tags([tags])).have.property('_tags').eql([tags]);
      expect(schema.tags([tags]).tags(tags)).have.property('_tags').eql([tags, tags]);
    });

    it('should not throw an error if no tag added', function() {
      expect(function() {
        schema.tags();
      }).to.not.throw(Error);
    });
  });

  describe('tag()', function() {
    it('should add cooresponding tag', function() {
      let tags = 'tag';
      expect(schema.tag(tags)).have.property('_tags').eql([tags]);
      expect(schema.tag([tags])).have.property('_tags').eql([tags]);
      expect(schema.tag([tags]).tag(tags)).have.property('_tags').eql([tags, tags]);
    });

    it('should not throw an error if no tag added', function() {
      expect(function() {
        schema.tag();
      }).to.not.throw(Error);
    });
  });
});
