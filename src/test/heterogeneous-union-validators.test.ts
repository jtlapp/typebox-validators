import { TObject, TUnion, Type } from '@sinclair/typebox';

import { HeterogeneousUnionValidator } from '../validators/heterogeneous-union-validator';
import { AbstractValidator } from '../validators/abstract-validator';
import { CompilingHeterogeneousUnionValidator } from '../validators/compiling-heterogeneous-union-validator';

const OVERALL_MESSAGE = 'Bad union';

describe('heterogeneous union validators', () => {
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
  const wellFormedUnion2 = Type.Union([
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
  ]);
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

  testHeterogeneousUnionValidation(
    'HeterogeneousUnionValidator()',
    new HeterogeneousUnionValidator(wellFormedUnion1),
    new HeterogeneousUnionValidator(wellFormedUnion2),
    new HeterogeneousUnionValidator(illFormedUnion)
  );
  testHeterogeneousUnionValidation(
    'CompilingHeterogeneousUnionValidator()',
    new CompilingHeterogeneousUnionValidator(wellFormedUnion1),
    new CompilingHeterogeneousUnionValidator(wellFormedUnion2),
    new CompilingHeterogeneousUnionValidator(illFormedUnion)
  );
});

function testHeterogeneousUnionValidation(
  description: string,
  goodValidator1: AbstractValidator<TUnion<TObject[]>>,
  goodValidator2: AbstractValidator<TUnion<TObject[]>>,
  badValidator: AbstractValidator<TUnion<TObject[]>>
) {
  describe(description, () => {
    it('accepts only valid heterogeneous unions', () => {
      checkValidations(goodValidator1, { s: 'hello', str1: 'hello' }, true);
      checkValidations(goodValidator1, { i: 1, int1: 1 }, true);

      checkValidations(
        goodValidator1,
        { s: 'hello', str1: 'hello', int1: 1 },
        true
      );
      checkValidations(goodValidator1, { i: 1, str1: 'hello', int1: 1 }, true);

      checkValidations(goodValidator1, { s: 'hello', int1: 1 }, false);
      checkValidations(goodValidator1, { i: 1, str1: 'hello' }, false);
      checkValidations(
        goodValidator1,
        { x: 'hello', str1: 'hello', int1: 1 },
        false
      );
      checkValidations(goodValidator1, { str1: 'hello', int1: 1 }, false);
      checkValidations(goodValidator1, {}, false);

      checkValidations(goodValidator1, undefined, false);
      checkValidations(goodValidator1, null, false);
      checkValidations(goodValidator1, true, false);
      checkValidations(goodValidator1, 1, false);
      checkValidations(goodValidator1, 'hello', false);
    });

    it('properly selects unique members keys', () => {
      checkValidations(
        goodValidator2,
        {
          str1: 'hello',
          str2: 'hello',
          s1: 'hello',
          unique: 'hello',
          extra: 'hello',
        },
        true
      );
      checkValidations(
        goodValidator2,
        {
          str1: 'hello',
          str2: 'hello',
          s1: 'hello',
          unique: 'hello',
          extra: 32,
        },
        false
      );

      checkValidations(
        goodValidator2,
        {
          str1: 'hello',
          s2: 'hello',
          str2: 'hello',
          extra: 32,
        },
        true
      );
      checkValidations(
        goodValidator2,
        {
          str1: 'hello',
          s2: 'hello',
          str2: 'hello',
          extra: 'hello',
        },
        false
      );
    });

    it("rejects unions whose members aren't all unique", () => {
      const validObject = { s: 'hello', str1: 'hello' };
      expect(() =>
        badValidator.safeValidate(validObject, OVERALL_MESSAGE)
      ).toThrow('Heterogeneous union has members lacking unique keys');
    });
  });
}

function checkValidations(
  validator: AbstractValidator<TUnion<TObject[]>>,
  value: any,
  valid: boolean
): void {
  tryValidation(valid, () => validator.safeValidate(value, OVERALL_MESSAGE));
  tryValidation(valid, () => validator.validate(value, OVERALL_MESSAGE, true));

  tryValidation(valid, () => validator.unsafeValidate(value, OVERALL_MESSAGE));
  tryValidation(valid, () => validator.validate(value, OVERALL_MESSAGE, false));
}

function tryValidation(valid: boolean, validate: () => void): void {
  if (valid) {
    expect(validate).not.toThrow();
  } else {
    expect(validate).toThrow(OVERALL_MESSAGE);
  }
}
