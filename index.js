require("babel-register");
var RAML = require('raml-1-parser');

var TEST_DIR = '/Users/icharala/Downloads/marathon-feature-pods/docs/docs/rest-api/public/api/v2';
var TEST_RAML = 'types/test.raml';

var raml = RAML.loadApiSync( TEST_DIR + '/' + TEST_RAML );
var types = raml.types().reduce(function(types, type) {
  types[type.name()] = type;
  return types;
}, {});

var GeneratorContext = require('./lib/GeneratorContext');
var Generator = require('./lib/Generator');

var ctx = new GeneratorContext();
ctx.uses( types.TestType.runtimeType() );

console.log(Generator.generate(ctx));
