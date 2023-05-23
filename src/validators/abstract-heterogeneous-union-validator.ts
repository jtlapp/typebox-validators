import {
  TObject,
  TUnion,
  Modifier as TypeBoxModifier,
} from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';
import { UnionTypeException } from '../lib/union-type-exception';

/**
 * Abstract validator for heterogeneous unions, providing safe
 * and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  protected uniqueKeyByMemberIndex?: string[];

  constructor(schema: S) {
    super(schema);
  }

  protected findHeterogeneousUnionSchemaIndex(
    subject: any,
    overallErrorMessage: string
  ): number {
    if (this.uniqueKeyByMemberIndex === undefined) {
      // only incur cost if validator is actually used
      this.cacheUniqueKeys();
    }

    if (typeof subject === 'object' && subject !== null) {
      for (let i = 0; i < this.schema.anyOf.length; ++i) {
        const uniqueKey = this.uniqueKeyByMemberIndex![i];
        if (subject[uniqueKey] !== undefined) {
          return i;
        }
      }
    }
    throw new UnionTypeException(this.schema, subject, overallErrorMessage);
  }

  protected cacheUniqueKeys(): void {
    const keyToMemberIndexMap = new Map<string, number>();
    const unionSize = this.schema.anyOf.length;

    for (let i = 0; i < unionSize; ++i) {
      const memberSchema = this.schema.anyOf[i];
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
