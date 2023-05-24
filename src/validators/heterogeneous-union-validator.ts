import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractHeterogeneousUnionValidator } from './abstract-heterogeneous-union-validator';

/**
 * Non-compiling validator for heterogeneous unions, providing safe
 * and unsafe validation, supporting custom error messages, and
 * cleaning values of unrecognized properties.
 */
export class HeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractHeterogeneousUnionValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override safeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findHeterogeneousUnionSchemaIndex(value, overallError);
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledSafeValidate(schema, value, overallError);
    return schema;
  }

  /** @inheritdoc */
  override unsafeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findHeterogeneousUnionSchemaIndex(value, overallError);
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledUnsafeValidate(schema, value, overallError);
    return schema;
  }
}
