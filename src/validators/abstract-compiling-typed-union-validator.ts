import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from './abstract-typed-union-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Abstract lazily compiled validator for values that are typed member unions,
 * providing safe and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractCompilingTypedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractTypedUnionValidator<S> {
  protected memberValidators: CompilingStandardValidator<TObject>[];

  constructor(schema: S) {
    super(schema);
    this.memberValidators = this.schema.anyOf.map(
      (memberSchema) => new CompilingStandardValidator(memberSchema)
    );
  }
}
