/**
 * Abstract base class for validators, providing safe and unsafe validation
 * and supporting custom error messages.
 *
 * Safe validation short-circuits at the first validation error and reports
 * only this error. TypeBox will test a `maxLength` constraint before testing
 * a regex pattern, so safe validation will prevent an excessive length string
 * from being parsed. It also quits at the first error, preventing the server
 * from wasting clock cycles on bad data.
 *
 * Unsafe validation reports all validation errors, making each error
 * separately retrievable, allowing custom presentation of the specifics.
 */

import type { TSchema, Static } from '@sinclair/typebox';
import { Value as TypeBoxValue } from '@sinclair/typebox/value';

import { ValidationException } from '../lib/validation-exception';
import { TypeCheck } from '@sinclair/typebox/compiler';

const DEFAULT_OVERALL_ERROR = 'Invalid value';

/**
 * Class providing validation services for a TypeBox schema, offering both
 * safe and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractValidator<S extends TSchema> {
  /**
   * @param schema Schema against which to validate values. Include an
   *  `specificError` key in a type's options to provide that message instead
   *  of the default TypeBox message when the key's value fails validation.
   *  When an object is validated, each occurrence of "{field}" within the
   *  message is replaced with the name of the field that failed validation.
   */
  constructor(readonly schema: S) {}

  /**
   * Safely validates a value against the schema. Short-circuits at the first
   * specific validation error, reporting only this error.
   *
   * @param value Value to validate against the schema.
   * @param specificError Error message to use when the error occurs as a
   *  specific error of a ValidationException.
   * @returns The most specific schema against which the value was validated.
   *  Standard validators return their provided schema, while typed union
   *  validators return the schema of the matching member of the union.
   * @throws ValidationException when the value is invalid, detecting and
   *  reporting only the first specific error.
   */
  abstract safeValidate(value: unknown, specificError?: string): TSchema;

  /**
   * Safely validates a value against the schema and returns a copy of the value
   * with all unrecognized properties of objects removed. Short-circuits at the
   * first specific validation error, reporting only this error.
   *
   * @param value Value to validate against the schema.
   * @param specificError Error message to use when the error occurs as a
   *  specific error of a ValidationException.
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
    value: unknown,
    specificError?: string
  ): [TSchema, Static<S>];

  /**
   * Safely validates a value against the schema and returns the value with all
   * unrecognized properties of objects removed. Short-circuits at the first
   * specific validation error, reporting only this error.
   *
   * @param value Value to validate against the schema and then clean.
   * @param specificError Error message to use when the error occurs as a
   *  specific error of a ValidationException.
   * @returns The most specific schema against which the value was validated.
   *  Standard validators return their provided schema, while typed union
   *  validators return the schema of the matching member of the union.
   * @throws ValidationException when the value is invalid, detecting and
   *  reporting only the first specific error.
   */
  abstract safeValidateAndCleanOriginal(
    value: unknown,
    specificError?: string
  ): TSchema;

  /**
   * Unsafely validates a value against the schema, having the validation
   * exception report all detectable validation errors.
   *
   * @param value Value to validate against the schema.
   * @param specificError Error message to use when the error occurs as a
   *  specific error of a ValidationException.
   * @returns The most specific schema against which the value was validated.
   *  Standard validators return their provided schema, while typed union
   *  validators return the schema of the matching member of the union.
   * @throws ValidationException when the value is invalid, detecting and
   *  reporting all specific validation errors.
   */
  abstract unsafeValidate(value: unknown, specificError?: string): TSchema;

  protected cleanCopyOfValue<VS extends TSchema>(
    schema: VS,
    value: unknown
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
    schema: VS,
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
    value: unknown,
    specificError?: string
  ): void {
    if (!compiledType.Check(value)) {
      const firstError = compiledType.Errors(value).First()!;
      throw new ValidationException(specificError ?? DEFAULT_OVERALL_ERROR, [
        firstError,
      ]);
    }
  }

  protected compiledUnsafeValidate(
    compiledType: TypeCheck<S>,
    value: unknown,
    specificError?: string
  ): void {
    if (!compiledType.Check(value)) {
      throw new ValidationException(specificError ?? DEFAULT_OVERALL_ERROR, [
        ...compiledType.Errors(value),
      ]);
    }
  }

  protected uncompiledSafeValidate(
    schema: TSchema,
    value: unknown,
    specificError?: string
  ): void {
    if (!TypeBoxValue.Check(schema, value)) {
      const firstError = TypeBoxValue.Errors(schema, value).First()!;
      throw new ValidationException(specificError ?? DEFAULT_OVERALL_ERROR, [
        firstError,
      ]);
    }
  }

  protected uncompiledUnsafeValidate(
    schema: TSchema,
    value: unknown,
    specificError?: string
  ): void {
    if (!TypeBoxValue.Check(schema, value)) {
      throw new ValidationException(specificError ?? DEFAULT_OVERALL_ERROR, [
        ...TypeBoxValue.Errors(schema, value),
      ]);
    }
  }
}
