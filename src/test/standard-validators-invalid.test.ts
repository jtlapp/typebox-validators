import { TSchema, Type } from '@sinclair/typebox';

import { AbstractStandardValidator } from '../validators/abstract-standard-validator';
import { StandardValidator } from '../validators/standard-validator';
import { ValidationException } from '../lib/validation-exception';
import { DEFAULT_OVERALL_ERROR } from '../lib/errors';
import { CompilingStandardValidator } from '../validators/compiling-standard-validator';
import {
  ValidatorKind,
  TestKind,
  ValidatorMethodOfClass,
  InvalidTestSpec,
  specsToRun,
} from './test-utils';

const onlyRunValidator: ValidatorKind = ValidatorKind.All;
const onlyRunTest: TestKind = TestKind.All;

describe('standard validators - invalid values', () => {
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

  const schema2 = Type.Object({
    int1: Type.Integer({ errorMessage: '{field} must be an integer' }),
    int2: Type.Integer({ errorMessage: '{field} must be an integer' }),
    alpha: Type.String({ pattern: '^[a-zA-Z]+$', maxLength: 4 }),
  });

  testInvalidSpecs([
    {
      description: 'single invalid field with one error',
      onlySpec: false,
      schema: schema1,
      value: { delta: 0.5, count: 1, name: 'ABCDE' },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '/delta', message: 'Expected integer' }],
      assertString: 'Invalid value:\n- delta: Expected integer',
      validateString: 'Invalid value:\n- delta: Expected integer',
    },
    {
      description:
        'single invalid field with one error, custom overall message 1',
      onlySpec: false,
      schema: schema1,
      value: { delta: 0.5, count: 1, name: 'ABCDE' },
      overallMessage: 'Custom message',
      assertMessage: 'Custom message',
      errors: [{ path: '/delta', message: 'Expected integer' }],
      assertString: 'Custom message:\n- delta: Expected integer',
      validateString: 'Custom message:\n- delta: Expected integer',
    },
    {
      description:
        'single invalid field with one error, custom overall message 2',
      onlySpec: false,
      schema: schema1,
      value: { delta: 0.5, count: 1, name: 'ABCDE' },
      overallMessage: "Oopsie. '{field}' {detail}",
      assertMessage: "Oopsie. 'delta' Expected integer",
      errors: [{ path: '/delta', message: 'Expected integer' }],
      assertString:
        "Oopsie. 'delta' Expected integer:\n- delta: Expected integer",
      validateString: "Oopsie. '{field}' {detail}:\n- delta: Expected integer",
    },
    {
      description: 'single invalid field with multiple errors',
      onlySpec: false,
      schema: schema2,
      value: { int1: 1, int2: 1, alpha: '12345' },
      errors: [
        {
          path: '/alpha',
          message: 'less or equal to 4',
        },
        {
          path: '/alpha',
          message: 'match pattern',
        },
      ],
    },
    {
      description: 'multiple invalid fields with multiple errors',
      onlySpec: false,
      schema: schema2,
      value: { int1: 1.5, int2: 1.5, alpha: '12345' },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [
        {
          path: '/int1',
          message: 'int1 must be an integer',
        },
        {
          path: '/int2',
          message: 'int2 must be an integer',
        },
        {
          path: '/alpha',
          message: 'less or equal to 4',
        },
        {
          path: '/alpha',
          message: 'match pattern',
        },
      ],
    },
    {
      description: 'one custom error message for multiple errors',
      onlySpec: false,
      schema: schema1,
      value: { delta: 0.5, count: 1, name: '1' },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [
        {
          path: '/delta',
          message: 'integer',
        },
        {
          path: '/name',
          message: 'name should consist of 5-10 letters',
        },
      ],
      assertString: 'Invalid value:\n- delta: Expected integer',
      validateString:
        'Invalid value:\n- delta: Expected integer\n- name: name should consist of 5-10 letters',
    },
  ]);

  function testInvalidSpecs(specs: InvalidTestSpec[]) {
    if (runThisTest(TestKind.Test)) {
      describe('test() rejections', () => {
        specsToRun(specs).forEach((spec) => {
          it('test() should reject ' + spec.description, () => {
            const validator = createValidator(spec.schema);
            expect(validator.test(spec.value)).toBe(false);
          });
        });
      });
    }

    if (runThisTest(TestKind.Assert)) {
      testAssertMethodRejection('assert', specs);
    }
    if (runThisTest(TestKind.AssertAndClean)) {
      testAssertMethodRejection('assertAndClean', specs);
    }
    if (runThisTest(TestKind.AssertAndCleanCopy)) {
      testAssertMethodRejection('assertAndCleanCopy', specs);
    }
    if (runThisTest(TestKind.Validate)) {
      testValidateMethodRejection('validate', specs);
    }
    if (runThisTest(TestKind.ValidateAndClean)) {
      testValidateMethodRejection('validateAndClean', specs);
    }
    if (runThisTest(TestKind.ValidateAndCleanCopy)) {
      testValidateMethodRejection('validateAndCleanCopy', specs);
    }

    if (runThisTest(TestKind.Errors)) {
      describe('errors()', () => {
        specsToRun(specs).forEach((spec) => {
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
  }

  function testAssertMethodRejection<S extends TSchema>(
    method: ValidatorMethodOfClass<StandardValidator<S>>,
    specs: InvalidTestSpec[]
  ) {
    describe(`${method}() rejections`, () => {
      specsToRun(specs).forEach((spec) => {
        it(`${method}() should reject ${spec.description}`, () => {
          const validator = createValidator(spec.schema);
          try {
            (validator[method] as any)(spec.value, spec.overallMessage);
            fail('should have thrown');
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
    method: ValidatorMethodOfClass<StandardValidator<S>>,
    specs: InvalidTestSpec[]
  ) {
    describe(`${method}() rejections`, () => {
      specsToRun(specs).forEach((spec) => {
        it(`${method}() should reject ${spec.description}`, () => {
          const validator = createValidator(spec.schema);
          try {
            (validator[method] as any)(spec.value, spec.overallMessage);
            fail('should have thrown');
          } catch (e: any) {
            if (!(e instanceof ValidationException)) throw e;

            const details = e.details;
            const errors = spec.errors;
            expect(details.length).toEqual(errors.length);
            errors.forEach((error, i) => {
              expect(details[i]?.path).toEqual(error.path);
              expect(details[i]?.message).toContain(error.message);
            });

            const expectedOverallMessage =
              spec.overallMessage ?? DEFAULT_OVERALL_ERROR;
            expect(e.message).toEqual(expectedOverallMessage);
            if (spec.validateString !== undefined) {
              expect(e.toString()).toEqual(spec.validateString);
            }
          }
        });
      });
    });
  }
}

function runThisValidator(validatorKind: ValidatorKind): boolean {
  return (
    onlyRunValidator === ValidatorKind.All || validatorKind === onlyRunValidator
  );
}

function runThisTest(testKind: TestKind): boolean {
  return onlyRunTest === TestKind.All || testKind === onlyRunTest;
}
