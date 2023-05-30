import { TObject, TUnion } from '@sinclair/typebox';
import { Value, ValueError } from '@sinclair/typebox/value';
import { TypeCompiler } from '@sinclair/typebox/compiler';

import {
  FindSchemaMemberIndex,
  SchemaMemberTest,
} from './abstract-typed-union-validator';
import { AbstractHeterogeneousUnionValidator } from './abstract-heterogeneous-union-validator';
import {
  createErrorsIterable,
  throwInvalidAssert,
  throwInvalidValidate,
} from '../lib/errors';

// TODO: It looks like many of these methods can be shared with discriminated unions,
// except that they are calling different base methods having the same name.

/**
 * Lazily compiled validator for heterogeneous unions of objects. To improve
 * performance, list the more frequently used types earlier in the union, and
 * list each object's unique key first in its properties.
 */
export class CompilingHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractHeterogeneousUnionValidator<S> {
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
      this.cacheUniqueKeys();
      const codeParts: string[] = [
        `(value) => ((typeof value !== 'object' || value === null || Array.isArray(value)) ? null : `,
      ];
      for (let i = 0; i < this.schema.anyOf.length; ++i) {
        const uniqueKey = this.uniqueKeyByMemberIndex![i];
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
