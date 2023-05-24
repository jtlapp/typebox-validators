import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractDiscriminatedUnionValidator } from './abstract-discriminated-union-validator';

/**
 * Non-compiling validator for discriminated unions, providing safe and
 * unsafe validation, supporting custom error messages, and cleaning
 * values of unrecognized properties. List the more frequently used types
 * earlier in the union to improve performance.
 */
export class DiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractDiscriminatedUnionValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override safeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findDiscriminatedUnionSchemaIndex(value, overallError);
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledSafeValidate(this.schema.anyOf[i], value, overallError);
    return schema;
  }

  /** @inheritdoc */
  override unsafeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findDiscriminatedUnionSchemaIndex(value, overallError);
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledUnsafeValidate(this.schema.anyOf[i], value, overallError);
    return schema;
  }
}
