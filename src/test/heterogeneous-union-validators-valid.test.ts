import { TObject, TSchema, TUnion, Type } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from '../validators/abstract-typed-union-validator';
import { HeterogeneousUnionValidator } from '../validators/heterogeneous-union-validator';
import { CompilingHeterogeneousUnionValidator } from '../validators/compiling-heterogeneous-union-validator';
import {
  ValidUnionTestSpec,
  ValidatorKind,
  MethodKind,
  ValidatorCache,
  ValidTestSpec,
} from './test-utils';
import { testValidSpecs } from './test-valid-specs';
import { AbstractValidator } from '../validators/abstract-validator';

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
      opt: Type.Optional(Type.String()),
    }),
    Type.Object({
      str1: Type.String(),
      s2: Type.String(),
      str2: Type.String(),
      opt: Type.Optional(Type.Integer()),
    }),
  ],
  { typeError: 'Unknown type' }
);

const validatorCache = new ValidatorCache();

describe('heterogenous union validators - valid values', () => {
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
  createValidator: (schema: TSchema) => AbstractValidator<TSchema>
) {
  testValidSpecs(runThisTest, createValidator, verifyCleaning, [
    {
      description: 'valid hetero union 1, no unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { s: 'hello', str1: 'hello' },
      selectedIndex: 0,
    },
    {
      description: 'valid hetero union 2, no unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { i: 1, int1: 1 },
      selectedIndex: 1,
    },
    {
      description: 'valid hetero union 3, with unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: {
        s: 'hello',
        str1: 'hello',
        int1: 1,
        unrecognized1: 1,
        unrecognized2: 'abc',
      },
      selectedIndex: 0,
    },
    {
      description: 'valid hetero union 4, with unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: {
        i: 1,
        str1: 'hello',
        int1: 1,
        unrecognized1: 1,
        unrecognized2: 'abc',
      },
      selectedIndex: 1,
    },
    {
      description: 'valid hetero union 5, selecting by member keys',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { str1: 'a', str2: 'b', s1: 'c', unique: 'd', opt: 'e' },
      selectedIndex: 0,
    },
    {
      description: 'valid hetero union 6, selecting by member keys',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: {
        str1: 'a',
        s2: 'b',
        str2: 'c',
        opt: 32,
      },
      selectedIndex: 1,
    },
  ]);
}

function verifyCleaning(spec: ValidTestSpec<TSchema>, value: any): void {
  const unionSpec = spec as ValidUnionTestSpec;
  const validProperties = Object.keys(
    unionSpec.schema.anyOf[unionSpec.selectedIndex].properties
  );
  for (const key in value) {
    expect(validProperties.includes(key)).toBe(true);
  }
  expect(Object.keys(value).length).toBeLessThanOrEqual(validProperties.length);
}

function runThisValidator(validatorKind: ValidatorKind): boolean {
  return [ValidatorKind.All, validatorKind].includes(onlyRunValidator);
}

function runThisTest(methodKind: MethodKind): boolean {
  return [MethodKind.All, methodKind].includes(onlyRunMethod);
}