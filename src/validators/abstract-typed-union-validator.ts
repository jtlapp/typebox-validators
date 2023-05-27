import { Static, TObject, TUnion } from '@sinclair/typebox';
import { ValueError, ValueErrorType } from '@sinclair/typebox/errors';

import { AbstractValidator } from './abstract-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

const DEFAULT_UNKNOWN_TYPE_MESSAGE = 'not a type the union recognizes';

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
      message: unionSchema.typeError ?? DEFAULT_UNKNOWN_TYPE_MESSAGE,
    };
  }

  protected createUnionTypeErrorIterator(
    typeError: ValueError
  ): Iterator<ValueError> {
    return { next: () => ({ done: true, value: typeError }) };
  }
}
