import { TObject, TUnion } from '@sinclair/typebox';
import { ValueError } from '@sinclair/typebox/errors';

import { AbstractDiscriminatedUnionValidator } from './abstract-discriminated-union-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';
import { throwInvalidAssert, throwInvalidValidate } from '../lib/errors';

/**
 * Lazily compiled validator for discriminated-union unions, providing
 * safe and unsafe validation, supporting custom error messages, and
 * cleaning values of unrecognized properties. List the more frequently
 * used types earlier in the union to improve performance.
 */
export class CompilingDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractDiscriminatedUnionValidator<S> {
  protected memberValidators: CompilingStandardValidator<TObject>[];

  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
    this.memberValidators = this.createMemberValidators();
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    const indexOrError = this.findDiscriminatedUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      return false;
    }
    return this.memberValidators[indexOrError].test(value);
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    const indexOrError = this.findDiscriminatedUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      return this.createUnionTypeErrorIterable(indexOrError);
    }
    return this.memberValidators[indexOrError].errors(value);
  }

  override assertReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const indexOrError = this.findDiscriminatedUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      throwInvalidAssert(overallError, indexOrError);
    }
    this.memberValidators[indexOrError].assert(value, overallError);
    return this.schema.anyOf[indexOrError] as TObject;
  }

  override validateReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const indexOrError = this.findDiscriminatedUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      throwInvalidValidate(overallError, indexOrError);
    }
    this.memberValidators[indexOrError].validate(value, overallError);
    return this.schema.anyOf[indexOrError] as TObject;
  }
}
