import { TSchema, Type } from '@sinclair/typebox';

import { AbstractStandardValidator } from '../validators/abstract-standard-validator';
import { StandardValidator } from '../validators/standard-validator';
import { CompilingStandardValidator } from '../validators/compiling-standard-validator';
import {
  ValidTestSpec,
  ValidatorKind,
  MethodKind,
  specsToRun,
  ValidatorCache,
} from './test-utils';

const onlyRunValidator = ValidatorKind.All;
const onlyRunMethod = MethodKind.All;

const schema1 = Type.Object({
  delta: Type.Integer(),
  count: Type.Integer({ exclusiveMinimum: 0 }),
  name: Type.String({
    minLength: 5,
    maxLength: 10,
    pattern: '^[a-zA-Z]+$',
    errorMessage: 'name should consist of 5-10 letters',
  }),
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
  testValidSpecs([
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

  function testValidSpecs(validSpecs: ValidTestSpec[]) {
    specsToRun(validSpecs).forEach((spec) => {
      describe('test()', () => {
        if (runThisTest(MethodKind.Test)) {
          it(`test() should accept ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            expect(validator.test(spec.value)).toBe(true);
          });
        }
      });

      describe('no cleaning', () => {
        if (runThisTest(MethodKind.Assert)) {
          it(`assert() should accept ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            expect(() => validator.assert(spec.value)).not.toThrow();
          });
        }

        if (runThisTest(MethodKind.Validate)) {
          it(`validate() should accept ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            expect(() => validator.validate(spec.value)).not.toThrow();
          });
        }
      });

      describe('cleaning provided value', () => {
        if (runThisTest(MethodKind.AssertAndClean)) {
          it(`assertAndClean() should clean provided ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            const value = { ...spec.value };
            expect(() => validator.assertAndClean(value)).not.toThrow();
            for (const key in value) {
              expect(key in spec.schema.properties).toBe(true);
            }
          });
        }

        if (runThisTest(MethodKind.ValidateAndClean)) {
          it(`validateAndClean() should clean provided ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            const value = { ...spec.value };
            expect(() => validator.validateAndClean(value)).not.toThrow();
            for (const key in value) {
              expect(key in spec.schema.properties).toBe(true);
            }
            expect(Object.keys(value).length).toEqual(
              Object.keys(spec.schema.properties).length
            );
          });
        }
      });

      describe('cleaning copy of value', () => {
        if (runThisTest(MethodKind.AssertAndCleanCopy)) {
          it(`assertAndCleanCopy() should clean copy of ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            const value = validator.assertAndCleanCopy(spec.value) as object;
            for (const key in value) {
              expect(key in spec.schema.properties).toBe(true);
            }
            expect(Object.keys(value).length).toEqual(
              Object.keys(spec.schema.properties).length
            );
          });
        }

        if (runThisTest(MethodKind.ValidateAndCleanCopy)) {
          it(`validateAndCleanCopy() should clean copy of ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            const value = validator.validateAndCleanCopy(spec.value) as object;
            for (const key in value) {
              expect(key in spec.schema.properties).toBe(true);
            }
            expect(Object.keys(value).length).toEqual(
              Object.keys(spec.schema.properties).length
            );
          });
        }
      });
    });
  }
}

function runThisValidator(validatorKind: ValidatorKind): boolean {
  return [ValidatorKind.All, validatorKind].includes(onlyRunValidator);
}

function runThisTest(methodKind: MethodKind): boolean {
  return [MethodKind.All, methodKind].includes(onlyRunMethod);
}
