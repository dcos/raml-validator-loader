const RAML = require('raml-1-parser');
const Generator = require('../Generator');
const GeneratorContext = require('../GeneratorContext');

/**
 * Utility function that parses RAML on-the-fly, generates a validator object
 * and returns the validation function
 */
function createValidator(ramlDocument, typeName='TestType') {
  var raml = RAML.parseRAMLSync(ramlDocument);
  var types = raml.types().reduce(function(types, type) {
    types[type.name()] = type;
    return types;
  }, {});

  // Generate code with the given type
  var ctx = new GeneratorContext();
  ctx.uses( types[typeName].runtimeType() );

  // Generate code
  var code = Generator.generate(ctx);
  var typeValidators = eval(`(function() {var module={};${code};return module.exports;})()`);

  // console.log(code);

  // Return the validator for this type
  return typeValidators[typeName];
}

describe('RAMLValidator', function () {

  describe('Scalar Types', function () {

    describe('#string', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: string'
        ].join('\n'));
      });

      it('should validate if string', function () {
        var errors = this.validator('test')
        expect(errors.length).toEqual(0);
      });

      it('should return error if number', function () {
        var errors = this.validator(123)
        expect(errors.length).toEqual(1);
      });

      it('should return error if object', function () {
        var errors = this.validator({})
        expect(errors.length).toEqual(1);
      });

      it('should return error if array', function () {
        var errors = this.validator([])
        expect(errors.length).toEqual(1);
      });

    });

    describe('#number', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: number'
        ].join('\n'));
      });

      it('should validate if integer', function () {
        var errors = this.validator(1234)
        expect(errors.length).toEqual(0);
      });

      it('should validate if float', function () {
        var errors = this.validator(12.34)
        expect(errors.length).toEqual(0);
      });

      it('should validate if numerical string', function () {
        var errors = this.validator('12345')
        expect(errors.length).toEqual(0);
      });

      it('should return error if non-numerical string', function () {
        var errors = this.validator('abc')
        expect(errors.length).toEqual(1);
      });

      it('should return error if object', function () {
        var errors = this.validator({})
        expect(errors.length).toEqual(1);
      });

    });

    describe('#integer', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: integer'
        ].join('\n'));
      });

      it('should validate if integer', function () {
        var errors = this.validator(1234)
        expect(errors.length).toEqual(0);
      });

      it('should validate if integer string', function () {
        var errors = this.validator('12345')
        expect(errors.length).toEqual(0);
      });

      it('should return error if float', function () {
        var errors = this.validator(12.34)
        expect(errors.length).toEqual(1);
      });

      it('should return error if float string', function () {
        var errors = this.validator('12.34')
        expect(errors.length).toEqual(1);
      });

      it('should return error if non-numerical string', function () {
        var errors = this.validator('abc')
        expect(errors.length).toEqual(1);
      });

      it('should return error if object', function () {
        var errors = this.validator({})
        expect(errors.length).toEqual(1);
      });

    });

    describe('#boolean', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: boolean'
        ].join('\n'));
      });

      it('should validate if true', function () {
        var errors = this.validator(true)
        expect(errors.length).toEqual(0);
      });


      it('should validate if false', function () {
        var errors = this.validator(false)
        expect(errors.length).toEqual(0);
      });

      it('should return error if number', function () {
        var errors = this.validator(12345)
        expect(errors.length).toEqual(1);
      });

      it('should return error if string', function () {
        var errors = this.validator('abc')
        expect(errors.length).toEqual(1);
      });

      it('should return error if object', function () {
        var errors = this.validator({})
        expect(errors.length).toEqual(1);
      });

    });

    describe('#object', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: object'
        ].join('\n'));
      });

      it('should validate if object', function () {
        var errors = this.validator({})
        expect(errors.length).toEqual(0);
      });

      it('should return error if number', function () {
        var errors = this.validator(12345)
        expect(errors.length).toEqual(1);
      });

      it('should return error if string', function () {
        var errors = this.validator('abc')
        expect(errors.length).toEqual(1);
      });

      it('should return error if boolean', function () {
        var errors = this.validator(true)
        expect(errors.length).toEqual(1);
      });

    });

  });

  describe('Object Type', function () {

    describe('#properties', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: object',
          '    properties:',
          '      required: number',
          '      optional?: number',
        ].join('\n'));
      });

      it('should validate if all fields in place', function () {
        var errors = this.validator({
          required: 1,
          optional: 2
        })
        expect(errors.length).toEqual(0);
      });

      it('should validate if extra fields present', function () {
        var errors = this.validator({
          required: 1,
          optional: 2,
          extra: 3
        })
        expect(errors.length).toEqual(0);
      });

      it('should validate if optional fields missing', function () {
        var errors = this.validator({
          required: 1
        })
        expect(errors.length).toEqual(0);
      });

      it('should return error if required fields missing', function () {
        var errors = this.validator({
          optional: 1
        })
        expect(errors.length).toEqual(1);
      });

    });

    describe('#minProperties', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: object',
          '    minProperties: 2',
          '    properties:',
          '      required: number',
          '      optional?: number',
        ].join('\n'));
      });

      it('should validate if property number matches', function () {
        var errors = this.validator({
          required: 1,
          optional: 2
        })
        expect(errors.length).toEqual(0);
      });

      it('should validate if more properties', function () {
        var errors = this.validator({
          required: 1,
          optional: 2,
          extra: 3
        })
        expect(errors.length).toEqual(0);
      });

      it('should return error if less properties', function () {
        var errors = this.validator({
          required: 1,
        })
        expect(errors.length).toEqual(1);
      });

    });

    describe('#maxProperties', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: object',
          '    maxProperties: 2',
          '    properties:',
          '      required: number',
          '      optional?: number',
        ].join('\n'));
      });

      it('should validate if property number matches', function () {
        var errors = this.validator({
          required: 1,
          optional: 2
        })
        expect(errors.length).toEqual(0);
      });

      it('should validate if less properties', function () {
        var errors = this.validator({
          required: 1
        })
        expect(errors.length).toEqual(0);
      });

      it('should return error if more properties', function () {
        var errors = this.validator({
          required: 1,
          optional: 2,
          extra: 3
        })
        expect(errors.length).toEqual(1);
      });

    });

  });

  describe('Array Type', function () {

    describe('#uniqueItems', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: array',
          '    uniqueItems: true'
        ].join('\n'));
      });

      it('should validate if all items are unique', function () {
        var errors = this.validator([1,2,3,4]);
        expect(errors.length).toEqual(0);
      });

      it('should return error if there are duplicate items', function () {
        var errors = this.validator([1,2,3,4,1]);
        expect(errors.length).toEqual(1);
      });

    });

    describe('#items', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  ItemType:',
          '    type: string',
          '  TestType:',
          '    type: array',
          '    items: ItemType'
        ].join('\n'));
      });

      it('should validate if all items match type', function () {
        var errors = this.validator(['a', 'b', 'c']);
        expect(errors.length).toEqual(0);
      });

      it('should return error if the item type does not match', function () {
        var errors = this.validator(['a', 'b', 4]);
        expect(errors.length).toEqual(1);
      });

      it('should return on error for every mismatching type', function () {
        var errors = this.validator(['a', 'b', 4, {}, false]);
        expect(errors.length).toEqual(3);
      });

    });

    describe('#minItems', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: array',
          '    minItems: 5'
        ].join('\n'));
      });

      it('should validate if there are exactly minItems', function () {
        var errors = this.validator([1,2,3,4,5]);
        expect(errors.length).toEqual(0);
      });

      it('should validate if more than minItems', function () {
        var errors = this.validator([1,2,3,4,5,6]);
        expect(errors.length).toEqual(0);
      });

      it('should return error if less than minItems', function () {
        var errors = this.validator([1,2,3]);
        expect(errors.length).toEqual(1);
      });

    });

    describe('#maxItems', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TestType:',
          '    type: array',
          '    maxItems: 5'
        ].join('\n'));
      });

      it('should validate if there are exactly maxItems', function () {
        var errors = this.validator([1,2,3,4,5]);
        expect(errors.length).toEqual(0);
      });

      it('should validate if less than maxItems', function () {
        var errors = this.validator([1,2,3]);
        expect(errors.length).toEqual(0);
      });

      it('should return error if more than maxItems', function () {
        var errors = this.validator([1,2,3,4,5,6]);
        expect(errors.length).toEqual(1);
      });

    });

  });

  describe('Union Type', function () {

    describe('#properties', function () {

      beforeEach(function() {
        this.validator = createValidator([
          '#%RAML 1.0',
          'types:',
          '  TypeA:',
          '    type: object',
          '    properties:',
          '      a: number',
          '      x: string',
          '  TypeB:',
          '    type: object',
          '    properties:',
          '      b: number',
          '      x: boolean',
          '  TestType:',
          '    type: TypeA | TypeB',
        ].join('\n'));
      });

      it('should validate if props of typeA match', function () {
        var errors = this.validator({
          a: 1,
          x: 'string'
        })
        expect(errors.length).toEqual(0);
      });

      it('should validate if props of typeB match', function () {
        var errors = this.validator({
          b: 2,
          x: false,
        })
        expect(errors.length).toEqual(0);
      });

      it('should return error if props of typeA match partially', function () {
        var errors = this.validator({
          a: 1, // < 'a' selects typeA for validation
          x: 1234, // <This is supposed to be a string
        })
        expect(errors.length).toEqual(1);
      });

      it('should return error if props of typeB match partially', function () {
        var errors = this.validator({
          b: 1, // < 'a' selects typeB for validation
          x: 1234, // <This is supposed to be a boolean
        })
        expect(errors.length).toEqual(1);
      });

      it('should return error if type props missing', function () {
        var errors = this.validator({
          z: 2
        })
        expect(errors.length).toEqual(2);
      });

    });

  });

});
