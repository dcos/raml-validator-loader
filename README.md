# raml-validator-loader

A webpack plugin that converts RAML rules into pure javascript-only validation routines

## Usage

```
import TypeValidators from './ramls/myTypes.raml';

// The raml-validator-loader will convert the RAML document into an object with
// a validation function for every type defined in your RAML.

var userInput = read_user_input();
var validationErrors = TypeValidators.MyType(userInput);

// Display errors
validationErrors.forEach((error) => {
  console.log('Error message: /' + error.path.join('/'));
  console.log('  Error path : ' + error.message);
});

```

## Installation

First install the module

```
npm install --save-dev raml-validator-loader
```

And then use it in your `webpack.config.js` like so:

```javascript
{
    module: {
        loaders: [
            { test: /\.raml$/, loader: "raml-validator-loader" }
        ]
    }
};

```

## API Reference

Each validation function has the following signature:

```

```



