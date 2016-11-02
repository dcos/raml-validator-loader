require("babel-register");
var RAML = require('raml-1-parser');

var TEST_DIR = '/Users/icharala/Downloads/marathon-feature-pods/docs/docs/rest-api/public/api/v2';
var TEST_RAML = 'types/pod.raml';

var raml = RAML.loadApiSync( TEST_DIR + '/' + TEST_RAML );
var types = raml.types().reduce(function(types, type) {
  types[type.name()] = type;
  return types;
}, {});

var GeneratorContext = require('./generator2/GeneratorContext');
var Generator = require('./generator2/Generator');

var ctx = new GeneratorContext();
ctx.uses( types.Pod.runtimeType() );

// var code = TypeValidator.generateValidator( types.Pod.runtimeType(), ctx );
console.log(Generator.generate(ctx));

// console.log(types.Pod.runtimeType().getAdapters().map((adapter) => {
//   console.log(adapter.constructor.prototype);
//   return adapter.name && adapter.name() || adapter.nameId && adapter.nameId();
// }));

// var FacetGenerator = require('./generator2/FacetGenerator');
// var f = new FacetGenerator();
// f.compileType( types.Pod.runtimeType() );
// var buffer = '';
// buffer += 'var ERROR_MESSAGES = ' + JSON.stringify({
//   OBJECT_MISSING_PROPERTY: 'Missing property ${name}',
//   STRING_PATTERN_MISMATCH: 'String does not match the pattern ${pattern}',
//   LENGTH_BIGGER: 'Should be bigger than ${value}',
//   LENGTH_SMALLER: 'Should be smaller than ${value}',
// });
// buffer += 'var Rules = {\n';
// Object.keys(f.typeCode).forEach((key) => {
//   buffer += `\t${key}: function(value, path=[]) {\n`;
//   buffer += '\t\t' + f.typeCode[key].replace(/\n/g, '\n\t\t') + '\n';
//   buffer += '\t},\n'
// });
// buffer += '}\n';
// console.log(buffer);

// var GeneratorState = require('./generator/GeneratorState');
// var TypeGenerator = require('./generator/TypeGenerator');
// var state = new GeneratorState();
// state.pendingTypes.push(types.Pod);
// var type;
// while (type = state.pendingTypes.shift()) {
//   console.log(TypeGenerator.generateValidator(type, state));
// }

// console.log(types.Pod.validateInstanceWithDetailedStatuses(
//   {
//     id: 'bob',
//     'containers': [
//       {
//         'name': 'marley',
//         'resources': {

//         }
//       }
//     ]
//   }
// ));

// const util = require('util')
// console.log(util.inspect(raml.toJSON(), {showHidden: false, depth: null}))
