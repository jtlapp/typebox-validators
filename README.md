# typebox-errors

TypeBox validators with custom errors, safe multi-tier error handling, discriminated unions

# TODO

- probably restricted to use with TypeBox schemas because uses TypeBox validation and
  TypeBox uses symbols
- test in browser context. Maybe use https://github.com/egoist/tsup. But how to make it easy for devs to use this in a browser?

## Overview

The [TypeBox](https://github.com/sinclairzx81/typebox) JSON Schema validator may be the [fastest JSON validator](https://moltar.github.io/typescript-runtime-type-benchmarks/) for JavaScript/TypeScript not requiring a development-time precompilation step. TypeBox provides the ability to both construct and validate JSON, but it is strictly standards compliant and does not offer commonly needed additional functionality.

This library provides JSON Schema validators having this additional functionality. It wraps TypeBox so you can get TypeBox validation performance and limit your use of TypeBox to just JSON Schema specification.

The library provides the following abilities, each of which is optional:

1. Replace TypeBox's validation error messages with your own error messages.
2. Fail validation at the first encountered validation error, reporting just this error. This minimizes server resources consumed by faulty or malevolent clients.
3. Collect all validation errors, such as for feedback on form user input in a browser.
4. Remove unrecognized properties from validated objects, which is important for Internet APIs.
5. Validate discriminated unions, yielding only errors for the matching member schema.
6. Validate heterogeneous unions of objects that need not have any properties in common, yielding only errors for the matching member schema. Useful for branded types.
7. Compile a TypeBox schema on its first use, subsequently using the cached compilation (lazy compilation).
8. Report all validation errors within a single string, such as for debugging purposes.

## Installation

Install with your preferred dependency manager:

```
npm install typebox-validators

yarn add typebox-validators

pnpm add typebox-validators
```

## Usage

Select the validator or validators you want to use. The following classes are available:

- `AbstractValidator` &mdash; Abstract base class of all validators.
- `StandardValidator` &mdash; Non-compiling validator that validates TypeBox schemas using TypeBox validation behavior.
- `CompilingStandardValiator` &mdash; Compiling validator that validates TypeBox schemas using TypeBox validation behavior. This validator compiles the schema on the first validation, caches the compilation, and thereafter uses the cached compilation.
- `DiscriminatedUnionValidator` &mdash; Non-compiling validator that validates a union of object types, each of which has a discriminant key whose value identifies the object type. This validator validates objects against the schema for the object's type, yielding only errors relevant to that type.
- `CompilingDiscriminatedUnionValidator` &mdash; Compiling validator that validates a union of object types, each of which has a discriminant key whose value identifies the object type. This validator validates objects against the schema for the object's type, yielding only errors relevant to that type. It compiles the schema for an object type on the first validaton of that type, caches the compilation, and thereafter uses the cached compilation for objects of that type.
- `HeterogeneousUnionValidator` &mdash; Non-compiling validator that validates a union of object types, each of which has at least one required property name unique to the object type among all object types of the union. This validator validates objects against the schema for the object's type, yielding only errors relevant to that type.
- `CompilingHeterogeneousUnionValidator` &mdash; Compiling validator that validates a union of object types, each of which has at least one required property name unique to the object type among all object types of the union. This validator validates objects against the schema for the object's type, yielding only errors relevant to that type. It compiles the schema for an object type on the first validaton of that type, caches the compilation, and thereafter uses the cached compilation for objects of that type.

Create a validator for a particular schema and use that validator to validate a value against its schema:

```ts
import { Type } from '@sinclaim/typebox';
import { StandardValidator } from 'typebox-validators';

const schema = Type.Object({
  handle: Type.String(
    {
      minLength: 5,
      maxLength: 10,
      pattern: '^[a-zA-Z]+$',
    },
    {
      errorMessage: 'must be a string of 5 to 10 letters',
    }
  ),
  count: Type.Integer({ minimum: 0 }),
});

const validator = new StandardValidator(schema);
const value = { handle: '1234', count: -1 };

// returns false:
validator.test(value);

// throws with only error 'must be a string of 5 to 10 letters':
validator.assert(value);

// throws with error 'must be a string of 5 to 10 letters' and TypeBox's
//  default error message for an integer being less than the minimum:
validator.validate(value);

// returns an iterable providing the two errors:
validator.errors(value);
```

`assert` and `validate` methods throw a [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts) error when validation fails, reporting only the first error for `assert` methods and reporting all errors for `validate` methods. `assert` methods are safer to use on the server because TypeBox ensures that the `maxLength` and `maxItems` contraints are tested before testing regular expressions. `test` is faster than `assert`, which is faster than `validate` when a least one error occurs.

The union validators only work on schemas of type `TUnion<TObject[]>`. The discriminated union validators assume the discriminant key is named `kind`, unless you provide a `discriminantKey` option indicating otherwise. The discriminated and heterogeneous union validators both report an error when the value is not one of the types in the union. To override the default message for this error, specify your message in an `errorMessage` option on the union's schema.

Any schema can provide an `errorMessage` option to indicate what error message should be used when a value doesn't satify the constraints of that particular schema. If provided, this message causes all errors reported for that schema to be collapsed into a single error having the message. The error message does not apply if the failed constraints are actually on a further nested schema.

The validators all offer the same methods:

<!-- prettier-ignore -->
| Method | Description |
| --- | --- |
| test(value) | Fast test of whether the value satisfies the schema. Returns a boolean, with `true` meaning valid. |
| assert(value, msg?) | Checks for at most one error and throws [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts) to report the error. If `msg` is provided, this becomes the `message` of the exception, except that the substring `{error}` (if present) is replaced with the specific error message. The exception's `details` property provides the details of the error. |
| assertAndClean(value, msg?) | Same as `assert`, except that when valid, the method also removes unrecognized properties from the value, if the value is an object. |
| assertAndCleanCopy(value, msg?) | Same as `assert`, except that when valid, the method returns a copy of the value with unrecognized properties removed. |
| validate(value, msg?) | Checks for all errors and throws [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts) to report them. If `msg` is provided, this becomes the `message` of the exception. The exception's `details` property provides the details of the errors. |
| validateAndClean(value, msg?) | Same as `validate`, except that when valid, the method also removes unrecognized properties from the value, if the value is an object. |
| validateAndCleanCopy(value, msg?) | Same as `validate`, except that when valid, the method returns a copy of the value with unrecognized properties removed. |
| errors(value) | Returns an iterable that yields all validation errors as instances of [`ValueError`](https://github.com/sinclairzx81/typebox/blob/master/src/errors/errors.ts#L99). When there are no errors, the iterable yields no values. |

If you want validation to fail when an object has properties not given by the schema, use the [`additionalProperties`](https://json-schema.org/understanding-json-schema/reference/object.html#additional-properties) option in the object's schema. In this case, there would be no need to use the various "clean" methods.

The `details` property of a [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts) contains an array of [`ValueError`](https://github.com/sinclairzx81/typebox/blob/master/src/errors/errors.ts#L99) instances, one for each detected error. Call `toString()` on the exception to get a single string that describes all of the errors found in `details`.

## Discriminated Union Examples

```ts
const schema1 = Type.Union([
  Type.Object({
    kind: Type.Literal('string'),
    val: Type.String(),
  }),
  Type.Object({
    kind: Type.Literal('integer'),
    val: Type.Integer(),
    units: Type.Optional(Type.String()),
  }),
]);

const validator1 = new DiscriminatedUnionValidator(schema1);

// throws exception with message "Invalid value" and the single error
//  "Object type not recognized" for path "":
validator1.assert({ kind: 'float', val: 1.5 });

// throws exception with message "Oopsie! val - Expected integer"
//  and the single error "Expected integer" for path "/val":
validator1.assert({ kind: 'integer', val: 1.5 }, 'Oopsie! {error}');
```

```ts
const schema2 = Type.Union(
  [
    Type.Object({
      __type: Type.Literal('string'),
      val: Type.String({ errorMessage: 'Must be a string' }),
    }),
    Type.Object({
      __type: Type.Literal('integer'),
      val: Type.Integer({ errorMessage: 'Must be an integer' }),
      units: Type.Optional(Type.String()),
    }),
  ],
  { discriminantKey: '__type', errorMessage: 'Unknown type' }
);

const validator2 = new DiscriminatedUnionValidator(schema2);

// throws exception with message "Invalid value" and the single error
//  "Unknown type" for path "":
validator2.assert({ __type: 'float', val: 1.5 });

// throws exception with message "Oopsie! val - Must be an integer"
//  and the single error "Must be an integer" for path "/val":
validator2.assert({ __type: 'integer', val: 1.5 }, 'Oopsie! {error}');
```

## Heterogeneous Union Examples

```ts
const schema3 = Type.Union([
  Type.Object({
    summaryBrand: Type.String(),
    name: Type.String(),
    address: Type.String()
    zipCode: Type.String()
  }),
  Type.Object({
    detailedBrand: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    streetAddress: Type.String(),
    city: Type.String(),
    state: Type.String(),
    zipCode: Type.String()
  }),
]);

const validator3 = new DiscriminatedUnionValidator(schema3);

// throws exception with message "Bad info" and the single error
//  "Object type not recognized" for path "":
validator3.assert({ name: 'Jane Doe', zipcode: 12345 }, "Bad info");

// throws exception with message "Bad info: address - Expected string"
//  and the single error "Expected string" for path "/address":
validator3.assert({ summaryBrand: '', name: 'Jane Doe' }, 'Bad info: {error}');
```

```ts
const schema4 = Type.Union([
  Type.Object({
    name: Type.String(),
    address: Type.String({ errorMessage: 'Required string' })
    zipCode: Type.String()
  }),
  Type.Object({
    firstName: Type.String(),
    lastName: Type.String({ errorMessage: 'Required string' }),
    streetAddress: Type.String(),
    city: Type.String(),
    state: Type.String(),
    zipCode: Type.String()
  }),
]);

const validator4 = new DiscriminatedUnionValidator(schema4);

// throws exception with message "Bad info" and the single error
//  "Required string" for path "/address":
validator4.assert({ name: 'Jane Doe', zipcode: 12345 }, "Bad info");

// throws exception with message "Bad info: lastName - Required string"
//  and the single error "Required string" for path "/lastName":
validator4.assert({ firstName: 'Jane', zipcode: 12345 }, 'Bad info: {error}');
```

## License

MIT License. Copyright &copy; 2023 Joseph T. Lapp
