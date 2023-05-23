import type { TSchema } from '@sinclair/typebox';

import { AbstractStandardValidator } from './abstract-standard-validator';

/**
 * Non-compiling validator for standard TypeBox values, providing safe
 * and unsafe validation, supporting custom error messages.
 */
export class StandardValidator<
  S extends TSchema
> extends AbstractStandardValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override safeValidate(value: unknown, errorMessage: string): S {
    this.uncompiledSafeValidate(this.schema, value, errorMessage);
    return this.schema;
  }

  /** @inheritdoc */
  override unsafeValidate(value: unknown, errorMessage: string): S {
    this.uncompiledUnsafeValidate(this.schema, value, errorMessage);
    return this.schema;
  }
}
