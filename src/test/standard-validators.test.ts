import { TSchema, Type } from '@sinclair/typebox';

import { StandardValidator } from '../validators/standard-validator';
import { ValidationException } from '../lib/validation-exception';
import { DEFAULT_OVERALL_ERROR } from '../lib/errors';

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
        description: 'valid 1',
        schema: schema1,
        value: { delta: 0, count: 1, name: 'ABCDE' },
      },
      {
        description: 'valid 2',
        schema: schema1,
        value: { delta: -5, count: 125, name: 'ABCDEDEFGH' },
      },
    ]);
  });

  describe('invalid values', () => {
    testInvalidSpecs([
      {
        description: 'single invalid field with one error',
        schema: schema1,
        value: { delta: 0.5, count: 1, name: 'ABCDE' },
        message: DEFAULT_OVERALL_ERROR,
        errors: [{ path: '/delta', message: 'Expected integer' }],
      },
      {
        description: 'single invalid field with multiple errors',
        schema: schema2,
        value: { int1: 1, int2: 1, alpha: '12345' },
        message: DEFAULT_OVERALL_ERROR,
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
        message: DEFAULT_OVERALL_ERROR,
        errors: [
          {
            path: '/int1',
            message: 'must be an integer',
          },
          {
            path: '/int2',
            message: 'must be an integer',
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
      // {
      //   description: 'one custom error message for multiple errors',
      //   schema: schema1,
      //   value: { delta: 0.5, count: 1, name: '1' },
      //   message: DEFAULT_OVERALL_ERROR,
      //   errors: [
      //     {
      //       path: '/delta',
      //       message: 'must be an integer',
      //     },
      //     {
      //       path: '/name',
      //       message: 'name should consist of 5-10 letters',
      //     },
      //   ],
      // },
    ]);
  });
});

function testValidSpecs(
  validSpecs: {
    description: string;
    schema: TSchema;
    value: any;
  }[]
) {
  validSpecs.forEach((spec) => {
    it(`should accept ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      expect(() => validator.assert(spec.value)).not.toThrow();
    });
  });
}

function testInvalidSpecs(
  invalidSpecs: {
    description: string;
    schema: TSchema;
    value: any;
    message: string;
    errors: { path: string; message: string }[];
  }[]
) {
  invalidSpecs.forEach((spec) => {
    it(`assert() should reject ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      try {
        validator.assert(spec.value);
        fail('should have thrown');
      } catch (e: any) {
        if (!(e instanceof ValidationException)) throw e;
        expect(e.message).toEqual(spec.message);
        const details = e.details;
        const errors = spec.errors;
        expect(details.length).toEqual(1);
        expect(details[0].path).toEqual(errors[0].path);
        expect(details[0].message).toContain(errors[0].message);
      }
    });

    it(`validate() should reject ${spec.description}`, () => {
      const validator = new StandardValidator(spec.schema);
      try {
        validator.validate(spec.value);
        fail('should have thrown');
      } catch (e: any) {
        if (!(e instanceof ValidationException)) throw e;
        const details = e.details;
        const errors = spec.errors;
        expect(details.length).toEqual(errors.length);
        expect(e.message).toEqual(spec.message);
        errors.forEach((error, i) => {
          console.log(`**** details[${i}]`, details[i]);
          expect(details[i]?.path).toEqual(error.path);
          expect(details[i]?.message).toContain(error.message);
        });
      }
    });
  });
}
