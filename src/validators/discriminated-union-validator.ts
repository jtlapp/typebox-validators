import { TObject, TUnion } from '@sinclair/typebox';
import { Value, ValueError } from '@sinclair/typebox/value';

import { AbstractDiscriminatedUnionValidator } from './abstract-discriminated-union-validator';

/**
 * Non-compiling validator for discriminated unions. List the more frequently
 * used types earlier in the union to improve performance.
 */
export class DiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractDiscriminatedUnionValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    return Value.Check(this.schema, value);
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    const indexOrError = this.findDiscriminatedUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      return this.createUnionTypeErrorIterable(indexOrError);
    }
    const schema = this.schema.anyOf[indexOrError] as TObject;
    return this.uncompiledErrors(schema, value);
  }

  override assertReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findDiscriminatedUnionSchemaIndexOrThrow(
      value,
      overallError
    );
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledAssert(schema, value, overallError);
    return schema;
  }

  override validateReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findDiscriminatedUnionSchemaIndexOrThrow(
      value,
      overallError
    );
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledValidate(schema, value, overallError);
    return schema;
  }
}
