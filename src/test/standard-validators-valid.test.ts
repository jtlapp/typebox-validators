import { TSchema, Type } from '@sinclair/typebox';

import { AbstractStandardValidator } from '../validators/abstract-standard-validator';
import { StandardValidator } from '../validators/standard-validator';
import { CompilingStandardValidator } from '../validators/compiling-standard-validator';
import {
  ValidTestSpec,
  ValidatorKind,
  MethodKind,
  ValidatorCache,
} from './test-utils';
import { testValidSpecs } from './test-valid-specs';

const onlyRunValidator = ValidatorKind.NonCompiling;
const onlyRunMethod = MethodKind.AssertAndClean;

const schema0 = Type.String({
  minLength: 5,
  maxLength: 10,
  pattern: '^[a-zA-Z]+$',
});

const schema1 = Type.Object({
  delta: Type.Integer(),
  count: Type.Integer({ exclusiveMinimum: 0 }),
  name: schema0,
});

const validatorCache = new ValidatorCache();

describe('standard validators - valid values', () => {
  if (runThisValidator(ValidatorKind.NonCompiling)) {
    describe('StandardValidator', () => {
      testValidator((schema: TSchema) =>
        validatorCache.getNonCompiling(
          schema,
          () => new StandardValidator(schema)
        )
      );
    });
  }
  if (runThisValidator(ValidatorKind.Compiling)) {
    describe('CompilingStandardValidator', () => {
      testValidator((schema: TSchema) =>
        validatorCache.getCompiling(
          schema,
          () => new CompilingStandardValidator(schema)
        )
      );
    });
  }
});

function testValidator(
  createValidator: (schema: TSchema) => AbstractStandardValidator<TSchema>
) {
  testValidSpecs(runThisTest, createValidator, verifyCleaning, [
    {
      description: 'valid value 0, string literal',
      onlySpec: true,
      schema: schema0,
      value: 'ABCDEDEFGH',
    },
    {
      description: 'valid value 1, no unrecognized fields',
      onlySpec: false,
      schema: schema1,
      value: { delta: 0, count: 1, name: 'ABCDE' },
    },
    {
      description: 'valid value 2, with unrecognized fields',
      onlySpec: false,
      schema: schema1,
      value: {
        delta: -5,
        count: 125,
        name: 'ABCDEDEFGH',
        unrecognized1: 1,
        unrecognized2: 'abc',
      },
    },
  ]);
}

function verifyCleaning(spec: ValidTestSpec<TSchema>, value: any): void {
  if (spec.schema.properties !== undefined) {
    for (const key in value) {
      expect(key in spec.schema.properties).toBe(true);
    }
    expect(Object.keys(value).length).toBeLessThanOrEqual(
      Object.keys(spec.schema.properties).length
    );
  }
}

function runThisValidator(validatorKind: ValidatorKind): boolean {
  return [ValidatorKind.All, validatorKind].includes(onlyRunValidator);
}

function runThisTest(methodKind: MethodKind): boolean {
  return [MethodKind.All, methodKind].includes(onlyRunMethod);
}
