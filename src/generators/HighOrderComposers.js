import FacetValidators from './FacetValidators';
import { indentFragments } from '../utils/GeneratorUtil';

const REGEX_MATCHING_REGEX = /[\[\]\(\)\{\}\\\^\$\.\|\?\*\+/]/g;

const HighOrderComposers = {

  /**
   * Compose a union validator
   */
  composeUnion(facets, leftValidatorFn, rightValidatorFn, context) {
    let fragments = [
      // First perform some type validations
      `var lErr = ${leftValidatorFn}(value, path);`,
      `var rErr = ${rightValidatorFn}(value, path);`,
      `if (lErr.length === 0) { return []; }`,
      `if (rErr.length === 0) { return []; }`,
      `if (lErr.length < rErr.length) {`,
      `\treturn lErr;`,
      `} else {`,
      `\treturn rErr;`,
      `}`
    ];

    return fragments;
  },

  /**
   * Compose a plain type, only by it's facets
   */
  composeFacets(facets, context) {
    return FacetValidators.generateFacetFragments(facets, context);
  },

  /**
   * Compose object properties fragments
   */
  composeObjectProperties(properties, facets, context) {
    let hasPropsDefined = false;
    let stringMatchers = [];
    let regexMatchers = [];
    let fragments = [];

    // Pre-process properties and create regex and string-based matchers
    properties.forEach(function(prop) {
      let typeValidatorFn = context.uses(prop.range());
      let key = prop.nameId();
      let keyRegex = prop.getKeyRegexp();

      // FIX: When the key looks like a regex, other RAML generators consider
      //      it a valid regex. However `raml-1-parser` does not understands it,
      //      keeping the `keyRegex` undefined.
      if ((keyRegex == null) && REGEX_MATCHING_REGEX.exec(key)) {
        keyRegex = key;
        if ((key[0] === '/') && (key[key.length - 1] === '/')) {
          keyRegex = key.slice(1, -1);
        }
      }

      // Store on the appropriate list
      if (!keyRegex) {
        stringMatchers.push([key, prop.isRequired(), typeValidatorFn]);
      } else {
        regexMatchers.push([keyRegex, prop.isRequired(), typeValidatorFn]);
      }

    });

    // If we do have regex-based matchers, we will have to iterate over
    // each property individually
    if (regexMatchers.length !== 0) {

      // Define properties only when needed
      hasPropsDefined = true;
      fragments.push(
        `var matched = [];`,
        `var props = Object.keys(value);`
      );

      fragments = regexMatchers.reduce(function(fragments, [regex, required, validatorFn]) {
        let REGEX = context.getConstantExpression('REGEX', `/${regex}/`);
        let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
          'PROP_MISSING_MATCH', 'Missing a property that matches `{name}`');

        fragments.push(
          `matched = props.filter(function(key) {`,
          `\treturn ${REGEX}.exec(key);`,
          `});`
        );

        // Check for required props
        if (required) {
          fragments.push(
            `if (matched.length === 0) {`,
            `\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}, {name: '${regex}'}));`,
            `}`
          );
        }

        // Validate property children
        return fragments.concat([
          `errors = matched.reduce(function(errors, property) {`,
          `\treturn errors.concat(${validatorFn}(value[property], path.concat([property])));`,
          `}, errors);`
        ]);
      }, fragments);
    }

    // Process string-based properties
    if (stringMatchers.length !== 0) {
      fragments = stringMatchers.reduce(function(fragments, [name, required, validatorFn]) {
        if (required) {
          return fragments.concat(
            HighOrderComposers.composeRequiredProperty(
              name, validatorFn, context
            )
          );

        } else {
          return fragments.concat(
            HighOrderComposers.composeProperty(
              name, validatorFn, context
            )
          );

        }
      }, fragments);
    }

    // The `additionalProperties` facet is a bit more complicated, since it
    // requires traversal thorugh it's keys
    if (facets.additionalProperties) {
        let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
          'PROP_ADDITIONAL_PROPS', 'Unexpected extraneous property `{name}`');

      // Don't re-define props if we already have them
      if (!hasPropsDefined) {
        fragments.push(
          `var props = Object.keys(value);`
        );
      }

      // Iterate over properties and check if the validators match
      fragments = fragments.concat(
        `props.forEach(function(key) {`,
        `\tvar found = false;`,
        stringMatchers.reduce(function(fragments, [name, unused1, unused2]) {
          return fragments.concat([
            `if (key === "${name}") found=true;`
          ]);
        }, []),
        regexMatchers.reduce(function(fragments, [regex, unused1, unused2]) {
          let REGEX = context.getConstantExpression('REGEX', `/${regex}/`);
          return fragments.concat([
            `if (${REGEX}.exec(key)) found=true;`
          ]);
        }, []),
        `\tif (!found) {`,
        `\t\terrors.push(new RAMLError(path, ${ERROR_MESSAGE}, {name: key}));`,
        `\t}`
        `});`
      );
    }


    return fragments;
  },

  /**
   * Compose a required property framgent
   */
  composeRequiredProperty(property, validatorFn, context) {
    let ERROR_MESSAGE = context.getConstantString('ERROR_MESSAGES',
      'PROP_MISSING', 'Missing property `{name}`');

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

module.exports = HighOrderComposers;
