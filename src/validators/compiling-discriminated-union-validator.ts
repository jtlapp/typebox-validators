import { TObject, TUnion } from '@sinclair/typebox';

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
  override safeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findDiscriminatedUnionSchemaIndex(value, overallError);
    const schema = this.schema.anyOf[i] as TObject;
    this.memberValidators[i].safeValidate(value, overallError);
    return schema;
  }

  /** @inheritdoc */
  override unsafeValidate(
    value: Readonly<unknown>,
    overallError?: string
  ): TObject {
    const i = this.findDiscriminatedUnionSchemaIndex(value, overallError);
    const schema = this.schema.anyOf[i] as TObject;
    this.memberValidators[i].unsafeValidate(value, overallError);
    return schema;
  }
}
