import { TObject, TUnion } from '@sinclair/typebox';
import { ValueError } from '@sinclair/typebox/errors';

import { createUnionTypeError } from '../lib/error-utils';

export const DEFAULT_DISCRIMINANT_KEY = 'kind';

/**
 * Abstract validator for discriminated unions.
 */
export class DiscriminatedMemberFinder {
  discriminantKey: string;
  #unionIsWellformed: boolean = false;

  constructor(readonly schema: Readonly<TUnion<TObject[]>>) {
    this.discriminantKey =
      this.schema.discriminantKey ?? DEFAULT_DISCRIMINANT_KEY;
  }

  findSchemaMemberIndex(subject: Readonly<any>): number | ValueError {
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
