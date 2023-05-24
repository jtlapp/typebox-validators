import type { Static, TSchema } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';

/**
 * Abstract validator for standard TypeBox values, providing safe
 * and unsafe validation, supporting custom error messages, and
 * cleaning values of unrecognized properties.
 */
export abstract class AbstractStandardValidator<
  S extends TSchema
> extends AbstractValidator<S> {
  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
  }

  /** @inheritdoc */
  override safeValidateAndCleanCopy(
    value: Readonly<unknown>,
    overallError?: string
  ): [S, Static<S>] {
    this.safeValidate(value, overallError);
    return [this.schema, this.cleanCopyOfValue(this.schema, value)];
  }

  /** @inheritdoc */
  override safeValidateAndCleanOriginal(
    value: unknown,
    overallError?: string
  ): S {
    this.safeValidate(value as any, overallError);
    this.cleanOriginalValue(this.schema, value);
    return this.schema;
  }
}
