import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';
import { Value, ValueError } from '@sinclair/typebox/value';
import {
  createErrorsIterable,
  createUnionTypeErrorIterable,
  throwInvalidAssert,
  throwInvalidValidate,
} from '../lib/error-utils';
import { HeterogeneousMemberFinder } from '../lib/heterogeneous-member-finder';

/**
 * Non-compiling validator for heterogeneous unions of objects. To improve
 * performance, list the more frequently used types earlier in the union, and
 * list each object's unique key first in its properties.
 */
export class HeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  #memberFinder: HeterogeneousMemberFinder;

  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
    this.#memberFinder = new HeterogeneousMemberFinder(schema);
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    const indexOrError = this.#memberFinder.findSchemaMemberIndex(value);
    if (typeof indexOrError !== 'number') {
      return false;
    }
    return Value.Check(this.schema.anyOf[indexOrError], value);
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    const indexOrError = this.#memberFinder.findSchemaMemberIndex(value);
    if (typeof indexOrError !== 'number') {
      return createUnionTypeErrorIterable(indexOrError);
    }
    const schema = this.schema.anyOf[indexOrError] as TObject;
    return createErrorsIterable(Value.Errors(schema, value));
  }

  override assertReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const indexOrError = this.#memberFinder.findSchemaMemberIndex(value);
    if (typeof indexOrError !== 'number') {
      throwInvalidAssert(overallError, indexOrError);
    }
    const schema = this.schema.anyOf[indexOrError] as TObject;
    this.uncompiledAssert(schema, value, overallError);
    return schema;
  }

  override validateReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const indexOrError = this.#memberFinder.findSchemaMemberIndex(value);
    if (typeof indexOrError !== 'number') {
      throwInvalidValidate(overallError, indexOrError);
    }
    const schema = this.schema.anyOf[indexOrError] as TObject;
    this.uncompiledValidate(schema, value, overallError);
    return schema;
  }
}
