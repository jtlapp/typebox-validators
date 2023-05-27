import { TObject, TUnion, Type } from '@sinclair/typebox';

import { HeterogeneousUnionValidator } from '../validators/heterogeneous-union-validator';
import { AbstractValidator } from '../validators/abstract-validator';
import { CompilingHeterogeneousUnionValidator } from '../validators/compiling-heterogeneous-union-validator';
import { ValidationException } from '../lib/validation-exception';

import { OVERALL_MESSAGE, checkValidations } from './test-util';

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
      checkValidations(goodValidator1, 0, { s: 'hello', str1: 'hello' }, true);
      checkValidations(goodValidator1, 1, { i: 1, int1: 1 }, true);

      checkValidations(
        goodValidator1,
        0,
        { s: 'hello', str1: 'hello', int1: 1 },
        true
      );
      checkValidations(
        goodValidator1,
        1,
        { i: 1, str1: 'hello', int1: 1 },
        true
      );

      checkValidations(goodValidator1, 0, { s: 'hello', int1: 1 }, false);
      checkValidations(goodValidator1, 1, { i: 1, str1: 'hello' }, false);
      checkValidations(
        goodValidator1,
        0,
        { x: 'hello', str1: 'hello', int1: 1 },
        false
      );
      checkValidations(goodValidator1, 0, { str1: 'hello', int1: 1 }, false);
      checkValidations(goodValidator1, 0, {}, false);

      checkValidations(goodValidator1, 0, undefined, false);
      checkValidations(goodValidator1, 0, null, false);
      checkValidations(goodValidator1, 0, true, false);
      checkValidations(goodValidator1, 0, 1, false);
      checkValidations(goodValidator1, 0, 'hello', false);
    });

    it('properly selects unique members keys', () => {
      checkValidations(
        goodValidator2,
        0,
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
        0,
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
        1,
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
        1,
        {
          str1: 'hello',
          s2: 'hello',
          str2: 'hello',
          extra: 'hello',
        },
        false
      );
    });

    it('reports unrecognized object type', () => {
      expect.assertions(16);
      const invalidObject = { str1: 'hello' };
      const trials = [
        {
          validator: goodValidator1,
          overallError: undefined,
          specific: 'not a type the union recognizes',
        },
        {
          validator: goodValidator2,
          overallError: OVERALL_MESSAGE,
          specific: 'Unknown type',
        },
      ];

      for (const trial of trials) {
        const expectedOverall = trial.overallError ?? 'Invalid value';

        // assert()
        try {
          trial.validator.assert(invalidObject, trial.overallError);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          expect(err.message).toEqual(expectedOverall);
          expect(err.specifics[0].toString()).toEqual(trial.specific);
          expect(err.toString()).toEqual(
            `${expectedOverall}: ${trial.specific}`
          );
        }

        // validate()
        try {
          trial.validator.validate(invalidObject, trial.overallError);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          expect(err.message).toEqual(expectedOverall);
          expect(err.specifics[0].toString()).toEqual(trial.specific);
          expect(err.toString()).toEqual(
            `${expectedOverall}: ${trial.specific}`
          );
        }
      }
    });

    it('only reports first error with safe validation', () => {
      expect.assertions(4);
      try {
        const invalidObject = { s: 's', str1: 1, str2: 2 };
        goodValidator1.assert(invalidObject);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        const overall = 'Invalid value';
        const specific = 'str1: Expected string';
        expect(err.specifics.length).toEqual(1);
        expect(err.message).toEqual(overall);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${overall}: ${specific}`);
      }
    });

    it('assertAndCleanCopy() cleans object on successful validation', () => {
      const validObject = { s: 'hello', str1: 'hello', misc: 'foo' };
      const cleanObject = goodValidator1.assertAndCleanCopy(
        validObject,
        OVERALL_MESSAGE
      );
      expect(cleanObject).toEqual({ s: 'hello', str1: 'hello' });
      expect(cleanObject).not.toBe(validObject);
    });

    it('assertAndCleanCopy() fails on invalid object (default message)', () => {
      expect.assertions(4);
      try {
        const invalidObject = { s: 's', str1: 1, str2: 2 };
        goodValidator1.assertAndCleanCopy(invalidObject);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        const message = 'Invalid value';
        const specific = 'str1: Expected string';
        expect(err.specifics.length).toEqual(1);
        expect(err.message).toEqual(message);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${message}: ${specific}`);
      }
    });

    it('assertAndCleanCopy() fails on invalid object (custom message)', () => {
      expect.assertions(4);
      try {
        const invalidObject = { s: 's', str1: 1, str2: 2 };
        goodValidator1.assertAndCleanCopy(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(1);
        const specific = 'str1: Expected string';
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${specific}`);
      }
    });

    it('assertAndClean() cleans object on successful validation', () => {
      const value = { s: 'hello', str1: 'hello', misc: 'foo' };
      const schema = goodValidator1.assertAndClean(value, OVERALL_MESSAGE);
      expect(schema).toEqual(goodValidator1.schema.anyOf[0]);
      expect(value).toEqual({ s: 'hello', str1: 'hello' });
    });

    it('assertAndClean() fails on invalid object (default message)', () => {
      expect.assertions(4);
      try {
        const invalidObject = { s: 's', str1: 1, str2: 2 };
        goodValidator1.assertAndClean(invalidObject);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        const message = 'Invalid value';
        const specific = 'str1: Expected string';
        expect(err.specifics.length).toEqual(1);
        expect(err.message).toEqual(message);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${message}: ${specific}`);
      }
    });

    it('assertAndClean() fails on invalid object (custom message)', () => {
      expect.assertions(4);
      try {
        const invalidObject = { s: 's', str1: 1, str2: 2 };
        goodValidator1.assertAndClean(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(1);
        const specific = 'str1: Expected string';
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${specific}`);
      }
    });

    it('reports all errors with unsafe validation', () => {
      expect.assertions(5);
      try {
        const invalidObject = { s: 's', str1: 1, str2: 2 };
        goodValidator1.validate(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(2);
        const specific1 = 'str1: Expected string';
        const specific2 = 'str2: Expected string';
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(specific1);
        expect(err.specifics[1].toString()).toEqual(specific2);
        expect(err.toString()).toEqual(
          `${OVERALL_MESSAGE}:\n- ${specific1}\n- ${specific2}`
        );
      }
    });

    it("rejects unions whose members aren't all unique", () => {
      const validObject = { s: 'hello', str1: 'hello' };

      expect(() => badValidator.assert(validObject)).toThrow(
        'Heterogeneous union has members lacking unique keys'
      );

      expect(() => badValidator.validate(validObject)).toThrow(
        'Heterogeneous union has members lacking unique keys'
      );
    });
  });
}
