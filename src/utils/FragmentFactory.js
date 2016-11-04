module.exports = {

  /**
   * Simple fragment factory that tests the given expression and if it fails,
   * it creates a new RAMLError instance with the error message from the
   * constant specified. If that constant is using templates, you can use the
   * errorMessageVariables to pass values for these variables.
   *
   * @param {String} testExpr - The javascript test expression
   * @param {String} errorConstant - The error constant from the ERROR_MESSAGES global table
   * @param {Object} [errorMessageVariables] - Optional values for the error message templates
   *
   * @returns {String} Returns the contents of the javascript fragment
   */
  testAndPushError(testExpr, errorConstant, errorMessageVariables={}) {
    let variablesExpr = JSON.stringify(errorMessageVariables);

    return [
      `if (${testExpr}) {`,
        `\terrors.push(new RAMLError(path, ${errorConstant}, ${variablesExpr}));`,
      '}'
    ];
  },

  /**
   * Delegate the property validation to the given delegate function.
   * Such functions can be any other validation function generated so far or
   * will be generated in the future.
   *
   * @param {String} property - The property whose check you want to delegate
   * @param {}
   */
  delegatePropertyValidation(property, delegateFn) {
    return [
      `errors = errors.concat(RAMLValidators.${delegateFn}(value.${property}, path.concat['${property}']));`
    ];
  },

  /**
   * Run the given expression only if the given property is not missing
   */
  runIfPropNotMissing(property, expression) {
    let indentedExpression = '\t' + expression.replace(/\n/g, '\n\t');

    return [
      `if (value.${property} != null) {`,
        indentedExpression,
      `}`
    ];
  }

};
