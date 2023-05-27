import type { TSchema, Static } from '@sinclair/typebox';
import { Value as TypeBoxValue, ValueError } from '@sinclair/typebox/value';
import { TypeCheck } from '@sinclair/typebox/compiler';

import { ValidationException } from '../lib/validation-exception';
import {
  DEFAULT_OVERALL_ERROR,
  createErrorsIterable,
  adjustErrorMessage,
} from '../lib/errors';

// TODO: "{field}" can occur in detail messages too

/**
 * Abstract base class for validators, providing validation services for a
 * JSON schema, offering both short-circuting and full validation, supporting
 * custom error messages, and optionally removing unrecognized properties.
 *
 * As of TypeBox version 0.28.13, when validating any given value, TypeBox
 * checks the value's `maxItems` and `maxLength` constraints before testing
 * any other constraints. An API endpoint can therefore protect itself from
 * faulty and malicious clients by short-circuting validation upon detecting
 * the first validation error. The `test` method does this, but it does not
 * return any errors. If you want to short-circuit validation and return the
 * first error, use one of the `assert` methods. These methods protect the
 * server from running regex checks on excessively long strings and from
 * running regex checks on all the items of excessively long arrays.
 *
 * @typeParam S Type for a JSON schema.
 */
export abstract class AbstractValidator<S extends TSchema> {
  /**
   * @param schema JSON schema against which to validate values. When a schema
   *  nested within this schema provides an `errorMessage` string option, this
   *  string replaces the specific error messages that TypeBox would otherwise
   *  provide for the nested schema on validation failure. Occurrences of the
   *  substring "{field}" within these messages (if any) are replaced with the
   *  name of the field that failed validation (or with the path to the this
   *  field). `errorMessage` is ignored when it occurs in the rootmost schema,
   *  as the validation methods provide the exception's overall error message.
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
   * @param errorMessage Error message to report in the `ValidationException`.
   *  The substring `{field}`, if present, will be replaced with the name of
   *  the field that failed validation (or with the path to this field). The
   *  substring `{error}`, if present, will be replaced with the specific
   *  error message. If the error occurred on a field whose schema provides
   *  an `errorMessage` property, `{error}` will be this error message.
   *  Defaults to "Invalid field '{field}': {error}".
   * @throws ValidationException when the value is invalid, reporting only
   *  the first validation error in the `details` property. The `errorMessage`
   *  parameter provides the exception's error message.
   */
  abstract assert(value: Readonly<unknown>, errorMessage?: string): void;

  /**
   * Validates a value against the schema, halting validation at the first
   * validation error with a `ValidationException`. On successful validation,
   * removes unrecognized properties from the provided value.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to report in the `ValidationException`.
   *  The substring `{field}`, if present, will be replaced with the name of
   *  the field that failed validation (or with the path to this field). The
   *  substring `{error}`, if present, will be replaced with the specific
   *  error message. If the error occurred on a field whose schema provides
   *  an `errorMessage` property, `{error}` will be this error message.
   *  Defaults to "Invalid field '{field}': {error}".
   * @throws ValidationException when the value is invalid, reporting only
   *  the first validation error in the `details` property. The `errorMessage`
   *  parameter provides the exception's error message.
   */
  abstract assertAndClean(value: unknown, errorMessage?: string): void;

  /**
   * Validates a value against the schema, halting validation at the first
   * validation error with a `ValidationException`. On successful validation,
   * returns a copy of the value with unrecognized properties removed, but
   * returns the original value if there are no unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to report in the `ValidationException`.
   *  The substring `{field}`, if present, will be replaced with the name of
   *  the field that failed validation (or with the path to this field). The
   *  substring `{error}`, if present, will be replaced with the specific
   *  error message. If the error occurred on a field whose schema provides
   *  an `errorMessage` property, `{error}` will be this error message.
   *  Defaults to "Invalid field '{field}': {error}".
   * @returns The provided value itself if the value is not an object or if
   *  the value is an object having no unrecognized properties. If the value
   *  is an object having at least one unrecognized property, returns a copy
   *  of the value with unrecognized properties removed.
   * @throws ValidationException when the value is invalid, reporting only
   *  the first validation error in the `details` property. The `errorMessage`
   *  parameter provides the exception's error message.
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
   * @param errorMessage Error message to report in the exception.
   *  Defaults to "Invalid value".
   * @throws ValidationException when the value is invalid, reporting all
   *  validation errors in the `details` property. The `errorMessage`
   *  parameter provides the exception's error message.
   */
  abstract validate(value: Readonly<unknown>, errorMessage?: string): void;

  /**
   * Validates a value against the schema, detecting all validation errors
   * and reporting them by throwing `ValidationException`. On successful
   * validation, removes unrecognized properties from the provided value.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to report in the exception.
   *  Defaults to "Invalid value".
   * @throws ValidationException when the value is invalid, reporting all
   *  validation errors in the `details` property. The `errorMessage`
   *  parameter provides the exception's error message.
   */
  abstract validateAndClean(value: unknown, errorMessage?: string): void;

  /**
   * Validates a value against the schema, detecting all validation errors
   * and reporting them with a `ValidationException`. On successful validation,
   * returns a copy of the value with unrecognized properties removed, but
   * returns the original value if there are no unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to report in the exception.
   *  Defaults to "Invalid value".
   * @returns The provided value itself if the value is not an object or if
   *  the value is an object having no unrecognized properties. If the value
   *  is an object having at least one unrecognized property, returns a copy
   *  of the value with unrecognized properties removed.
   * @throws ValidationException when the value is invalid, reporting all
   *  validation errors in the `details` property. The `errorMessage`
   *  parameter provides the exception's error message.
   */
  abstract validateAndCleanCopy(
    value: Readonly<unknown>,
    errorMessage?: string
  ): Static<S>;

  /**
   * Validates a value against the schema and returns an iteratable whose
   * iterator yields the validation errors. The iterator examines the value for
   * the next error on each call to `next()`, returning a `ValueError` for the
   * error. It does not evaluate errors in advance of their being requested,
   * allowing you to short-circuit validation by stopping iteration early. This
   * method does not throw `ValidationException` and does not clean values of
   * unrecognized properties.
   *
   * @param value Value to validate against the schema.
   * @returns An iteratable yielding all validation errors. However, upon
   *  detecting one or more errors for a particular field, if that field's
   *  schema provides an `errorMessage` property, only a single error is
   *  reported for the field, and the `message` property of this error is set to
   *  the `errorMessage`.
   */
  abstract errors(value: Readonly<unknown>): Iterable<ValueError>;

  protected cleanCopyOfValue<VS extends TSchema>(
    schema: Readonly<VS>,
    value: Readonly<unknown>
  ): Static<VS> {
    // TODO: reimplement without 'in', cache when compiling; test performance
    if (schema.type === 'object') {
      const cleanedValue: Record<string, any> = {};
      for (const key in schema.properties) {
        cleanedValue[key] = (value as Record<string, any>)[key];
      }
      return cleanedValue;
    }
    return value;
  }

  // TODO: make sure these methods are multiply used

  protected cleanValue<VS extends TSchema>(
    schema: Readonly<VS>,
    value: unknown
  ): void {
    // TODO: reimplement within 'in', cache when compiling; test performance
    if (schema.type === 'object') {
      for (const key in value as Record<string, any>) {
        if (!(key in schema.properties)) {
          delete (value as Record<string, any>)[key];
        }
      }
    }
  }

  protected compiledAssert(
    compiledType: TypeCheck<S>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!compiledType.Check(value)) {
      const firstError = compiledType.Errors(value).First()!;
      throw new ValidationException(overallError ?? DEFAULT_OVERALL_ERROR, [
        adjustErrorMessage(firstError),
      ]);
    }
  }

  protected compiledValidate(
    compiledType: TypeCheck<S>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!compiledType.Check(value)) {
      throw new ValidationException(overallError ?? DEFAULT_OVERALL_ERROR, [
        ...createErrorsIterable(compiledType.Errors(value)),
      ]);
    }
  }

  protected compiledErrors(
    compiledType: TypeCheck<S>,
    value: Readonly<unknown>
  ): Iterable<ValueError> {
    return createErrorsIterable(compiledType.Errors(value));
  }

  protected uncompiledErrors(
    schema: Readonly<TSchema>,
    value: Readonly<unknown>
  ): Iterable<ValueError> {
    return createErrorsIterable(TypeBoxValue.Errors(schema, value));
  }

  protected uncompiledAssert(
    schema: Readonly<TSchema>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!TypeBoxValue.Check(schema, value)) {
      const firstError = TypeBoxValue.Errors(schema, value).First()!;
      throw new ValidationException(overallError ?? DEFAULT_OVERALL_ERROR, [
        adjustErrorMessage(firstError),
      ]);
    }
  }

  protected uncompiledValidate(
    schema: Readonly<TSchema>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!TypeBoxValue.Check(schema, value)) {
      throw new ValidationException(overallError ?? DEFAULT_OVERALL_ERROR, [
        ...createErrorsIterable(TypeBoxValue.Errors(schema, value)),
      ]);
    }
  }
}
