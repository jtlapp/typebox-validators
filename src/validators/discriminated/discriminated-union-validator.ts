import { TObject, TUnion } from '@sinclair/typebox';
import { Value, ValueError } from '@sinclair/typebox/value';

import {
  AbstractTypedUnionValidator,
  DEFAULT_DISCRIMINANT_KEY,
} from '../abstract/abstract-typed-union-validator';
import {
  createErrorsIterable,
  createUnionTypeError,
  createUnionTypeErrorIterable,
  throwInvalidAssert,
  throwInvalidValidate,
} from '../../lib/error-utils';

/**
 * Non-compiling validator for discriminated unions. To improve performance,
 * list the more frequently used types earlier in the union, and list each
 * object's discriminant key first in its properties.
 */
export class DiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  discriminantKey: string;
  #unionIsWellformed: boolean = false;

  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
    this.discriminantKey =
      this.schema.discriminantKey ?? DEFAULT_DISCRIMINANT_KEY;
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    const indexOrError = this.findSchemaMemberIndex(value);
    if (typeof indexOrError !== 'number') {
      return false;
    }
    return Value.Check(this.schema.anyOf[indexOrError], value);
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    const indexOrError = this.findSchemaMemberIndex(value);
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
    const indexOrError = this.findSchemaMemberIndex(value);
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
    const indexOrError = this.findSchemaMemberIndex(value);
    if (typeof indexOrError !== 'number') {
      throwInvalidValidate(overallError, indexOrError);
    }
    const schema = this.schema.anyOf[indexOrError] as TObject;
    this.uncompiledValidate(schema, value, overallError);
    return schema;
  }

  private findSchemaMemberIndex(subject: Readonly<any>): number | ValueError {
    if (!this.#unionIsWellformed) {
      // only incur cost if validator is actually used
      for (const memberSchema of this.schema.anyOf) {
        if (memberSchema.properties[this.discriminantKey] === undefined) {
          throw Error(
            `Discriminant key '${this.discriminantKey}' not present in all members of discriminated union`
          );
        }
      }
      this.#unionIsWellformed = true;
    }

    if (typeof subject === 'object' && subject !== null) {
      const subjectKind = subject[this.discriminantKey];
      if (subjectKind !== undefined) {
        for (let i = 0; i < this.schema.anyOf.length; ++i) {
          const memberKind =
            this.schema.anyOf[i].properties[this.discriminantKey];
          if (memberKind !== undefined && memberKind.const === subjectKind) {
            return i;
          }
        }
      }
    }
    return createUnionTypeError(this.schema, subject);
  }
}
