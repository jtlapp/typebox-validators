import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractCompilingTypedUnionValidator } from './abstract-compiling-typed-union-validator';

/**
 * Lazily compiled validator for values that are heterogeneous-union unions,
 * providing safe and unsafe validation, supporting custom error messages.
 */
export class CompilingHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractCompilingTypedUnionValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
    this.verifyUniqueKeys();
  }

  /** @inheritdoc */
  safeValidate(value: unknown, errorMessage: string): void {
    const i = this.findHeterogeneousUnionSchemaIndex(value, errorMessage);
    this.memberValidators[i].safeValidate(value, errorMessage);
  }

  /** @inheritdoc */
  unsafeValidate(value: unknown, errorMessage: string): void {
    const i = this.findHeterogeneousUnionSchemaIndex(value, errorMessage);
    this.memberValidators[i].unsafeValidate(value, errorMessage);
  }
}
