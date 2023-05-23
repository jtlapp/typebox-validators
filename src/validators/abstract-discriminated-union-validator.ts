import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';
import { UnionTypeException } from '../lib/union-type-exception';

const DEFAULT_DISCRIMINANT_KEY = 'kind';

// TODO: investigate removeUnevaluatedProperties and unevaluatedProperties
// of JSON Schema.

/**
 * Abstract validator for discriminated unions, providing safe
 * and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  constructor(schema: S) {
    super(schema);
  }

  protected findDiscriminatedUnionSchemaIndex(
    subject: any,
    overallErrorMessage: string
  ): number {
    if (typeof subject === 'object' && subject !== null) {
      const discriminantKey =
        this.schema.discriminantKey ?? DEFAULT_DISCRIMINANT_KEY;
      const subjectKind = subject[discriminantKey];
      if (subjectKind !== undefined) {
        for (let i = 0; i < this.schema.anyOf.length; ++i) {
          const memberKind = this.schema.anyOf[i].properties[discriminantKey];
          if (memberKind !== undefined && memberKind.const === subjectKind) {
            return i;
          }
        }
      }
    }
    throw new UnionTypeException(this.schema, subject, overallErrorMessage);
  }
}
