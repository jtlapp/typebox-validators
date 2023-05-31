import { TObject, TUnion } from '@sinclair/typebox';

import {
  AbstractCompilingTypedUnionValidator,
  FindSchemaMemberIndex,
} from './abstract-compiling-typed-union-validator';
import { UniqueKeyIndex } from '../lib/unique-key-index';

/**
 * Lazily compiled validator for heterogeneous unions of objects. To improve
 * performance, list the more frequently used types earlier in the union, and
 * list each object's unique key first in its properties.
 */
export class CompilingHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractCompilingTypedUnionValidator<S> {
  #uniqueKeyIndex: UniqueKeyIndex;
  #compiledFindSchemaMemberIndex?: FindSchemaMemberIndex;

  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
    this.#uniqueKeyIndex = new UniqueKeyIndex(schema);
  }

  protected override compiledFindSchemaMemberIndex(
    value: Readonly<unknown>
  ): number | null {
    if (this.#compiledFindSchemaMemberIndex === undefined) {
      this.#uniqueKeyIndex.cacheUniqueKeys();
      const codeParts: string[] = [
        `(value) => ((typeof value !== 'object' || value === null || Array.isArray(value)) ? null : `,
      ];
      for (let i = 0; i < this.schema.anyOf.length; ++i) {
        const uniqueKey = this.#uniqueKeyIndex.keyByMemberIndex![i];
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
