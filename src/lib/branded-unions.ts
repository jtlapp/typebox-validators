import * as typebox from '@sinclair/typebox';

import { BrandedTypeException } from './branded-type-exception';

const DEFAULT_DISCRIMINANT_KEY = 'kind';

export function findKeyBrandedSchemaIndex(
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
  throw new BrandedTypeException(unionSchema, subject, overallErrorMessage);
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
    const valueBrand = subject[discriminantKey];
    if (valueBrand !== undefined) {
      for (let i = 0; i < unionSchema.anyOf.length; ++i) {
        const schemaBrand = unionSchema.anyOf[i].properties[discriminantKey];
        if (schemaBrand !== undefined && schemaBrand.const === valueBrand) {
          return i;
        }
      }
    }
  }
  throw new BrandedTypeException(unionSchema, subject, overallErrorMessage);
}
