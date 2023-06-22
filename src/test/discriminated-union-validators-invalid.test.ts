import { TSchema, TObject, Type, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from '../abstract/abstract-typed-union-validator';
import { DiscriminatedUnionValidator } from '../discriminated/discriminated-union-validator';
import { CompilingDiscriminatedUnionValidator } from '../discriminated/compiling-discriminated-union-validator';
import {
  DEFAULT_OVERALL_MESSAGE,
  DEFAULT_UNKNOWN_TYPE_MESSAGE,
} from '../lib/error-utils';
import { ValidatorKind, MethodKind, ValidatorCache } from './test-utils';
import { testInvalidSpecs } from './test-invalid-specs';

const onlyRunValidator = ValidatorKind.All;
const onlyRunMethod = MethodKind.All;

const wellFormedUnion1 = Type.Union([
  Type.Object({
    kind: Type.Literal('s'),
    str1: Type.String(),
    str2: Type.Optional(Type.String()),
  }),
  Type.Object({
    kind: Type.Literal('i'),
    int1: Type.Integer(),
    int2: Type.Optional(
      Type.Integer({
        errorMessage: 'must be an int',
      })
    ),
  }),
]);

const wellFormedUnion2 = Type.Union(
  [
    Type.Object({
      str1: Type.String(),
      t: Type.Literal('s'),
      str2: Type.Optional(Type.String()),
    }),
    Type.Object({
      int1: Type.Integer(),
      int2: Type.Optional(Type.Integer()),
      t: Type.Literal('i'),
    }),
  ],
  { discriminantKey: 't', errorMessage: 'Unknown type' }
);

const illFormedUnion = Type.Union(
  [
    Type.Object({
      t: Type.Literal('s'),
      str1: Type.String(),
      str2: Type.Optional(Type.String()),
    }),
    Type.Object({
      kind: Type.Literal('i'),
      int1: Type.Integer(),
      int2: Type.Optional(Type.Integer()),
    }),
  ],
  { discriminantKey: 't' }
);

const validatorCache = new ValidatorCache();

describe('discriminated union validators - invalid values', () => {
  if (runThisValidator(ValidatorKind.NonCompiling)) {
    describe('DiscriminatedUnionValidator', () => {
      testValidator(
        (schema: TSchema) =>
          validatorCache.getNonCompiling(
            schema,
            () => new DiscriminatedUnionValidator(schema as TUnion<TObject[]>)
          ) as AbstractTypedUnionValidator<TUnion<TObject[]>>
      );
    });
  }
  if (runThisValidator(ValidatorKind.Compiling)) {
    describe('CompilingDiscriminatedUnionValidator', () => {
      testValidator(
        (schema: TSchema) =>
          validatorCache.getCompiling(
            schema,
            () =>
              new CompilingDiscriminatedUnionValidator(
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
  const defaultString = `${DEFAULT_OVERALL_MESSAGE}:\n * ${DEFAULT_UNKNOWN_TYPE_MESSAGE}`;
  testInvalidSpecs(runThisTest, createValidator, [
    {
      description: 'selects 1st union member, single error',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { kind: 's', int1: 1 },
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '/str1', message: 'Expected string' }],
      assertString: 'Invalid value:\n * str1 - Expected string',
      validateString: 'Invalid value:\n * str1 - Expected string',
    },
    {
      description: 'selects 2nd union member, multiple errors',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { kind: 'i', int1: '1', int2: 'hello' },
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [
        { path: '/int1', message: 'Expected integer' },
        { path: '/int2', message: 'must be an int' },
      ],
      assertString: 'Invalid value:\n * int1 - Expected integer',
      validateString:
        'Invalid value:\n' +
        ' * int1 - Expected integer\n' +
        ' * int2 - must be an int',
    },
    {
      description: 'discriminant key value not selecting any union member',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { kind: 'not-there', str1: 'hello' },
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'value lacking discriminant key',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { str1: 'hello', int1: 1 },
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'empty object value',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: {},
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'undefined value',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: undefined,
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'null value',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: null,
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'simple literal value',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: 'hello',
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description:
        'selects 1st union member, non-1st discriminant, invalid, with overall message',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { t: 's', str1: 32 },
      overallMessage: 'Custom message',
      assertMessage: 'Custom message',
      errors: [{ path: '/str1', message: 'Expected string' }],
      assertString: 'Custom message:\n * str1 - Expected string',
      validateString: 'Custom message:\n * str1 - Expected string',
    },
    {
      description: 'not selecting any union member, with custom type error',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { t: 'not-there', str1: 'hello' },
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '', message: 'Unknown type' }],
      assertString: 'Invalid value:\n * Unknown type',
      validateString: 'Invalid value:\n * Unknown type',
    },
    {
      description:
        'not selecting any union member, with custom overall and type errors',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { int1: 32 },
      overallMessage: 'Oopsie: {error}',
      assertMessage: 'Oopsie: Unknown type',
      errors: [{ path: '', message: 'Unknown type' }],
      assertString: 'Oopsie: Unknown type:\n * Unknown type',
      validateString: 'Oopsie:\n * Unknown type',
    },
  ]);

  if ([MethodKind.All, MethodKind.InvalidSchema].includes(onlyRunMethod)) {
    const errorMessage = `Discriminant key 't' not present in all members of discriminated union`;

    describe('errors on invalid union schemas', () => {
      it('union having members lacking the discriminant key, valid value', () => {
        const validator = createValidator(illFormedUnion);
        const validObject = { t: 's', str1: 'hello' };

        expect(() => validator.test(validObject)).toThrow(errorMessage);
        expect(() => validator.assert(validObject)).toThrow(errorMessage);
        expect(() => validator.assertAndClean(validObject)).toThrow(
          errorMessage
        );
        expect(() => validator.assertAndCleanCopy(validObject)).toThrow(
          errorMessage
        );
        expect(() => validator.validate(validObject)).toThrow(errorMessage);
        expect(() => validator.validateAndClean(validObject)).toThrow(
          errorMessage
        );
        expect(() => validator.validateAndCleanCopy(validObject)).toThrow(
          errorMessage
        );
        expect(() => validator.errors(validObject)).toThrow(errorMessage);
      });

      it('union having members lacking the discriminant key, invalid value', () => {
        const validator = createValidator(illFormedUnion);
        const invalidObject = { s: 'hello', str1: 32 };

        expect(() => validator.test(invalidObject)).toThrow(errorMessage);
        expect(() => validator.assert(invalidObject)).toThrow(errorMessage);
        expect(() => validator.assertAndClean(invalidObject)).toThrow(
          errorMessage
        );
        expect(() => validator.assertAndCleanCopy(invalidObject)).toThrow(
          errorMessage
        );
        expect(() => validator.validate(invalidObject)).toThrow(errorMessage);
        expect(() => validator.validateAndClean(invalidObject)).toThrow(
          errorMessage
        );
        expect(() => validator.validateAndCleanCopy(invalidObject)).toThrow(
          errorMessage
        );
        expect(() => validator.errors(invalidObject)).toThrow(errorMessage);
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
