import { TSchema } from '@sinclair/typebox';
import { MethodKind, ValidTestSpec, specsToRun } from './test-utils';
import { AbstractValidator } from '../validators/abstract/abstract-validator';

export function testValidSpecs<S extends ValidTestSpec<TSchema>>(
  runThisTest: (method: MethodKind) => boolean,
  createValidator: (schema: TSchema) => AbstractValidator<TSchema>,
  verifyCleaning: (spec: S, value: any) => void,
  validSpecs: S[]
) {
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
          const value =
            typeof spec.value == 'object' ? { ...spec.value } : spec.value;
          expect(() => validator.assertAndClean(value)).not.toThrow();
          verifyCleaning(spec, value);
        });
      }

      if (runThisTest(MethodKind.ValidateAndClean)) {
        it(`validateAndClean() should clean provided ${spec.description}`, () => {
          const validator = createValidator(spec.schema);
          const value =
            typeof spec.value == 'object' ? { ...spec.value } : spec.value;
          expect(() => validator.validateAndClean(value)).not.toThrow();
          verifyCleaning(spec, value);
        });
      }
    });

    describe('cleaning copy of value', () => {
      if (runThisTest(MethodKind.AssertAndCleanCopy)) {
        it(`assertAndCleanCopy() should clean copy of ${spec.description}`, () => {
          const validator = createValidator(spec.schema);
          const value = validator.assertAndCleanCopy(spec.value) as object;
          verifyCleaning(spec, value);
        });
      }

      if (runThisTest(MethodKind.ValidateAndCleanCopy)) {
        it(`validateAndCleanCopy() should clean copy of ${spec.description}`, () => {
          const validator = createValidator(spec.schema);
          const value = validator.validateAndCleanCopy(spec.value) as object;
          verifyCleaning(spec, value);
        });
      }
    });
  });
}
