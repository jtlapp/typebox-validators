import { TSchema } from '@sinclair/typebox';

/**
 * Marks an occurrence of a schema as being the property of a key that
 * uniquely identifies its containing object within a heterogeneous union.
 */
export function TypeIdentifyingKey(schema: Readonly<TSchema>): TSchema {
  return {
    ...schema,
    typeIdentifyingKey: true,
  };
}
