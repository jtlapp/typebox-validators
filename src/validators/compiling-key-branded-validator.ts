import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractCompilingBrandedValidator } from './abstract-compiling-branded-validator';
import { findKeyBrandedSchemaIndex } from '../lib/branded-unions';

/**
 * Lazily compiled validator for values that are key-branded unions,
 * providing safe and unsafe validation, supporting custom error messages.
 */
export class CompilingKeyBrandedValidator<
  S extends TUnion<TObject[]>
> extends AbstractCompilingBrandedValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  safeValidate(value: unknown, errorMessage: string): void {
    const i = findKeyBrandedSchemaIndex(this.schema, value, errorMessage);
    this.memberValidators[i].safeValidate(value, errorMessage);
  }

  /** @inheritdoc */
  unsafeValidate(value: unknown, errorMessage: string): void {
    const i = findKeyBrandedSchemaIndex(this.schema, value, errorMessage);
    this.memberValidators[i].unsafeValidate(value, errorMessage);
  }
}
