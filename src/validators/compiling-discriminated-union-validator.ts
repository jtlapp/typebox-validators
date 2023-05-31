import { TObject, TUnion } from '@sinclair/typebox';
import { Value, ValueError } from '@sinclair/typebox/value';
import { TypeCompiler } from '@sinclair/typebox/compiler';

import {
  FindSchemaMemberIndex,
  SchemaMemberTest,
} from './abstract-typed-union-validator';
import { AbstractDiscriminatedUnionValidator } from './abstract-discriminated-union-validator';
import {
  createErrorsIterable,
  throwInvalidAssert,
  throwInvalidValidate,
} from '../lib/error-utils';

/**
 * Lazily compiled validator for discriminated-union unions. To improve
 * performance, list the more frequently used types earlier in the union,
 * and list each object's discriminant key first in its properties.
 */
export class CompilingDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractDiscriminatedUnionValidator<S> {
  #compiledFindSchemaMemberIndex?: FindSchemaMemberIndex;
  #compiledSchemaMemberTests: (SchemaMemberTest | undefined)[];

  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
    this.#compiledSchemaMemberTests = new Array(schema.anyOf.length);
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    const memberIndex = this.compiledFindSchemaMemberIndex(value);
    return this.compiledSchemaMemberTest(memberIndex, value);
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    const indexOrError = this.compiledFindSchemaMemberIndexOrError(value);
    if (typeof indexOrError !== 'number') {
      return this.createUnionTypeErrorIterable(indexOrError);
    }
    return createErrorsIterable(
      Value.Errors(this.schema.anyOf[indexOrError], value)
    );
  }

  override assertReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const indexOrError = this.compiledFindSchemaMemberIndexOrError(value);
    if (typeof indexOrError !== 'number') {
      throwInvalidAssert(overallError, indexOrError);
    }
    const memberSchema = this.schema.anyOf[indexOrError];
    if (!this.compiledSchemaMemberTest(indexOrError, value)) {
      throwInvalidAssert(
        overallError,
        Value.Errors(memberSchema, value).First()!
      );
    }
    return memberSchema;
  }

  override validateReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const indexOrError = this.compiledFindSchemaMemberIndexOrError(value);
    if (typeof indexOrError !== 'number') {
      throwInvalidValidate(overallError, indexOrError);
    }
    const memberSchema = this.schema.anyOf[indexOrError];
    if (!this.compiledSchemaMemberTest(indexOrError, value)) {
      throwInvalidValidate(overallError, Value.Errors(memberSchema, value));
    }
    return memberSchema;
  }

  private compiledFindSchemaMemberIndex(
    value: Readonly<unknown>
  ): number | null {
    if (this.#compiledFindSchemaMemberIndex === undefined) {
      const codeParts: string[] = [
        `(value) => {
          if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
          switch (${this.toValueKeyDereference(this.discriminantKey)}) {\n`,
      ];
      for (let i = 0; i < this.schema.anyOf.length; ++i) {
        const discriminantSchema =
          this.schema.anyOf[i].properties[this.discriminantKey];
        if (discriminantSchema === undefined) {
          throw Error(
            `Discriminant key '${this.discriminantKey}' not present in all members of discriminated union`
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

  private compiledFindSchemaMemberIndexOrError(
    value: Readonly<unknown>
  ): number | ValueError {
    const memberIndex = this.compiledFindSchemaMemberIndex(value);
    if (memberIndex === null) {
      return this.createUnionTypeError(this.schema, value);
    }
    return memberIndex;
  }

  private compiledSchemaMemberTest(
    memberIndex: number | null,
    value: Readonly<unknown>
  ): boolean {
    if (memberIndex === null) {
      return false;
    }
    if (this.#compiledSchemaMemberTests[memberIndex] === undefined) {
      let code = TypeCompiler.Compile(this.schema.anyOf[memberIndex]).Code();
      code = code.replace(
        `(typeof value === 'object' && value !== null && !Array.isArray(value)) &&`,
        ''
      );
      // provide some resilience to change in TypeBox compiled code formatting
      const startOfFunction = code.indexOf('function');
      const startOfReturn = code.indexOf('return', startOfFunction);
      code =
        '(value) => ' +
        code.substring(code.indexOf('(', startOfReturn), code.length - 1);
      this.#compiledSchemaMemberTests[memberIndex] = eval(code);
    }
    return this.#compiledSchemaMemberTests[memberIndex]!(value);
  }
}
