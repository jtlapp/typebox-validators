import { TObject, TUnion } from '@sinclair/typebox';

import { AbstractDiscriminatedUnionValidator } from './abstract-discriminated-union-validator';
import { CompilingStandardValidator } from './compiling-standard-validator';

/**
 * Lazily compiled validator for discriminated-union unions, providing
 * safe and unsafe validation, supporting custom error messages. List the
 * more frequently used types earlier in the union to improve performance.
 */
export class CompilingDiscriminatedUnionValidator<
  S extends TUnion<TObject[]>
> extends AbstractDiscriminatedUnionValidator<S> {
  protected memberValidators: CompilingStandardValidator<TObject>[];

  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
    this.memberValidators = this.createMemberValidators();
  }

  /** @inheritdoc */
  override safeValidate(value: unknown, specificError: string): TObject {
    const i = this.findDiscriminatedUnionSchemaIndex(value, specificError);
    const schema = this.schema.anyOf[i] as TObject;
    this.memberValidators[i].safeValidate(value, specificError);
    return schema;
  }

  /** @inheritdoc */
  override unsafeValidate(value: unknown, specificError: string): TObject {
    const i = this.findDiscriminatedUnionSchemaIndex(value, specificError);
    const schema = this.schema.anyOf[i] as TObject;
    this.memberValidators[i].unsafeValidate(value, specificError);
    return schema;
  }
}
