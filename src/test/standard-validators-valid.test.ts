import { TSchema, Type } from '@sinclair/typebox';

import { AbstractStandardValidator } from '../validators/abstract-standard-validator';
import { StandardValidator } from '../validators/standard-validator';
import { CompilingStandardValidator } from '../validators/compiling-standard-validator';
import {
  ValidTestSpec,
  ValidatorKind,
  TestKind,
  specsToRun,
} from './test-utils';

const onlyRunValidator: ValidatorKind = ValidatorKind.All;
const onlyRunTest: TestKind = TestKind.All;

describe('standard validators - valid values', () => {
  if (runThisValidator(ValidatorKind.Noncompiling)) {
    describe('StandardValidator', () => {
      testValidator((schema: TSchema) => new StandardValidator(schema));
    });
  }
  if (runThisValidator(ValidatorKind.Compiling)) {
    describe('CompilingStandardValidator', () => {
      testValidator(
        (schema: TSchema) => new CompilingStandardValidator(schema)
      );
    });
  }
});

function testValidator(
  createValidator: (schema: TSchema) => AbstractStandardValidator<TSchema>
) {
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
        if (runThisTest(TestKind.Test)) {
          it(`test() should accept ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            expect(validator.test(spec.value)).toBe(true);
          });
        }
      });

      describe('no cleaning', () => {
        if (runThisTest(TestKind.Assert)) {
          it(`assert() should accept ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            expect(() => validator.assert(spec.value)).not.toThrow();
          });
        }

        if (runThisTest(TestKind.Validate)) {
          it(`validate() should accept ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            expect(() => validator.validate(spec.value)).not.toThrow();
          });
        }
      });

      describe('cleaning provided value', () => {
        if (runThisTest(TestKind.AssertAndClean)) {
          it(`assertAndClean() should clean provided ${spec.description}`, () => {
            const validator = createValidator(spec.schema);
            const value = { ...spec.value };
            expect(() => validator.assertAndClean(value)).not.toThrow();
            for (const key in value) {
              expect(key in spec.schema.properties).toBe(true);
            }
          });
        }

        if (runThisTest(TestKind.ValidateAndClean)) {
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
        if (runThisTest(TestKind.AssertAndCleanCopy)) {
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

        if (runThisTest(TestKind.ValidateAndCleanCopy)) {
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

function runThisTest(testKind: TestKind): boolean {
  return [TestKind.All, testKind].includes(onlyRunTest);
}
