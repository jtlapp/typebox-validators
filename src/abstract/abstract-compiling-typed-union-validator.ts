import { TObject, TUnion } from '@sinclair/typebox';
import { Value, ValueError } from '@sinclair/typebox/value';
import { TypeCompiler } from '@sinclair/typebox/compiler';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';
import {
  createErrorsIterable,
  createUnionTypeError,
  createUnionTypeErrorIterable,
  throwInvalidAssert,
  throwInvalidValidate,
} from '../lib/error-utils';

export type FindSchemaMemberIndex = (value: unknown) => number | null;
export type SchemaMemberTest = (value: object) => boolean;

/**
 * Abstract validatory for typed unions, performing lazy compilation.
 */
export abstract class AbstractCompilingTypedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
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
      return createUnionTypeErrorIterable(indexOrError);
    }
    return createErrorsIterable(
      Value.Errors(this.schema.anyOf[indexOrError], value)
    );
  }

  protected override assertReturningSchema(
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

  protected override validateReturningSchema(
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

  protected compiledFindSchemaMemberIndexOrError(
    value: Readonly<unknown>
  ): number | ValueError {
    const memberIndex = this.compiledFindSchemaMemberIndex(value);
    if (memberIndex === null) {
      return createUnionTypeError(this.schema, value);
    }
    return memberIndex;
  }

  protected abstract compiledFindSchemaMemberIndex(
    value: Readonly<unknown>
  ): number | null;

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
        'return ' +
        code.substring(code.indexOf('(', startOfReturn), code.length - 1);
      this.#compiledSchemaMemberTests[memberIndex] = new Function(
        'value',
        code
      ) as SchemaMemberTest;
    }
    return this.#compiledSchemaMemberTests[memberIndex]!(value);
  }
}
