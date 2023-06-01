import { Modifier, TObject, TUnion } from '@sinclair/typebox';

export const MESSAGE_OPTIONAL_TYPE_ID_KEY =
  'Type identifying key cannot be optional';
export const MESSAGE_MEMBER_WITH_MULTIPLE_KEYS =
  'Union has member with multiple identifying keys';
export const MESSAGE_MULTIPLE_MEMBERS_WITH_SAME_KEY =
  'Union has multiple members with same identifying key';
export const MESSAGE_MEMBERS_MISSING_KEY =
  'Union has members missing identifying keys';

export class TypeIdentifyingKeyIndex {
  keyByMemberIndex?: string[];

  constructor(readonly schema: Readonly<TUnion<TObject[]>>) {}

  cacheKeys(): void {
    const unionSize = this.schema.anyOf.length;
    const takenKeys = new Set<string>();
    this.keyByMemberIndex = new Array<string>(unionSize);

    for (let i = 0; i < unionSize; ++i) {
      const memberSchema = this.schema.anyOf[i];
      for (const [key, schema] of Object.entries(memberSchema.properties)) {
        if (schema.typeIdentifyingKey) {
          if (schema[Modifier] == 'Optional') {
            throw Error(MESSAGE_OPTIONAL_TYPE_ID_KEY);
          }
          if (this.keyByMemberIndex[i] !== undefined) {
            throw Error(MESSAGE_MEMBER_WITH_MULTIPLE_KEYS);
          }
          if (takenKeys.has(key)) {
            throw Error(MESSAGE_MULTIPLE_MEMBERS_WITH_SAME_KEY);
          }
          this.keyByMemberIndex[i] = key;
          takenKeys.add(key);
        }
      }
    }

    if (takenKeys.size < unionSize) {
      this.keyByMemberIndex = undefined; // reset for next attempt
      throw Error(MESSAGE_MEMBERS_MISSING_KEY);
    }
  }
}
