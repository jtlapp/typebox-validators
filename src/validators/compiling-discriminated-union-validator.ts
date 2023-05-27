import { TObject, TUnion } from '@sinclair/typebox';
import { ValueError } from '@sinclair/typebox/errors';

import { AbstractDiscriminatedUnionValidator } from './abstract-discriminated-union-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

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
  override getErrorIterator(value: Readonly<unknown>): Iterator<ValueError> {
    const indexOrError = this.findDiscriminatedUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      return this.createUnionTypeErrorIterator(indexOrError);
    }
    return this.memberValidators[indexOrError].getErrorIterator(value);
  }

  override assertReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findDiscriminatedUnionSchemaIndexOrThrow(
      value,
      overallError
    );
    this.memberValidators[i].assert(value, overallError);
    return this.schema.anyOf[i] as TObject;
  }

  override validateReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findDiscriminatedUnionSchemaIndexOrThrow(
      value,
      overallError
    );
    this.memberValidators[i].validate(value, overallError);
    return this.schema.anyOf[i] as TObject;
  }
}
