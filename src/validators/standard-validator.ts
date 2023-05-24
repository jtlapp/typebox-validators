import type { TSchema } from '@sinclair/typebox';

import { AbstractStandardValidator } from './abstract-standard-validator';

/**
 * Non-compiling validator for standard TypeBox values, providing safe
 * and unsafe validation, supporting custom error messages, and cleaning
 * values of unrecognized properties.
 */
export class StandardValidator<
  S extends TSchema
> extends AbstractStandardValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override safeValidate(value: Readonly<unknown>, overallError?: string): S {
    this.uncompiledSafeValidate(this.schema, value, overallError);
    return this.schema;
  }

  /** @inheritdoc */
  override unsafeValidate(value: Readonly<unknown>, overallError?: string): S {
    this.uncompiledUnsafeValidate(this.schema, value, overallError);
    return this.schema;
  }
}
