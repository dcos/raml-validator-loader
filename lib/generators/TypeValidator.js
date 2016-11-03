import FacetValidators from './FacetValidators';
import GeneratorUtil from '../utils/GeneratorUtil';
import HighOrderComposers from './HighOrderComposers';
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
    if (itype.isArray()) {
      let typeValidatorFn = context.uses( itype.componentType() );
      fragments = HighOrderComposers.composeArray(
          itype.getFixedFacets(), typeValidatorFn, context
        );

    } else if (itype.isUnion()) {
      let leftTypeValidatorFn = context.uses( itype.leftType() );
      let rightTypeValidatorFn = context.uses( itype.rightType() );
      fragments = HighOrderComposers.composeUnion(
          itype.getFixedFacets(), leftTypeValidatorFn,
          rightTypeValidatorFn, context
        );

    } else {
      fragments = HighOrderComposers.composePlain(
          itype.getFixedFacets(), context
        );

    }

    // In the special case of the object, we are generating validator fragments
    // for every single property
    // if (typeName === 'Image') {
    //   console.log('>>>>>>>>>');
    //   console.log('isObject=', itype.isObject());
    //   console.log('isArray=', itype.isArray());
    //   console.log('isBuiltIn=', itype.isBuiltIn());
    //   console.log('isExternal=', itype.isExternal());
    //   console.log('isGenuineUserDefinedType=', itype.isGenuineUserDefinedType());
    //   console.log('isObject=', itype.isObject());
    //   console.log('isUnion=', itype.isUnion());
    //   console.log('isUserDefined=', itype.isUserDefined());
    //   console.log('isValueType=', itype.isValueType());
    //   console.log('props=', itype.properties());
    //   console.log('allProps=', itype.allProperties());
    //   console.log('<<<<<<<<<');
    // }
    if (itype.isObject()) {
      fragments = fragments.concat(
          HighOrderComposers.composeObjectProperties(
              itype.allProperties(), context
            )
        );
    }

    // Return the composed fragments
    return fragments;
  }

};
