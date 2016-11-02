import FacetValidators from './FacetValidators';
import GeneratorUtil from '../utils/GeneratorUtil';

module.exports = {

  /**
   * Compose an array validator
   */
  composeArray(facets, validatorFn, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'TYPE_NOT_ARRAY', 'Expecting an array here');

    let fragments = [
      // First perform some type validations
      `if (!Array.isArray(value)) {`,
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}));`,
      `} else {`,
        `\tvalue.forEach(function(value, i)) {`,
          `\t\terrors = errors.concat(${validatorFn}(value, path.concat([''+i])));`,
        `\t})`,
    ];

    // Then process the array facets
    fragments = fragments.concat(
      GeneratorUtil.indentFragments(
        FacetValidators.generateFacetFragments(facets, context)
      )
    );

    // And finaly close the condition
    fragments.push(
      `}`
    );
    return fragments;
  },

  /**
   * Compose a union validator
   */
  composeUnion(facets, leftValidatorFn, rightValidatorFn, context) {
    return [];
    // throw new Error('Not implemented');
  },

  /**
   * Compose a simple, facet-based
   */
  composePlain(facets, context) {
    return FacetValidators.generateFacetFragments(facets, context);
  },

  /**
   * Compose a required property framgent
   */
  composeRequiredProperty(property, validatorFn, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'PROP_MISSING', 'Missing property `${name}`');

    return [
      `if (value.${property} == null) {`,
        `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}, {name: '${property}'}));`,
      `} else {`,
        `\terrors = errors.concat(${validatorFn}(value.${property}, path.concat(['${property}'])));`,
      `}`
    ];
  },

  /**
   * Compose a property framgent
   */
  composeProperty(property, validatorFn, context) {
    return [
      `if (value.${property} != null) {`,
        `\terrors = errors.concat(${validatorFn}(value.${property}, path.concat(['${property}'])));`,
      `}`
    ];
  }

};
