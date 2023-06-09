import type { TSchema, Static } from '@sinclair/typebox';
import { Value, ValueError } from '@sinclair/typebox/value';

import { throwInvalidAssert, throwInvalidValidate } from '../lib/error-utils';

/**
 * Abstract base class for validators, providing validation services for a
 * JSON schema, offering both short-circuting and full validation, supporting
 * custom error messages, and optionally removing unrecognized properties.
 *
 * As of TypeBox version 0.28.13, when validating any given value, TypeBox
 * checks the value's `maxItems` and `maxLength` constraints before testing
 * any other constraints. An API endpoint can therefore protect itself from
 * faulty and malicious clients by short-circuting validation after the
 * first validation error. The `test` method does this, but it does not
 * return any errors. If you want to short-circuit validation and return the
 * first error, use one of the `assert` methods. These methods protect the
 * server from running regex checks on excessively long strings and from
 * running regex checks on all the items of excessively long arrays.
 *
 * @typeParam S Type for a JSON schema, expressed as a TypeBox type.
 */
export abstract class AbstractValidator<S extends TSchema> {
  /**
   * @param schema JSON schema against which to validate values. When a schema
   *  provides an `errorMessage` string option, all errors occurring for that
   *  schema (but not for nested schemas) collapse into a single error having
   *  this message. The `errorMessage` option allows you to provide a custom
   *  error message for a schema. For example, an `errorMessage` on a schema
   *  for a property of an object replaces TypeBox's built-in error messages
   *  for errors that occur on that property.
   */
  constructor(readonly schema: Readonly<S>) {}

  /**
   * Tests whether a value conforms to the schema. For performance reasons, it
   * is best to call this method before calling `errors()` or `firstError()`,
   * should you also need to information about the errors. This method does not
   * throw `ValidationException` and does not clean values of unrecognized
   * properties.
   *
   * @param value Value to validate against the schema.
   * @returns `true` when the value conforms to the schema, `false` otherwise.
   */
  abstract test(value: Readonly<unknown>): boolean;

  /**
   * Tests whether a value conforms to the schema, returning an iterable whose
   * iterator yields the validation errors, or returning `null` if there are no
   * validation errors. This method is equivalent to calling `test()` and then
   * `errors()` and exists only for convenience. The method does not throw
   * `ValidationException` and does not clean values of unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @returns An iteratable yielding all validation errors, if any, otherwise
   *  `null`. Upon detecting one or more errors for a particular schema
   *  (possibly a nested schema), if the schema provides an `errorMessage`
   *  property, only a single error is reported for the schema, and the
   *  `message` property of this error is set to `errorMessage`'s value. Also,
   *  the TypeBox error "Expected required property" is dropped when at least
   *  one other error is reported for the property. Consequently, only the
   *  `Type.Any` and `Type.Unknown` schemas can yield "Expected required
   *  property" errors.
   */
  testReturningErrors(value: Readonly<unknown>): Iterable<ValueError> | null {
    return this.test(value) ? null : this.errors(value);
  }

  /**
   * Tests whether a value conforms to the schema, returning the first error,
   * or returning `null` if there is no error. This method is equivalent to
   * calling `test()` and then `firstError()` and exists only for convenience.
   * The method does not throw `ValidationException` and does not clean values
   * of unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @returns The first validation error, if there is a validation error,
   *  otherwise `null`.
   */
  testReturningFirstError(value: Readonly<unknown>): ValueError | null {
    const iterable = this.testReturningErrors(value);
    if (iterable === null) {
      return null;
    }
    const result = iterable[Symbol.iterator]().next();
    return result.done ? null : result.value;
  }

  /**
   * Validates a value against the schema, halting validation at the first
   * validation error with a `ValidationException`. Does not clean values of
   * unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Overall eror message to report in the exception.
   *  The substring `{error}`, if present, will be replaced with a string
   *  representation of the error. Defaults to "Invalid value".
   * @throws ValidationException when the value is invalid, reporting only
   *  the first validation error in the `details` property. The `errorMessage`
   *  parameter provides the exception's overall error message.
   */
  abstract assert(value: Readonly<unknown>, errorMessage?: string): void;

  /**
   * Validates a value against the schema, halting validation at the first
   * validation error with a `ValidationException`. On successful validation,
   * removes unrecognized properties from the provided value.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Overall eror message to report in the exception.
   *  The substring `{error}`, if present, will be replaced with a string
   *  representation of the error. Defaults to "Invalid value".
   * @throws ValidationException when the value is invalid, reporting only
   *  the first validation error in the `details` property. The `errorMessage`
   *  parameter provides the exception's overall error message.
   */
  abstract assertAndClean(value: unknown, errorMessage?: string): void;

  /**
   * Validates a value against the schema, halting validation at the first
   * validation error with a `ValidationException`. On successful validation,
   * returns a copy of the value with unrecognized properties removed, but
   * returns the original value if there are no unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Overall eror message to report in the exception.
   *  The substring `{error}`, if present, will be replaced with a string
   *  representation of the error. Defaults to "Invalid value".
   * @returns The provided value itself if the value is not an object or if
   *  the value is an object having no unrecognized properties. If the value
   *  is an object having at least one unrecognized property, returns a copy
   *  of the value with unrecognized properties removed.
   * @throws ValidationException when the value is invalid, reporting only
   *  the first validation error in the `details` property. The `errorMessage`
   *  parameter provides the exception's overall error message.
   */
  abstract assertAndCleanCopy(
    value: Readonly<unknown>,
    errorMessage?: string
  ): Static<S>;

  /**
   * Validates a value against the schema, detecting all validation errors
   * and reporting them by throwing `ValidationException`. Does not clean
   * values of unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Overall error message to report in the exception.
   * @throws ValidationException when the value is invalid, reporting all
   *  validation errors in the `details` property. The `errorMessage`
   *  parameter provides the exception's overall error message.
   */
  abstract validate(value: Readonly<unknown>, errorMessage?: string): void;

  /**
   * Validates a value against the schema, detecting all validation errors
   * and reporting them by throwing `ValidationException`. On successful
   * validation, removes unrecognized properties from the provided value.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Overall error message to report in the exception.=
   * @throws ValidationException when the value is invalid, reporting all
   *  validation errors in the `details` property. The `errorMessage`
   *  parameter provides the exception's overall error message.
   */
  abstract validateAndClean(value: unknown, errorMessage?: string): void;

  /**
   * Validates a value against the schema, detecting all validation errors
   * and reporting them with a `ValidationException`. On successful validation,
   * returns a copy of the value with unrecognized properties removed, but
   * returns the original value if there are no unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Overall error message to report in the exception.
   * @returns The provided value itself if the value is not an object or if
   *  the value is an object having no unrecognized properties. If the value
   *  is an object having at least one unrecognized property, returns a copy
   *  of the value with unrecognized properties removed.
   * @throws ValidationException when the value is invalid, reporting all
   *  validation errors in the `details` property. The `errorMessage`
   *  parameter provides the exception's overall error message.
   */
  abstract validateAndCleanCopy(
    value: Readonly<unknown>,
    errorMessage?: string
  ): Static<S>;

  /**
   * Validates a value against the schema and returns an iteratable whose
   * iterator yields the validation errors. The iterator tests the value for the
   * next error on each call to `next()`, returning a `ValueError` for the error
   * until done. It does not evaluate errors in advance of their being
   * requested, allowing you to short-circuit validation by stopping iteration
   * early. For performance reasons, it is best to call `test()` before calling
   * this method. This method does not throw `ValidationException` and does not
   * clean values of unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @returns An iteratable yielding all validation errors. Upon detecting one
   *  or more errors for a particular schema (possibly a nested schema), if the
   *  schema provides an `errorMessage` property, only a single error is
   *  reported for the schema, and the `message` property of this error is set
   *  to `errorMessage`'s value. Also, the TypeBox error "Expected required
   *  property" is dropped when at least one other error is reported for the
   *  property. Consequently, only the `Type.Any` and `Type.Unknown` schemas can
   *  yield "Expected required property" errors.
   */
  abstract errors(value: Readonly<unknown>): Iterable<ValueError>;

  /**
   * Validates a value against the schema and returns the first error,
   * returning `null` if there is no error. No validation is performed beyond
   * the first error, allowing you to protect the server from wasting time and
   * memory validating excessively long strings. It is equivalent to calling
   * `next()` exactly once on the iterator returned by `errors()`, serving
   * only as a convenience method. For performance reasons, it is best to call
   * `test()` before calling this method. This method does not throw
   * `ValidationException` and does not clean values of unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @returns The first validation error, if there is a validation error,
   *  otherwise `null`.
   */
  firstError(value: Readonly<unknown>): ValueError | null {
    const iterator = this.errors(value)[Symbol.iterator]();
    const result = iterator.next();
    return result.done ? null : result.value;
  }

  protected cleanCopyOfValue<VS extends TSchema>(
    schema: Readonly<VS>,
    value: Readonly<unknown>
  ): Static<VS> {
    if (schema.type === 'object' && typeof value === 'object') {
      const cleanedValue: Record<string, any> = {};
      Object.keys(schema.properties).forEach((key) => {
        cleanedValue[key] = (value as Record<string, any>)[key];
      });
      return cleanedValue;
    }
    return value;
  }

  protected cleanValue<VS extends TSchema>(
    schema: Readonly<VS>,
    value: unknown
  ): void {
    if (schema.type === 'object' && typeof value === 'object') {
      const schemaKeys = Object.keys(schema.properties);
      Object.getOwnPropertyNames(value).forEach((key) => {
        if (!schemaKeys.includes(key)) {
          delete (value as Record<string, any>)[key];
        }
      });
    }
  }

  protected uncompiledAssert(
    schema: Readonly<TSchema>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!Value.Check(schema, value)) {
      throwInvalidAssert(overallError, Value.Errors(schema, value).First()!);
    }
  }

  protected uncompiledValidate(
    schema: Readonly<TSchema>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!Value.Check(schema, value)) {
      throwInvalidValidate(overallError, Value.Errors(schema, value));
    }
  }
}
