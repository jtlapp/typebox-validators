import {
  TObject,
  TUnion,
  Modifier as TypeBoxModifier,
} from '@sinclair/typebox';
import { ValueError } from '@sinclair/typebox/errors';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';

/**
 * Abstract validator for heterogeneous unions of objects.
 */
export abstract class AbstractHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  protected uniqueKeyByMemberIndex?: string[];

  constructor(schema: Readonly<S>) {
    super(schema);
  }

  protected findSchemaMemberIndex(value: Readonly<any>): number | ValueError {
    if (this.uniqueKeyByMemberIndex === undefined) {
      // only incur cost if validator is actually used
      this.cacheUniqueKeys();
    }

    if (typeof value === 'object' && value !== null) {
      for (let i = 0; i < this.schema.anyOf.length; ++i) {
        const uniqueKey = this.uniqueKeyByMemberIndex![i];
        if (value[uniqueKey] !== undefined) {
          return i;
        }
      }
    }
    return this.createUnionTypeError(this.schema, value);
  }

  protected cacheUniqueKeys(): void {
    const keyToMemberIndexMap = new Map<string, number>();
    const unionSize = this.schema.anyOf.length;

    for (let i = 0; i < unionSize; ++i) {
      const memberSchema = this.schema.anyOf[i];
      // TODO: replace 'in'
      for (const key in memberSchema.properties) {
        if (!keyToMemberIndexMap.has(key)) {
          const property = memberSchema.properties[key];
          if (property[TypeBoxModifier] !== 'Optional') {
            keyToMemberIndexMap.set(key, i);
          }
        } else {
          keyToMemberIndexMap.set(key, -1);
        }
      }
    }

    let uniqueKeyCount = 0;
    this.uniqueKeyByMemberIndex = new Array<string>(unionSize);
    for (const [uniqueKey, memberIndex] of keyToMemberIndexMap) {
      if (
        memberIndex >= 0 &&
        this.uniqueKeyByMemberIndex[memberIndex] === undefined
      ) {
        this.uniqueKeyByMemberIndex[memberIndex] = uniqueKey;
        ++uniqueKeyCount;
      }
    }
    if (uniqueKeyCount < unionSize) {
      this.uniqueKeyByMemberIndex = undefined; // reset for next attempt
      throw Error('Heterogeneous union has members lacking unique keys');
    }
  }
}
