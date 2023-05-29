import { TSchema, TObject, Type, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from '../validators/abstract-typed-union-validator';
import { HeterogeneousUnionValidator } from '../validators/heterogeneous-union-validator';
import { CompilingHeterogeneousUnionValidator } from '../validators/compiling-heterogeneous-union-validator';
import { ValidationException } from '../lib/validation-exception';
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

const wellFormedUnion1 = Type.Union([
  Type.Object({
    s: Type.String(),
    str1: Type.String(),
    str2: Type.Optional(Type.String()),
  }),
  Type.Object({
    i: Type.Integer(),
    int1: Type.Integer(),
    int2: Type.Optional(Type.Integer()),
  }),
]);

const wellFormedUnion2 = Type.Union(
  [
    Type.Object({
      str1: Type.String(),
      str2: Type.String(),
      s1: Type.String(),
      unique: Type.String(),
      extra: Type.Optional(Type.String()),
    }),
    Type.Object({
      str1: Type.String(),
      s2: Type.String(),
      str2: Type.String(),
      extra: Type.Optional(Type.Integer()),
    }),
  ],
  { typeError: 'Unknown type' }
);

const illFormedUnion = Type.Union([
  Type.Object({
    s: Type.String(),
    str1: Type.Optional(Type.String()),
  }),
  Type.Object({
    s: Type.Integer(),
    int1: Type.Optional(Type.Integer()),
  }),
]);

const validatorCache = new ValidatorCache();

describe('heterogenous union validators - invalid values', () => {
  if (runThisValidator(ValidatorKind.NonCompiling)) {
    describe('HeterogeneousUnionValidator', () => {
      testValidator(
        (schema: TSchema) =>
          validatorCache.getNonCompiling(
            schema,
            () => new HeterogeneousUnionValidator(schema as TUnion<TObject[]>)
          ) as AbstractTypedUnionValidator<TUnion<TObject[]>>
      );
    });
  }
  if (runThisValidator(ValidatorKind.Compiling)) {
    describe('CompilingHeterogeneousUnionValidator', () => {
      testValidator((schema: TSchema) =>
        validatorCache.getCompiling(
          schema,
          () =>
            new CompilingHeterogeneousUnionValidator(
              schema as TUnion<TObject[]>
            )
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
    method: ValidatorMethodOfClass<StandardValidator<S>>,
    specs: InvalidTestSpec<TSchema>[]
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
    specs: InvalidTestSpec<TSchema>[]
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
  return [ValidatorKind.All, validatorKind].includes(onlyRunValidator);
}

function runThisTest(methodKind: MethodKind): boolean {
  return [MethodKind.All, methodKind].includes(onlyRunMethod);
}