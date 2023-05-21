import type { TSchema } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';

import { AbstractValidator } from './abstract-validator';
import { ValidationException } from './validation-exception';

/**
 * Lazily compiled validator for values that are not branded unions,
 * providing safe and unsafe validation, supporting custom error messages.
 */
export class CompilingSimpleValidator<
  S extends TSchema
> extends AbstractValidator<S> {
  #compiledType?: TypeCheck<S>;

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
    const compiledType = this.getCompiledType();
    if (!compiledType.Check(value)) {
      const firstError = compiledType.Errors(value).First()!;
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
    const compiledType = this.getCompiledType();
    if (!compiledType.Check(value)) {
      throw new ValidationException(errorMessage, [
        ...compiledType.Errors(value),
      ]);
    }
  }

  /**
   * Returns the compiled TypeBox type for the schema. The method compiles
   * the type on the first call and caches the result for subsequent calls.
   * @returns Compiled TypeBox type for the schema.
   */
  private getCompiledType(): TypeCheck<S> {
    if (this.#compiledType === undefined) {
      this.#compiledType = TypeCompiler.Compile(this.schema);
      // There's no benefit to nulling schema to free memory, because
      // #compiledType holds a reference to it. TODO: keep this comment?
    }
    return this.#compiledType;
  }
}
