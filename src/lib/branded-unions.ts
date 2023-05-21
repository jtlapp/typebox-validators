import { TObject } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { TypeSystem } from '@sinclair/typebox/system';

import { ErrorSchemaOptions } from './error-schema-options';

/**
 * Options for a KeyBrandedUnion.
 */
export interface BrandedUnionOptions extends ErrorSchemaOptions {
  /**
   * Array of object schemas any one of which an object could match.
   */
  schemas: TObject[];
}

/**
 * Type representing a union of TypeBox types, where the schemas each have at
 * least one property not found in any other schema. Each schema provides a
 * `uniqueKey` option specifying the name of one of its unique properties.
 * The values of these properties can have any type.
 */
export const KeyBrandedUnion = TypeSystem.Type<object, BrandedUnionOptions>(
  'KeyBrandedUnion',
  (options, subject: any) => {
    if (typeof subject !== 'object' || subject === null) {
      return false;
    }

    for (const schema of options.schemas) {
      const uniqueKey = schema.uniqueKey;
      if (uniqueKey !== undefined && subject[uniqueKey] !== undefined) {
        // TODO: can I precompile this?
        return Value.Check(schema, subject);
      }
    }
    return false;
  }
);

/**
 * Options for a ValueBrandedUnion.
 */
export interface ValueBrandedUnionOptions extends BrandedUnionOptions {
  /**
   * Name of the property found in all schemas whose literal value uniquely
   * identifies the type.
   */
  brandKey: string;
}

/**
 * Type representing a union of TypeBox types, where the schemas all have a
 * property of the same name whose value uniquely identifies the type. The
 * `brandKey` option on the union schema specifies the name of this property,
 * which must be a literal type.
 */
export const ValueBrandedUnion = TypeSystem.Type<
  object,
  ValueBrandedUnionOptions
>('BrandedUnion', (options, subject: any) => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  const brandKey = options.brandKey;
  const valueBrand = subject[brandKey];
  if (valueBrand === undefined) {
    return false;
  }

  for (const schema of options.schemas) {
    const schemaBrand = schema.properties[brandKey];
    if (schemaBrand !== undefined && schemaBrand.const === valueBrand) {
      // TODO: can I precompile this?
      return Value.Check(schema, subject);
    }
  }
  return false;
});
