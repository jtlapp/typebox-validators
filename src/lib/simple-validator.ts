import type { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import { AbstractValidator } from './abstract-validator';
import { ValidationException } from './validation-exception';

/**
 * Non-compiling validator for values that are not branded unions, providing
 * safe and unsafe validation, supporting custom error messages.
 */
export class SimpleValidator<S extends TSchema> extends AbstractValidator<S> {
  /**
   * @param schema Schema against which to validate values. Include an
   *  `errorMessage` key in a type's options to provide that messge instead
   *  of the default TypeBox message when the key's value fails validation.
   *  When an object is validated, each occurrence of "{field}" within the
   *  message is replaced with the name of the field that failed validation.
   */
  constructor(schema: S) {
    super(schema);
  }

  /**
   * Safely validate a value against the schema. Short-circuits at the first
   * validation error, reporting only this error.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to use in the ValidationException when
   *    thrown. The exception also reports the details of the first error.
   * @throws ValidationException when the value is invalid.
   */
  safeValidate(value: unknown, errorMessage: string): void {
    if (!Value.Check(this.schema, value)) {
      const firstError = Value.Errors(this.schema, value).First()!;
      throw new ValidationException(errorMessage, [firstError]);
    }
  }

  /**
   * Unsafely validate a value against the schema, but have the validation
   * exception report all detectable validation errors.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to use in the ValidationException when
   *    thrown. The exception also reports the details of all validation errors.
   * @throws ValidationException when the value is invalid.
   */
  unsafeValidate(value: unknown, errorMessage: string): void {
    if (!Value.Check(this.schema, value)) {
      throw new ValidationException(errorMessage, [
        ...Value.Errors(this.schema, value),
      ]);
    }
  }
}
