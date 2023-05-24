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
 * separately retrievable, allowing custom presentation of the details.
 */

import type { TSchema, Static } from '@sinclair/typebox';
import { Value as TypeBoxValue } from '@sinclair/typebox/value';

import { ValidationException } from '../lib/validation-exception';
import { TypeCheck } from '@sinclair/typebox/compiler';

/**
 * Class providing validation services for a TypeBox schema, offering both
 * safe and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractValidator<S extends TSchema> {
  /**
   * @param schema Schema against which to validate values. Include an
   *  `errorMessage` key in a type's options to provide that message instead
   *  of the default TypeBox message when the key's value fails validation.
   *  When an object is validated, each occurrence of "{field}" within the
   *  message is replaced with the name of the field that failed validation.
   */
  constructor(readonly schema: S) {}

  /**
   * Safely validate a value against the schema. Short-circuits at the first
   * validation error, reporting only this error.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to use in the ValidationException when
   *    thrown. The exception also reports the details of the first error.
   * @returns The most specific schema against which the value was validated.
   *  Standard validators return their provided schema, while typed union
   *  validators return the schema of the matching member of the union.
   * @throws ValidationException when the value is invalid.
   */
  abstract safeValidate(value: unknown, errorMessage: string): TSchema;

  /**
   * Safely validate a value against the schema and return a copy of the value
   * with all unrecognized properties of objects removed. Short-circuits at the
   * first validation error, reporting only this error.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to use in the ValidationException when
   *    thrown. The exception also reports the details of the first error.
   * @returns The pair [<schema>, <value>], where <schema> is the most specific
   *  schema against which the value was validated, and <value> is the provided
   *  value, if it is not an object. If the value is an object, <value> is a copy
   *  of the object with all unrecognized properties removed. Standard validators
   *  return their provided schema, while typed union validators return the
   *  schema of the matching member of the union.
   * @throws ValidationException when the value is invalid.
   */
  abstract safeValidateAndCleanCopy(
    value: unknown,
    errorMessage: string
  ): [TSchema, Static<S>];

  /**
   * Unsafely validate a value against the schema, but have the validation
   * exception report all detectable validation errors.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to use in the ValidationException when
   *    thrown. The exception also reports the details of all validation errors.
   * @returns The most specific schema against which the value was validated.
   *  Standard validators return their provided schema, while typed union
   *  validators return the schema of the matching member of the union.
   * @throws ValidationException when the value is invalid.
   */
  abstract unsafeValidate(value: unknown, errorMessage: string): TSchema;

  /**
   * Safely or unsafely validates a value against a schema, as requested. Safe
   * validation short-circuits at the first validation error and reports only
   * this error. Unsafe validation reports all detectable validation errors.
   *
   * This alternative method exists for the caller's convenience, helping to
   * minimize the amount of validation code.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to use in the ValidationException when
   *    thrown. The exception also reports validation error details.
   * @throws ValidationException when the value is invalid.
   */
  validate(value: unknown, errorMessage: string, safely = true): TSchema {
    return safely
      ? this.safeValidate(value, errorMessage)
      : this.unsafeValidate(value, errorMessage);
  }

  protected cleanValue<VS extends TSchema>(
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

  protected compiledSafeValidate(
    compiledType: TypeCheck<S>,
    value: unknown,
    errorMessage: string
  ): void {
    if (!compiledType.Check(value)) {
      const firstError = compiledType.Errors(value).First()!;
      throw new ValidationException(errorMessage, [firstError]);
    }
  }

  protected compiledUnsafeValidate(
    compiledType: TypeCheck<S>,
    value: unknown,
    errorMessage: string
  ): void {
    if (!compiledType.Check(value)) {
      throw new ValidationException(errorMessage, [
        ...compiledType.Errors(value),
      ]);
    }
  }

  protected uncompiledSafeValidate(
    schema: TSchema,
    value: unknown,
    errorMessage: string
  ): void {
    if (!TypeBoxValue.Check(schema, value)) {
      const firstError = TypeBoxValue.Errors(schema, value).First()!;
      throw new ValidationException(errorMessage, [firstError]);
    }
  }

  protected uncompiledUnsafeValidate(
    schema: TSchema,
    value: unknown,
    errorMessage: string
  ): void {
    if (!TypeBoxValue.Check(schema, value)) {
      throw new ValidationException(errorMessage, [
        ...TypeBoxValue.Errors(schema, value),
      ]);
    }
  }
}
