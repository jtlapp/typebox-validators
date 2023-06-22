import { TObject, TSchema, TUnion } from '@sinclair/typebox';
import { AbstractValidator } from '../validators/abstract/abstract-validator';

export enum ValidatorKind {
  All,
  Compiling,
  NonCompiling,
}

export enum MethodKind {
  All,
  Test,
  Assert,
  AssertAndClean,
  AssertAndCleanCopy,
  Validate,
  ValidateAndClean,
  ValidateAndCleanCopy,
  Errors,
  InvalidSchema,
}

export type ValidatorMethodOfClass<T> = {
  [K in keyof T]: T[K] extends (value: any, errorMessage?: string) => any
    ? K
    : never;
}[keyof T];

export interface TestSpec {
  onlySpec: boolean;
}

export interface ValidTestSpec<S extends TSchema> extends TestSpec {
  description: string;
  schema: S;
  value: any;
}

export interface ValidUnionTestSpec extends ValidTestSpec<TUnion<TObject[]>> {
  selectedIndex: number;
}

export interface InvalidTestSpec<S extends TSchema> extends TestSpec {
  description: string;
  schema: S;
  value: any;
  overallMessage?: string;
  assertMessage?: string;
  errors: { path: string; message: string }[];
  assertString?: string;
  validateString?: string;
}

export function specsToRun<S extends TestSpec>(specs: S[]): S[] {
  for (const spec of specs) {
    if (spec.onlySpec) {
      return [spec];
    }
  }
  return specs;
}

export class ValidatorCache {
  compilingValidators = new Map<TSchema, AbstractValidator<TSchema>>();
  nonCompilingValidators = new Map<TSchema, AbstractValidator<TSchema>>();

  getCompiling<S extends TSchema>(
    schema: S,
    createValidator: (schema: S) => AbstractValidator<S>
  ): AbstractValidator<TSchema> {
    return this._getCachedValidator(
      this.compilingValidators,
      schema,
      createValidator
    );
  }

  getNonCompiling<S extends TSchema>(
    schema: S,
    createValidator: (schema: S) => AbstractValidator<S>
  ): AbstractValidator<TSchema> {
    return this._getCachedValidator(
      this.nonCompilingValidators,
      schema,
      createValidator
    );
  }

  private _getCachedValidator<S extends TSchema>(
    cache: Map<TSchema, AbstractValidator<TSchema>>,
    schema: S,
    createValidator: (schema: S) => AbstractValidator<S>
  ): AbstractValidator<TSchema> {
    let validator = cache.get(schema);
    if (validator === undefined) {
      validator = createValidator(schema);
      cache.set(schema, validator);
    }
    return validator;
  }
}
