import { indentFragments } from '../utils/GeneratorUtil';
import RAMLUtil from '../utils/RAMLUtil';

const NATIVE_TYPE_VALIDATORS = {

  /**
   * Any
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  /* eslint-disable no-unused-vars */
  any(fragments, context) {
  /* eslint-enable no-unused-vars */
    // Everything passes
    return [];
  },

  /**
   * Nil
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  nil(fragments, context) {
    const ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_NULL', 'Expecting null');

    return [].concat(
      'if (value !== null) {',
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      '} else {',
        indentFragments( fragments ),
      '}'
    );
  },

  /**
   * Number type
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  NumberType(fragments, context) {
    const ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_NUMBER', 'Expecting a number');

    return [].concat(
      'if (isNaN(value)) {',
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      '} else {',
        indentFragments( fragments ),
      '}'
    );
  },

  /**
   * Integer type
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  IntegerType(fragments, context) {
    const ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_INTEGER', 'Expecting an integer number');

    return [].concat(
      'if (isNaN(value) || (value % 1 !== 0)) {',
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      '} else {',
        indentFragments( fragments ),
      '}'
    );
  },

  /**
   * Boolean type
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  BooleanType(fragments, context) {
    const ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_BOOLEAN', 'Expecting a boolean value');

    return [].concat(
      'if ((value !== false) && (value !== true)) {',
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      '} else {',
        indentFragments( fragments ),
      '}'
    );
  },

  /**
   * String type
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  StringType(fragments, context) {
    const ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_STRING', 'Expecting a string');

    return [].concat(
      'if (typeof value != "string") {',
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      '} else {',
        indentFragments( fragments ),
      '}'
    );
  },

  /**
   * Date/Time type
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  DateTimeType(fragments, context) {
    const ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_DATETIME', 'Expecting a date/time string');

    return [].concat(
      'if (isNaN(new Date(value).getTime())) {',
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      '} else {',
        indentFragments( fragments ),
      '}'
    );
  },

  /**
   * Object type
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  object(fragments, context) {
    const ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_OBJECT', 'Expecting an object');

    return [].concat(
      'if ((typeof value != "object") || (value === null)) {',
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      '} else {',
        indentFragments( fragments ),
      '}'
    );
  },

  /**
   * Array type
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  array(fragments, context) {
    const ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_ARRAY', 'Expecting an array');

    return [].concat(
      'if (!Array.isArray(value)) {',
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      '} else {',
        indentFragments( fragments ),
      '}'
    );
  },

  /**
   * Union type
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  /* eslint-disable no-unused-vars */
  union(fragments, context) {
  /* eslint-enable no-unused-vars */
    return fragments;
  }

};

module.exports = {

  /**
   * Wrap a set of fragments in a condition only if the value passes the native
   * type test.
   *
   * @param {Array} fragments - The validator fragment code lines so far
   * @param {ITypeDefinition} itype - The RAML type to create validation for
   * @param {GeneratorContext} context - The current generator context
   * @return {Array} - The type validator code lines
   */
  wrapWithNativeTypeValidator(fragments, itype, context) {
    const typeName = RAMLUtil.getBuiltinTypeName(itype);
    if (NATIVE_TYPE_VALIDATORS[typeName] === undefined) {
      throw TypeError(`Unknown native type ${typeName}`);
    }

    return NATIVE_TYPE_VALIDATORS[typeName](fragments, context);
  }

};
