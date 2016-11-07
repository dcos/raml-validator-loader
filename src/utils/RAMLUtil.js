import crypto from 'crypto';

module.exports = {

  /**
   * This function checks if the given runtime type is an inline defininition,
   * since such definitions needs further specialisation.
   *
   * Keep in mind that the RAML parser considers this:
   *
   * properties:
   *   arrayProp:
   *     type: array
   *
   * To be different than this:
   *
   * properties:
   *   arrayProp:
   *     type: array
   *     minimum: 0
   *
   * Since the latter is defining an 'anonymous' type in-place
   *
   * @param {ITypeDefinition} itype - The runtime type of a RAML type to check
   * @returns {Boolean} Returns true if this type is an in-line definition
   */
  isInlineType(itype) {
    // So, a type that has no name, but is either an array or a value type
    // is considered an in-line definition, and has a dedicated specialisation
    return (itype.nameId() == null) &&
           (itype.isArray() || itype.isValueType());
  },

  /**
   * Return a comment that describes this inline type
   *
   * @param {ITypeDefinition} itype - The runtime type of a RAML type
   * @returns {String} The comment to the specialised inline type
   */
  getInlineTypeComment(itype) {
    let facets = itype.getFixedFacets();
    let comment = 'This is an in-line specialisation of ' + this.getInlineTypeBase(itype)
      + '\n with the following constraints:\n\n';
    return comment + Object.keys(facets).map(function(name) {
      if (name === 'items') {
        return `- ${name}: ${this.getTypeName(facets[name].extras.nominal)}`;
      } else {
        return `- ${name}: ${facets[name]}`;
      }
    }, this).join('\n');
  },

  /**
   * Walk up the type and find out the built-in type
   *
   * @param {ITypeDefinition} itype - The runtime type of a RAML type
   * @returns {ITypeDefinition|null} The builtin type or null if not found
   */
  getBuiltinTypeName(itype) {
    if (itype.isBuiltIn()) {
      return itype.nameId();
    }

    return itype.allSuperTypes().find(function(type) {
      return type.isBuiltIn().nameId();
    });

    return null;
  },

  /**
   * Returns the base type of the given in-line type definition
   *
   * @param {ITypeDefinition} itype - The runtime type of a RAML type
   * @returns {String} The string name of the base type
   */
  getInlineTypeBase(itype) {
    let typeName = itype.nameId();
    if (typeName == null) {
      if (itype.isArray()) {
        typeName = this.getTypeName(itype.componentType());
      } else if (itype.isValueType()) {
        typeName = this.getTypeName(itype.superTypes()[0]);
      } else {
        typeName = 'any';
      }
    }

    return typeName;
  },

  /**
   * Returns a unique name for this inline type, by calculating a checksum
   * of the values of it's facets.
   *
   * @param {ITypeDefinition} itype - The runtime type of a RAML type
   * @returns {String} A unique name for this type, based on it's facets values
   */
  getInlineTypeName(itype) {
    // Calculate the checksum of the facets
    let facets = itype.getFixedFacets();
    let facetKeys = Object.keys(facets).sort();
    let expr = facetKeys.reduce(function(expr, key) {
      return expr + '|' + key + '=' + facets[key];
    }, '');

    // Calculate unique name
    let typeName = this.getInlineTypeBase(itype);
    return 'inline' + typeName[0].toUpperCase() + typeName.substr(1) + '_' +
            crypto.createHash('md5').update(expr).digest('hex');
  },

  /**
   * This function tries to put a name on the given run-time RAML type.
   *
   * @param {ITypeDefinition} itype - The runtime type of a RAML type
   * @returns {String} Returns a string with the name of the given type
   */
  getTypeName(itype) {

    // Inline types are processed first
    if (this.isInlineType(itype)) {
      return this.getInlineTypeName(itype);
    }

    // The moment we have found a named type we are good
    if (itype.nameId() != null) {

      // There are cases with anonymous arrays
      if (!itype.nameId() && itype.isArray()) {
        return this.getTypeName(itype.componentType()) + 'AsArray';
      }

      return itype.nameId();
    }

    // If this is a value type, walk the tree upwards
    if (itype.isValueType()) {
      return this.getTypeName(itype.superTypes()[0])
    }

    // A special case, where we have a structured item, but without an id
    // or properties, that's an empty field definition. For example:
    //
    // labels?:
    //   type: labels.KVLabels
    //   description: some text
    //
    if (itype.hasStructure() && itype.superTypes().length) {
      return this.getTypeName(itype.superTypes()[0]);
    }

    // This looks like an anonymous inline array type
    if (itype.isArray()) {
      return this.getTypeName(itype.componentType()) + 'AsArray';
    }

    // That looks like an unnamed type :/
    throw new Error('Don\'t know how to handle anonymous, structured types');
  },

  /**
   * This function walks up the type tree until it reaches a native type
   * and then returns it's type.
   */
  getBuiltinType(itype) {
    if (itype.isBuiltIn()) {
      return itype;
    }

    return itype.allSuperTypes().find(function(type) {
      return type.isBuiltIn();
    });
  }

};
