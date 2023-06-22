import { TSchema, TObject, Type, TUnion } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from '../validators/abstract/abstract-typed-union-validator';
import { HeterogeneousUnionValidator } from '../validators/heterogeneous/heterogeneous-union-validator';
import { CompilingHeterogeneousUnionValidator } from '../validators/heterogeneous/compiling-heterogeneous-union-validator';
import { TypeIdentifyingKey } from '../validators/heterogeneous//type-identifying-key';
import {
  DEFAULT_OVERALL_MESSAGE,
  DEFAULT_UNKNOWN_TYPE_MESSAGE,
} from '../lib/error-utils';
import { ValidatorKind, MethodKind, ValidatorCache } from './test-utils';
import { testInvalidSpecs } from './test-invalid-specs';
import {
  MESSAGE_MEMBERS_MISSING_KEY,
  MESSAGE_MULTIPLE_MEMBERS_WITH_SAME_KEY,
  MESSAGE_MEMBER_WITH_MULTIPLE_KEYS,
  MESSAGE_OPTIONAL_TYPE_ID_KEY,
} from '../validators/heterogeneous/type-identifying-key-index';

const onlyRunValidator = ValidatorKind.NonCompiling;
const onlyRunMethod = MethodKind.InvalidSchema;

const wellFormedUnion1 = Type.Union([
  Type.Object({
    unique1: TypeIdentifyingKey(Type.String()),
    str1: Type.String(),
    str2: Type.Optional(Type.String()),
  }),
  Type.Object({
    unique2: TypeIdentifyingKey(Type.Integer()),
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
      str2: Type.String(),
      unique3: Type.String(),
      unique1: TypeIdentifyingKey(Type.String()),
      opt: Type.Optional(Type.String()),
    }),
    Type.Object({
      str1: Type.String(),
      unique2: TypeIdentifyingKey(Type.String()),
      str2: Type.String(),
      opt: Type.Optional(Type.Integer()),
    }),
  ],
  { errorMessage: 'Unknown type' }
);

const unionDupTypeKeysMultipleMembers = Type.Union([
  Type.Object({
    s: TypeIdentifyingKey(Type.String()),
    str1: Type.Optional(Type.String()),
  }),
  Type.Object({
    s: TypeIdentifyingKey(Type.Integer()),
    int1: Type.Optional(Type.Integer()),
  }),
]);

const unionDupTypeKeysSingleMembers = Type.Union([
  Type.Object({
    s1: TypeIdentifyingKey(Type.String()),
    s3: TypeIdentifyingKey(Type.String()),
    str1: Type.Optional(Type.String()),
  }),
  Type.Object({
    s2: TypeIdentifyingKey(Type.Integer()),
    int1: Type.Optional(Type.Integer()),
  }),
]);

const unionMissingTypeKeys = Type.Union([
  Type.Object({
    s1: TypeIdentifyingKey(Type.String()),
    str1: Type.Optional(Type.String()),
  }),
  Type.Object({
    s2: Type.String(),
    int1: Type.Optional(Type.Integer()),
  }),
]);

const unionOptionalTypeKey = Type.Union([
  Type.Object({
    s1: TypeIdentifyingKey(Type.String()),
    str1: Type.Optional(Type.String()),
  }),
  Type.Object({
    s2: TypeIdentifyingKey(Type.Optional(Type.Integer())),
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
  const defaultString = `${DEFAULT_OVERALL_MESSAGE}:\n * ${DEFAULT_UNKNOWN_TYPE_MESSAGE}`;
  testInvalidSpecs(runThisTest, createValidator, [
    {
      description: 'selects 1st union member, 1st key unique, single error',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { unique1: 'hello', int1: 1 },
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '/str1', message: 'Expected string' }],
      assertString: 'Invalid value:\n * str1 - Expected string',
      validateString: 'Invalid value:\n * str1 - Expected string',
    },
    {
      description: 'selects 2nd union member, 1st key unique, multiple errors',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { unique2: 1, str1: 'hello', int2: 'hello' },
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
      description: 'unique field not selecting any union member',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { x: 'hello', str1: 'hello', int1: 1 },
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '', message: DEFAULT_UNKNOWN_TYPE_MESSAGE }],
      assertString: defaultString,
      validateString: defaultString,
    },
    {
      description: 'unique fields selecting multiple union members',
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
      assertString: 'Custom message:\n * opt - Expected string',
      validateString: 'Custom message:\n * opt - Expected string',
    },
    {
      description:
        'selects 2nd union member, non-1st key unique, invalid key value',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { str1: 'a', unique2: 1, str2: 'c', opt: 32 },
      assertMessage: DEFAULT_OVERALL_MESSAGE,
      errors: [{ path: '/unique2', message: 'Expected string' }],
      assertString: 'Invalid value:\n * unique2 - Expected string',
      validateString: 'Invalid value:\n * unique2 - Expected string',
    },
    {
      description: 'not selecting any union member, with custom type error',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { x: 'not-there' },
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
      value: { opt: 32 },
      overallMessage: 'Oopsie: {error}',
      assertMessage: 'Oopsie: Unknown type',
      errors: [{ path: '', message: 'Unknown type' }],
      assertString: 'Oopsie: Unknown type:\n * Unknown type',
      validateString: 'Oopsie:\n * Unknown type',
    },
    {
      description: 'not selecting any union member, but having a unique key',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { unique3: 'hello' },
      overallMessage: 'Oopsie: {error}',
      assertMessage: 'Oopsie: Unknown type',
      errors: [{ path: '', message: 'Unknown type' }],
      assertString: 'Oopsie: Unknown type:\n * Unknown type',
      validateString: 'Oopsie:\n * Unknown type',
    },
  ]);

  if ([MethodKind.All, MethodKind.InvalidSchema].includes(onlyRunMethod)) {
    describe('errors on invalid union schemas', () => {
      it('union with members missing keys', () => {
        const validator = createValidator(unionMissingTypeKeys);
        expect(() => validator.test({})).toThrow(MESSAGE_MEMBERS_MISSING_KEY);
      });

      it('union with multiple members having same key', () => {
        const validator = createValidator(unionDupTypeKeysMultipleMembers);
        expect(() => validator.assert({})).toThrow(
          MESSAGE_MULTIPLE_MEMBERS_WITH_SAME_KEY
        );
      });

      it('union with single member having multiple keys', () => {
        const validator = createValidator(unionDupTypeKeysSingleMembers);
        expect(() => validator.validate({})).toThrow(
          MESSAGE_MEMBER_WITH_MULTIPLE_KEYS
        );
      });

      it('union with optional type identifying key', () => {
        const validator = createValidator(unionOptionalTypeKey);
        expect(() => validator.errors({})).toThrow(
          MESSAGE_OPTIONAL_TYPE_ID_KEY
        );
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
