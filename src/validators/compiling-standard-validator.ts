import type { TSchema } from '@sinclair/typebox';
import {
  TypeCheck,
  TypeCompiler,
  ValueError,
} from '@sinclair/typebox/compiler';

import { AbstractStandardValidator } from './abstract-standard-validator';

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
    this.compiledAssert(compiledType, value, overallError);
  }

  /** @inheritdoc */
  override validate(value: Readonly<unknown>, overallError?: string): void {
    const compiledType = this.getCompiledType();
    this.compiledValidate(compiledType, value, overallError);
  }

  /** @inheritdoc */
  override errors(value: Readonly<unknown>): Iterable<ValueError> {
    const compiledType = this.getCompiledType();
    return this.compiledErrors(compiledType, value);
  }

  private getCompiledType(): TypeCheck<S> {
    if (this.#compiledType === undefined) {
      this.#compiledType = TypeCompiler.Compile(this.schema);
    }
    return this.#compiledType;
  }
}
