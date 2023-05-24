import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractHeterogeneousUnionValidator } from './abstract-heterogeneous-union-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Lazily compiled validator for heterogeneous unions, providing
 * safe and unsafe validation, supporting custom error messages.
 */
export class CompilingHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractHeterogeneousUnionValidator<S> {
  protected memberValidators: CompilingStandardValidator<TObject>[];

  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
    this.memberValidators = this.createMemberValidators();
  }

  /** @inheritdoc */
  override safeValidate(value: unknown, specificError: string): TObject {
    const i = this.findHeterogeneousUnionSchemaIndex(value, specificError);
    const schema = this.schema.anyOf[i] as TObject;
    this.memberValidators[i].safeValidate(value, specificError);
    return schema;
  }

  /** @inheritdoc */
  override unsafeValidate(value: unknown, specificError: string): TObject {
    const i = this.findHeterogeneousUnionSchemaIndex(value, specificError);
    const schema = this.schema.anyOf[i] as TObject;
    this.memberValidators[i].unsafeValidate(value, specificError);
    return schema;
  }
}
