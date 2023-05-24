import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';
import { UnionTypeException } from '../lib/union-type-exception';

const DEFAULT_DISCRIMINANT_KEY = 'kind';

/**
 * Abstract validator for discriminated unions, providing safe
 * and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  #discriminantKey: string;
  #unionIsWellformed: boolean = false;

  constructor(schema: S) {
    super(schema);
    this.#discriminantKey =
      this.schema.discriminantKey ?? DEFAULT_DISCRIMINANT_KEY;
  }

  protected findDiscriminatedUnionSchemaIndex(
    subject: any,
    overallError: string
  ): number {
    if (!this.#unionIsWellformed) {
      // only incur cost if validator is actually used
      for (const memberSchema of this.schema.anyOf) {
        if (memberSchema.properties[this.#discriminantKey] === undefined) {
          throw Error(
            `Discriminant key '${
              this.#discriminantKey
            }' not present in all members of discriminated union`
          );
        }
      }
      this.#unionIsWellformed = true;
    }

    if (typeof subject === 'object' && subject !== null) {
      const subjectKind = subject[this.#discriminantKey];
      if (subjectKind !== undefined) {
        for (let i = 0; i < this.schema.anyOf.length; ++i) {
          const memberKind =
            this.schema.anyOf[i].properties[this.#discriminantKey];
          if (memberKind !== undefined && memberKind.const === subjectKind) {
            return i;
          }
        }
      }
    }
    throw new UnionTypeException(this.schema, subject, overallError);
  }
}
