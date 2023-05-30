import { TSchema } from '@sinclair/typebox';

import { AbstractValidator } from '../validators/abstract-validator';
import {
  InvalidTestSpec,
  MethodKind,
  ValidatorMethodOfClass,
  specsToRun,
} from './test-utils';
import { DEFAULT_OVERALL_ERROR } from '../lib/error-utils';
import { ValidationException } from '../lib/validation-exception';

export function testInvalidSpecs<S extends InvalidTestSpec<TSchema>>(
  runThisTest: (method: MethodKind) => boolean,
  createValidator: (schema: TSchema) => AbstractValidator<TSchema>,
  invalidSpecs: S[]
) {
  if (runThisTest(MethodKind.Test)) {
    describe('test() rejections', () => {
      specsToRun(invalidSpecs).forEach((spec) => {
        it('test() should reject ' + spec.description, () => {
          const validator = createValidator(spec.schema);
          expect(validator.test(spec.value)).toBe(false);
        });
      });
    });
  }

  if (runThisTest(MethodKind.Assert)) {
    testAssertMethodRejection('assert', invalidSpecs);
  }
  if (runThisTest(MethodKind.AssertAndClean)) {
    testAssertMethodRejection('assertAndClean', invalidSpecs);
  }
  if (runThisTest(MethodKind.AssertAndCleanCopy)) {
    testAssertMethodRejection('assertAndCleanCopy', invalidSpecs);
  }
  if (runThisTest(MethodKind.Validate)) {
    testValidateMethodRejection('validate', invalidSpecs);
  }
  if (runThisTest(MethodKind.ValidateAndClean)) {
    testValidateMethodRejection('validateAndClean', invalidSpecs);
  }
  if (runThisTest(MethodKind.ValidateAndCleanCopy)) {
    testValidateMethodRejection('validateAndCleanCopy', invalidSpecs);
  }

  if (runThisTest(MethodKind.Errors)) {
    describe('errors()', () => {
      specsToRun(invalidSpecs).forEach((spec) => {
        it('errors() for ' + spec.description, () => {
          const validator = createValidator(spec.schema);
          const errors = [...validator.errors(spec.value)];
          expect(errors.length).toEqual(spec.errors.length);
          errors.forEach((error, i) => {
            expect(error.path).toEqual(spec.errors[i].path);
            expect(error.message).toContain(spec.errors[i].message);
          });
        });
      });
    });
  }

  function testAssertMethodRejection<S extends TSchema>(
    method: ValidatorMethodOfClass<AbstractValidator<S>>,
    specs: InvalidTestSpec<TSchema>[]
  ) {
    describe(`${method}() rejections`, () => {
      specsToRun(specs).forEach((spec) => {
        it(`${method}() should reject ${spec.description}`, () => {
          const validator = createValidator(spec.schema);
          try {
            (validator[method] as any)(spec.value, spec.overallMessage);
            expect(false).toBe(true);
          } catch (e: any) {
            if (!(e instanceof ValidationException)) throw e;

            const details = e.details;
            const errors = spec.errors;
            expect(details.length).toEqual(1);
            expect(details[0].path).toEqual(errors[0].path);
            expect(details[0].message).toContain(errors[0].message);

            if (spec.assertMessage !== undefined) {
              expect(e.message).toEqual(spec.assertMessage);
            }
            if (spec.assertString !== undefined) {
              expect(e.toString()).toEqual(spec.assertString);
            }
          }
        });
      });
    });
  }

  function testValidateMethodRejection<S extends TSchema>(
    method: ValidatorMethodOfClass<AbstractValidator<S>>,
    specs: InvalidTestSpec<TSchema>[]
  ) {
    describe(`${method}() rejections`, () => {
      specsToRun(specs).forEach((spec) => {
        it(`${method}() should reject ${spec.description}`, () => {
          const validator = createValidator(spec.schema);
          const overallMessage = spec.overallMessage
            ? spec.overallMessage.replace('{error}', '').trim()
            : undefined;
          try {
            (validator[method] as any)(spec.value, overallMessage);
            expect(false).toBe(true);
          } catch (e: any) {
            if (!(e instanceof ValidationException)) throw e;

            const details = e.details;
            const errors = spec.errors;
            expect(details.length).toEqual(errors.length);
            errors.forEach((error, i) => {
              expect(details[i]?.path).toEqual(error.path);
              expect(details[i]?.message).toContain(error.message);
            });

            expect(e.message).toEqual(overallMessage ?? DEFAULT_OVERALL_ERROR);
            if (spec.validateString !== undefined) {
              expect(e.toString()).toEqual(spec.validateString);
            }
          }
        });
      });
    });
  }
}
