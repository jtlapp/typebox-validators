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
    unique1: Type.String(),
    str1: Type.String(),
    str2: Type.Optional(Type.String()),
  }),
  Type.Object({
    unique2: Type.Integer(),
    int1: Type.Integer(),
    int2: Type.Optional(Type.Integer()),
  }),
  Type.Object({
    "s'quote": Type.String(),
    str1: Type.String(),
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
      value: { unique1: 'hello', str1: 'hello' },
      selectedIndex: 0,
    },
    {
      description: 'valid hetero union 2, no unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { unique2: 1, int1: 1 },
      selectedIndex: 1,
    },
    {
      description: 'valid hetero union 3, with unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: {
        unique1: 'hello',
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
        unique2: 1,
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
      value: { str1: 'a', str2: 'b', unique1: 'c', unique3: 'd', opt: 'e' },
      selectedIndex: 0,
    },
    {
      description: 'valid hetero union 6, selecting by member keys',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: {
        str1: 'a',
        unique2: 'b',
        str2: 'c',
        opt: 32,
      },
      selectedIndex: 1,
    },
    {
      description: 'valid hetero union 7, selecting quoted key',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { "s'quote": 'a', str1: 'b' },
      selectedIndex: 2,
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
