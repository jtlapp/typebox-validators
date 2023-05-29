import { TSchema, Type } from '@sinclair/typebox';

import { AbstractStandardValidator } from '../validators/abstract-standard-validator';
import { StandardValidator } from '../validators/standard-validator';
import { ValidationException } from '../lib/validation-exception';
import { CompilingStandardValidator } from '../validators/compiling-standard-validator';
import { DEFAULT_OVERALL_ERROR } from '../lib/errors';
import {
  ValidatorKind,
  MethodKind,
  ValidatorMethodOfClass,
  InvalidTestSpec,
  specsToRun,
  ValidatorCache,
} from './test-utils';

const onlyRunValidator = ValidatorKind.All;
const onlyRunMethod = MethodKind.All;

const schema0 = Type.String({
  minLength: 5,
  maxLength: 10,
  pattern: '^[a-zA-Z]+$',
});

const schema1 = Type.String({
  minLength: 5,
  maxLength: 10,
  pattern: '^[a-zA-Z]+$',
  errorMessage: 'name should consist of 5-10 letters',
});

const schema2 = Type.Object({
  delta: Type.Integer(),
  count: Type.Integer({ exclusiveMinimum: 0 }),
  name: schema1,
});

const schema3 = Type.Object({
  int1: Type.Integer({ errorMessage: '{field} must be an integer' }),
  int2: Type.Integer({ errorMessage: '{field} must be an integer' }),
  alpha: Type.String({ pattern: '^[a-zA-Z]+$', maxLength: 4 }),
});

const schema4 = Type.Object({
  int1: Type.Integer(),
  whatever: Type.Any(),
});

const schema5 = Type.Object({
  int1: Type.Integer(),
  whatever: Type.Any({ errorMessage: 'Missing whatever' }),
});

const validatorCache = new ValidatorCache();

describe('standard validators - invalid values', () => {
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
  testInvalidSpecs([
    {
      description: 'multiple errors for string literal',
      onlySpec: false,
      schema: schema0,
      value: '1',
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [
        {
          path: '',
          message: 'greater or equal to 5',
        },
        {
          path: '',
          message: 'match pattern',
        },
      ],
      assertString:
        'Invalid value:\n- Expected string length greater or equal to 5',
      validateString:
        'Invalid value:\n' +
        '- Expected string length greater or equal to 5\n' +
        '- Expected string to match pattern ^[a-zA-Z]+$',
    },
    {
      description: 'custom overall and error messages for string literal',
      onlySpec: false,
      schema: schema1,
      value: '1',
      overallMessage: 'Oopsie',
      assertMessage: 'Oopsie',
      errors: [
        {
          path: '',
          message: 'name should consist of 5-10 letters',
        },
      ],
      assertString: 'Oopsie:\n- name should consist of 5-10 letters',
      validateString: 'Oopsie:\n- name should consist of 5-10 letters',
    },
    {
      description: 'single invalid field with one error',
      onlySpec: false,
      schema: schema2,
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
      schema: schema2,
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
      schema: schema2,
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
      schema: schema3,
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
      schema: schema3,
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
      schema: schema2,
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
    {
      description:
        'invalid overall value with one error, custom overall message 1',
      onlySpec: false,
      schema: schema2,
      value: 'not an object',
      overallMessage: 'Oopsie. {field} {detail}',
      assertMessage: 'Oopsie. Value Expected object',
      errors: [{ path: '', message: 'Expected object' }],
      assertString: 'Oopsie. Value Expected object:\n- Expected object',
      validateString: 'Oopsie. {field} {detail}:\n- Expected object',
    },
    {
      description: "reports default required message for 'any' field",
      onlySpec: false,
      schema: schema4,
      value: { int1: 32 },
      errors: [
        {
          path: '/whatever',
          message: 'Expected required property',
        },
      ],
      assertString: 'Invalid value:\n- whatever: Expected required property',
      validateString: 'Invalid value:\n- whatever: Expected required property',
    },
    {
      description: "reports custom required message for 'any' field",
      onlySpec: false,
      schema: schema5,
      value: { int1: 'not an integer' },
      errors: [
        {
          path: '/int1',
          message: 'Expected integer',
        },
        {
          path: '/whatever',
          message: 'Missing whatever',
        },
      ],
      assertString: 'Invalid value:\n- int1: Expected integer',
      validateString:
        'Invalid value:\n- int1: Expected integer\n- whatever: Missing whatever',
    },
  ]);

  function testInvalidSpecs(specs: InvalidTestSpec<TSchema>[]) {
    if (runThisTest(MethodKind.Test)) {
      describe('test() rejections', () => {
        specsToRun(specs).forEach((spec) => {
          it('test() should reject ' + spec.description, () => {
            const validator = createValidator(spec.schema);
            expect(validator.test(spec.value)).toBe(false);
          });
        });
      });
    }

    if (runThisTest(MethodKind.Assert)) {
      testAssertMethodRejection('assert', specs);
    }
    if (runThisTest(MethodKind.AssertAndClean)) {
      testAssertMethodRejection('assertAndClean', specs);
    }
    if (runThisTest(MethodKind.AssertAndCleanCopy)) {
      testAssertMethodRejection('assertAndCleanCopy', specs);
    }
    if (runThisTest(MethodKind.Validate)) {
      testValidateMethodRejection('validate', specs);
    }
    if (runThisTest(MethodKind.ValidateAndClean)) {
      testValidateMethodRejection('validateAndClean', specs);
    }
    if (runThisTest(MethodKind.ValidateAndCleanCopy)) {
      testValidateMethodRejection('validateAndCleanCopy', specs);
    }

    if (runThisTest(MethodKind.Errors)) {
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
    method: ValidatorMethodOfClass<AbstractStandardValidator<S>>,
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
    method: ValidatorMethodOfClass<AbstractStandardValidator<S>>,
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
  return [ValidatorKind.All, validatorKind].includes(onlyRunValidator);
}

function runThisTest(methodKind: MethodKind): boolean {
  return [MethodKind.All, methodKind].includes(onlyRunMethod);
}
