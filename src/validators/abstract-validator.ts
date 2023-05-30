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
   * Tests whether a value conforms to the schema. This method does not throw
   * `ValidationException` and does not clean values of unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @returns `true` when the value conforms to the schema, `false` otherwise.
   */
  abstract test(value: Readonly<unknown>): boolean;

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
   * iterator yields the validation errors. The iterator tests the value for
   * the next error on each call to `next()`, returning a `ValueError` for the
   * error until done. It does not evaluate errors in advance of their being
   * requested, allowing you to short-circuit validation by stopping iteration
   * early. This method does not throw `ValidationException` and does not
   * clean values of unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @returns An iteratable yielding all validation errors. However, upon
   *  detecting one or more errors for a particular schema (possibly a nested
   *  schema), if the schema provides an `errorMessage` property, only a
   *  single error is reported for the schema, and the `message` property of
   *  this error is set to `errorMessage`'s value. Also, the TypeBox error
   *  "Expected required property" is dropped when at least one other error
   *  is reported for the property. Consequently, only the `Type.Any` and
   *  `Type.Unknown` schemas can yield "Expected required property" errors.
   */
  abstract errors(value: Readonly<unknown>): Iterable<ValueError>;

  protected cleanCopyOfValue<VS extends TSchema>(
    schema: Readonly<VS>,
    value: Readonly<unknown>
  ): Static<VS> {
    if (schema.type === 'object' && typeof value === 'object') {
      const cleanedValue: Record<string, any> = {};
      // TODO: reimplement without 'in', cache when compiling; test performance
      for (const key in schema.properties) {
        cleanedValue[key] = (value as Record<string, any>)[key];
      }
      return cleanedValue;
    }
    return value;
  }

  protected cleanValue<VS extends TSchema>(
    schema: Readonly<VS>,
    value: unknown
  ): void {
    if (schema.type === 'object' && typeof value === 'object') {
      // TODO: reimplement within 'in', cache when compiling; test performance
      for (const key in value as Record<string, any>) {
        if (!(key in schema.properties)) {
          delete (value as Record<string, any>)[key];
        }
      }
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
