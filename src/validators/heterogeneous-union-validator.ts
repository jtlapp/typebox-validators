import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractHeterogeneousUnionValidator } from './abstract-heterogeneous-union-validator';

/**
 * Non-compiling validator for heterogeneous unions, providing safe
 * and unsafe validation, supporting custom error messages
 */
export class HeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractHeterogeneousUnionValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  safeValidate(value: unknown, errorMessage: string): void {
    const i = this.findHeterogeneousUnionSchemaIndex(value, errorMessage);
    this.uncompiledSafeValidate(this.schema.anyOf[i], value, errorMessage);
  }

  /** @inheritdoc */
  unsafeValidate(value: unknown, errorMessage: string): void {
    const i = this.findHeterogeneousUnionSchemaIndex(value, errorMessage);
    this.uncompiledUnsafeValidate(this.schema.anyOf[i], value, errorMessage);
  }
}
