import * as typebox from '@sinclair/typebox';

import { UnionTypeException } from './union-type-exception';

const DEFAULT_DISCRIMINANT_KEY = 'kind';

export function findHeterogeneousUnionSchemaIndex(
  unionSchema: typebox.TUnion<typebox.TObject[]>,
  subject: any,
  overallErrorMessage: string
): number {
  if (typeof subject === 'object' && subject !== null) {
    for (let i = 0; i < unionSchema.anyOf.length; ++i) {
      const memberSchema = unionSchema.anyOf[i];
      const uniqueKey = memberSchema.uniqueKey;
      if (uniqueKey !== undefined && subject[uniqueKey] !== undefined) {
        return i;
      }
    }
  }
  throw new UnionTypeException(unionSchema, subject, overallErrorMessage);
}

// TODO: prefix TypeBox types

export function findDiscriminatedUnionSchemaIndex(
  unionSchema: typebox.TUnion<typebox.TObject[]>,
  subject: any,
  overallErrorMessage: string
): number {
  if (typeof subject === 'object' && subject !== null) {
    const discriminantKey =
      unionSchema.discriminator ?? DEFAULT_DISCRIMINANT_KEY;
    const subjectKind = subject[discriminantKey];
    if (subjectKind !== undefined) {
      for (let i = 0; i < unionSchema.anyOf.length; ++i) {
        const memberKind = unionSchema.anyOf[i].properties[discriminantKey];
        if (memberKind !== undefined && memberKind.const === subjectKind) {
          return i;
        }
      }
    }
  }
  throw new UnionTypeException(unionSchema, subject, overallErrorMessage);
}
