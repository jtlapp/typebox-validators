import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractHeterogeneousUnionValidator } from './abstract-heterogeneous-union-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Lazily compiled validator for heterogeneous unions, providing
 * safe and unsafe validation, supporting custom error messages, and
 * cleaning values of unrecognized properties.
 */
export class CompilingHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractHeterogeneousUnionValidator<S> {
  protected memberValidators: CompilingStandardValidator<TObject>[];

  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
    this.memberValidators = this.createMemberValidators();
  }

  /** @inheritdoc */
  override safeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findHeterogeneousUnionSchemaIndex(value, overallError);
    const schema = this.schema.anyOf[i] as TObject;
    this.memberValidators[i].safeValidate(value, overallError);
    return schema;
  }

  /** @inheritdoc */
  override unsafeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findHeterogeneousUnionSchemaIndex(value, overallError);
    const schema = this.schema.anyOf[i] as TObject;
    this.memberValidators[i].unsafeValidate(value, overallError);
    return schema;
  }
}
