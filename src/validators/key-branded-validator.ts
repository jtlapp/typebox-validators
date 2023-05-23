import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';
import { findKeyBrandedSchemaIndex } from '../lib/branded-unions';

/**
 * Non-compiling validator for values that are key-branded unions, providing
 * safe and unsafe validation, supporting custom error messages. List the
 * more frequently used types earlier in the union to improve performance.
 */
export class KeyBrandedValidator<
  S extends TUnion<TObject[]>
> extends AbstractValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  safeValidate(value: unknown, errorMessage: string): void {
    const i = findKeyBrandedSchemaIndex(this.schema, value, errorMessage);
    this.uncompiledSafeValidate(this.schema.anyOf[i], value, errorMessage);
  }

  /** @inheritdoc */
  unsafeValidate(value: unknown, errorMessage: string): void {
    const i = findKeyBrandedSchemaIndex(this.schema, value, errorMessage);
    this.uncompiledUnsafeValidate(this.schema.anyOf[i], value, errorMessage);
  }
}
