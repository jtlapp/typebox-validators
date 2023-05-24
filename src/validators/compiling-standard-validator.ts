import type { TSchema } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';

import { AbstractStandardValidator } from './abstract-standard-validator';

/**
 * Lazily compiled validator for standard TypeBox values, providing safe
 * and unsafe validation, supporting custom error messages, and cleaning
 * values of unrecognized properties.
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
  override safeValidate(value: Readonly<unknown>, overallError?: string): S {
    const compiledType = this.getCompiledType();
    this.compiledSafeValidate(compiledType, value, overallError);
    return this.schema;
  }

  /** @inheritdoc */
  override unsafeValidate(value: Readonly<unknown>, overallError?: string): S {
    const compiledType = this.getCompiledType();
    this.compiledUnsafeValidate(compiledType, value, overallError);
    return this.schema;
  }

  /**
   * Returns the compiled TypeBox type for the schema. The method compiles
   * the type on the first call and caches the result for subsequent calls.
   * @returns Compiled TypeBox type for the schema.
   */
  private getCompiledType(): TypeCheck<S> {
    if (this.#compiledType === undefined) {
      this.#compiledType = TypeCompiler.Compile(this.schema);
    }
    return this.#compiledType;
  }
}
