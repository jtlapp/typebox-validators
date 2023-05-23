import type { TSchema } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';

/**
 * Non-compiling validator for values that are not typed member unions,
 * providing safe and unsafe validation, supporting custom error messages.
 */
export class StandardValidator<S extends TSchema> extends AbstractValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  safeValidate(value: unknown, errorMessage: string): void {
    this.uncompiledSafeValidate(this.schema, value, errorMessage);
  }

  /** @inheritdoc */
  unsafeValidate(value: unknown, errorMessage: string): void {
    this.uncompiledUnsafeValidate(this.schema, value, errorMessage);
  }
}
