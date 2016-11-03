module.exports = {

  /**
   * This function tries to put a name on the given run-time RAML type.
   *
   * @param {ITypeDefinition} itype - The runtime type of a RAML type
   * @returns {String} Returns a string with the name of the given type
   */
  getTypeName(itype) {

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

    // This looks like an anonymous on-the-fly array type
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
