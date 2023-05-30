import type { TSchema } from '@sinclair/typebox';

import { AbstractStandardValidator } from './abstract-standard-validator';
import { ValueError } from '@sinclair/typebox/errors';
import { Value } from '@sinclair/typebox/value';
import { createErrorsIterable } from '../lib/error-utils';

/**
 * Non-compiling validator for standard TypeBox values.
 */
export class StandardValidator<
  S extends TSchema
> extends AbstractStandardValidator<S> {
  /** @inheritdoc */
  constructor(schema: S) {
    super(schema);
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    return Value.Check(this.schema, value);
  }

  /** @inheritdoc */
  override assert(value: Readonly<unknown>, overallError?: string): void {
    this.uncompiledAssert(this.schema, value, overallError);
  }

  /** @inheritdoc */
  override validate(value: Readonly<unknown>, overallError?: string): void {
    this.uncompiledValidate(this.schema, value, overallError);
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    return createErrorsIterable(Value.Errors(this.schema, value));
  }
}
