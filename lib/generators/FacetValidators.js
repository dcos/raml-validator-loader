import FragmentFactory from '../utils/FragmentFactory';

const FACET_FRAGMENT_GENERATORS = {

  /**
   * [Number]  `maximum`: Maximum numeric value
   */
  maximum: function(value, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'NUMBER_MAX', 'Must be smaller than ${value}');

    return FragmentFactory.testAndPushError(
      `value > ${value}`,
      ERROR_MESSAGE,
      { value: value }
    );
  },
  /**
   * [Number] `minimum`: Minimum numeric value
   */
  minimum: function(value, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'NUMBER_MIN', 'Must be bigger than ${value}');

    return FragmentFactory.testAndPushError(
      `value < ${value}`,
      ERROR_MESSAGE,
      { value: value }
    );
  },

  /**
   * [Number] `format` : The format of the value
   *
   * Must be one of: int32, int64, int, long, float, double, int16, int8
   */
  format: function(value, context) {
    let IS_FLOAT = '(value % 1 !== 0)';
    let IS_INT   = '(value % 1 === 0)';
    let FLOAT_HELPER = context.getConstantExpression('HELPERS',
      'new Float32Array(1)');

    let condition;
    switch (value) {
      case 'int64':
        condition = `${IS_INT}`;
        break;

      case 'int32':
        condition = `${IS_INT} && (value >= -2147483648) && (value <= 2147483647)`;
        break;

      case 'int16':
        condition = `${IS_INT} && (value >= -32768) && (value <= 32767)`;
        break;

      case 'int8':
        condition = `${IS_INT} && (value >= -128) && (value <= 127)`;
        break;

      case 'int':
        condition = `${IS_INT} && (value >= -32768) && (value <= 32767)`;
        break;

      case 'long':
        condition = `${IS_INT} && (value >= -2147483648) && (value <= 2147483647)`;
        break;

      case 'float':
        // To test for Float32 we are first casting the number to an internally
        // representable Float32 number and we are then checking if it's equal
        // to the number specified.
        condition = `${IS_FLOAT} && ((${FLOAT_HELPER}[0] = value) == ${FLOAT_HELPER}[0])`;
        break;

      case 'double':
        condition = `${IS_FLOAT}`;
        break;

      default:
        throw new TypeError(`Unknown value for the 'format' facet: '${value}'`)
    }

    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'NUMBER_TYPE', 'Must be of type `${value}`');

    return FragmentFactory.testAndPushError(
      `!(${condition})`,
      ERROR_MESSAGE,
      { value: value }
    );
  },

  /**
   * [Number] `multipleOf` : Value must be divisable by this value
   */
  multipleOf: function(value, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'NUMBER_MULTIPLEOF', 'Must be multiple of ${value}');

    return FragmentFactory.testAndPushError(
      `value % ${value} !== 0`,
      ERROR_MESSAGE,
      { value: value }
    );
  },

  /**
   * [String] `pattern`: Regular expression this value should match against
   */
  pattern: function(value, context) {
    let REGEX = context.getConstantExpression('REGEX', `/${value}/`);
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'STRING_PATTERN', 'Must match the pattern "${pattern}"');

    return FragmentFactory.testAndPushError(
      `!${REGEX}.exec(value)`,
      ERROR_MESSAGE,
      { pattern: value }
    );
  },

  /**
   * [String] `minLength`: Minimum length of the string
   */
  minLength: function(value, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'LENGTH_MIN', 'Must be at least ${value} characters long');

    return FragmentFactory.testAndPushError(
      `value.length < ${value}`,
      ERROR_MESSAGE,
      { value: value }
    );
  },

  /**
   * [String] `maxLength`: Maximum length of the string
   */
  maxLength: function(value, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'LENGTH_MAX', 'Must be at most ${value} characters long');

    return FragmentFactory.testAndPushError(
      `value.length > ${value}`,
      ERROR_MESSAGE,
      { value: value }
    );
  },

  /**
   * [Object] `minProperties`: Minimum number of properties
   */
  minProperties: function(value, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'PROPS_MIN', 'Must contain at least ${value} properties in the object');

    return FragmentFactory.testAndPushError(
      `Object.keys(value).length < ${value}`,
      ERROR_MESSAGE,
      { value: value }
    );
  },

  /**
   * [Object] `maxProperties`: Maximum number of properties
   */
  maxProperties: function(value, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'PROPS_MAX', 'Must contain at most ${value} properties in the object');

    return FragmentFactory.testAndPushError(
      `Object.keys(value).length > ${value}`,
      ERROR_MESSAGE,
      { value: value }
    );
  },

  /**
   * [General] `enum`: Enumeration of the given values
   */
  enum: function(values, context) {
    let ENUM = context.getConstantExpression('ENUMS', JSON.stringify(values));
    let ENUM_STRING = values.map((value) => String(value)).join(', ');
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'ENUM', 'Must be one of ${values}');

    return FragmentFactory.testAndPushError(
      `${ENUM}.indexOf(value) === -1`,
      ERROR_MESSAGE,
      { values: ENUM_STRING }
    );
  },

};

/**
 * Generate an array of code fragments that perform the validataions as
 * described in the `facets` object.
 *
 * @param {Object} facets - The object with the facet names and values
 * @param {GeneratorContext} context - The generator context
 *
 * @returns {Array} Returns an array of validator code fragments
 */
function generateFacetFragments(facets, context) {
  let keys = Object.keys(facets);
  return keys.reduce(function(fragments, facet) {
    if (FACET_FRAGMENT_GENERATORS[facet] == null) {
      // throw new TypeError(`Unknown facet: '${facet}'`);
      // console.warn(`Unknown facet: '${facet}'`);
      return [];
    }

    return fragments.concat(
      FACET_FRAGMENT_GENERATORS[facet]( facets[facet], context )
    );
  }, []);
}


module.exports = {
  generateFacetFragments
};
