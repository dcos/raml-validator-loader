import RAMLUtil from './utils/RAMLUtil';
import GeneratorUtil from './utils/GeneratorUtil';
import TypeValidator from './generators/TypeValidator';
import RAMLError from './payloads/RAMLError';

module.exports = {

  /**
   * Generate a comment
   */
  commentBlock: function(desc) {
    return [].concat(
      [ '/**' ],
      desc.split('\n').map((line) => ` * ${line}`),
      [ ' */']
    );
  },

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
      let typeName = RAMLUtil.getTypeName(itype);

      if (typeName === 'any') {
        validatorFragments = validatorFragments.concat(
          `\t${typeName}: function(value, _path) { return [] },`
        );
        continue;
      }

      validatorFragments = validatorFragments.concat(
        GeneratorUtil.indentFragments(
          this.commentBlock(
            itype.examples()[0].expandAsString()
          )
        ),
        [ `\t${typeName}: function(value, _path) {`,
          '\t\tvar path = _path || [];',
          '\t\tvar errors = [];' ],
        GeneratorUtil.indentFragments(
          TypeValidator.generateTypeValidator(itype, ctx),
          '\t\t'
        ),
        [ '\t\treturn errors;',
          '\t},', '' ]
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
            GeneratorUtil.indentFragments( table ).map(function(line) {
              return `${line},`;
            }),
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
            [ `};`, '' ]
          );
        }
      }, []);

    // Compose result
    return [].concat(
      [ RAMLError ],
      globalTableFragments,
      '',
      validatorFragments,
      '',
      'module.exports = Validators;'
    ).join('\n');
  }

};
