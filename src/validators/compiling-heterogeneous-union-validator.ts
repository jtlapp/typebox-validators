import { TObject, TUnion } from '@sinclair/typebox';
import { ValueError } from '@sinclair/typebox/errors';

import { AbstractHeterogeneousUnionValidator } from './abstract-heterogeneous-union-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Lazily compiled validator for heterogeneous unions of objects.
 */
export class CompilingHeterogeneousUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractHeterogeneousUnionValidator<S> {
  protected memberValidators: CompilingStandardValidator<TObject>[];

  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
    this.memberValidators = this.createMemberValidators();
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    const indexOrError = this.findHeterogeneousUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      return false;
    }
    return this.memberValidators[indexOrError].test(value);
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    const indexOrError = this.findHeterogeneousUnionSchemaIndex(value);
    if (typeof indexOrError !== 'number') {
      return this.createUnionTypeErrorIterable(indexOrError);
    }
    return this.memberValidators[indexOrError].errors(value);
  }

  override assertReturningSchema(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findHeterogeneousUnionSchemaIndexOrThrow(
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
    const i = this.findHeterogeneousUnionSchemaIndexOrThrow(
      value,
      overallError
    );
    this.memberValidators[i].validate(value, overallError);
    return this.schema.anyOf[i] as TObject;
  }
}
