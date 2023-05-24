import { Static, TObject, TUnion } from '@sinclair/typebox';

import { AbstractValidator } from './abstract-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Abstract validator for values that are typed member unions, providing
 * safe and unsafe validation, supporting custom error messages, and cleaning
 * values of unrecognized properties.
 */
export abstract class AbstractTypedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractValidator<S> {
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override safeValidateAndCleanCopy(
    value: Readonly<unknown>,
    overallError?: string
  ): [TObject, Static<S>] {
    const schema = this.safeValidate(value, overallError) as TObject;
    return [schema, this.cleanCopyOfValue(schema, value)];
  }

  /** @inheritdoc */
  override safeValidateAndCleanOriginal(
    value: unknown,
    overallError?: string
  ): TObject {
    const schema = this.safeValidate(value as any, overallError) as TObject;
    this.cleanOriginalValue(schema, value);
    return schema;
  }

  protected createMemberValidators(): CompilingStandardValidator<TObject>[] {
    return this.schema.anyOf.map(
      (memberSchema) => new CompilingStandardValidator(memberSchema)
    );
  }
}
