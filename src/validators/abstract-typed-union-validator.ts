import { Static, TObject, TUnion } from '@sinclair/typebox';
import { ValueError, ValueErrorType } from '@sinclair/typebox/errors';

import { AbstractValidator } from './abstract-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';
import { DEFAULT_UNKNOWN_TYPE_MESSAGE } from '../lib/error-utils';

export type FindSchemaMemberIndex = (value: unknown) => number | null;
export type SchemaMemberTest = (value: object) => boolean;

/**
 * Abstract validator for values that are typed member unions of objects.
 */
export abstract class AbstractTypedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractValidator<S> {
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override assert(value: Readonly<unknown>, overallError?: string): void {
    this.assertReturningSchema(value, overallError);
  }

  /** @inheritdoc */
  override assertAndClean(value: unknown, overallError?: string): void {
    const schema = this.assertReturningSchema(value as any, overallError);
    this.cleanValue(schema, value);
  }

  /** @inheritdoc */
  override assertAndCleanCopy(
    value: Readonly<unknown>,
    overallError?: string
  ): Static<S> {
    const schema = this.assertReturningSchema(value, overallError);
    return this.cleanCopyOfValue(schema, value);
  }

  /** @inheritdoc */
  override validate(value: Readonly<unknown>, overallError?: string): void {
    this.validateReturningSchema(value, overallError);
  }

  /** @inheritdoc */
  override validateAndClean(value: unknown, overallError?: string): void {
    const schema = this.validateReturningSchema(value as any, overallError);
    this.cleanValue(schema, value);
  }

  /** @inheritdoc */
  override validateAndCleanCopy(
    value: Readonly<unknown>,
    overallError?: string
  ): Static<S> {
    const schema = this.validateReturningSchema(value, overallError);
    return this.cleanCopyOfValue(schema, value);
  }

  protected abstract assertReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject;

  protected abstract validateReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject;

  protected createMemberValidators(): CompilingStandardValidator<TObject>[] {
    return this.schema.anyOf.map(
      (memberSchema) => new CompilingStandardValidator(memberSchema)
    );
  }

  protected createUnionTypeError(
    unionSchema: Readonly<TUnion<TObject[]>>,
    value: Readonly<unknown>
  ): ValueError {
    return {
      type: ValueErrorType.Union,
      path: '',
      schema: unionSchema,
      value,
      message: unionSchema.errorMessage ?? DEFAULT_UNKNOWN_TYPE_MESSAGE,
    };
  }

  protected createUnionTypeErrorIterable(
    typeError: ValueError
  ): Iterable<ValueError> {
    return {
      [Symbol.iterator]: function* () {
        yield typeError;
      },
    };
  }

  protected toValueKeyDereference(key: string): string {
    return /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(key)
      ? `value.${key}`
      : `value['${key.replace(/'/g, "\\'")}']`;
  }
}
