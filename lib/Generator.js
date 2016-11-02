import RAMLUtil from './utils/RAMLUtil';
import GeneratorUtil from './utils/GeneratorUtil';
import TypeValidator from './generators/TypeValidator';

module.exports = {

  /**
   * Generate a full source using the given generator context
   */
  generate: function(ctx) {

    // First build the validator fragments
    let itype;
    let validatorFragments = [
      'var Validators = {'
    ];
    while (itype = ctx.nextTypeInQueue()) {
      validatorFragments = validatorFragments.concat(
        [ `\t${RAMLUtil.getTypeName(itype)}: function(value, path=[]) {` ],
        GeneratorUtil.indentFragments(
          TypeValidator.generateTypeValidator(itype, ctx),
          '\t\t'
        ),
        [ '\t},' ]
      );
    }
    validatorFragments.push('}');

    // THEN build the constants table fragments
    let globalTableFragments = Object.keys(ctx.constantTables)
      .reduce(function(lines, tableName) {
        let table = ctx.constantTables[tableName];
        if (Array.isArray(table)) {
          return lines.concat(
            [ `var ${tableName} = [` ],
            GeneratorUtil.indentFragments( table ),
            [ `];` ]
          );
        } else {
          return lines.concat(
            [ `var ${tableName} = {` ],
            GeneratorUtil.indentFragments(
              Object.keys(table).map(function(key) {
                return `${key}: ${table[key]},`
              })
            ),
            [ `}` ]
          );
        }
      }, []);

    // Compose result
    return [].concat(
      globalTableFragments,
      '',
      validatorFragments,
      '',
      'module.exports = Validators;'
    ).join('\n');
  }

};
