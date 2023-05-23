import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';
import { UnionTypeException } from '../lib/union-type-exception';
import { CompilingStandardValidator } from './compiling-standard-validator';

const DEFAULT_DISCRIMINANT_KEY = 'kind';

// TODO: investigate removeUnevaluatedProperties and unevaluatedProperties
// of JSON Schema.

/**
 * Abstract validator for values that are typed member unions, providing
 * safe and unsafe validation, supporting custom error messages.
 */
// Provides functionality supporting both discriminated and heterogeneous
// unions and compiling and non-compiling validators, for use by subclasses,
// because TypeScript doesn't support multiple inheritance or mixins.
export abstract class AbstractTypedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractValidator<S> {
  constructor(schema: S) {
    super(schema);
  }

  protected createMemberValidators(): CompilingStandardValidator<TObject>[] {
    return this.schema.anyOf.map(
      (memberSchema) => new CompilingStandardValidator(memberSchema)
    );
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
