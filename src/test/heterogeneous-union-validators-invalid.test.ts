import { TSchema, TObject, Type, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from '../validators/abstract-typed-union-validator';
import { HeterogeneousUnionValidator } from '../validators/heterogeneous-union-validator';
import { CompilingHeterogeneousUnionValidator } from '../validators/compiling-heterogeneous-union-validator';
import { ValidationException } from '../lib/validation-exception';
import {
  DEFAULT_OVERALL_ERROR,
  DEFAULT_UNKNOWN_TYPE_MESSAGE,
} from '../lib/errors';
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
    unique1: Type.String(),
    str1: Type.String(),
    str2: Type.Optional(Type.String()),
  }),
  Type.Object({
    unique2: Type.Integer(),
    int1: Type.Integer(),
    int2: Type.Optional(
      Type.Integer({
        errorMessage: "'{field}' must be an integer",
      })
    ),
  }),
]);

const wellFormedUnion2 = Type.Union(
  [
    Type.Object({
      str1: Type.String(),
      str2: Type.String(),
      unique1: Type.String(),
      unique3: Type.String(),
      opt: Type.Optional(Type.String()),
    }),
    Type.Object({
      str1: Type.String(),
      unique2: Type.String(),
      str2: Type.String(),
      opt: Type.Optional(Type.Integer()),
    }),
  ],
  { errorMessage: 'Unknown type' }
);

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
      testValidator(
        (schema: TSchema) =>
          validatorCache.getCompiling(
            schema,
            () =>
              new CompilingHeterogeneousUnionValidator(
                schema as TUnion<TObject[]>
              )
          ) as AbstractTypedUnionValidator<TUnion<TObject[]>>
      );
    });
  }
});

function testValidator(
  createValidator: (
    schema: TSchema
  ) => AbstractTypedUnionValidator<TUnion<TObject[]>>
) {
  const defaultString = `${DEFAULT_OVERALL_ERROR}:\n- ${DEFAULT_UNKNOWN_TYPE_MESSAGE}`;
  testInvalidSpecs([
    {
      description: 'selects 1st union member, 1st key unique, single error',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { unique1: 'hello', int1: 1 },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '/str1', message: 'Expected string' }],
      assertString: 'Invalid value:\n- str1: Expected string',
      validateString: 'Invalid value:\n- str1: Expected string',
    },
    {
      description: 'selects 2nd union member, 1st key unique, multiple errors',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { unique2: 1, str1: 'hello', int2: 'hello' },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [
        { path: '/int1', message: 'Expected integer' },
        { path: '/int2', message: "'int2' must be an integer" },
      ],
      assertString: 'Invalid value:\n- int1: Expected integer',
      validateString:
        "Invalid value:\n- int1: Expected integer\n- int2: 'int2' must be an integer",
    },
    {
      description: 'unique field not selecting any union member',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { x: 'hello', str1: 'hello', int1: 1 },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'unique fields selecting multiple union members',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { str1: 'hello', int1: 1 },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'empty object value',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: {},
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'undefined value',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: undefined,
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'null value',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: null,
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'simple literal value',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: 'hello',
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description:
        'selects 1st union member, non-1st key unique, invalid, with overall message',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: {
        str1: 'a',
        str2: 'b',
        unique1: 'c',
        unique3: 'd',
        opt: 32,
      },
      overallMessage: 'Custom message',
      assertMessage: 'Custom message',
      errors: [{ path: '/opt', message: 'Expected string' }],
      assertString: 'Custom message:\n- opt: Expected string',
      validateString: 'Custom message:\n- opt: Expected string',
    },
    {
      description:
        'selects 2nd union member, non-1st key unique, invalid key value',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { str1: 'a', unique2: 1, str2: 'c', opt: 32 },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '/unique2', message: 'Expected string' }],
      assertString: 'Invalid value:\n- unique2: Expected string',
      validateString: 'Invalid value:\n- unique2: Expected string',
    },
    {
      description: 'not selecting any union member, with custom type error',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { x: 'not-there' },
      assertMessage: DEFAULT_OVERALL_ERROR,
      errors: [{ path: '', message: 'Unknown type' }],
      assertString: 'Invalid value:\n- Unknown type',
      validateString: 'Invalid value:\n- Unknown type',
    },
    // {
    //   description:
    //     'not selecting any union member, with custom overall and type errors',
    //   onlySpec: false,
    //   schema: wellFormedUnion2,
    //   value: { opt: 32 },
    //   overallMessage: "Oopsie. '{field}' {detail}",
    //   assertMessage: "Oopsie. 'Value' Unknown type",
    //   errors: [{ path: '', message: 'Unknown type' }],
    //   assertString: "Oopsie. 'Value' Unknown type:\n- Unknown type",
    //   validateString: "Oopsie. '{field}' {detail}:\n- Unknown type",
    // },
  ]);

  function testInvalidSpecs(specs: InvalidTestSpec<TUnion<TObject[]>>[]) {
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

  function testAssertMethodRejection<S extends TUnion<TObject[]>>(
    method: ValidatorMethodOfClass<AbstractTypedUnionValidator<S>>,
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

  function testValidateMethodRejection<S extends TUnion<TObject[]>>(
    method: ValidatorMethodOfClass<AbstractTypedUnionValidator<S>>,
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
