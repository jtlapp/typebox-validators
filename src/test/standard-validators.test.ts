import { TSchema, Type } from '@sinclair/typebox';

import { StandardValidator } from '../validators/standard-validator';
import { ValidationException } from '../lib/validation-exception';
import { DEFAULT_OVERALL_ERROR } from '../lib/errors';

type ValidatorMethodOfClass<T> = {
  [K in keyof T]: T[K] extends (value: any, errorMessage?: string) => any
    ? K
    : never;
}[keyof T];

interface ValidTestSpec {
  description: string;
  schema: TSchema;
  value: any;
}

interface InvalidTestSpec {
  description: string;
  schema: TSchema;
  value: any;
  overallMessage?: string;
  assertMessage?: string;
  errors: { path: string; message: string }[];
  assertString?: string;
  validateString?: string;
}

describe('standard validators', () => {
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

  describe('valid values', () => {
    testValidSpecs([
      {
        description: 'valid value 1, no unrecognized fields',
        schema: schema1,
        value: { delta: 0, count: 1, name: 'ABCDE' },
      },
      {
        description: 'valid value 2, with unrecognized fields',
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
  });

  describe('invalid values', () => {
    testInvalidSpecs([
      {
        description: 'single invalid field with one error',
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
        schema: schema1,
        value: { delta: 0.5, count: 1, name: 'ABCDE' },
        overallMessage: "Oopsie. '{field}' {detail}",
        assertMessage: "Oopsie. 'delta' Expected integer",
        errors: [{ path: '/delta', message: 'Expected integer' }],
        assertString:
          "Oopsie. 'delta' Expected integer:\n- delta: Expected integer",
        validateString:
          "Oopsie. '{field}' {detail}:\n- delta: Expected integer",
      },
      {
        description: 'single invalid field with multiple errors',
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
  });
});

function testValidSpecs(validSpecs: ValidTestSpec[]) {
  validSpecs.forEach((spec) => {
    it(`assert() should accept ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      expect(() => validator.assert(spec.value)).not.toThrow();
    });

    it(`validate() should accept ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      expect(() => validator.validate(spec.value)).not.toThrow();
    });

    it(`assertAndClean() should clean provided ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      const value = { ...spec.value };
      expect(() => validator.assertAndClean(value)).not.toThrow();
      for (const key in value) {
        expect(key in spec.schema.properties).toBe(true);
      }
    });

    it(`validateAndClean() should clean provided ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      const value = { ...spec.value };
      expect(() => validator.validateAndClean(value)).not.toThrow();
      for (const key in value) {
        expect(key in spec.schema.properties).toBe(true);
      }
      expect(Object.keys(value).length).toEqual(
        Object.keys(spec.schema.properties).length
      );
    });

    it(`assertAndCleanCopy() should clean copy of ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      const value = validator.assertAndCleanCopy(spec.value) as object;
      for (const key in value) {
        expect(key in spec.schema.properties).toBe(true);
      }
      expect(Object.keys(value).length).toEqual(
        Object.keys(spec.schema.properties).length
      );
    });

    it(`validateAndCleanCopy() should clean copy of ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      const value = validator.validateAndCleanCopy(spec.value) as object;
      for (const key in value) {
        expect(key in spec.schema.properties).toBe(true);
      }
      expect(Object.keys(value).length).toEqual(
        Object.keys(spec.schema.properties).length
      );
    });
  });
}

function testInvalidSpecs(specs: InvalidTestSpec[]) {
  describe('test() rejections', () => {
    specs.forEach((spec) => {
      it('test() should reject ' + spec.description, () => {
        const validator = new StandardValidator(spec.schema);
        expect(validator.test(spec.value)).toBe(false);
      });
    });
  });

  testAssertMethodRejection('assert', specs);
  testAssertMethodRejection('assertAndClean', specs);
  testAssertMethodRejection('assertAndCleanCopy', specs);
  testValidateMethodRejection('validate', specs);
  testValidateMethodRejection('validateAndClean', specs);
  testValidateMethodRejection('validateAndCleanCopy', specs);

  describe('errors()', () => {
    specs.forEach((spec) => {
      it('errors() for ' + spec.description, () => {
        const validator = new StandardValidator(spec.schema);
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
  method: ValidatorMethodOfClass<StandardValidator<S>>,
  specs: InvalidTestSpec[]
) {
  describe(`${method}() rejections`, () => {
    specs.forEach((spec) => {
      it(`${method}() should reject ${spec.description}`, () => {
        const validator = new StandardValidator(spec.schema);
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
    specs.forEach((spec) => {
      it(`${method}() should reject ${spec.description}`, () => {
        const validator = new StandardValidator(spec.schema);
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
