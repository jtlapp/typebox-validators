import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Abstract validator for values that are typed member unions, providing
 * safe and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractTypedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractValidator<S> {
  constructor(schema: S) {
    super(schema);
  }

  protected createMemberValidators(): CompilingStandardValidator<TObject>[] {
    return this.schema.anyOf.map(
      (memberSchema) => new CompilingStandardValidator(memberSchema)
    );
  }
}
