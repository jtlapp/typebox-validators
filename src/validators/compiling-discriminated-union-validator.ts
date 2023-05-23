import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractCompilingTypedUnionValidator } from './abstract-compiling-typed-union-validator';
import { findDiscriminatedUnionSchemaIndex } from '../lib/typed-member-unions';

/**
 * Lazily compiled validator for values that are discriminated-union unions,
 * providing safe and unsafe validation, supporting custom error messages.
 */
export class CompilingDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractCompilingTypedUnionValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  safeValidate(value: unknown, errorMessage: string): void {
    const i = findDiscriminatedUnionSchemaIndex(
      this.schema,
      value,
      errorMessage
    );
    this.memberValidators[i].safeValidate(value, errorMessage);
  }

  /** @inheritdoc */
  unsafeValidate(value: unknown, errorMessage: string): void {
    const i = findDiscriminatedUnionSchemaIndex(
      this.schema,
      value,
      errorMessage
    );
    this.memberValidators[i].unsafeValidate(value, errorMessage);
  }
}
