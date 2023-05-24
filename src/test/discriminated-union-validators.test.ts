import { TObject, TUnion, Type } from '@sinclair/typebox';

import { DiscriminatedUnionValidator } from '../validators/discriminated-union-validator';
import { AbstractValidator } from '../validators/abstract-validator';
import { CompilingDiscriminatedUnionValidator } from '../validators/compiling-discriminated-union-validator';
import { ValidationException } from '../lib/validation-exception';

import { OVERALL_MESSAGE, checkValidations } from './test-util';

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
          detail: 'not a type the union recognizes',
        },
        {
          validator: goodValidator2,
          detail: 'Unknown type',
        },
      ];

      for (const trial of trials) {
        // safeValidate()
        try {
          trial.validator.safeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          expect(err.message).toEqual(OVERALL_MESSAGE);
          expect(err.specifics[0].toString()).toEqual(trial.detail);
          expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${trial.detail}`);
        }

        // unsafeValidate()
        try {
          trial.validator.unsafeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          expect(err.message).toEqual(OVERALL_MESSAGE);
          expect(err.specifics[0].toString()).toEqual(trial.detail);
          expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${trial.detail}`);
        }
      }
    });

    it('reports object lacking discriminant key', () => {
      expect.assertions(16);
      const invalidObject = { str1: 'hello' };
      const trials = [
        {
          validator: goodValidator1,
          detail: 'not a type the union recognizes',
        },
        {
          validator: goodValidator2,
          detail: 'Unknown type',
        },
      ];

      for (const trial of trials) {
        // safeValidate()
        try {
          trial.validator.safeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          expect(err.message).toEqual(OVERALL_MESSAGE);
          expect(err.specifics[0].toString()).toEqual(trial.detail);
          expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${trial.detail}`);
        }

        // unsafeValidate()
        try {
          trial.validator.unsafeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          expect(err.message).toEqual(OVERALL_MESSAGE);
          expect(err.specifics[0].toString()).toEqual(trial.detail);
          expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${trial.detail}`);
        }
      }
    });

    it('only reports first error with safe validation', () => {
      expect.assertions(4);
      try {
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.safeValidate(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(1);
        const detail = 'str1: Expected string';
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(detail);
        expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${detail}`);
      }
    });

    it('safeValidateAndCleanCopy() cleans object on successful validation', () => {
      const validObject = { t: 's', str1: 'hello', misc: 'foo' };
      const [schema, cleanedObject] = goodValidator2.safeValidateAndCleanCopy(
        validObject,
        OVERALL_MESSAGE
      );
      expect(schema).toEqual(goodValidator2.schema.anyOf[0]);
      expect(cleanedObject).toEqual({ t: 's', str1: 'hello' });
      expect(cleanedObject).not.toBe(validObject);
    });

    it('safeValidateAndCleanCopy() fails on invalid object', () => {
      expect.assertions(4);
      try {
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.safeValidateAndCleanCopy(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(1);
        const detail = 'str1: Expected string';
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(detail);
        expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${detail}`);
      }
    });

    it('safeValidateAndCleanOriginal() cleans object on successful validation', () => {
      const value = { t: 's', str1: 'hello', misc: 'foo' };
      const schema = goodValidator2.safeValidateAndCleanOriginal(
        value,
        OVERALL_MESSAGE
      );
      expect(schema).toEqual(goodValidator2.schema.anyOf[0]);
      expect(value).toEqual({ t: 's', str1: 'hello' });
    });

    it('safeValidateAndCleanOriginal() fails on invalid object', () => {
      expect.assertions(4);
      try {
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.safeValidateAndCleanOriginal(
          invalidObject,
          OVERALL_MESSAGE
        );
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(1);
        const detail = 'str1: Expected string';
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(detail);
        expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ${detail}`);
      }
    });

    it('reports all errors with unsafe validation', () => {
      expect.assertions(5);
      try {
        const invalidObject = { t: 's', str1: 1, str2: 2 };
        goodValidator2.unsafeValidate(invalidObject, OVERALL_MESSAGE);
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.specifics.length).toEqual(2);
        const detail1 = 'str1: Expected string';
        const detail2 = 'str2: Expected string';
        expect(err.message).toEqual(OVERALL_MESSAGE);
        expect(err.specifics[0].toString()).toEqual(detail1);
        expect(err.specifics[1].toString()).toEqual(detail2);
        expect(err.toString()).toEqual(
          `${OVERALL_MESSAGE}:\n- ${detail1}\n- ${detail2}`
        );
      }
    });

    it('throws when there is no consistent discriminant key', () => {
      const validObject = { t: 's', str1: 'hello' };

      expect(() =>
        badValidator.safeValidate(validObject, OVERALL_MESSAGE)
      ).toThrow(
        "Discriminant key 't' not present in all members of discriminated union"
      );

      expect(() =>
        badValidator.unsafeValidate(validObject, OVERALL_MESSAGE)
      ).toThrow(
        "Discriminant key 't' not present in all members of discriminated union"
      );
    });
  });
}
