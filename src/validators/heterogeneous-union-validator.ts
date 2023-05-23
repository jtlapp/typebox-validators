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
  override safeValidate(value: unknown, errorMessage: string): TObject {
    const i = this.findHeterogeneousUnionSchemaIndex(value, errorMessage);
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledSafeValidate(schema, value, errorMessage);
    return schema;
  }

  /** @inheritdoc */
  override unsafeValidate(value: unknown, errorMessage: string): TObject {
    const i = this.findHeterogeneousUnionSchemaIndex(value, errorMessage);
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledUnsafeValidate(schema, value, errorMessage);
    return schema;
  }
}
