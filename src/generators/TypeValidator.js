import FacetValidators from './FacetValidators';
import GeneratorUtil from '../utils/GeneratorUtil';
import HighOrderComposers from './HighOrderComposers';
import NativeValidators from './NativeValidators';
import RAMLUtil from '../utils/RAMLUtil';

module.exports = {

  /**
   * Generate a validator function for the given internal RAML type
   *
   * @param {ITypeDefinition} itype - The run-time RAML type to generate a validator for
   * @param {GeneratorContext} context - The generator context
   *
   * @returns {String} - Returns the function javascript source
   */
  generateTypeValidator(itype, context) {
    let typeName = RAMLUtil.getTypeName(itype);
    let fragments = [];

    // We first use the high-order composers to generate the base code
    // depending on the major classifications of the validators
    if (itype.isUnion()) {
      let leftTypeValidatorFn = context.uses( itype.leftType() );
      let rightTypeValidatorFn = context.uses( itype.rightType() );
      fragments = HighOrderComposers.composeUnion(
          itype.getFixedFacets(), leftTypeValidatorFn,
          rightTypeValidatorFn, context
        );

    } else {
      fragments = HighOrderComposers.composeFacets(
          itype.getFixedFacets(), context
        );

    }

    // If we have an object, iterate over it's properties and create
    // validation constraints
    if (itype.isObject()) {
      fragments = fragments.concat(
          HighOrderComposers.composeObjectProperties(
              itype.allProperties(), itype.facets(), context
            )
        );
    }

    // Wrap everything in type validation
    let type = RAMLUtil.getBuiltinType(itype);
    return NativeValidators.wrapWithNativeTypeValidator(
      fragments, type, context
    );
  }

};
