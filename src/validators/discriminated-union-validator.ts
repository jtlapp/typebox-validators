import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractDiscriminatedUnionValidator } from './abstract-discriminated-union-validator';

/**
 * Non-compiling validator for discriminated unions, providing safe and
 * unsafe validation, supporting custom error messages. List the more
 * frequently used types earlier in the union to improve performance.
 */
export class DiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractDiscriminatedUnionValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override safeValidate(value: unknown, specificError: string): TObject {
    const i = this.findDiscriminatedUnionSchemaIndex(value, specificError);
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledSafeValidate(this.schema.anyOf[i], value, specificError);
    return schema;
  }

  /** @inheritdoc */
  override unsafeValidate(value: unknown, specificError: string): TObject {
    const i = this.findDiscriminatedUnionSchemaIndex(value, specificError);
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledUnsafeValidate(this.schema.anyOf[i], value, specificError);
    return schema;
  }
}
