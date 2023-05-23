import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Lazily compiled validator for values that are discriminated-union unions,
 * providing safe and unsafe validation, supporting custom error messages.
 */
export class CompilingDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  protected memberValidators: CompilingStandardValidator<TObject>[];

  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
    this.memberValidators = this.createMemberValidators();
  }

  /** @inheritdoc */
  safeValidate(value: unknown, errorMessage: string): void {
    const i = this.findDiscriminatedUnionSchemaIndex(value, errorMessage);
    this.memberValidators[i].safeValidate(value, errorMessage);
  }

  /** @inheritdoc */
  unsafeValidate(value: unknown, errorMessage: string): void {
    const i = this.findDiscriminatedUnionSchemaIndex(value, errorMessage);
    this.memberValidators[i].unsafeValidate(value, errorMessage);
  }
}
