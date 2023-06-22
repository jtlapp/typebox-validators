# typebox-validators

TypeBox validators with custom errors, safe error handling, discriminated unions

[API Reference](https://jtlapp.github.io/typebox-validators/)

## Overview

The [TypeBox](https://github.com/sinclairzx81/typebox) JSON Schema validator may be the [fastest JSON validator](https://moltar.github.io/typescript-runtime-type-benchmarks/) for JavaScript/TypeScript not requiring a development-time code generation step. TypeBox provides the ability to both construct and validate JSON, but it is strictly standards compliant and does not offer commonly needed additional functionality.

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

Tested for Node.js and Chrome.

## Installation

Install with your preferred dependency manager:

```
npm install typebox-validators

yarn add typebox-validators

pnpm add typebox-validators
```

## Usage

Select the validator or validators you want to use. The validators are split into different import files to prevent applications from including classes they don't need.

Imported from `typebox-validators`:

- `AbstractValidator` &mdash; Abstract base class of all validators, should you need to abstractly represent a validator.
- `ValidationException` &mdash; Exception reporting validation failure, for methods that throw an exception on failure. Does not includes a stack trace.

Imported from `typebox-validators/standard`:

- `StandardValidator` &mdash; Non-compiling validator that validates TypeBox schemas using TypeBox validation behavior.
- `CompilingStandardValiator` &mdash; Compiling validator that validates TypeBox schemas using TypeBox validation behavior. This validator compiles the schema on the first validation, caches the compilation, and thereafter uses the cached compilation.

Imported from `typebox-validators/discriminated`:

- `DiscriminatedUnionValidator` &mdash; Non-compiling validator that validates a union of object types, each of which has a discriminant key whose value identifies the object type. This validator validates objects against the schema for the object's type, yielding only errors relevant to that type.
- `CompilingDiscriminatedUnionValidator` &mdash; Compiling validator that validates a union of object types, each of which has a discriminant key whose value identifies the object type. This validator validates objects against the schema for the object's type, yielding only errors relevant to that type. It compiles the schema for an object type on the first validaton of that type, caches the compilation, and thereafter uses the cached compilation for objects of that type.

Imported from `typebox-validators/heterogeneous`:

- `HeterogeneousUnionValidator` &mdash; Non-compiling validator that validates a union of object types, each of which has at least one type identifying key. This key is the name of a required property that is unique among all object types of the union, whose schema includes `typeIdentifyingKey: true`. This validator validates objects against the schema for the object's type, yielding only errors relevant to that type.
- `CompilingHeterogeneousUnionValidator` &mdash; Compiling validator that validates a union of object types, each of which has at least one type identifying key. This key is the name of a required property that is unique among all object types of the union, whose schema includes `typeIdentifyingKey: true`. This validator validates objects against the schema for the object's type, yielding only errors relevant to that type. It compiles the schema for an object type on the first validaton of that type, caches the compilation, and thereafter uses the cached compilation for objects of that type.
- `TypeIdentifyingKey` &mdash; Convenience class that wraps a property's schema to set `typeIdentifyingKey` to `true` for the schema.

Create a validator for a particular schema and use that validator to validate a value against its schema:

```ts
import { Type } from '@sinclaim/typebox';
import { StandardValidator } from 'typebox-validators/standard';

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

// returns false indicating an error:
validator.test(value);

// returns an iterable providing the two errors:
validator.testReturningErrors();

// returns the first error:
validator.testReturningFirstError();

// throws with error 'must be a string of 5 to 10 letters':
validator.assert(value);

// throws with error 'must be a string of 5 to 10 letters' and TypeBox's
//  default error message for an integer being less than the minimum:
validator.validate(value);

// returning an iterable providing the two errors:
validator.errors(value);

// returning the first error:
validator.firstError(value);
```

`assert` and `validate` methods throw a [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts) error when validation fails, reporting only the first error for `assert` methods and reporting all errors for `validate` methods. `assert` methods are safer to use on the server because TypeBox ensures that the `maxLength` and `maxItems` contraints are tested before testing regular expressions. `test` is faster than `assert`, which is faster than `validate` when a least one error occurs.

The union validators only work on schemas of type `TUnion<TObject[]>`. Discriminated union validators assume the discriminant key is named `kind`, unless you provide a `discriminantKey` option indicating otherwise. The type identifying key of each heterogeneous union member can be assigned either by giving the key's schema a `typeIdentifyingKey: true` option or by wrapping the key's schema in a `TypeIdentifyinKeys(schema)` call (which assigns this option). The discriminated and heterogeneous union validators both report an error when the value is not one of the types in the union. To override the default message for this error, specify your message in an `errorMessage` option on the union's schema.

Any schema can provide an `errorMessage` option to indicate what error message should be used when a value doesn't satify the constraints of that particular schema. If provided, this message causes all errors reported for that schema to be collapsed into a single error having the message. The error message does not apply if the failed constraints are actually on a further nested schema.

The validators all offer the same methods:

<!-- prettier-ignore -->
| Method | Description |
| --- | --- |
| `test`(value) | Fast test of whether the value satisfies the schema. Returns a boolean, with `true` meaning valid. |
| `testReturningErrors`(value) | Fast test of whether the value satisfies the schema, returning `null` if there are no errors, otherwise returning an iterable that yields all validation errors as instances of [`ValueError`](https://github.com/sinclairzx81/typebox/blob/master/src/errors/errors.ts#L99). |
| `testReturningFirstError`(value) | Fast test of whether the value satisfies the schema, returning `null` if there are no errors, otherwise returning the first [`ValueError`](https://github.com/sinclairzx81/typebox/blob/master/src/errors/errors.ts#L99). |
| `assert`(value, msg?) | Checks for at most one error and throws [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts) to report the error. If `msg` is provided, this becomes the `message` of the exception, except that the substring `{error}` (if present) is replaced with the specific error message. The exception's `details` property provides the details of the error. |
| `assertAndClean`(value, msg?) | Same as `assert`, except that when valid, the method also removes unrecognized properties from the value, if the value is an object. |
| `assertAndCleanCopy`(value, msg?) | Same as `assert`, except that when valid, the method returns a copy of the value with unrecognized properties removed. |
| `validate`(value, msg?) | Checks for all errors and throws [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts) to report them. If `msg` is provided, this becomes the `message` of the exception. The exception's `details` property provides the details of the errors. |
| `validateAndClean`(value, msg?) | Same as `validate`, except that when valid, the method also removes unrecognized properties from the value, if the value is an object. |
| `validateAndCleanCopy`(value, msg?) | Same as `validate`, except that when valid, the method returns a copy of the value with unrecognized properties removed. |
| `errors`(value) | Returns an iterable that yields all validation errors as instances of [`ValueError`](https://github.com/sinclairzx81/typebox/blob/master/src/errors/errors.ts#L99). When there are no errors, the iterable yields no values. Call `test` first for better performance. |
| `firstError`(value) | Returns the first [`ValueError`](https://github.com/sinclairzx81/typebox/blob/master/src/errors/errors.ts#L99), if there is a validation error, and `null` otherwise. Call `test` first for better performance. |

If you want validation to fail when an object has properties not given by the schema, use the [`additionalProperties`](https://json-schema.org/understanding-json-schema/reference/object.html#additional-properties) option in the object's schema. In this case, there would be no need to use the various "clean" methods.

The `details` property of a [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts) contains an array of [`ValueError`](https://github.com/sinclairzx81/typebox/blob/master/src/errors/errors.ts#L99) instances, one for each detected error. Call `toString()` on the exception to get a single string that describes all of the errors found in `details`.

## ValidationException

When an `assert` or `validate` method fails validation, it throws a [`ValidationException`](https://github.com/jtlapp/typebox-validators/blob/main/src/lib/validation-exception.ts). The inputs to the constructor are a mandatory error message and an optional array of [`ValueError`](https://github.com/sinclairzx81/typebox/blob/master/src/errors/errors.ts#L99)s. These are available via the `message` and `details` properties.

```ts
constructor(readonly message: string, readonly details: ValueError[] = [])
```

Call the `toString()` method to get a string represenation that includes the error message and a bulleted list of all the detailed errors. Each bullet provides the object path to the erroring field and the error message for the field.

`ValidationException` does not subclass JavaScript's `Error` class. This prevents a stack trace from being generated for each exception, improving performance and saving memory. However, this means that if you validate for purposes of verifying program correctness, you'll need the error message to include enough information to identify the particular code that errored.

Also, not subclassing `Error` has implications for testing in Jest and Chai. Asynchronous exceptions require special treatment, as `toThrow()` (Jest) and `rejectedWith()` (Chai + [chai-as-promised](https://www.chaijs.com/plugins/chai-as-promised/)) will not detect the exception. Test for asynchronous validation exceptions as follows instead:

```ts
import { ValidationException } from 'typebox-validators';

const wait = () =>
  new Promise((_resolve, reject) =>
    setTimeout(() => reject(new ValidationException('Invalid')), 100)
  );

// Jest
await expect(wait()).rejects.toBeInstanceOf(ValidationException);
// Chai
await chai
  .expect(wait())
  .to.eventually.be.rejected.and.be.an.instanceOf(ValidationException);
```

Synchronous exceptions can be detected normally, as with the following code:

```ts
const fail = () => {
  throw new ValidationException('Invalid');
};

// Jest
expect(fail).toThrow(ValidationException);
// Chai
chai.expect(fail).to.throw().and.be.an.instanceOf(ValidationException);
```

## Discriminated Union Examples

```ts
import { Type } from '@sinclaim/typebox';
import { DiscriminatedUnionValidator } from 'typebox-validators/discriminated';

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
import { Type } from '@sinclaim/typebox';
import {
  TypeIdentifyingKey,
  HeterogeneousUnionValidator
} from 'typebox-validators/heterogeneous';

const schema3 = Type.Union([
  Type.Object({
    summaryBrand: TypeIdentifyingKey(Type.String()),
    name: Type.String(),
    address: Type.String()
    zipCode: Type.String()
  }),
  Type.Object({
    detailedBrand: TypeIdentifyingKey(Type.String()),
    firstName: Type.String(),
    lastName: Type.String(),
    streetAddress: Type.String(),
    city: Type.String(),
    state: Type.String(),
    zipCode: Type.String()
  }),
]);

const validator3 = new HeterogeneousUnionValidator(schema3);

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
    name: TypeIdentifyingKey(Type.String()),
    address: Type.String({ errorMessage: 'Required string' })
    zipCode: Type.String()
  }),
  Type.Object({
    firstName: TypeIdentifyingKey(Type.String()),
    lastName: Type.String({ errorMessage: 'Required string' }),
    streetAddress: Type.String(),
    city: Type.String(),
    state: Type.String(),
    zipCode: Type.String()
  }),
]);

const validator4 = new HeterogeneousUnionValidator(schema4);

// throws exception with message "Bad info" and the single error
//  "Required string" for path "/address":
validator4.assert({ name: 'Jane Doe', zipcode: 12345 }, "Bad info");

// throws exception with message "Bad info: lastName - Required string"
//  and the single error "Required string" for path "/lastName":
validator4.assert({ firstName: 'Jane', zipcode: 12345 }, 'Bad info: {error}');

// throws exception with message "Invalid value" and the single error
//  "Object type not recognized" for path "":
validator1.assert({ address: "123 Some Str, etc.", zipcode: 12345 });

```

## License

MIT License. Copyright &copy; 2023 Joseph T. Lapp
