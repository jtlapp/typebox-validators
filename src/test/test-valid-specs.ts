import { TSchema } from '@sinclair/typebox';
import { MethodKind, ValidTestSpec, specsToRun } from './test-utils';
import { AbstractValidator } from '../abstract/abstract-validator';

export function testValidSpecs<S extends ValidTestSpec<TSchema>>(
  runThisTest: (method: MethodKind) => boolean,
  createValidator: (schema: TSchema) => AbstractValidator<TSchema>,
  verifyCleaning: (spec: S, value: any) => void,
  validSpecs: S[]
) {
  specsToRun(validSpecs).forEach((spec) => {
    if (runThisTest(MethodKind.Test)) {
      describe('test()', () => {
        it(`test() should accept ${spec.description}`, () => {
          const validator = createValidator(spec.schema);
          expect(validator.test(spec.value)).toBe(true);
        });
      });
    }
    if (runThisTest(MethodKind.TestReturningErrors)) {
      describe('testReturningErrors()', () => {
        specsToRun(validSpecs).forEach((spec) => {
          it('testReturningErrors() for ' + spec.description, () => {
            const validator = createValidator(spec.schema);
            const errors = validator.testReturningErrors(spec.value);
            expect(errors).toBeNull();
          });
        });
      });
    }
    if (runThisTest(MethodKind.TestReturningFirstError)) {
      describe('testReturningFirstError()', () => {
        specsToRun(validSpecs).forEach((spec) => {
          it('testReturningFirstError() for ' + spec.description, () => {
            const validator = createValidator(spec.schema);
            const firstError = validator.testReturningFirstError(spec.value);
            expect(firstError).toBeNull();
          });
        });
      });
    }

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

    if (runThisTest(MethodKind.Errors)) {
      describe('errors()', () => {
        specsToRun(validSpecs).forEach((spec) => {
          it('errors() for ' + spec.description, () => {
            const validator = createValidator(spec.schema);
            const errors = [...validator.errors(spec.value)];
            expect(errors.length).toEqual(0);
          });
        });
      });
    }
    if (runThisTest(MethodKind.FirstError)) {
      describe('firstError()', () => {
        specsToRun(validSpecs).forEach((spec) => {
          it('firstError() for ' + spec.description, () => {
            const validator = createValidator(spec.schema);
            const firstError = validator.firstError(spec.value);
            expect(firstError).toBeNull();
          });
        });
      });
    }
  });
}
