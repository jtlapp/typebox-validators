import { TObject, TUnion } from '@sinclair/typebox';

import {
  AbstractCompilingTypedUnionValidator,
  FindSchemaMemberIndex,
} from '../abstract/abstract-compiling-typed-union-validator';
import { TypeIdentifyingKeyIndex } from './type-identifying-key-index';

/**
 * Lazily compiled validator for heterogeneous unions of objects. To improve
 * performance, list the more frequently used types earlier in the union, and
 * list each object's unique key first in its properties.
 */
export class CompilingHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractCompilingTypedUnionValidator<S> {
  #typeIdentifyingKeyIndex: TypeIdentifyingKeyIndex;
  #compiledFindSchemaMemberIndex?: FindSchemaMemberIndex;

  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
    this.#typeIdentifyingKeyIndex = new TypeIdentifyingKeyIndex(schema);
  }

  protected override compiledFindSchemaMemberIndex(
    value: Readonly<unknown>
  ): number | null {
    if (this.#compiledFindSchemaMemberIndex === undefined) {
      this.#typeIdentifyingKeyIndex.cacheKeys();
      const codeParts: string[] = [
        `(value) => ((typeof value !== 'object' || value === null || Array.isArray(value)) ? null : `,
      ];
      for (let i = 0; i < this.schema.anyOf.length; ++i) {
        const uniqueKey = this.#typeIdentifyingKeyIndex.keyByMemberIndex![i];
        codeParts.push(
          `${this.toValueKeyDereference(uniqueKey)} !== undefined ? ${i} : `
        );
      }
      this.#compiledFindSchemaMemberIndex = eval(
        codeParts.join('') + 'null)'
      ) as FindSchemaMemberIndex;
    }
    return this.#compiledFindSchemaMemberIndex(value);
  }
}
