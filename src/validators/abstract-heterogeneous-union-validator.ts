import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';
import { UnionTypeException } from '../lib/union-type-exception';

/**
 * Abstract validator for heterogeneous unions, providing safe
 * and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  constructor(schema: S) {
    super(schema);
  }

  protected findHeterogeneousUnionSchemaIndex(
    subject: any,
    overallErrorMessage: string
  ): number {
    if (typeof subject === 'object' && subject !== null) {
      for (let i = 0; i < this.schema.anyOf.length; ++i) {
        const memberSchema = this.schema.anyOf[i];
        const uniqueKey = memberSchema.uniqueKey;
        if (uniqueKey !== undefined && subject[uniqueKey] !== undefined) {
          return i;
        }
      }
    }
    throw new UnionTypeException(this.schema, subject, overallErrorMessage);
  }

  protected verifyUniqueKeys(): void {
    for (const memberSchema of this.schema.anyOf) {
      if (memberSchema.uniqueKey === undefined) {
        throw Error("Each member schema must have a 'uniqueKey' property.");
      }
    }
  }
}
