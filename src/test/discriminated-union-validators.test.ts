import { TObject, TUnion, Type } from '@sinclair/typebox';

import { DiscriminatedUnionValidator } from '../validators/discriminated-union-validator';
import { AbstractValidator } from '../validators/abstract-validator';
import { CompilingDiscriminatedUnionValidator } from '../validators/compiling-discriminated-union-validator';
import { ValidationException } from '../lib/validation-exception';

import { OVERALL_MESSAGE, checkValidations } from './test-utils';

describe('discriminated union validators', () => {
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
        t: Type.Literal('s'),
        str1: Type.String(),
        str2: Type.Optional(Type.String()),
      }),
      Type.Object({
        t: Type.Literal('i'),
        int1: Type.Integer(),
        int2: Type.Optional(Type.Integer()),
      }),
    ],
    { discriminantKey: 't', errorMessage: 'Unknown type' }
  );
  const illFormedUnion1 = Type.Union(
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

  testDiscriminatedUnionValidation(
    'DiscriminatedUnionValidator()',
    new DiscriminatedUnionValidator(wellFormedUnion1),
    new DiscriminatedUnionValidator(wellFormedUnion2),
    new DiscriminatedUnionValidator(illFormedUnion1)
  );
  testDiscriminatedUnionValidation(
    'CompilingDiscriminatedUnionValidator()',
    new CompilingDiscriminatedUnionValidator(wellFormedUnion1),
    new CompilingDiscriminatedUnionValidator(wellFormedUnion2),
    new CompilingDiscriminatedUnionValidator(illFormedUnion1)
  );
});

function testDiscriminatedUnionValidation(
  description: string,
  goodValidator1: AbstractValidator<TUnion<TObject[]>>,
  goodValidator2: AbstractValidator<TUnion<TObject[]>>,
  badValidator: AbstractValidator<TUnion<TObject[]>>
) {
  describe(description, () => {
    it("uses 'kind' as the default discriminant key", () => {
      checkValidations(goodValidator1, 0, { kind: 's', str1: 'hello' }, true);
      checkValidations(goodValidator1, 1, { kind: 'i', int1: 1 }, true);
      checkValidations(
        goodValidator1,
        0,
        { kind: 's', str1: 'hello', int1: 1 },
        true
      );
      checkValidations(
        goodValidator1,
        1,
        { kind: 'i', str1: 'hello', int1: 1 },
        true
      );

      checkValidations(goodValidator1, 0, { kind: 's', int1: 1 }, false);
      checkValidations(goodValidator1, 1, { kind: 'i', str1: 'hello' }, false);
      checkValidations(goodValidator1, 0, { kind: 'x', str1: 'hello' }, false);
      checkValidations(goodValidator1, 0, { str1: 'hello', int1: 1 }, false);
      checkValidations(goodValidator1, 0, {}, false);

      checkValidations(goodValidator1, 0, undefined, false);
      checkValidations(goodValidator1, 0, null, false);
      checkValidations(goodValidator1, 0, true, false);
      checkValidations(goodValidator1, 0, 1, false);
      checkValidations(goodValidator1, 0, 'hello', false);
    });

    it('accepts only valid discriminated unions', () => {
      checkValidations(goodValidator2, 0, { t: 's', str1: 'hello' }, true);
      checkValidations(goodValidator2, 1, { t: 'i', int1: 1 }, true);
      checkValidations(
        goodValidator2,
        0,
        { t: 's', str1: 'hello', int1: 1 },
        true
      );
      checkValidations(
        goodValidator2,
        1,
        { t: 'i', str1: 'hello', int1: 1 },
        true
      );

      checkValidations(goodValidator2, 0, { t: 's', int1: 1 }, false);
      checkValidations(goodValidator2, 1, { t: 'i', str1: 'hello' }, false);
      checkValidations(
        goodValidator2,
        0,
        { t: 'x', str1: 'hello', int1: 1 },
        false
      );
      checkValidations(goodValidator2, 0, { str1: 'hello', int1: 1 }, false);
      checkValidations(goodValidator2, 0, {}, false);

      checkValidations(goodValidator2, 0, undefined, false);
      checkValidations(goodValidator2, 0, null, false);
      checkValidations(goodValidator2, 0, true, false);
      checkValidations(goodValidator2, 0, 1, false);
      checkValidations(goodValidator2, 0, 'hello', false);
    });

    it('reports unrecognized discriminant value', () => {
      expect.assertions(16);
      const invalidObject = { t: 'x', str1: 'hello' };
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

    it('reports object lacking discriminant key', () => {
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
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.assert(invalidObject);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        const overallError = 'Invalid value';
        const specific = 'str1: Expected string';
        expect(err.specifics.length).toEqual(1);
        expect(err.message).toEqual(overallError);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${overallError}: ${specific}`);
      }
    });

    it('assertAndCleanCopy() cleans object on successful validation', () => {
      const validObject = { t: 's', str1: 'hello', misc: 'foo' };
      const [schema, cleanedObject] = goodValidator2.assertAndCleanCopy(
        validObject,
        OVERALL_MESSAGE
      );
      expect(schema).toEqual(goodValidator2.schema.anyOf[0]);
      expect(cleanedObject).toEqual({ t: 's', str1: 'hello' });
      expect(cleanedObject).not.toBe(validObject);
    });

    it('assertAndCleanCopy() fails on invalid object (default message)', () => {
      expect.assertions(4);
      try {
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.assertAndCleanCopy(invalidObject);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(1);
        const message = 'Invalid value';
        const specific = 'str1: Expected string';
        expect(err.message).toEqual(message);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${message}: ${specific}`);
      }
    });

    it('assertAndCleanCopy() fails on invalid object (custom message)', () => {
      expect.assertions(4);
      try {
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.assertAndCleanCopy(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        const specific = 'str1: Expected string';
        expect(err.specifics.length).toEqual(1);
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${specific}`);
      }
    });

    it('assertAndClean() cleans object on successful validation', () => {
      const value = { t: 's', str1: 'hello', misc: 'foo' };
      const schema = goodValidator2.assertAndClean(value, OVERALL_MESSAGE);
      expect(schema).toEqual(goodValidator2.schema.anyOf[0]);
      expect(value).toEqual({ t: 's', str1: 'hello' });
    });

    it('assertAndClean() fails on invalid object (default message)', () => {
      expect.assertions(4);
      try {
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.assertAndClean(invalidObject);
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
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.assertAndClean(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        const specific = 'str1: Expected string';
        expect(err.specifics.length).toEqual(1);
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(specific);
        expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${specific}`);
      }
    });

    it('reports all errors with unsafe validation', () => {
      expect.assertions(5);
      try {
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.validate(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(2);
        const specific1 = 'str1: Expected string';
        const specific2 = 'str2: Expected string';
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(specific1);
        expect(err.specifics[1].toString()).toEqual(specific2);
        expect(err.toString()).toEqual(
          `${OVERALL_MESSAGE}:\n * ${specific1}\n * ${specific2}`
        );
      }
    });

    it('throws when there is no consistent discriminant key', () => {
      const validObject = { t: 's', str1: 'hello' };

      expect(() => badValidator.assert(validObject)).toThrow(
        "Discriminant key 't' not present in all members of discriminated union"
      );

      expect(() => badValidator.validate(validObject)).toThrow(
        "Discriminant key 't' not present in all members of discriminated union"
      );
    });
  });
}
