import { TObject, TUnion } from '@sinclair/typebox';
import { ValueError } from '@sinclair/typebox/errors';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';

const DEFAULT_DISCRIMINANT_KEY = 'kind';

/**
 * Abstract validator for discriminated unions.
 */
export abstract class AbstractDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  protected discriminantKey: string;
  #unionIsWellformed: boolean = false;

  constructor(schema: Readonly<S>) {
    super(schema);
    this.discriminantKey =
      this.schema.discriminantKey ?? DEFAULT_DISCRIMINANT_KEY;
  }

  protected findSchemaMemberIndex(subject: Readonly<any>): number | ValueError {
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
    return this.createUnionTypeError(this.schema, subject);
  }
}
