import { TObject, TSchema, TUnion, Type } from '@sinclair/typebox';

import { AbstractTypedUnionValidator } from '../validators/abstract-typed-union-validator';
import { DiscriminatedUnionValidator } from '../validators/discriminated-union-validator';
import { CompilingDiscriminatedUnionValidator } from '../validators/compiling-discriminated-union-validator';
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
    kind: Type.Literal('s'),
    str1: Type.String(),
    str2: Type.Optional(Type.String()),
  }),
  Type.Object({
    kind: Type.Literal('i'),
    int1: Type.Integer(),
    int2: Type.Optional(Type.Integer()),
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
  { discriminantKey: 't', typeError: 'Unknown type' }
);

const validatorCache = new ValidatorCache();

describe('discriminated union validators - valid values', () => {
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
      testValidator((schema: TSchema) =>
        validatorCache.getCompiling(
          schema,
          () =>
            new CompilingDiscriminatedUnionValidator(
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
      description: 'valid discrim union 1, no unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { kind: 's', str1: 'hello' },
      selectedIndex: 0,
    },
    {
      description: 'valid discrim union 2, no unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: { kind: 'i', int1: 1 },
      selectedIndex: 1,
    },
    {
      description: 'valid discrim union 3, with unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: {
        kind: 's',
        str1: 'hello',
        int1: 1,
        unrecognized1: 1,
        unrecognized2: 'abc',
      },
      selectedIndex: 0,
    },
    {
      description: 'valid discrim union 4, with unrecognized fields',
      onlySpec: false,
      schema: wellFormedUnion1,
      value: {
        kind: 'i',
        str1: 'hello',
        int1: 1,
        unrecognized1: 1,
        unrecognized2: 'abc',
      },
      selectedIndex: 1,
    },
    {
      description: 'valid discrim union 5, different discriminant key',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { t: 's', str1: 'hello' },
      selectedIndex: 0,
    },
    {
      description: 'valid discrim union 6, different discriminant key',
      onlySpec: false,
      schema: wellFormedUnion2,
      value: { t: 'i', str1: 'hello', int1: 1 },
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
