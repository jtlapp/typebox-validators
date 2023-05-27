import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractHeterogeneousUnionValidator } from './abstract-heterogeneous-union-validator';
import { Value, ValueError } from '@sinclair/typebox/value';

/**
 * Non-compiling validator for heterogeneous unions of objecs.
 */
export class HeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractHeterogeneousUnionValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    return Value.Check(this.schema, value);
  }

  /** @inheritdoc */
  override getErrorIterator(value: Readonly<unknown>): Iterator<ValueError> {
    const indexOrError = this.findHeterogeneousUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      return this.createUnionTypeErrorIterator(indexOrError);
    }
    const schema = this.schema.anyOf[indexOrError] as TObject;
    return this.uncompiledGetErrorIterator(schema, value);
  }

  override assertReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findHeterogeneousUnionSchemaIndexOrThrow(
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
    const i = this.findHeterogeneousUnionSchemaIndexOrThrow(
      value,
      overallError
    );
    const schema = this.schema.anyOf[i] as TObject;
    this.uncompiledValidate(schema, value, overallError);
    return schema;
  }
}
