import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Abstract lazily compiled validator for values that are branded unions,
 * providing safe and unsafe validation, supporting custom error messages.
 */
export abstract class AbstractCompilingBrandedValidator<
  S extends TUnion<TObject[]>
> extends AbstractValidator<S> {
  protected memberValidators: CompilingStandardValidator<TObject>[];

  constructor(schema: S) {
    super(schema);
    this.memberValidators = this.schema.anyOf.map(
      (memberSchema) => new CompilingStandardValidator(memberSchema)
    );
  }
}
