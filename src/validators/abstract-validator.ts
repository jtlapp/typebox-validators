import type { TSchema, Static } from '@sinclair/typebox';
import { Value as TypeBoxValue } from '@sinclair/typebox/value';

import { ValidationException } from '../lib/validation-exception';
import { TypeCheck } from '@sinclair/typebox/compiler';

const DEFAULT_OVERALL_ERROR = 'Invalid value';

/**
 * Abstract base class for validators, providing validation services for a
 * JSON schema, offering both safe and unsafe validation, supporting
 * custom error messages, and cleaning values of unrecognized properties.
 *
 * Safe validation short-circuits at the first validation error and reports
 * only this error. Internally, TypeBox tests a `maxLength` constraint before
 * testing a regex pattern, so safe validation will prevent an excessive
 * length string from being parsed. Safe validatin also quits at the first
 * error, preventing the server from wasting clock cycles on bad data.
 *
 * Unsafe validation reports all validation errors, making each error
 * separately retrievable, allowing custom presentation of the specifics.
 */
export abstract class AbstractValidator<S extends TSchema> {
  /**
   * @param schema JSON schema against which to validate values. TypeBox types
   *  may optionally include a `specificError` string among its options. This
   *  string replaces the specific error messages that TypeBox would otherwise
   *  provide for the type when the type fails validation. Each occurrence of
   *  "{field}" within these messages (if it occurs) will be replaced with the
   *  name of the field that failed validation. However, `specificError` is
   *  ignored when it occurs in the rootmost type of the schema. This is
   *  because a ValidationException provides an overall error message for the
   *  value, and the caller has the option to ignore specific errors.
   */
  constructor(readonly schema: Readonly<S>) {}

  /**
   * Safely validates a value against the schema. Short-circuits at the first
   * specific validation error, reporting only this error. Does NOT remove
   * unrecognized properties from the value.
   *
   * @param value Value to validate against the schema.
   * @param overallError Overall error to report with a ValidationException,
   *  in addition to providing an optionally retrievable specific error. This
   *  is a good place to mention the role of the variable that is in error,
   *  rather than just the variable's type. Defaults to "Invalid value".
   * @returns The most specific schema against which the value was validated.
   *  Standard validators return their provided schema, while typed union
   *  validators return the schema of the matching member of the union.
   * @throws ValidationException when the value is invalid, detecting and
   *  reporting only the first specific error.
   */
  abstract safeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TSchema;

  /**
   * Safely validates a value against the schema and returns a copy of the
   * value with all unrecognized object properties removed. Short-circuits at
   * the first specific validation error, reporting only this error. Useful
   * with immutable values having additional utility elsewhere.
   *
   * @param value Value to validate against the schema.
   * @param overallError Overall error to report with a ValidationException,
   *  in addition to providing an optionally retrievable specific error. This
   *  is a good place to mention the role of the variable that is in error,
   *  rather than just the variable's type. Defaults to "Invalid value".
   * @returns The pair [`schema`, `value`], where `schema` is the most specific
   *  schema against which the value was validated, and `value` is the provided
   *  value, if it is not an object. If the value is an object, `value` is a copy
   *  of the object with all unrecognized properties removed. Standard validators
   *  return their provided schema, while typed union validators return the
   *  schema of the matching member of the union.
   * @throws ValidationException when the value is invalid, detecting and
   *  reporting only the first specific error.
   */
  abstract safeValidateAndCleanCopy(
    value: Readonly<unknown>,
    overallError?: string
  ): [TSchema, Static<S>];

  /**
   * Safely validates a value against the schema, and if the value is an
   * object, removes all unrecognized properties from the value. Short-
   * circuits at the first specific validation error, reporting only this
   * error. Useful with mutable values that are otherwise throw-away.
   *
   * @param value Value to validate against the schema and then clean.
   * @param overallError Overall error to report with a ValidationException,
   *  in addition to providing an optionally retrievable specific error. This
   *  is a good place to mention the role of the variable that is in error,
   *  rather than just the variable's type. Defaults to "Invalid value".
   * @returns The most specific schema against which the value was validated.
   *  Standard validators return their provided schema, while typed union
   *  validators return the schema of the matching member of the union.
   * @throws ValidationException when the value is invalid, detecting and
   *  reporting only the first specific error.
   */
  abstract safeValidateAndCleanOriginal(
    value: unknown,
    overallError?: string
  ): TSchema;

  /**
   * Unsafely validates a value against the schema, having the validation
   * exception report all detectable validation errors.
   *
   * @param value Value to validate against the schema.
   * @param overallError Overall error to report with a ValidationException,
   *  in addition to providing optionally retrievable specific errors. This
   *  is a good place to mention the role of the variable that is in error,
   *  rather than just the variable's type. Defaults to "Invalid value".
   * @returns The most specific schema against which the value was validated.
   *  Standard validators return their provided schema, while typed union
   *  validators return the schema of the matching member of the union.
   * @throws ValidationException when the value is invalid, detecting and
   *  reporting all specific validation errors.
   */
  abstract unsafeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TSchema;

  protected cleanCopyOfValue<VS extends TSchema>(
    schema: Readonly<VS>,
    value: Readonly<unknown>
  ): Static<VS> {
    if (schema.type === 'object') {
      const cleanedValue: Record<string, any> = {};
      for (const key in schema.properties) {
        cleanedValue[key] = (value as Record<string, any>)[key];
      }
      return cleanedValue;
    }
    return value;
  }

  protected cleanOriginalValue<VS extends TSchema>(
    schema: Readonly<VS>,
    value: unknown
  ): void {
    if (schema.type === 'object') {
      for (const key in value as Record<string, any>) {
        if (!(key in schema.properties)) {
          delete (value as Record<string, any>)[key];
        }
      }
    }
  }

  protected compiledSafeValidate(
    compiledType: TypeCheck<S>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!compiledType.Check(value)) {
      const firstError = compiledType.Errors(value).First()!;
      throw new ValidationException(overallError ?? DEFAULT_OVERALL_ERROR, [
        firstError,
      ]);
    }
  }

  protected compiledUnsafeValidate(
    compiledType: TypeCheck<S>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!compiledType.Check(value)) {
      throw new ValidationException(overallError ?? DEFAULT_OVERALL_ERROR, [
        ...compiledType.Errors(value),
      ]);
    }
  }

  protected uncompiledSafeValidate(
    schema: Readonly<TSchema>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!TypeBoxValue.Check(schema, value)) {
      const firstError = TypeBoxValue.Errors(schema, value).First()!;
      throw new ValidationException(overallError ?? DEFAULT_OVERALL_ERROR, [
        firstError,
      ]);
    }
  }

  protected uncompiledUnsafeValidate(
    schema: Readonly<TSchema>,
    value: Readonly<unknown>,
    overallError?: string
  ): void {
    if (!TypeBoxValue.Check(schema, value)) {
      throw new ValidationException(overallError ?? DEFAULT_OVERALL_ERROR, [
        ...TypeBoxValue.Errors(schema, value),
      ]);
    }
  }
}
