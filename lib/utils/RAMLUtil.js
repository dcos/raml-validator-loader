module.exports = {

  /**
   * This function tries to put a name on the given run-time RAML type.
   *
   * @param {ITypeDefinition} itype - The runtime type of a RAML type
   * @returns {String} Returns a string with the name of the given type
   */
  getTypeName(itype) {

    // If this type is an array, add the '_array' suffix
    if (itype.isArray()) {
      return this.getTypeName(itype.componentType()) + '_array';
    }

    // The moment we have found a named type we are good
    if (itype.nameId() != null) {
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

    // That looks like an unnamed type :/
    throw new Error('Don\'t know how to handle anonymous, structured types');
  }

};
