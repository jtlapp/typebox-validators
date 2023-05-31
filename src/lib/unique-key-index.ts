import {
  TObject,
  TUnion,
  Modifier as TypeBoxModifier,
} from '@sinclair/typebox';

export class UniqueKeyIndex {
  keyByMemberIndex?: string[];

  constructor(readonly schema: Readonly<TUnion<TObject[]>>) {}

  cacheUniqueKeys(): void {
    const keyToMemberIndexMap = new Map<string, number>();
    const unionSize = this.schema.anyOf.length;

    for (let i = 0; i < unionSize; ++i) {
      const memberSchema = this.schema.anyOf[i];
      Object.getOwnPropertyNames(memberSchema.properties).forEach((key) => {
        if (!keyToMemberIndexMap.has(key)) {
          const property = memberSchema.properties[key];
          if (property[TypeBoxModifier] !== 'Optional') {
            keyToMemberIndexMap.set(key, i);
          }
        } else {
          keyToMemberIndexMap.set(key, -1);
        }
      });
    }

    let uniqueKeyCount = 0;
    this.keyByMemberIndex = new Array<string>(unionSize);
    for (const [uniqueKey, memberIndex] of keyToMemberIndexMap) {
      if (
        memberIndex >= 0 &&
        this.keyByMemberIndex[memberIndex] === undefined
      ) {
        this.keyByMemberIndex[memberIndex] = uniqueKey;
        ++uniqueKeyCount;
      }
    }
    if (uniqueKeyCount < unionSize) {
      this.keyByMemberIndex = undefined; // reset for next attempt
      throw Error('Heterogeneous union has members lacking unique keys');
    }
  }
}
