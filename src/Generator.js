import RAMLUtil from './utils/RAMLUtil';
import GeneratorUtil from './utils/GeneratorUtil';
import TypeValidator from './generators/TypeValidator';
import RAMLErrorPayload from './payloads/RAMLError';

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

      let comment = itype.examples()[0].expandAsString();
      if (RAMLUtil.isInlineType(itype)) {
        comment += '\n\n' + RAMLUtil.getInlineTypeComment(itype);
      }

      validatorFragments = validatorFragments.concat(
        GeneratorUtil.indentFragments(
          this.commentBlock( comment )
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
    validatorFragments.push('};');
    validatorFragments.push('return Validators;');

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
      'module.exports = (function() {',
      [ RAMLErrorPayload ],
      globalTableFragments,
      '',
      validatorFragments,
      '',
      '})();'
    ).join('\n');
  }

};
