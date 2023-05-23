import { Static, TObject, TUnion } from '@sinclair/typebox';

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

  /** @inheritdoc */
  override safeValidateAndClean(
    value: unknown,
    errorMessage: string
  ): [TObject, Static<S>] {
    const schema = this.safeValidate(value, errorMessage) as TObject;
    return [schema, this.cleanValue(schema, value)];
  }

  protected createMemberValidators(): CompilingStandardValidator<TObject>[] {
    return this.schema.anyOf.map(
      (memberSchema) => new CompilingStandardValidator(memberSchema)
    );
  }
}
