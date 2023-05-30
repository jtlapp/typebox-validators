import type { TSchema } from '@sinclair/typebox';
import {
  TypeCheck,
  TypeCompiler,
  ValueError,
} from '@sinclair/typebox/compiler';

import { AbstractStandardValidator } from './abstract-standard-validator';
import {
  createErrorsIterable,
  throwInvalidAssert,
  throwInvalidValidate,
} from '../lib/error-utils';

/**
 * Lazily compiled validator for standard TypeBox values.
 */
export class CompilingStandardValidator<
  S extends TSchema
> extends AbstractStandardValidator<S> {
  #compiledType?: TypeCheck<S>;

  /** @inheritdoc */
  constructor(schema: Readonly<S>) {
    super(schema);
  }

  /** @inheritdoc */
  override test(value: Readonly<unknown>): boolean {
    const compiledType = this.getCompiledType();
    return compiledType.Check(value);
  }

  /** @inheritdoc */
  override assert(value: Readonly<unknown>, overallError?: string): void {
    const compiledType = this.getCompiledType();
    if (!compiledType.Check(value)) {
      throwInvalidAssert(overallError, compiledType.Errors(value).First()!);
    }
  }

  /** @inheritdoc */
  override validate(value: Readonly<unknown>, overallError?: string): void {
    const compiledType = this.getCompiledType();
    if (!compiledType.Check(value)) {
      throwInvalidValidate(overallError, compiledType.Errors(value));
    }
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    const compiledType = this.getCompiledType();
    return createErrorsIterable(compiledType.Errors(value));
  }

  private getCompiledType(): TypeCheck<S> {
    if (this.#compiledType === undefined) {
      this.#compiledType = TypeCompiler.Compile(this.schema);
    }
    return this.#compiledType;
  }
}
