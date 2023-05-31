import { TObject, TUnion } from '@sinclair/typebox';

import { DEFAULT_DISCRIMINANT_KEY } from '../validators/abstract-typed-union-validator';
import {
  AbstractCompilingTypedUnionValidator,
  FindSchemaMemberIndex,
} from './abstract-compiling-typed-union-validator';

/**
 * Lazily compiled validator for discriminated-union unions. To improve
 * performance, list the more frequently used types earlier in the union,
 * and list each object's discriminant key first in its properties.
 */
export class CompilingDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractCompilingTypedUnionValidator<S> {
  #discriminantKey: string;
  #compiledFindSchemaMemberIndex?: FindSchemaMemberIndex;

  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
    this.#discriminantKey =
      this.schema.discriminantKey ?? DEFAULT_DISCRIMINANT_KEY;
  }

  protected override compiledFindSchemaMemberIndex(
    value: Readonly<unknown>
  ): number | null {
    if (this.#compiledFindSchemaMemberIndex === undefined) {
      const codeParts: string[] = [
        `(value) => {
          if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
          switch (${this.toValueKeyDereference(this.#discriminantKey)}) {\n`,
      ];
      for (let i = 0; i < this.schema.anyOf.length; ++i) {
        const discriminantSchema =
          this.schema.anyOf[i].properties[this.#discriminantKey];
        if (discriminantSchema === undefined) {
          throw Error(
            `Discriminant key '${
              this.#discriminantKey
            }' not present in all members of discriminated union`
          );
        }
        const literal = discriminantSchema.const;
        if (typeof literal === 'string') {
          codeParts.push(
            `case '${literal.replace(/'/g, "\\'")}': return ${i};\n`
          );
        } else {
          codeParts.push(`case ${literal}: return ${i};\n`);
        }
      }
      const code = codeParts.join('') + 'default: return null; } }';
      this.#compiledFindSchemaMemberIndex = eval(code) as FindSchemaMemberIndex;
    }
    return this.#compiledFindSchemaMemberIndex(value);
  }
}
