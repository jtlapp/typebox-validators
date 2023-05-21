import type { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import { AbstractValidator } from './abstract-validator';
import { ValidationException } from './validation-exception';

/**
 * Non-compiling validator for values that are not branded unions, providing
 * safe and unsafe validation, supporting custom error messages.
 */
export class SimpleValidator<S extends TSchema> extends AbstractValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  safeValidate(value: unknown, errorMessage: string): void {
    if (!Value.Check(this.schema, value)) {
      const firstError = Value.Errors(this.schema, value).First()!;
      throw new ValidationException(errorMessage, [firstError]);
    }
  }

  /** @inheritdoc */
  unsafeValidate(value: unknown, errorMessage: string): void {
    if (!Value.Check(this.schema, value)) {
      throw new ValidationException(errorMessage, [
        ...Value.Errors(this.schema, value),
      ]);
    }
  }
}
