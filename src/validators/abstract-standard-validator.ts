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
    errorMessage: string
  ): [S, Static<S>] {
    this.safeValidate(value, errorMessage);
    return [this.schema, this.cleanValue(this.schema, value)];
  }
}
