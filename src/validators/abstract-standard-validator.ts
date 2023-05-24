import type { Static, TSchema } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';

/**
 * Abstract validator for standard TypeBox values, providing safe
 * and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractStandardValidator<
  S extends TSchema
> extends AbstractValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override safeValidateAndCleanCopy(
    value: unknown,
    specificError: string
  ): [S, Static<S>] {
    this.safeValidate(value, specificError);
    return [this.schema, this.cleanCopyOfValue(this.schema, value)];
  }

  /** @inheritdoc */
  override safeValidateAndCleanOriginal(
    value: unknown,
    specificError: string
  ): S {
    this.safeValidate(value, specificError);
    this.cleanOriginalValue(this.schema, value);
    return this.schema;
  }
}
