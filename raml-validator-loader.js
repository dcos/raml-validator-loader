var RAML = require('raml-1-parser');
var path = require('path');
var GeneratorContext = require('./lib/GeneratorContext');
var Generator = require('./lib/Generator');

/**
 * Recursive function to extract all related paths from RAML ast
 */
function collectUsedFiles(ast, fileDir) {
  return ast.uses().reduce(function(files, use) {
    var usePath = path.join(fileDir, use.value());
    return files.concat(
      usePath,
      collectUsedFiles(use.ast(), path.dirname(usePath))
    );
  }, []);
}

module.exports = function(source) {

  // First load the entire RAML tree
  var raml = RAML.parseRAMLSync(source, {
    filePath: this.resourcePath
  });

  // Traverse the AST to find out dependent files, in order to inform
  // webpack for the volatile components and invalidate caches
  var files = collectUsedFiles(raml, path.dirname(this.resourcePath));
  files.forEach( function( item, index, inputArray ) {
    if (files.indexOf(item) == index) {
      this.addDependency(item);
    }
  }, this);

  // Prepare generator
  var ctx = new GeneratorContext();

  // Use all types in this RAML specification
  raml.types().forEach(function(type) {
    ctx.uses( type.runtimeType() );
  });

  // Generate source
  return Generator.generate(ctx);
};
