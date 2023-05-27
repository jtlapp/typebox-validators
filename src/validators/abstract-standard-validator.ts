import type { Static, TSchema } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';

/**
 * Abstract validator for standard TypeBox values.
 */
export abstract class AbstractStandardValidator<
  S extends TSchema
> extends AbstractValidator<S> {
  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
  }

  /** @inheritdoc */
  override assertAndClean(value: unknown, overallError?: string): void {
    this.assert(value as any, overallError);
    this.cleanValue(this.schema, value);
  }

  /** @inheritdoc */
  override assertAndCleanCopy(
    value: Readonly<unknown>,
    overallError?: string
  ): Static<S> {
    this.assert(value, overallError);
    return this.cleanCopyOfValue(this.schema, value);
  }

  /** @inheritdoc */
  override validateAndClean(value: unknown, overallError?: string): void {
    this.validate(value as any, overallError);
    this.cleanValue(this.schema, value);
  }

  /** @inheritdoc */
  override validateAndCleanCopy(
    value: Readonly<unknown>,
    overallError?: string
  ): Static<S> {
    this.validate(value, overallError);
    return this.cleanCopyOfValue(this.schema, value);
  }
}
